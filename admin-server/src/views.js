// Pages HTML rendues côté serveur. Tout texte variable est échappé par html``.

class Raw {
  constructor(s) { this.s = s; }
  toString() { return this.s; }
}
export const raw = (s) => new Raw(String(s));
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const render = (v) => (v == null || v === false ? '' : v instanceof Raw ? v.s : Array.isArray(v) ? v.map(render).join('') : esc(v));
export function html(strings, ...values) {
  let out = strings[0];
  values.forEach((v, i) => { out += render(v) + strings[i + 1]; });
  return new Raw(out);
}

// ── Icônes (traits 24×24) ──
const ICONS = {
  home: '<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>',
  send: '<path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4 20-7z"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13"/><circle cx="3.5" cy="6" r="1"/><circle cx="3.5" cy="12" r="1"/><circle cx="3.5" cy="18" r="1"/>',
  settings: '<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  journal: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h5"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5M21 12H9"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  refresh: '<path d="M21 12a9 9 0 1 1-2.64-6.36L21 8"/><path d="M21 3v5h-5"/>',
  wallet: '<path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4z"/>',
  clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  check: '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
  x: '<circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/>',
  alert: '<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><path d="M12 9v4M12 17h.01"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  back: '<path d="M19 12H5M12 19l-7-7 7-7"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  activity: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
  phone: '<rect x="6" y="2" width="12" height="20" rx="2.5"/><path d="M11 18h2"/>',
  lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  key: '<circle cx="7.5" cy="15.5" r="4.5"/><path d="m10.7 12.3 9.8-9.8M17 6l3 3M15 8l2 2"/>',
  chevron: '<path d="m9 18 6-6-6-6"/>',
  more: '<circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>'
};
export const icon = (name, cls = '') => raw(`<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ''}</svg>`);

const LOGO = raw('<span class="logo-mark" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4 20-7z"/></svg></span>');

// ── Formats ──

export const STATUS_LABELS = {
  SUBMITTING: ['Envoi en cours', 'pending', 'clock'],
  PENDING: ['En attente', 'pending', 'clock'],
  SUCCESS: ['Réussi', 'success', 'check'],
  FAILED: ['Échoué', 'failed', 'x'],
  TO_CHECK: ['À vérifier', 'warning', 'alert']
};
export const statusBadge = (status) => {
  const [label, cls] = STATUS_LABELS[status] || [status, 'warning'];
  return html`<span class="badge ${cls}"><span class="dot"></span>${label}</span>`;
};

