// Serveur d'administration TikTok Coins : connexion admin et payouts AfribaPay.
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { openDb, loadSecretKey, createSettings } from './db.js';
import {
  hashPassword, verifyPassword, passwordProblem, sha256, randomToken, safeEqual,
  newTotpSecret, verifyTotp, totpUri, createLimiter,
  SESSION_IDLE_MS, SESSION_MAX_MS, PENDING_2FA_MS
} from './auth.js';
import { createAfribaPay, AfribaPayError } from './afribapay.js';
import { createPayoutService, validatePayout, newOrderId, isOrderId } from './payouts.js';
import { HttpError, readBody, readForm, parseCookies, send, sendHtml, redirect, clientIp } from './http.js';
import * as V from './views.js';

const PORT = Number(process.env.PORT || 3000);
const DB_PATH = process.env.ADMIN_DB_PATH || '/data/tiktokcoins_admin.db';
const PUBLIC_URL = (process.env.PUBLIC_URL || '').replace(/\/+$/, '');
const COOKIE = '__Host-tkc_admin';
const COOKIE_FLAGS = 'Path=/; HttpOnly; Secure; SameSite=Strict';

const here = dirname(fileURLToPath(import.meta.url));
const STATIC = {
  '/static/app.css': ['text/css; charset=utf-8', readFileSync(join(here, '..', 'public', 'app.css'))],
  '/static/app.js': ['text/javascript; charset=utf-8', readFileSync(join(here, '..', 'public', 'app.js'))]
};

const db = openDb(DB_PATH);
const settings = createSettings(db, loadSecretKey(DB_PATH));

const afribapay = createAfribaPay(() => ({
  environment: settings.get('afribapay_environment', 'production'),
  apiUser: settings.get('afribapay_api_user'),
  apiKey: settings.getSecret('afribapay_api_key'),
  merchantKey: settings.getSecret('afribapay_merchant_key')
}));

const q = {
  adminCount: db.prepare('SELECT COUNT(*) AS n FROM admins'),
  adminById: db.prepare('SELECT * FROM admins WHERE id = ?'),
  adminByName: db.prepare('SELECT * FROM admins WHERE username = ?'),
  admins: db.prepare('SELECT * FROM admins ORDER BY username'),
  insertAdmin: db.prepare('INSERT INTO admins (username, password_hash) VALUES (?, ?)'),
  setPassword: db.prepare('UPDATE admins SET password_hash = ? WHERE id = ?'),
  setTotp: db.prepare('UPDATE admins SET totp_secret = ?, totp_enabled = ? WHERE id = ?'),
  setDisabled: db.prepare('UPDATE admins SET disabled = ? WHERE id = ?'),
  touchLogin: db.prepare("UPDATE admins SET last_login_at = datetime('now') WHERE id = ?"),
  session: db.prepare('SELECT * FROM sessions WHERE token_hash = ?'),
  insertSession: db.prepare('INSERT INTO sessions (token_hash, admin_id, csrf, pending_2fa, created_at, last_seen_at, ip, user_agent) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'),
  touchSession: db.prepare('UPDATE sessions SET last_seen_at = ? WHERE token_hash = ?'),
  finishTwoFactor: db.prepare('UPDATE sessions SET pending_2fa = 0, last_seen_at = ? WHERE token_hash = ?'),
  deleteSession: db.prepare('DELETE FROM sessions WHERE token_hash = ?'),
  deleteAdminSessions: db.prepare('DELETE FROM sessions WHERE admin_id = ? AND token_hash != ?'),
  deleteAllAdminSessions: db.prepare('DELETE FROM sessions WHERE admin_id = ?'),
  purgeSessions: db.prepare('DELETE FROM sessions WHERE last_seen_at < ? OR created_at < ?'),
  audit: db.prepare('INSERT INTO audit (admin_id, username, action, details, ip) VALUES (?, ?, ?, ?, ?)'),
  journal: db.prepare('SELECT * FROM audit ORDER BY id DESC LIMIT 300')
};

const audit = (admin, action, details, ip) => q.audit.run(admin?.id ?? null, admin?.username ?? null, action, details ?? null, ip ?? null);
const payouts = createPayoutService({ db, afribapay, audit, publicUrl: PUBLIC_URL });