export const money = (amount, currency) => {
  if (amount == null || amount === '') return '—';
  return `${Number(amount).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} ${currency || ''}`.trim();
};
const toDate = (value) => new Date(String(value).includes('T') ? value : `${String(value).replace(' ', 'T')}Z`);
export const dateFr = (value) => {
  if (!value) return '—';
  const d = toDate(value);
  return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleString('fr-FR', { timeZone: 'Africa/Abidjan', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};
const dateShort = (value) => {
  if (!value) return '—';
  const d = toDate(value);
  if (Number.isNaN(d.getTime())) return String(value);
  const today = new Date().toLocaleDateString('fr-FR', { timeZone: 'Africa/Abidjan' });
  const day = d.toLocaleDateString('fr-FR', { timeZone: 'Africa/Abidjan' });
  const time = d.toLocaleTimeString('fr-FR', { timeZone: 'Africa/Abidjan', hour: '2-digit', minute: '2-digit' });
  return day === today ? `Aujourd’hui, ${time}` : `${d.toLocaleDateString('fr-FR', { timeZone: 'Africa/Abidjan', day: '2-digit', month: 'short' })}, ${time}`;
};
export const flag = (code) => (/^[A-Z]{2}$/.test(String(code || '')) ? String.fromCodePoint(...[...code].map((c) => 127397 + c.charCodeAt(0))) : '🌍');
const OPERATOR_NAMES = { orange: "Orange Money", mtn: "MTN MoMo", moov: "Moov Money", wave: "Wave", airtel: "Airtel Money", free: "Free Money", yas: "Yas", emoney: "E-Money", expresso: "Expresso", tmoney: "T-Money", togocell: "T-Money", mpesa: "M-Pesa", vodacom: "Vodacom", orangecd: "Orange Money", celtiis: "Celtiis Cash", coris: "Coris Money", djamo: "Djamo", afrimoney: "Afrimoney", amanata: "Amanata", nita: "Nita", zamani: "Zamani" };
export const opName = (code) => OPERATOR_NAMES[String(code || "").toLowerCase()] || String(code || "");
const initials = (name) => String(name || '?').slice(0, 2).toUpperCase();

const csrfField = (ctx) => html`<input type="hidden" name="_csrf" value="${ctx.session?.csrf || ''}">`;

// ── Gabarit ──

const NAV = [
  ['/', 'Tableau de bord', 'home'],
  ['/payouts', 'Payouts', 'list'],
  ['/payouts/new', 'Nouveau payout', 'send'],
  ['/settings', 'Paramètres', 'settings'],
  ['/admins', 'Administrateurs', 'users'],
  ['/journal', 'Journal', 'journal'],
  ['/security', 'Sécurité', 'shield']
];
const isActive = (ctx, href) => (href === '/' ? ctx.path === '/' : ctx.path === href || (href === '/payouts' && /^\/payouts\/\d+/.test(ctx.path)));

function head(title) {
  return html`<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex, nofollow">
<meta name="theme-color" content="#0b1020">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="format-detection" content="telephone=no">
<title>${title} · TikTok Coins Admin</title>
<link rel="stylesheet" href="/static/app.css?v=2">
<script src="/static/app.js?v=2" defer></script>`;
}

const flashBlock = (flash) => (flash ? html`<div class="alert ${flash.type}" role="status">${icon(flash.type === 'success' ? 'check' : flash.type === 'error' ? 'x' : 'alert')}<span>${flash.text}</span></div>` : '');

export function layout(ctx, title, body, { subtitle, actions, back } = {}) {
  const sandbox = ctx.environment === 'sandbox';
  return html`<!doctype html>
<html lang="fr">
<head>${head(title)}</head>
<body class="app">
<aside class="sidebar" id="sidebar">
  <div class="sidebar-brand">${LOGO}<div><strong>TikTok Coins</strong><small>Administration</small></div></div>
  <a class="sidebar-cta" href="/payouts/new">${icon('plus')}Nouveau payout</a>
  <nav class="sidebar-nav">
    ${NAV.filter(([href]) => href !== '/payouts/new').map(([href, label, ic]) => html`<a href="${href}" class="${isActive(ctx, href) ? 'active' : ''}">${icon(ic)}<span>${label}</span></a>`)}
  </nav>
  <div class="sidebar-foot">
    <div class="env-pill ${sandbox ? 'sandbox' : 'live'}"><span class="dot"></span>${sandbox ? 'Sandbox (test)' : 'Production'}</div>
    <div class="user">
      <span class="avatar">${initials(ctx.admin?.username)}</span>
      <span class="user-name">${ctx.admin?.username}</span>
      <form method="post" action="/logout">${csrfField(ctx)}<button type="submit" class="icon-btn" title="Déconnexion" aria-label="Déconnexion">${icon('logout')}</button></form>
    </div>
  </div>
</aside>
<div class="backdrop" data-close-menu></div>

<header class="mobile-bar">
  ${back ? html`<a class="icon-btn" href="${back}" aria-label="Retour">${icon('back')}</a>` : html`<span class="mobile-brand">${LOGO}</span>`}
  <span class="mobile-title">${title}</span>
  ${sandbox ? html`<span class="env-chip">TEST</span>` : ''}
  <button type="button" class="icon-btn" data-open-menu aria-label="Menu">${icon('menu')}</button>
</header>

<main class="content">
  <div class="page-head">
    <div>
      ${back ? html`<a class="back-link" href="${back}">${icon('back')}Retour</a>` : ''}
      <h1>${title}</h1>
      ${subtitle ? html`<p class="subtitle">${subtitle}</p>` : ''}
    </div>
    ${actions ? html`<div class="page-actions">${actions}</div>` : ''}
  </div>
  ${flashBlock(ctx.flash)}
  ${body}
</main>

<nav class="tabbar" aria-label="Navigation principale">
  <a href="/" class="${isActive(ctx, '/') ? 'active' : ''}">${icon('home')}<span>Accueil</span></a>
  <a href="/payouts" class="${isActive(ctx, '/payouts') ? 'active' : ''}">${icon('list')}<span>Payouts</span></a>
  <a href="/payouts/new" class="tab-cta ${ctx.path === '/payouts/new' ? 'active' : ''}" aria-label="Nouveau payout"><span class="fab">${icon('send')}</span><span>Envoyer</span></a>
  <a href="/journal" class="${isActive(ctx, '/journal') ? 'active' : ''}">${icon('activity')}<span>Journal</span></a>
  <button type="button" data-open-menu class="${['/settings', '/admins', '/security'].includes(ctx.path) ? 'active' : ''}">${icon('more')}<span>Plus</span></button>
</nav>
</body>
</html>`;
}

function authLayout(title, body) {
  return html`<!doctype html>
<html lang="fr">
<head>${head(title)}</head>
<body class="auth">
<div class="auth-wrap">
  <section class="auth-brand">
    <div class="sidebar-brand">${LOGO}<div><strong>TikTok Coins</strong><small>Administration</small></div></div>
    <div class="auth-pitch">
      <h2>Payouts Mobile Money, en toute sécurité.</h2>
      <p>Envoyez des fonds vers Orange Money, MTN, Moov, Wave et plus encore, avec confirmation par mot de passe et double authentification.</p>
      <ul>
        <li>${icon('shield')}Double authentification</li>
        <li>${icon('lock')}Clés AfribaPay chiffrées</li>
        <li>${icon('activity')}Journal de toutes les actions</li>
      </ul>
    </div>
    <small class="muted">Propulsé par AfribaPay</small>
  </section>
  <section class="auth-panel">
    <div class="auth-card">
      <div class="auth-logo">${LOGO}</div>
      ${body}
    </div>
  </section>
</div>
</body>
</html>`;
}

const errorAlert = (error) => (error ? html`<div class="alert error" role="alert">${icon('x')}<span>${error}</span></div>` : '');

// ── Authentification ──

export function setupPage(ctx, { error, username = '' } = {}) {
  return authLayout('Installation', html`
    <h1>Créer le premier administrateur</h1>
    <p class="subtitle">Cette page se ferme dès que le premier compte est créé.</p>
    ${errorAlert(error)}
    <form method="post" action="/setup" class="form">
      <label class="field"><span>Code d’installation</span><input name="setup_code" required autocomplete="off" autocapitalize="off" spellcheck="false"></label>
      <label class="field"><span>Identifiant</span><input name="username" value="${username}" required minlength="3" maxlength="40" pattern="[A-Za-z0-9._-]+" autocomplete="username" autocapitalize="off"></label>
      <label class="field"><span>Mot de passe</span><input type="password" name="password" required minlength="12" autocomplete="new-password"><small>12 caractères minimum.</small></label>
      <label class="field"><span>Confirmer le mot de passe</span><input type="password" name="password_confirm" required minlength="12" autocomplete="new-password"></label>
      <button type="submit" class="btn primary block">Créer le compte</button>
    </form>`);
}

export function loginPage(ctx, { error, username = '' } = {}) {
  return authLayout('Connexion', html`
    <h1>Connexion</h1>
    <p class="subtitle">Accès réservé aux administrateurs.</p>
    ${errorAlert(error)}
    <form method="post" action="/login" class="form">
      <label class="field"><span>Identifiant</span><input name="username" value="${username}" required autocomplete="username" autocapitalize="off" spellcheck="false" ${username ? '' : raw('autofocus')}></label>
      <label class="field"><span>Mot de passe</span><input type="password" name="password" required autocomplete="current-password" ${username ? raw('autofocus') : ''}></label>
      <button type="submit" class="btn primary block">Se connecter</button>
    </form>`);
}

export function twoFactorPage(ctx, { error } = {}) {
  return authLayout('Vérification', html`
    <h1>Vérification en deux étapes</h1>
    <p class="subtitle">Saisissez le code à 6 chiffres de votre application d’authentification.</p>
    ${errorAlert(error)}
    <form method="post" action="/login/2fa" class="form">
      ${csrfField(ctx)}
      <label class="field"><span>Code</span><input name="code" class="otp" required inputmode="numeric" pattern="[0-9 ]{6,7}" maxlength="7" autocomplete="one-time-code" autofocus placeholder="000 000"></label>
      <button type="submit" class="btn primary block">Valider</button>
    </form>
    <form method="post" action="/logout" class="center">${csrfField(ctx)}<button type="submit" class="btn ghost">Annuler</button></form>`);
}

// ── Tableau de bord ──

function emptyState(iconName, title, text, action) {
  return html`<div class="empty">${icon(iconName)}<strong>${title}</strong><p>${text}</p>${action || ''}</div>`;
}

export function payoutList(payouts, { emptyAction = true } = {}) {
  if (!payouts.length) {
    return emptyState('send', 'Aucun payout', 'Les payouts envoyés apparaîtront ici.', emptyAction ? html`<a class="btn primary" href="/payouts/new">${icon('plus')}Nouveau payout</a>` : '');
  }
  return html`<ul class="tx-list">${payouts.map((p) => html`<li>
    <a href="/payouts/${p.id}" class="tx">
      <span class="tx-icon ${(STATUS_LABELS[p.status] || [])[1] || 'warning'}">${icon((STATUS_LABELS[p.status] || [])[2] || 'alert')}</span>
      <span class="tx-main">
        <strong>${p.beneficiary || p.phone}</strong>
        <small>${flag(p.country)} ${opName(p.operator)} · ${p.beneficiary ? `${p.phone} · ` : ''}${dateShort(p.created_at)}</small>
      </span>
      <span class="tx-side">
        <strong>${money(p.amount, p.currency)}</strong>
        ${statusBadge(p.status)}
      </span>
    </a></li>`)}</ul>`;
}

function kpi(iconName, label, value, hint, tone = '') {
  return html`<div class="kpi ${tone}"><span class="kpi-icon">${icon(iconName)}</span><div><small>${label}</small><strong>${value}</strong>${hint ? html`<span class="kpi-hint">${hint}</span>` : ''}</div></div>`;
}

const sumsText = (rows) => (rows.length ? rows.map((r) => money(r.total, r.currency)).join(' · ') : '0');

export function dashboardPage(ctx, { balances, balanceError, recent, configured, stats }) {
  const payoutBal = balances.filter((b) => b.service === 'payout').sort((a, b) => Number(b.balance_available) - Number(a.balance_available));
  const payinBal = balances.filter((b) => b.service !== 'payout').sort((a, b) => Number(b.balance_available) - Number(a.balance_available));
  return layout(ctx, 'Tableau de bord', html`
    ${configured ? '' : html`<div class="alert warning">${icon('alert')}<span>Les identifiants AfribaPay ne sont pas encore configurés. <a href="/settings">Les renseigner</a></span></div>`}
    <section class="kpis">
      ${kpi('send', 'Envoyé aujourd’hui', sumsText(stats.today), `${stats.todayCount} payout${stats.todayCount > 1 ? 's' : ''}`)}
      ${kpi('check', 'Réussis (30 jours)', String(stats.success30), sumsText(stats.success30Sums), 'success')}
      ${kpi('clock', 'En attente', String(stats.pending), stats.pending ? 'Suivi automatique actif' : 'Rien en cours', stats.pending ? 'pending' : '')}
      ${kpi('x', 'Échoués (30 jours)', String(stats.failed30), stats.toCheck ? `${stats.toCheck} à vérifier` : null, stats.failed30 || stats.toCheck ? 'failed' : '')}
    </section>

    <section class="panel">
      <div class="panel-head"><h2>${icon('wallet')}Soldes payout</h2><a href="/" class="btn ghost sm">${icon('refresh')}Actualiser</a></div>
      ${balanceError ? html`<div class="alert error">${icon('x')}<span>${balanceError}</span></div>`
        : payoutBal.length ? html`<div class="balances">${payoutBal.map((b) => html`<div class="balance">
            <span class="flag">${flag(b.country_code)}</span>
            <div><small>${b.country_name || b.country_code}</small><strong>${money(b.balance_available, b.currency)}</strong>
            ${Number(b.balance) !== Number(b.balance_available) ? html`<span class="muted">Solde total ${money(b.balance, b.currency)}</span>` : ''}</div></div>`)}</div>`
          : configured ? emptyState('wallet', 'Aucun solde payout', 'AfribaPay n’a renvoyé aucun compte payout. Alimentez votre solde payout depuis votre espace AfribaPay.') : ''}
      ${payinBal.length ? html`<details class="more"><summary>Soldes payin (${payinBal.length})</summary>
        <div class="balances small">${payinBal.map((b) => html`<div class="balance"><span class="flag">${flag(b.country_code)}</span><div><small>${b.country_name || b.country_code}</small><strong>${money(b.balance_available, b.currency)}</strong></div></div>`)}</div></details>` : ''}
    </section>

    <section class="panel">
      <div class="panel-head"><h2>${icon('list')}Derniers payouts</h2>${recent.length ? html`<a href="/payouts" class="btn ghost sm">Tout voir${icon('chevron')}</a>` : ''}</div>
      ${payoutList(recent)}
    </section>`, {
    subtitle: `Bonjour ${ctx.admin?.username}, voici l’activité de vos payouts.`,
    actions: html`<a class="btn primary" href="/payouts/new">${icon('plus')}Nouveau payout</a>`
  });
}

// ── Payouts ──

export function payoutsPage(ctx, { payouts, status, q, page, hasNext }) {
  const qs = (p) => `?${new URLSearchParams({ ...(status ? { status } : {}), ...(q ? { q } : {}), page: String(p) })}`;
  const chip = (value, label) => {
    const params = new URLSearchParams({ ...(value ? { status: value } : {}), ...(q ? { q } : {}) }).toString();
    return html`<a href="/payouts${params ? `?${params}` : ''}" class="chip ${status === value ? 'active' : ''}">${label}</a>`;
  };
  return layout(ctx, 'Payouts', html`
    <form method="get" action="/payouts" class="searchbar">
      ${status ? html`<input type="hidden" name="status" value="${status}">` : ''}
      ${icon('search')}
      <input type="search" name="q" value="${q}" placeholder="Numéro, nom, référence, ID…" enterkeyhint="search">
    </form>
    <div class="chips">
      ${chip('', 'Tous')}
      ${Object.entries(STATUS_LABELS).filter(([k]) => k !== 'SUBMITTING').map(([k, [label]]) => chip(k, label))}
    </div>
    <section class="panel flush">${payoutList(payouts, { emptyAction: !q && !status })}</section>
    ${page > 1 || hasNext ? html`<div class="pager">
      ${page > 1 ? html`<a class="btn ghost" href="/payouts${qs(page - 1)}">${icon('back')}Précédent</a>` : html`<span></span>`}
      <span class="muted">Page ${page}</span>
      ${hasNext ? html`<a class="btn ghost" href="/payouts${qs(page + 1)}">Suivant${icon('chevron')}</a>` : html`<span></span>`}
    </div>` : ''}`, {
    subtitle: 'Historique de tous les envois Mobile Money.',
    actions: html`<a class="btn primary" href="/payouts/new">${icon('plus')}Nouveau payout</a>`
  });
}

export function newPayoutPage(ctx, { countries, countriesError, values = {}, error, maxAmount, balances = [] }) {
  const list = Object.values(countries || {}).sort((a, b) => String(a.country_name).localeCompare(b.country_name));
  const payoutBalance = Object.fromEntries(balances.filter((b) => b.service === 'payout').map((b) => [`${b.country_code}:${b.currency}`, Number(b.balance_available)]));
  const data = list.map((c) => ({
    code: c.country_code,
    name: c.country_name,
    flag: flag(c.country_code),
    prefix: c.prefix,
    currencies: Object.values(c.currencies || {}).map((cur) => ({
      currency: cur.currency,
      balance: payoutBalance[`${c.country_code}:${cur.currency}`] ?? null,
      operators: (cur.operators || []).map((o) => ({ code: o.operator_code, name: o.operator_name }))
    }))
  }));
  return layout(ctx, 'Nouveau payout', html`
    ${countriesError ? html`<div class="alert error">${icon('x')}<span>${countriesError}</span></div>` : ''}
    ${errorAlert(error)}
    <form method="post" action="/payouts/preview" class="split" data-payout-form>
      ${csrfField(ctx)}
      <script type="application/json" id="countries-data">${raw(JSON.stringify(data).replace(/</g, '\\u003c'))}</script>
      <div class="split-main">
        <section class="panel">
          <h2 class="step"><span>1</span>Destination</h2>
          <div class="form">
            <label class="field"><span>Pays</span>
              <select name="country" required data-country>
                <option value="">Choisir un pays</option>
                ${list.map((c) => html`<option value="${c.country_code}" ${values.country === c.country_code ? raw('selected') : ''}>${flag(c.country_code)}  ${c.country_name}</option>`)}
              </select>
            </label>
            <div class="field"><span>Opérateur</span>
              <div class="operators" data-operators><p class="muted small">Choisissez d’abord le pays.</p></div>
              <input type="hidden" name="operator" value="${values.operator || ''}" data-operator>
            </div>
            <input type="hidden" name="currency" value="${values.currency || ''}" data-currency>
            <label class="field"><span>Numéro Mobile Money</span>
              <div class="input-group"><span class="addon" data-prefix>+ …</span><input name="phone" value="${values.phone || ''}" required inputmode="tel" autocomplete="off" placeholder="Sans l’indicatif" data-phone></div>
            </label>
          </div>
        </section>
        <section class="panel">
          <h2 class="step"><span>2</span>Montant et bénéficiaire</h2>
          <div class="form">
            <label class="field"><span>Montant</span>
              <div class="input-group amount"><input name="amount" value="${values.amount || ''}" required inputmode="numeric" placeholder="0" data-amount ${maxAmount ? raw(`data-max="${Number(maxAmount)}"`) : ''}><span class="addon" data-currency-label>—</span></div>
              <small data-balance-hint>${maxAmount ? `Maximum par payout : ${Number(maxAmount).toLocaleString('fr-FR')}` : ''}</small>
            </label>
            <label class="field"><span>Nom du bénéficiaire <em>facultatif</em></span><input name="beneficiary" value="${values.beneficiary || ''}" maxlength="80" autocomplete="off" data-beneficiary></label>
            <label class="field"><span>Référence / motif <em>facultatif</em></span><input name="reference" value="${values.reference || ''}" maxlength="60" placeholder="Ex. remboursement commande TKT-1234" autocomplete="off"></label>
          </div>
        </section>
      </div>
      <aside class="split-side">
        <section class="panel summary sticky">
          <h2>Récapitulatif</h2>
          <dl class="kv">
            <dt>Pays</dt><dd data-sum-country>—</dd>
            <dt>Opérateur</dt><dd data-sum-operator>—</dd>
            <dt>Numéro</dt><dd data-sum-phone>—</dd>
            <dt>Bénéficiaire</dt><dd data-sum-beneficiary>—</dd>
          </dl>
          <div class="summary-total"><small>Montant envoyé</small><strong data-sum-amount>—</strong></div>
          <p class="muted small">Les frais AfribaPay s’ajoutent et sont prélevés sur le solde payout.</p>
          <div class="action-bar">
            <button type="submit" class="btn primary block" ${countriesError ? raw('disabled') : ''}>Vérifier avant envoi${icon('chevron')}</button>
          </div>
        </section>
      </aside>
    </form>`, {
    subtitle: 'Envoyez des fonds vers un compte Mobile Money.',
    back: '/payouts'
  });
}

export function confirmPayoutPage(ctx, { p, countryName, operatorName, prefix, needsTotp, error }) {
  const live = ctx.environment !== 'sandbox';
  return layout(ctx, 'Confirmer l’envoi', html`
    ${errorAlert(error)}
    <div class="narrow">
      <section class="panel receipt">
        <div class="receipt-head">
          <small>Vous allez envoyer</small>
          <strong class="receipt-amount">${money(p.amount, p.currency)}</strong>
          <span class="receipt-to">à ${p.beneficiary || `+${prefix} ${p.phone}`}</span>
        </div>
        <dl class="kv">
          <dt>Numéro</dt><dd>+${prefix} ${p.phone}</dd>
          <dt>Opérateur</dt><dd>${operatorName}</dd>
          <dt>Pays</dt><dd>${flag(p.country)} ${countryName}</dd>
          ${p.beneficiary ? html`<dt>Bénéficiaire</dt><dd>${p.beneficiary}</dd>` : ''}
          <dt>Référence</dt><dd>${p.reference || '—'}</dd>
          <dt>Environnement</dt><dd>${live ? html`<span class="badge failed"><span class="dot"></span>Argent réel</span>` : html`<span class="badge warning"><span class="dot"></span>Test (sandbox)</span>`}</dd>
        </dl>
        <div class="alert warning">${icon('alert')}<span>Vérifiez bien le numéro : un payout envoyé ne peut pas être annulé. Les frais AfribaPay s’ajoutent au montant.</span></div>
        <form method="post" action="/payouts" class="form" data-once>
          ${csrfField(ctx)}
          ${['order_id', 'country', 'operator', 'currency', 'phone', 'amount', 'beneficiary', 'reference'].map((k) => html`<input type="hidden" name="${k}" value="${p[k] ?? ''}">`)}
          <label class="field"><span>Votre mot de passe</span><input type="password" name="password" required autocomplete="current-password"></label>
          ${needsTotp ? html`<label class="field"><span>Code de double authentification</span><input name="code" class="otp" required inputmode="numeric" pattern="[0-9 ]{6,7}" maxlength="7" autocomplete="one-time-code" placeholder="000 000"></label>` : ''}
          <div class="action-bar">
            <button type="submit" class="btn danger block">${icon('send')}Envoyer ${money(p.amount, p.currency)}</button>
          </div>
        </form>
        <form method="post" action="/payouts/edit" class="center">
          ${csrfField(ctx)}
          ${['country', 'operator', 'currency', 'phone', 'amount', 'beneficiary', 'reference'].map((k) => html`<input type="hidden" name="${k}" value="${p[k] ?? ''}">`)}
          <button type="submit" class="btn ghost">Modifier les informations</button>
        </form>
      </section>
    </div>`, { subtitle: 'Dernière vérification avant l’envoi.' });
}

export function payoutDetailPage(ctx, { p, adminName }) {
  const isFinal = p.status === 'SUCCESS' || p.status === 'FAILED';
  const [, tone, ic] = STATUS_LABELS[p.status] || ['', 'warning', 'alert'];
  const steps = [
    ['Créé', dateFr(p.created_at), true],
    ['Transmis à AfribaPay', p.transaction_id ? p.transaction_id : 'En attente de réponse', Boolean(p.transaction_id) || isFinal],
    [p.status === 'FAILED' ? 'Échoué' : 'Reçu par le bénéficiaire', isFinal ? dateFr(p.updated_at) : 'En attente de l’opérateur', isFinal]
  ];
  return layout(ctx, 'Détail du payout', html`
    <div class="detail-grid">
      <section class="panel receipt">
        <div class="receipt-head">
          <span class="status-icon ${tone}">${icon(ic)}</span>
          <strong class="receipt-amount">${money(p.amount, p.currency)}</strong>
          <span class="receipt-to">${p.beneficiary || p.phone}</span>
          ${statusBadge(p.status)}
        </div>
        ${p.error ? html`<div class="alert ${p.status === 'FAILED' ? 'error' : 'warning'}">${icon('alert')}<span>${p.error}</span></div>` : ''}
        <dl class="kv">
          <dt>Numéro</dt><dd>${p.phone}</dd>
          <dt>Opérateur</dt><dd>${opName(p.operator)}</dd>
          <dt>Pays</dt><dd>${flag(p.country)} ${p.country}</dd>
          <dt>Référence</dt><dd>${p.reference || '—'}</dd>
          <dt>Frais + taxes</dt><dd>${p.fees != null ? money((p.fees || 0) + (p.taxes || 0), p.currency) : '—'}</dd>
          <dt>Total débité</dt><dd><strong>${money(p.amount_total, p.currency)}</strong></dd>
        </dl>
        ${isFinal ? '' : html`<form method="post" action="/payouts/${p.id}/refresh" class="action-bar">${csrfField(ctx)}<button type="submit" class="btn primary block">${icon('refresh')}Vérifier le statut</button></form>`}
      </section>
      <div class="stack">
        <section class="panel">
          <h2>Suivi</h2>
          <ol class="timeline">${steps.map(([label, sub, done], i) => html`<li class="${done ? (i === 2 && p.status === 'FAILED' ? 'failed' : 'done') : ''}"><span class="tl-dot"></span><div><strong>${label}</strong><small>${sub}</small></div></li>`)}</ol>
        </section>
        <section class="panel">
          <h2>Informations techniques</h2>
          <dl class="kv">
            <dt>Order ID</dt><dd class="mono">${p.order_id}</dd>
            <dt>Transaction</dt><dd class="mono">${p.transaction_id || '—'}</dd>
            <dt>Environnement</dt><dd>${p.environment}</dd>
            <dt>Envoyé par</dt><dd>${adminName || '—'}</dd>
            <dt>Mis à jour</dt><dd>${dateFr(p.updated_at)}</dd>
          </dl>
        </section>
      </div>
    </div>`, { back: '/payouts' });
}

// ── Paramètres ──

export function settingsPage(ctx, { s, publicUrl, testResult }) {
  const state = (has) => (has ? html`<span class="badge success"><span class="dot"></span>Enregistrée</span>` : html`<span class="badge warning"><span class="dot"></span>À renseigner</span>`);
  return layout(ctx, 'Paramètres', html`
    <div class="grid-2">
      <section class="panel">
        <h2>${icon('key')}Identifiants AfribaPay</h2>
        <p class="muted">Disponibles dans votre tableau de bord AfribaPay. Les clés sont chiffrées sur le serveur et ne sont jamais réaffichées.</p>
        <form method="post" action="/settings" class="form" autocomplete="off">
          ${csrfField(ctx)}
          <div class="field"><span>Environnement</span>
            <div class="segmented">
              <label><input type="radio" name="environment" value="production" ${s.environment === 'production' ? raw('checked') : ''}><span>Production</span></label>
              <label><input type="radio" name="environment" value="sandbox" ${s.environment === 'sandbox' ? raw('checked') : ''}><span>Sandbox (test)</span></label>
            </div>
          </div>
          <label class="field"><span>API user</span><input name="api_user" value="${s.apiUser}" autocapitalize="off" spellcheck="false"></label>
          <label class="field"><span>Clé API ${state(s.hasApiKey)}</span><input type="password" name="api_key" placeholder="${s.hasApiKey ? 'Laisser vide pour conserver' : 'Coller la clé API'}" autocomplete="new-password"></label>
          <label class="field"><span>Clé marchand ${state(s.hasMerchantKey)}</span><input type="password" name="merchant_key" placeholder="${s.hasMerchantKey ? 'Laisser vide pour conserver' : 'Coller la clé marchand'}" autocomplete="new-password"></label>
          <label class="field"><span>Montant maximum par payout <em>facultatif</em></span><input name="max_amount" value="${s.maxAmount}" inputmode="numeric" pattern="[0-9]*" placeholder="Sans limite"></label>
          <button type="submit" class="btn primary">Enregistrer</button>
        </form>
      </section>
      <div class="stack">
        <section class="panel">
          <h2>${icon('activity')}Tester la connexion</h2>
          <p class="muted">Demande un jeton et les soldes à AfribaPay avec les identifiants enregistrés.</p>
          ${testResult ? html`<div class="alert ${testResult.ok ? 'success' : 'error'}">${icon(testResult.ok ? 'check' : 'x')}<span>${testResult.text}</span></div>` : ''}
          <form method="post" action="/settings/test">${csrfField(ctx)}<button type="submit" class="btn">${icon('refresh')}Lancer le test</button></form>
        </section>
        <section class="panel">
          <h2>${icon('shield')}Notifications et réseau</h2>
          <p class="muted">Adresse transmise à AfribaPay à chaque payout pour recevoir le statut final (signature vérifiée) :</p>
          <p class="code">${publicUrl}/webhooks/afribapay</p>
          <p class="muted">Les appels partent de l’IP <strong>185.97.144.133</strong>, qui doit être autorisée dans votre compte AfribaPay (payin et payout).</p>
        </section>
      </div>
    </div>`, { subtitle: 'Connexion à AfribaPay et limites d’envoi.' });
}

// ── Administrateurs ──

export function adminsPage(ctx, { admins, error }) {
  return layout(ctx, 'Administrateurs', html`
    ${errorAlert(error)}
    <div class="grid-2">
      <section class="panel flush">
        <ul class="people">${admins.map((a) => html`<li>
          <span class="avatar">${initials(a.username)}</span>
          <div class="people-main">
            <strong>${a.username}${a.id === ctx.admin.id ? html` <span class="muted">(vous)</span>` : ''}</strong>
            <small>Dernière connexion : ${dateFr(a.last_login_at)}</small>
            <span class="people-tags">
              ${a.disabled ? html`<span class="badge failed"><span class="dot"></span>Désactivé</span>` : html`<span class="badge success"><span class="dot"></span>Actif</span>`}
              ${a.totp_enabled ? html`<span class="badge neutral">${icon('shield')}2FA</span>` : html`<span class="badge warning"><span class="dot"></span>Sans 2FA</span>`}
            </span>
          </div>
          ${a.id === ctx.admin.id ? '' : html`<form method="post" action="/admins/${a.id}/toggle">${csrfField(ctx)}<button type="submit" class="btn ghost sm">${a.disabled ? 'Réactiver' : 'Désactiver'}</button></form>`}
        </li>`)}</ul>
      </section>
      <section class="panel">
        <h2>${icon('plus')}Ajouter un administrateur</h2>
        <form method="post" action="/admins" class="form" autocomplete="off">
          ${csrfField(ctx)}
          <label class="field"><span>Identifiant</span><input name="username" required minlength="3" maxlength="40" pattern="[A-Za-z0-9._-]+" autocapitalize="off"></label>
          <label class="field"><span>Mot de passe initial</span><input type="password" name="password" required minlength="12" autocomplete="new-password"><small>12 caractères minimum. À transmettre en main propre.</small></label>
          <label class="field"><span>Votre mot de passe (confirmation)</span><input type="password" name="current_password" required autocomplete="current-password"></label>
          <button type="submit" class="btn primary">Ajouter</button>
        </form>
      </section>
    </div>`, { subtitle: 'Personnes autorisées à se connecter et à envoyer des payouts.' });
}

// ── Journal ──

const ACTION_LABELS = {
  'connexion': 'Connexion', 'connexion.echec': 'Échec de connexion', 'connexion.2fa.echec': 'Code 2FA incorrect', 'deconnexion': 'Déconnexion',
  'admin.installation': 'Installation', 'admin.ajout': 'Administrateur ajouté', 'admin.desactivation': 'Administrateur désactivé', 'admin.reactivation': 'Administrateur réactivé',
  'parametres': 'Paramètres modifiés', 'mot_de_passe': 'Mot de passe changé', '2fa.activation': '2FA activée', '2fa.desactivation': '2FA désactivée',
  'payout.envoi': 'Payout envoyé', 'payout.reponse': 'Réponse AfribaPay', 'payout.erreur': 'Erreur AfribaPay', 'payout.statut': 'Statut mis à jour', 'payout.refus': 'Confirmation refusée',
  'notification.rejetee': 'Notification rejetée', 'notification.incoherente': 'Notification incohérente', 'notification.ignoree': 'Notification ignorée'
};
const actionTone = (a) => (/echec|erreur|refus|rejetee|incoherente|desactivation/.test(a) ? 'failed' : /payout\.envoi|ajout|activation|installation/.test(a) ? 'success' : 'neutral');

export function journalPage(ctx, { entries }) {
  return layout(ctx, 'Journal', html`
    <section class="panel flush">
      ${entries.length ? html`<ul class="log">${entries.map((e) => html`<li>
        <span class="log-dot ${actionTone(e.action)}"></span>
        <div class="log-main">
          <div class="log-top"><strong>${ACTION_LABELS[e.action] || e.action}</strong><small>${dateShort(e.at)}</small></div>
          ${e.details ? html`<p>${e.details}</p>` : ''}
          <small class="muted">${e.username || 'Système'}${e.ip ? ` · ${e.ip}` : ''}</small>
        </div></li>`)}</ul>` : emptyState('journal', 'Journal vide', 'Les actions apparaîtront ici.')}
    </section>`, { subtitle: 'Les 300 dernières actions : connexions, paramètres, payouts, notifications.' });
}

// ── Sécurité ──

export function securityPage(ctx, { admin, pendingSecret, pendingUri, error }) {
  return layout(ctx, 'Sécurité', html`
    ${errorAlert(error)}
    <div class="grid-2">
      <section class="panel">
        <h2>${icon('shield')}Double authentification</h2>
        ${admin.totp_enabled
          ? html`<div class="alert success">${icon('check')}<span>Activée : un code est demandé à chaque connexion et à chaque payout.</span></div>
            <form method="post" action="/security/2fa/disable" class="form">
              ${csrfField(ctx)}
              <label class="field"><span>Mot de passe</span><input type="password" name="password" required autocomplete="current-password"></label>
              <label class="field"><span>Code actuel</span><input name="code" class="otp" required inputmode="numeric" pattern="[0-9 ]{6,7}" maxlength="7" autocomplete="one-time-code" placeholder="000 000"></label>
              <button type="submit" class="btn ghost danger-text">Désactiver la 2FA</button>
            </form>`
          : pendingSecret
            ? html`<ol class="steps">
                <li>Installez <strong>Google Authenticator</strong> (ou Authy, 1Password…).</li>
                <li>${pendingUri ? html`Sur ce téléphone : <a class="btn sm" href="${pendingUri}">Ajouter dans l’application</a><br><span class="muted">ou saisissez la clé :</span>` : 'Ajoutez un compte avec cette clé :'}
                  <p class="code secret">${pendingSecret.replace(/(.{4})/g, '$1 ').trim()}</p></li>
                <li>Saisissez le code à 6 chiffres affiché.</li>
              </ol>
              <form method="post" action="/security/2fa/enable" class="form">
                ${csrfField(ctx)}
                <label class="field"><span>Code</span><input name="code" class="otp" required inputmode="numeric" pattern="[0-9 ]{6,7}" maxlength="7" autocomplete="one-time-code" placeholder="000 000"></label>
                <button type="submit" class="btn primary">Activer la 2FA</button>
              </form>`
            : html`<div class="alert warning">${icon('alert')}<span>Non activée. Fortement recommandée : elle protège les payouts même si votre mot de passe fuite.</span></div>
              <form method="post" action="/security/2fa/start">${csrfField(ctx)}<button type="submit" class="btn primary">${icon('shield')}Configurer la 2FA</button></form>`}
      </section>
      <section class="panel">
        <h2>${icon('lock')}Mot de passe</h2>
        <form method="post" action="/security/password" class="form">
          ${csrfField(ctx)}
          <label class="field"><span>Mot de passe actuel</span><input type="password" name="current_password" required autocomplete="current-password"></label>
          <label class="field"><span>Nouveau mot de passe</span><input type="password" name="password" required minlength="12" autocomplete="new-password"><small>12 caractères minimum.</small></label>
          <label class="field"><span>Confirmer</span><input type="password" name="password_confirm" required minlength="12" autocomplete="new-password"></label>
          <button type="submit" class="btn">Changer le mot de passe</button>
          <small class="muted">Vos autres sessions seront fermées.</small>
        </form>
      </section>
    </div>`, { subtitle: 'Protégez l’accès à votre compte administrateur.' });
}

export function errorPage(ctx, status, message) {
  const body = html`<div class="empty">${icon('alert')}<strong>Erreur ${status}</strong><p>${message}</p><a class="btn primary" href="/">Retour à l’accueil</a></div>`;
  return ctx.admin ? layout(ctx, 'Erreur', html`<section class="panel">${body}</section>`) : authLayout('Erreur', body);
}