// Code d'installation : n'existe que tant qu'aucun administrateur n'est créé.
let setupCode = null;
if (q.adminCount.get().n === 0) {
  setupCode = randomToken(9);
  console.log(`[installation] Aucun administrateur. Code d'installation : ${setupCode}`);
}

const loginByIp = createLimiter({ max: 10, windowMs: 15 * 60 * 1000 });
const loginByUser = createLimiter({ max: 5, windowMs: 15 * 60 * 1000 });
const sensitiveByAdmin = createLimiter({ max: 8, windowMs: 15 * 60 * 1000 });
const lastTotpCounter = new Map(); // anti-rejeu d'un même code TOTP

function checkTotp(admin, code) {
  const counter = verifyTotp(admin.totp_secret, code, lastTotpCounter.get(admin.id) ?? -1);
  if (counter == null) return false;
  lastTotpCounter.set(admin.id, counter);
  return true;
}

// ── Session ──

function loadSession(req) {
  const token = parseCookies(req)[COOKIE];
  if (!token) return null;
  const hash = sha256(token);
  const s = q.session.get(hash);
  if (!s) return null;
  const now = Date.now();
  const limit = s.pending_2fa ? PENDING_2FA_MS : SESSION_IDLE_MS;
  if (now - s.last_seen_at > limit || now - s.created_at > SESSION_MAX_MS) {
    q.deleteSession.run(hash);
    return null;
  }
  const admin = q.adminById.get(s.admin_id);
  if (!admin || admin.disabled) {
    q.deleteSession.run(hash);
    return null;
  }
  if (now - s.last_seen_at > 60 * 1000) q.touchSession.run(now, hash);
  return { ...s, hash, admin };
}

function startSession(res, admin, req, pending2fa) {
  const token = randomToken();
  const now = Date.now();
  q.insertSession.run(sha256(token), admin.id, randomToken(24), pending2fa ? 1 : 0, now, now, clientIp(req), String(req.headers['user-agent'] || '').slice(0, 200));
  return `${COOKIE}=${token}; ${COOKIE_FLAGS}; Max-Age=${SESSION_MAX_MS / 1000}`;
}
const clearCookie = `${COOKIE}=; ${COOKIE_FLAGS}; Max-Age=0`;

// Message flash transmis par cookie de courte durée.
function flashCookie(type, text) {
  return `tkc_flash=${encodeURIComponent(JSON.stringify({ type, text }))}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=60`;
}
function readFlash(req) {
  const value = parseCookies(req).tkc_flash;
  if (!value) return null;
  try { return JSON.parse(value); } catch { return null; }
}
const back = (res, location, type, text) => redirect(res, location, { 'Set-Cookie': flashCookie(type, text) });

function requireCsrf(ctx, form) {
  if (!ctx.session || !safeEqual(form._csrf || '', ctx.session.csrf)) throw new HttpError(403, 'Formulaire expiré. Rechargez la page et recommencez.');
}

function getSettingsView() {
  return {
    environment: settings.get('afribapay_environment', 'production'),
    apiUser: settings.get('afribapay_api_user'),
    hasApiKey: settings.has('afribapay_api_key'),
    hasMerchantKey: settings.has('afribapay_merchant_key'),
    maxAmount: settings.get('max_payout_amount')
  };
}
const maxAmount = () => Number(settings.get('max_payout_amount')) || 0;
const errMsg = (e) => (e instanceof AfribaPayError ? e.message : 'Erreur inattendue. Réessayez.');

// ── Routes ──

const routes = [];
const route = (method, pattern, handler, { auth = true } = {}) => routes.push({ method, pattern, handler, auth });

route('GET', '/healthz', (ctx, res) => send(res, 200, 'ok', { 'Content-Type': 'text/plain' }), { auth: false });

// Installation
route('GET', '/setup', (ctx, res) => {
  if (!setupCode) return redirect(res, '/login');
  sendHtml(res, 200, V.setupPage(ctx));
}, { auth: false });

route('POST', '/setup', async (ctx, res, req) => {
  if (!setupCode) return redirect(res, '/login');
  const form = await readForm(req);
  const ip = clientIp(req);
  const fail = (error) => sendHtml(res, 400, V.setupPage(ctx, { error, username: form.username }));
  if (loginByIp.blocked(ip)) return fail('Trop de tentatives. Réessayez dans 15 minutes.');
  if (!safeEqual(String(form.setup_code || '').trim(), setupCode)) { loginByIp.hit(ip); return fail('Code d’installation incorrect.'); }
  const username = String(form.username || '').trim();
  if (!/^[A-Za-z0-9._-]{3,40}$/.test(username)) return fail('Identifiant invalide (lettres, chiffres, . _ -).');
  if (form.password !== form.password_confirm) return fail('Les mots de passe ne correspondent pas.');
  const problem = passwordProblem(form.password, username);
  if (problem) return fail(problem);
  if (q.adminCount.get().n > 0) { setupCode = null; return redirect(res, '/login'); }
  const { lastInsertRowid } = q.insertAdmin.run(username, await hashPassword(form.password));
  setupCode = null;
  const admin = q.adminById.get(Number(lastInsertRowid));
  audit(admin, 'admin.installation', 'Premier administrateur créé', ip);
  q.touchLogin.run(admin.id);
  redirect(res, '/security', { 'Set-Cookie': [startSession(res, admin, req, false), flashCookie('success', 'Compte créé. Activez maintenant la double authentification.')] });
}, { auth: false });

// Connexion
route('GET', '/login', (ctx, res) => {
  if (setupCode) return redirect(res, '/setup');
  if (ctx.admin && !ctx.session.pending_2fa) return redirect(res, '/');
  sendHtml(res, 200, V.loginPage(ctx));
}, { auth: false });

route('POST', '/login', async (ctx, res, req) => {
  const form = await readForm(req);
  const ip = clientIp(req);
  const username = String(form.username || '').trim().slice(0, 40);
  const fail = (error, status = 401) => sendHtml(res, status, V.loginPage(ctx, { error, username }));
  const userKey = username.toLowerCase();
  if (loginByIp.blocked(ip) || loginByUser.blocked(userKey)) return fail('Trop de tentatives. Réessayez dans 15 minutes.', 429);
  const admin = q.adminByName.get(username);
  const ok = await verifyPassword(String(form.password || ''), admin?.password_hash);
  if (!ok || !admin || admin.disabled) {
    loginByIp.hit(ip);
    loginByUser.hit(userKey);
    audit(null, 'connexion.echec', `Identifiant : ${username}`, ip);
    return fail('Identifiant ou mot de passe incorrect.');
  }
  loginByUser.reset(userKey);
  if (ctx.session) q.deleteSession.run(ctx.session.hash);
  if (admin.totp_enabled) {
    return redirect(res, '/login/2fa', { 'Set-Cookie': startSession(res, admin, req, true) });
  }
  q.touchLogin.run(admin.id);
  audit(admin, 'connexion', 'Connexion réussie', ip);
  redirect(res, '/', { 'Set-Cookie': startSession(res, admin, req, false) });
}, { auth: false });

route('GET', '/login/2fa', (ctx, res) => {
  if (!ctx.session?.pending_2fa) return redirect(res, '/login');
  sendHtml(res, 200, V.twoFactorPage(ctx));
}, { auth: false });

route('POST', '/login/2fa', async (ctx, res, req) => {
  if (!ctx.session?.pending_2fa) return redirect(res, '/login');
  const form = await readForm(req);
  requireCsrf(ctx, form);
  const ip = clientIp(req);
  const key = `2fa:${ctx.admin.id}`;
  if (loginByUser.blocked(key)) return sendHtml(res, 429, V.twoFactorPage(ctx, { error: 'Trop de tentatives. Réessayez dans 15 minutes.' }));
  if (!checkTotp(ctx.admin, form.code)) {
    loginByUser.hit(key);
    audit(ctx.admin, 'connexion.2fa.echec', 'Code 2FA incorrect', ip);
    return sendHtml(res, 401, V.twoFactorPage(ctx, { error: 'Code incorrect.' }));
  }
  loginByUser.reset(key);
  // Nouvelle session après la 2FA (on ne réutilise pas le jeton intermédiaire).
  q.deleteSession.run(ctx.session.hash);
  q.touchLogin.run(ctx.admin.id);
  audit(ctx.admin, 'connexion', 'Connexion réussie (2FA)', ip);
  redirect(res, '/', { 'Set-Cookie': startSession(res, ctx.admin, req, false) });
}, { auth: false });

route('POST', '/logout', async (ctx, res, req) => {
  const form = await readForm(req);
  if (ctx.session) {
    requireCsrf(ctx, form);
    q.deleteSession.run(ctx.session.hash);
    if (!ctx.session.pending_2fa) audit(ctx.admin, 'deconnexion', null, clientIp(req));
  }
  redirect(res, '/login', { 'Set-Cookie': clearCookie });
}, { auth: false });

// Tableau de bord
route('GET', '/', async (ctx, res) => {
  const configured = afribapay.isConfigured();
  let balances = [];
  let balanceError = null;
  if (configured) {
    try { balances = await afribapay.balance(); } catch (e) { balanceError = errMsg(e); }
  }
  const recent = db.prepare('SELECT * FROM payouts ORDER BY id DESC LIMIT 8').all();
  // « Aujourd'hui » en heure GMT (Afrique de l'Ouest).
  const sums = (where) => db.prepare(`SELECT currency, SUM(amount) AS total, COUNT(*) AS n FROM payouts WHERE ${where} GROUP BY currency ORDER BY total DESC`).all();
  const count = (where) => db.prepare(`SELECT COUNT(*) AS n FROM payouts WHERE ${where}`).get().n;
  const today = sums("date(created_at) = date('now') AND status != 'FAILED'");
  const success30Sums = sums("status = 'SUCCESS' AND created_at > datetime('now', '-30 days')");
  const stats = {
    today,
    todayCount: today.reduce((n, r) => n + r.n, 0),
    success30: success30Sums.reduce((n, r) => n + r.n, 0),
    success30Sums,
    pending: count("status IN ('PENDING', 'SUBMITTING')"),
    toCheck: count("status = 'TO_CHECK'"),
    failed30: count("status = 'FAILED' AND created_at > datetime('now', '-30 days')")
  };
  sendHtml(res, 200, V.dashboardPage(ctx, { balances, balanceError, recent, configured, stats }));
});

// Liste des payouts
route('GET', '/payouts', (ctx, res) => {
  const status = Object.keys(V.STATUS_LABELS).includes(ctx.query.get('status')) ? ctx.query.get('status') : '';
  const search = String(ctx.query.get('q') || '').trim().slice(0, 60);
  const page = Math.max(1, Number.parseInt(ctx.query.get('page') || '1', 10) || 1);
  const where = [];
  const args = [];
  if (status) { where.push('status = ?'); args.push(status); }
  if (search) {
    where.push('(phone LIKE ? OR reference LIKE ? OR beneficiary LIKE ? OR order_id LIKE ? OR transaction_id LIKE ?)');
    const like = `%${search.replace(/[%_]/g, '')}%`;
    args.push(like, like, like, like, like);
  }
  const rows = db.prepare(`SELECT * FROM payouts ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY id DESC LIMIT 51 OFFSET ?`).all(...args, (page - 1) * 50);
  sendHtml(res, 200, V.payoutsPage(ctx, { payouts: rows.slice(0, 50), status, q: search, page, hasNext: rows.length > 50 }));
});

async function loadCountries() {
  try { return { countries: await afribapay.countries(), countriesError: null }; } catch (e) { return { countries: {}, countriesError: errMsg(e) }; }
}
// Formulaire de payout : pays/opérateurs + soldes payout (le solde est indicatif, une erreur est ignorée).
async function loadPayoutForm() {
  const [c, balances] = await Promise.all([loadCountries(), afribapay.balance().catch(() => [])]);
  return { ...c, balances, maxAmount: maxAmount() };
}

route('GET', '/payouts/new', async (ctx, res) => {
  sendHtml(res, 200, V.newPayoutPage(ctx, await loadPayoutForm()));
});

route('POST', '/payouts/edit', async (ctx, res, req) => {
  const form = await readForm(req);
  requireCsrf(ctx, form);
  sendHtml(res, 200, V.newPayoutPage(ctx, { ...(await loadPayoutForm()), values: form }));
});

route('POST', '/payouts/preview', async (ctx, res, req) => {
  const form = await readForm(req);
  requireCsrf(ctx, form);
  const formData = await loadPayoutForm();
  if (formData.countriesError) return sendHtml(res, 502, V.newPayoutPage(ctx, { ...formData, values: form }));
  const v = validatePayout(form, formData.countries, maxAmount());
  if (v.error) return sendHtml(res, 400, V.newPayoutPage(ctx, { ...formData, values: form, error: v.error }));
  sendHtml(res, 200, V.confirmPayoutPage(ctx, { ...v, p: { ...v.payout, order_id: newOrderId() }, needsTotp: Boolean(ctx.admin.totp_enabled) }));
});

route('POST', '/payouts', async (ctx, res, req) => {
  const form = await readForm(req);
  requireCsrf(ctx, form);
  const ip = clientIp(req);
  if (!isOrderId(form.order_id)) throw new HttpError(400, 'Demande de payout invalide.');
  const existing = payouts.getByOrderId(form.order_id);
  if (existing) return redirect(res, `/payouts/${existing.id}`);

  const { countries, countriesError } = await loadCountries();
  if (countriesError) throw new HttpError(502, countriesError);
  const v = validatePayout(form, countries, maxAmount());
  if (v.error) return sendHtml(res, 400, V.newPayoutPage(ctx, { ...(await loadPayoutForm()), values: form, error: v.error }));
  const retry = (error) => sendHtml(res, 401, V.confirmPayoutPage(ctx, { ...v, p: { ...v.payout, order_id: form.order_id }, needsTotp: Boolean(ctx.admin.totp_enabled), error }));

  const key = `sensitive:${ctx.admin.id}`;
  if (sensitiveByAdmin.blocked(key)) return retry('Trop de tentatives. Réessayez dans 15 minutes.');
  if (!(await verifyPassword(String(form.password || ''), ctx.admin.password_hash))) {
    sensitiveByAdmin.hit(key);
    audit(ctx.admin, 'payout.refus', 'Mot de passe incorrect à la confirmation', ip);
    return retry('Mot de passe incorrect.');
  }
  if (ctx.admin.totp_enabled && !checkTotp(ctx.admin, form.code)) {
    sensitiveByAdmin.hit(key);
    audit(ctx.admin, 'payout.refus', 'Code 2FA incorrect à la confirmation', ip);
    return retry('Code de double authentification incorrect.');
  }
  sensitiveByAdmin.reset(key);
  const { payout } = await payouts.send(v.payout, { orderId: form.order_id, admin: ctx.admin, ip });
  const messages = {
    SUCCESS: ['success', 'Payout réussi.'],
    PENDING: ['success', 'Payout envoyé : en attente de confirmation par l’opérateur.'],
    FAILED: ['error', 'AfribaPay a refusé le payout.'],
    TO_CHECK: ['warning', 'La réponse d’AfribaPay est incertaine : vérifiez le statut avant tout nouvel envoi.']
  };
  const [type, text] = messages[payout.status] || ['warning', 'Payout enregistré.'];
  back(res, `/payouts/${payout.id}`, type, text);
});

route('GET', /^\/payouts\/(\d+)$/, (ctx, res, req, m) => {
  const p = payouts.get(Number(m[1]));
  if (!p) throw new HttpError(404, 'Payout introuvable.');
  sendHtml(res, 200, V.payoutDetailPage(ctx, { p, adminName: p.admin_id ? q.adminById.get(p.admin_id)?.username : null }));
});

route('POST', /^\/payouts\/(\d+)\/refresh$/, async (ctx, res, req, m) => {
  const form = await readForm(req);
  requireCsrf(ctx, form);
  const p = payouts.get(Number(m[1]));
  if (!p) throw new HttpError(404, 'Payout introuvable.');
  const before = p.status;
  const after = await payouts.refresh(p);
  if (after.status !== before) audit(ctx.admin, 'payout.statut', `${p.order_id} : ${before} → ${after.status}`, clientIp(req));
  back(res, `/payouts/${p.id}`, after.status === before ? 'warning' : 'success', after.status === before ? 'Statut inchangé.' : 'Statut mis à jour.');
});

// Paramètres
route('GET', '/settings', (ctx, res) => {
  sendHtml(res, 200, V.settingsPage(ctx, { s: getSettingsView(), publicUrl: PUBLIC_URL }));
});

route('POST', '/settings', async (ctx, res, req) => {
  const form = await readForm(req);
  requireCsrf(ctx, form);
  const changes = [];
  const env = form.environment === 'sandbox' ? 'sandbox' : 'production';
  if (env !== settings.get('afribapay_environment', 'production')) { settings.set('afribapay_environment', env); changes.push(`environnement=${env}`); }
  const apiUser = String(form.api_user || '').trim();
  if (apiUser && apiUser !== settings.get('afribapay_api_user')) { settings.set('afribapay_api_user', apiUser); changes.push('api_user'); }
  if (form.api_key && form.api_key.trim()) { settings.setSecret('afribapay_api_key', form.api_key.trim()); changes.push('clé API'); }
  if (form.merchant_key && form.merchant_key.trim()) { settings.setSecret('afribapay_merchant_key', form.merchant_key.trim()); changes.push('clé marchand'); }
  const max = String(form.max_amount || '').trim();
  if (max && !/^\d+$/.test(max)) return back(res, '/settings', 'error', 'Montant maximum invalide.');
  if (max !== settings.get('max_payout_amount')) { settings.set('max_payout_amount', max); changes.push(`max=${max || 'aucun'}`); }
  afribapay.resetCache();
  if (changes.length) audit(ctx.admin, 'parametres', `Modifié : ${changes.join(', ')}`, clientIp(req));
  back(res, '/settings', 'success', changes.length ? 'Paramètres enregistrés.' : 'Aucun changement.');
});

route('POST', '/settings/test', async (ctx, res, req) => {
  const form = await readForm(req);
  requireCsrf(ctx, form);
  let testResult;
  try {
    const balances = await afribapay.balance();
    const payoutBalances = balances.filter((b) => b.service === 'payout');
    testResult = { ok: true, text: `Connexion réussie (${afribapay.environment()}). ${payoutBalances.length} solde(s) payout disponible(s).` };
  } catch (e) {
    testResult = { ok: false, text: `Échec : ${errMsg(e)}` };
  }
  sendHtml(res, 200, V.settingsPage(ctx, { s: getSettingsView(), publicUrl: PUBLIC_URL, testResult }));
});

// Administrateurs
route('GET', '/admins', (ctx, res) => sendHtml(res, 200, V.adminsPage(ctx, { admins: q.admins.all() })));

route('POST', '/admins', async (ctx, res, req) => {
  const form = await readForm(req);
  requireCsrf(ctx, form);
  const fail = (error) => sendHtml(res, 400, V.adminsPage(ctx, { admins: q.admins.all(), error }));
  const key = `sensitive:${ctx.admin.id}`;
  if (sensitiveByAdmin.blocked(key)) return fail('Trop de tentatives. Réessayez dans 15 minutes.');
  if (!(await verifyPassword(String(form.current_password || ''), ctx.admin.password_hash))) { sensitiveByAdmin.hit(key); return fail('Votre mot de passe est incorrect.'); }
  const username = String(form.username || '').trim();
  if (!/^[A-Za-z0-9._-]{3,40}$/.test(username)) return fail('Identifiant invalide (lettres, chiffres, . _ -).');
  if (q.adminByName.get(username)) return fail('Cet identifiant existe déjà.');
  const problem = passwordProblem(form.password, username);
  if (problem) return fail(problem);
  q.insertAdmin.run(username, await hashPassword(form.password));
  audit(ctx.admin, 'admin.ajout', `Nouvel administrateur : ${username}`, clientIp(req));
  back(res, '/admins', 'success', `Administrateur « ${username} » ajouté.`);
});

route('POST', /^\/admins\/(\d+)\/toggle$/, async (ctx, res, req, m) => {
  const form = await readForm(req);
  requireCsrf(ctx, form);
  const target = q.adminById.get(Number(m[1]));
  if (!target || target.id === ctx.admin.id) throw new HttpError(400, 'Action impossible.');
  const disabled = target.disabled ? 0 : 1;
  q.setDisabled.run(disabled, target.id);
  if (disabled) q.deleteAllAdminSessions.run(target.id);
  audit(ctx.admin, disabled ? 'admin.desactivation' : 'admin.reactivation', target.username, clientIp(req));
  back(res, '/admins', 'success', `${target.username} ${disabled ? 'désactivé' : 'réactivé'}.`);
});

// Journal
route('GET', '/journal', (ctx, res) => sendHtml(res, 200, V.journalPage(ctx, { entries: q.journal.all() })));

// Sécurité du compte
const pendingTotp = new Map(); // admin_id → { secret, at }
function securityView(ctx, extra = {}) {
  const pending = pendingTotp.get(ctx.admin.id);
  const fresh = pending && Date.now() - pending.at < 15 * 60 * 1000 ? pending.secret : null;
  return V.securityPage(ctx, { admin: ctx.admin, pendingSecret: fresh, pendingUri: fresh ? totpUri(fresh, ctx.admin.username) : null, ...extra });
}

route('GET', '/security', (ctx, res) => sendHtml(res, 200, securityView(ctx)));

route('POST', '/security/2fa/start', async (ctx, res, req) => {
  const form = await readForm(req);
  requireCsrf(ctx, form);
  if (!ctx.admin.totp_enabled) pendingTotp.set(ctx.admin.id, { secret: newTotpSecret(), at: Date.now() });
  redirect(res, '/security');
});

route('POST', '/security/2fa/enable', async (ctx, res, req) => {
  const form = await readForm(req);
  requireCsrf(ctx, form);
  const pending = pendingTotp.get(ctx.admin.id);
  if (!pending || ctx.admin.totp_enabled) return redirect(res, '/security');
  const counter = verifyTotp(pending.secret, form.code);
  if (counter == null) return sendHtml(res, 400, securityView(ctx, { error: 'Code incorrect. Vérifiez l’heure de votre téléphone et réessayez.' }));
  lastTotpCounter.set(ctx.admin.id, counter);
  q.setTotp.run(pending.secret, 1, ctx.admin.id);
  pendingTotp.delete(ctx.admin.id);
  q.deleteAdminSessions.run(ctx.admin.id, ctx.session.hash);
  audit(ctx.admin, '2fa.activation', null, clientIp(req));
  back(res, '/security', 'success', 'Double authentification activée.');
});

route('POST', '/security/2fa/disable', async (ctx, res, req) => {
  const form = await readForm(req);
  requireCsrf(ctx, form);
  const key = `sensitive:${ctx.admin.id}`;
  if (sensitiveByAdmin.blocked(key)) return sendHtml(res, 429, securityView(ctx, { error: 'Trop de tentatives. Réessayez dans 15 minutes.' }));
  const okPassword = await verifyPassword(String(form.password || ''), ctx.admin.password_hash);
  if (!okPassword || !checkTotp(ctx.admin, form.code)) {
    sensitiveByAdmin.hit(key);
    return sendHtml(res, 400, securityView(ctx, { error: 'Mot de passe ou code incorrect.' }));
  }
  q.setTotp.run(null, 0, ctx.admin.id);
  audit(ctx.admin, '2fa.desactivation', null, clientIp(req));
  back(res, '/security', 'warning', 'Double authentification désactivée.');
});

route('POST', '/security/password', async (ctx, res, req) => {
  const form = await readForm(req);
  requireCsrf(ctx, form);
  const fail = (error) => sendHtml(res, 400, securityView(ctx, { error }));
  const key = `sensitive:${ctx.admin.id}`;
  if (sensitiveByAdmin.blocked(key)) return fail('Trop de tentatives. Réessayez dans 15 minutes.');
  if (!(await verifyPassword(String(form.current_password || ''), ctx.admin.password_hash))) { sensitiveByAdmin.hit(key); return fail('Mot de passe actuel incorrect.'); }
  if (form.password !== form.password_confirm) return fail('Les nouveaux mots de passe ne correspondent pas.');
  const problem = passwordProblem(form.password, ctx.admin.username);
  if (problem) return fail(problem);
  q.setPassword.run(await hashPassword(form.password), ctx.admin.id);
  q.deleteAdminSessions.run(ctx.admin.id, ctx.session.hash);
  audit(ctx.admin, 'mot_de_passe', 'Mot de passe changé', clientIp(req));
  back(res, '/security', 'success', 'Mot de passe changé.');
});

// Notification AfribaPay (webhook public, signature HMAC obligatoire)
route('POST', '/webhooks/afribapay', async (ctx, res, req) => {
  const raw = await readBody(req, 64 * 1024);
  const ip = clientIp(req);
  const signature = req.headers['afribapay-sign'];
  if (!afribapay.verifySignature(raw, signature)) {
    audit(null, 'notification.rejetee', 'Signature absente ou invalide', ip);
    return send(res, 403, 'Invalid signature', { 'Content-Type': 'text/plain' });
  }
  let payload;
  try { payload = JSON.parse(raw.toString('utf8')); } catch { return send(res, 400, 'Invalid JSON', { 'Content-Type': 'text/plain' }); }
  payouts.handleNotification(payload, ip);
  send(res, 200, 'OK', { 'Content-Type': 'text/plain' });
}, { auth: false });

// ── Serveur ──

const server = createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const path = url.pathname.length > 1 ? url.pathname.replace(/\/+$/, '') : url.pathname;

  if (req.method === 'GET' && STATIC[path]) {
    const [type, body] = STATIC[path];
    return send(res, 200, body, { 'Content-Type': type, 'Cache-Control': 'public, max-age=3600' });
  }

  const ctx = { path, query: url.searchParams, flash: null, session: null, admin: null, environment: settings.get('afribapay_environment', 'production') };
  try {
    ctx.session = loadSession(req);
    ctx.admin = ctx.session?.admin || null;
    ctx.flash = readFlash(req);

    let matched = null;
    let match = null;
    for (const r of routes) {
      if (r.method !== req.method) continue;
      if (typeof r.pattern === 'string' ? r.pattern === path : (match = path.match(r.pattern))) { matched = r; break; }
    }
    if (!matched) {
      const known = routes.some((r) => (typeof r.pattern === 'string' ? r.pattern === path : r.pattern.test(path)));
      throw new HttpError(known ? 405 : 404, known ? 'Méthode non autorisée.' : 'Page introuvable.');
    }
    if (matched.auth) {
      if (setupCode) return redirect(res, '/setup');
      if (!ctx.admin) return redirect(res, '/login');
      if (ctx.session.pending_2fa) return redirect(res, '/login/2fa');
    }
    if (ctx.flash) res.setHeader('Set-Cookie', 'tkc_flash=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0');
    await matched.handler(ctx, res, req, match);
  } catch (error) {
    const status = error instanceof HttpError ? error.status : 500;
    if (status === 500) console.error(error);
    if (!res.headersSent) {
      const authed = ctx.admin && !ctx.session?.pending_2fa;
      sendHtml(res, status, V.errorPage({ ...ctx, admin: authed ? ctx.admin : null }, status, status === 500 ? 'Erreur interne. Réessayez.' : error.message));
    }
  }
});

server.requestTimeout = 90_000;
server.headersTimeout = 20_000;
server.listen(PORT, () => console.log(`Admin TikTok Coins à l’écoute sur le port ${PORT}`));

// Maintenance : sessions expirées et vérification des payouts en attente.
setInterval(() => {
  const now = Date.now();
  q.purgeSessions.run(now - SESSION_IDLE_MS, now - SESSION_MAX_MS);
}, 10 * 60 * 1000).unref();

let refreshing = false;
setInterval(async () => {
  if (refreshing || !afribapay.isConfigured()) return;
  refreshing = true;
  try { await payouts.refreshOpen(); } catch (e) { console.error('Vérification des payouts :', e.message); } finally { refreshing = false; }
}, 3 * 60 * 1000).unref();

for (const sig of ['SIGTERM', 'SIGINT']) {
  process.on(sig, () => { server.close(() => { db.close(); process.exit(0); }); setTimeout(() => process.exit(0), 5000).unref(); });
}
