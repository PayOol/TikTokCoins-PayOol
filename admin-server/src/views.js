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

export const STATUS_LABELS = {
  SUBMITTING: ['Envoi en cours', 'pending'],
  PENDING: ['En attente', 'pending'],
  SUCCESS: ['Réussi', 'success'],
  FAILED: ['Échoué', 'failed'],
  TO_CHECK: ['À vérifier', 'warning']
};
export const statusBadge = (status) => {
  const [label, cls] = STATUS_LABELS[status] || [status, 'warning'];
  return html`<span class="badge ${cls}">${label}</span>`;
};

export const money = (amount, currency) => {
  if (amount == null || amount === '') return '—';
  return `${Number(amount).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} ${currency || ''}`.trim();
};
export const dateFr = (value) => {
  if (!value) return '—';
  const d = new Date(String(value).includes('T') ? value : `${String(value).replace(' ', 'T')}Z`);
  return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleString('fr-FR', { timeZone: 'Africa/Abidjan', dateStyle: 'short', timeStyle: 'short' }) + ' GMT';
};

const csrfField = (ctx) => html`<input type="hidden" name="_csrf" value="${ctx.session?.csrf || ''}">`;

const NAV = [
  ['/', 'Tableau de bord'],
  ['/payouts', 'Payouts'],
  ['/payouts/new', 'Nouveau payout'],
  ['/settings', 'Paramètres'],
  ['/admins', 'Administrateurs'],
  ['/journal', 'Journal'],
  ['/security', 'Sécurité']
];

export function layout(ctx, title, body, { bare = false } = {}) {
  const flash = ctx.flash
    ? html`<div class="flash ${ctx.flash.type}">${ctx.flash.text}</div>`
    : '';
  const env = ctx.environment === 'sandbox' ? html`<span class="env sandbox">SANDBOX</span>` : '';
  const header = bare ? '' : html`
    <header class="top">
      <div class="brand">TikTok Coins · Admin ${env}</div>
      <nav>${NAV.map(([href, label]) => html`<a href="${href}" class="${ctx.path === href ? 'active' : ''}">${label}</a>`)}</nav>
      <form method="post" action="/logout" class="logout">${csrfField(ctx)}<span>${ctx.admin?.username}</span><button type="submit" class="link">Déconnexion</button></form>
    </header>`;
  return html`<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>${title} · TikTok Coins Admin</title>
<link rel="stylesheet" href="/static/app.css">
<script src="/static/app.js" defer></script>
</head>
<body class="${bare ? 'bare' : ''}">
${header}
<main>
${flash}
${body}
</main>
</body>
</html>`;
}

// ── Authentification ──

export function setupPage(ctx, { error, username = '' } = {}) {
  return layout(ctx, 'Installation', html`
    <section class="card narrow">
      <h1>Créer le premier administrateur</h1>
      <p class="muted">Cette page n’est disponible que tant qu’aucun administrateur n’existe. Le code d’installation figure dans les journaux du conteneur.</p>
      ${error ? html`<div class="flash error">${error}</div>` : ''}
      <form method="post" action="/setup" class="stack">
        <label>Code d’installation<input name="setup_code" required autocomplete="off" autocapitalize="off" spellcheck="false"></label>
        <label>Identifiant<input name="username" value="${username}" required minlength="3" maxlength="40" pattern="[A-Za-z0-9._-]+" autocomplete="username" autocapitalize="off"></label>
        <label>Mot de passe (12 caractères minimum)<input type="password" name="password" required minlength="12" autocomplete="new-password"></label>
        <label>Confirmer le mot de passe<input type="password" name="password_confirm" required minlength="12" autocomplete="new-password"></label>
        <button type="submit" class="primary">Créer le compte</button>
      </form>
    </section>`, { bare: true });
}

export function loginPage(ctx, { error, username = '' } = {}) {
  return layout(ctx, 'Connexion', html`
    <section class="card narrow">
      <h1>Connexion administrateur</h1>
      ${error ? html`<div class="flash error">${error}</div>` : ''}
      <form method="post" action="/login" class="stack">
        <label>Identifiant<input name="username" value="${username}" required autocomplete="username" autocapitalize="off" spellcheck="false" autofocus></label>
        <label>Mot de passe<input type="password" name="password" required autocomplete="current-password"></label>
        <button type="submit" class="primary">Se connecter</button>
      </form>
    </section>`, { bare: true });
}

export function twoFactorPage(ctx, { error } = {}) {
  return layout(ctx, 'Double authentification', html`
    <section class="card narrow">
      <h1>Code de vérification</h1>
      <p class="muted">Saisissez le code à 6 chiffres affiché par votre application d’authentification.</p>
      ${error ? html`<div class="flash error">${error}</div>` : ''}
      <form method="post" action="/login/2fa" class="stack">
        ${csrfField(ctx)}
        <label>Code<input name="code" required inputmode="numeric" pattern="[0-9 ]{6,7}" autocomplete="one-time-code" autofocus></label>
        <button type="submit" class="primary">Valider</button>
      </form>
      <form method="post" action="/logout" class="center">${csrfField(ctx)}<button type="submit" class="link">Annuler</button></form>
    </section>`, { bare: true });
}

// ── Tableau de bord ──

function balanceTable(balances) {
  if (!balances.length) return html`<p class="muted">Aucun solde renvoyé par AfribaPay.</p>`;
  const sorted = [...balances].sort((a, b) => (a.service === b.service ? String(a.country_name).localeCompare(b.country_name) : a.service === 'payout' ? -1 : 1));
  return html`<div class="table-wrap"><table>
    <thead><tr><th>Service</th><th>Pays</th><th class="num">Solde disponible</th><th class="num">Solde</th></tr></thead>
    <tbody>${sorted.map((b) => html`<tr class="${b.service === 'payout' ? 'highlight' : ''}">
      <td>${b.service === 'payout' ? 'Payout' : 'Payin'}</td>
      <td>${b.country_name || b.country_code}</td>
      <td class="num">${money(b.balance_available, b.currency)}</td>
      <td class="num">${money(b.balance, b.currency)}</td></tr>`)}</tbody></table></div>`;
}

export function payoutRows(payouts) {
  if (!payouts.length) return html`<p class="muted">Aucun payout pour le moment.</p>`;
  return html`<div class="table-wrap"><table>
    <thead><tr><th>Date</th><th>Bénéficiaire</th><th>Opérateur</th><th class="num">Montant</th><th>Statut</th></tr></thead>
    <tbody>${payouts.map((p) => html`<tr>
      <td><a href="/payouts/${p.id}">${dateFr(p.created_at)}</a></td>
      <td>${p.beneficiary ? html`${p.beneficiary}<br>` : ''}<span class="muted">${p.country} · ${p.phone}</span></td>
      <td>${p.operator}</td>
      <td class="num">${money(p.amount, p.currency)}</td>
      <td>${statusBadge(p.status)}</td></tr>`)}</tbody></table></div>`;
}

export function dashboardPage(ctx, { balances, balanceError, recent, configured }) {
  return layout(ctx, 'Tableau de bord', html`
    <div class="page-head"><h1>Tableau de bord</h1><a class="button primary" href="/payouts/new">Nouveau payout</a></div>
    ${configured ? '' : html`<div class="flash warning">Les identifiants AfribaPay ne sont pas encore configurés. <a href="/settings">Les renseigner</a>.</div>`}
    <section class="card">
      <h2>Soldes AfribaPay</h2>
      ${balanceError ? html`<div class="flash error">${balanceError}</div>` : balanceTable(balances)}
    </section>
    <section class="card">
      <div class="page-head"><h2>Derniers payouts</h2><a href="/payouts">Tout voir</a></div>
      ${payoutRows(recent)}
    </section>`);
}

// ── Payouts ──

export function payoutsPage(ctx, { payouts, status, q, page, hasNext }) {
  const qs = (p) => `?${new URLSearchParams({ ...(status ? { status } : {}), ...(q ? { q } : {}), page: String(p) })}`;
  return layout(ctx, 'Payouts', html`
    <div class="page-head"><h1>Payouts</h1><a class="button primary" href="/payouts/new">Nouveau payout</a></div>
    <form method="get" action="/payouts" class="filters">
      <input name="q" value="${q}" placeholder="Numéro, référence, bénéficiaire, ID…">
      <select name="status">
        <option value="">Tous les statuts</option>
        ${Object.entries(STATUS_LABELS).map(([k, [label]]) => html`<option value="${k}" ${status === k ? raw('selected') : ''}>${label}</option>`)}
      </select>
      <button type="submit">Filtrer</button>
    </form>
    <section class="card">${payoutRows(payouts)}</section>
    <div class="pager">
      ${page > 1 ? html`<a href="/payouts${qs(page - 1)}">← Précédent</a>` : html`<span></span>`}
      ${hasNext ? html`<a href="/payouts${qs(page + 1)}">Suivant →</a>` : ''}
    </div>`);
}

export function newPayoutPage(ctx, { countries, countriesError, values = {}, error, maxAmount }) {
  const list = Object.values(countries || {}).sort((a, b) => String(a.country_name).localeCompare(b.country_name));
  const data = list.map((c) => ({
    code: c.country_code,
    name: c.country_name,
    prefix: c.prefix,
    currencies: Object.values(c.currencies || {}).map((cur) => ({
      currency: cur.currency,
      operators: (cur.operators || []).map((o) => ({ code: o.operator_code, name: o.operator_name }))
    }))
  }));
  return layout(ctx, 'Nouveau payout', html`
    <h1>Nouveau payout</h1>
    <p class="muted">L’argent est envoyé sur le compte Mobile Money du bénéficiaire, depuis le solde payout AfribaPay du pays choisi.</p>
    ${countriesError ? html`<div class="flash error">${countriesError}</div>` : ''}
    ${error ? html`<div class="flash error">${error}</div>` : ''}
    <section class="card narrow">
      <form method="post" action="/payouts/preview" class="stack" data-payout-form>
        ${csrfField(ctx)}
        <script type="application/json" id="countries-data">${raw(JSON.stringify(data).replace(/</g, '\\u003c'))}</script>
        <label>Pays
          <select name="country" required data-country>
            <option value="">Choisir…</option>
            ${list.map((c) => html`<option value="${c.country_code}" ${values.country === c.country_code ? raw('selected') : ''}>${c.country_name} (+${c.prefix})</option>`)}
          </select>
        </label>
        <label>Opérateur
          <select name="operator" required data-operator data-selected="${values.operator || ''}"><option value="">Choisir d’abord le pays</option></select>
        </label>
        <input type="hidden" name="currency" value="${values.currency || ''}" data-currency>
        <label>Numéro Mobile Money du bénéficiaire
          <div class="prefixed"><span data-prefix>+…</span><input name="phone" value="${values.phone || ''}" required inputmode="tel" autocomplete="off" placeholder="Numéro sans l’indicatif"></div>
        </label>
        <label>Montant <span class="muted" data-currency-label></span>
          <input name="amount" value="${values.amount || ''}" required inputmode="numeric" pattern="[0-9 ]+" ${maxAmount ? html`data-max="${maxAmount}"` : ''}>
          ${maxAmount ? html`<small class="muted">Maximum par payout : ${Number(maxAmount).toLocaleString('fr-FR')}</small>` : ''}
        </label>
        <label>Nom du bénéficiaire (facultatif)<input name="beneficiary" value="${values.beneficiary || ''}" maxlength="80"></label>
        <label>Référence / motif (facultatif)<input name="reference" value="${values.reference || ''}" maxlength="60" placeholder="Ex. remboursement commande TKT-1234"></label>
        <button type="submit" class="primary" ${countriesError ? raw('disabled') : ''}>Vérifier avant envoi</button>
      </form>
    </section>`);
}

export function confirmPayoutPage(ctx, { p, countryName, operatorName, prefix, needsTotp, error }) {
  return layout(ctx, 'Confirmer le payout', html`
    <h1>Confirmer le payout</h1>
    ${error ? html`<div class="flash error">${error}</div>` : ''}
    <section class="card narrow">
      <dl class="details">
        <dt>Montant</dt><dd class="big">${money(p.amount, p.currency)}</dd>
        <dt>Bénéficiaire</dt><dd>${p.beneficiary || '—'}</dd>
        <dt>Numéro</dt><dd>+${prefix} ${p.phone}</dd>
        <dt>Opérateur</dt><dd>${operatorName}</dd>
        <dt>Pays</dt><dd>${countryName}</dd>
        <dt>Référence</dt><dd>${p.reference || '—'}</dd>
        <dt>Environnement</dt><dd>${ctx.environment === 'sandbox' ? 'Sandbox (test)' : 'Production (argent réel)'}</dd>
      </dl>
      <p class="muted">Les frais AfribaPay s’ajoutent au montant et sont prélevés sur votre solde payout. Un payout envoyé ne peut pas être annulé.</p>
      <form method="post" action="/payouts" class="stack" data-once>
        ${csrfField(ctx)}
        ${['order_id', 'country', 'operator', 'currency', 'phone', 'amount', 'beneficiary', 'reference'].map((k) => html`<input type="hidden" name="${k}" value="${p[k] ?? ''}">`)}
        <label>Votre mot de passe<input type="password" name="password" required autocomplete="current-password"></label>
        ${needsTotp ? html`<label>Code de double authentification<input name="code" required inputmode="numeric" pattern="[0-9 ]{6,7}" autocomplete="one-time-code"></label>` : ''}
        <button type="submit" class="primary danger">Envoyer ${money(p.amount, p.currency)}</button>
      </form>
      <form method="post" action="/payouts/edit" class="center">
        ${csrfField(ctx)}
        ${['country', 'operator', 'currency', 'phone', 'amount', 'beneficiary', 'reference'].map((k) => html`<input type="hidden" name="${k}" value="${p[k] ?? ''}">`)}
        <button type="submit" class="link">Modifier</button>
      </form>
    </section>`);
}

export function payoutDetailPage(ctx, { p, adminName }) {
  const isFinal = p.status === 'SUCCESS' || p.status === 'FAILED';
  return layout(ctx, 'Détail du payout', html`
    <div class="page-head"><h1>Payout ${statusBadge(p.status)}</h1><a href="/payouts">← Liste</a></div>
    <section class="card narrow">
      <dl class="details">
        <dt>Montant</dt><dd class="big">${money(p.amount, p.currency)}</dd>
        <dt>Frais + taxes</dt><dd>${p.fees != null ? money((p.fees || 0) + (p.taxes || 0), p.currency) : '—'}</dd>
        <dt>Total débité</dt><dd>${money(p.amount_total, p.currency)}</dd>
        <dt>Bénéficiaire</dt><dd>${p.beneficiary || '—'}</dd>
        <dt>Numéro</dt><dd>${p.phone}</dd>
        <dt>Opérateur / pays</dt><dd>${p.operator} · ${p.country}</dd>
        <dt>Référence</dt><dd>${p.reference || '—'}</dd>
        <dt>Order ID</dt><dd class="mono">${p.order_id}</dd>
        <dt>Transaction AfribaPay</dt><dd class="mono">${p.transaction_id || '—'}</dd>
        <dt>Environnement</dt><dd>${p.environment}</dd>
        <dt>Créé par</dt><dd>${adminName || '—'}</dd>
        <dt>Créé le</dt><dd>${dateFr(p.created_at)}</dd>
        <dt>Mis à jour</dt><dd>${dateFr(p.updated_at)}</dd>
        ${p.error ? html`<dt>Message</dt><dd class="error-text">${p.error}</dd>` : ''}
      </dl>
      ${isFinal ? '' : html`<form method="post" action="/payouts/${p.id}/refresh">${csrfField(ctx)}<button type="submit">Vérifier le statut auprès d’AfribaPay</button></form>`}
    </section>`);
}

// ── Paramètres ──

export function settingsPage(ctx, { s, publicUrl, testResult }) {
  const mask = (has) => (has ? 'Enregistrée — laisser vide pour conserver' : 'Non configurée');
  return layout(ctx, 'Paramètres', html`
    <h1>Paramètres AfribaPay</h1>
    <section class="card narrow">
      <p class="muted">Ces identifiants se trouvent dans votre tableau de bord AfribaPay. Les clés sont chiffrées dans la base du serveur et ne sont jamais réaffichées.</p>
      <form method="post" action="/settings" class="stack" autocomplete="off">
        ${csrfField(ctx)}
        <label>Environnement
          <select name="environment">
            <option value="production" ${s.environment === 'production' ? raw('selected') : ''}>Production (argent réel)</option>
            <option value="sandbox" ${s.environment === 'sandbox' ? raw('selected') : ''}>Sandbox (test)</option>
          </select>
        </label>
        <label>API user (username)<input name="api_user" value="${s.apiUser}" autocapitalize="off" spellcheck="false"></label>
        <label>Clé API (password)<input type="password" name="api_key" placeholder="${mask(s.hasApiKey)}" autocomplete="new-password"></label>
        <label>Clé marchand (merchant_key)<input type="password" name="merchant_key" placeholder="${mask(s.hasMerchantKey)}" autocomplete="new-password"></label>
        <label>Montant maximum par payout (vide = sans limite)<input name="max_amount" value="${s.maxAmount}" inputmode="numeric" pattern="[0-9]*"></label>
        <button type="submit" class="primary">Enregistrer</button>
      </form>
    </section>
    <section class="card narrow">
      <h2>Tester la connexion</h2>
      <p class="muted">Demande un jeton et les soldes à AfribaPay avec les identifiants enregistrés.</p>
      ${testResult ? html`<div class="flash ${testResult.ok ? 'success' : 'error'}">${testResult.text}</div>` : ''}
      <form method="post" action="/settings/test">${csrfField(ctx)}<button type="submit">Tester</button></form>
    </section>
    <section class="card narrow">
      <h2>Notifications AfribaPay</h2>
      <p class="muted">Chaque payout transmet automatiquement cette adresse à AfribaPay pour recevoir son statut final (signature vérifiée) :</p>
      <p class="mono">${publicUrl}/webhooks/afribapay</p>
      <p class="muted">Les appels partent du serveur 185.97.144.133 : cette IP doit être autorisée dans votre compte AfribaPay.</p>
    </section>`);
}

// ── Administrateurs ──

export function adminsPage(ctx, { admins, error }) {
  return layout(ctx, 'Administrateurs', html`
    <h1>Administrateurs</h1>
    ${error ? html`<div class="flash error">${error}</div>` : ''}
    <section class="card">
      <div class="table-wrap"><table>
        <thead><tr><th>Identifiant</th><th>2FA</th><th>Dernière connexion</th><th>État</th><th></th></tr></thead>
        <tbody>${admins.map((a) => html`<tr>
          <td>${a.username}${a.id === ctx.admin.id ? html` <span class="muted">(vous)</span>` : ''}</td>
          <td>${a.totp_enabled ? 'Activée' : html`<span class="muted">Non</span>`}</td>
          <td>${dateFr(a.last_login_at)}</td>
          <td>${a.disabled ? html`<span class="badge failed">Désactivé</span>` : html`<span class="badge success">Actif</span>`}</td>
          <td>${a.id === ctx.admin.id ? '' : html`<form method="post" action="/admins/${a.id}/toggle" class="inline">${csrfField(ctx)}<button type="submit" class="link">${a.disabled ? 'Réactiver' : 'Désactiver'}</button></form>`}</td>
        </tr>`)}</tbody></table></div>
    </section>
    <section class="card narrow">
      <h2>Ajouter un administrateur</h2>
      <form method="post" action="/admins" class="stack" autocomplete="off">
        ${csrfField(ctx)}
        <label>Identifiant<input name="username" required minlength="3" maxlength="40" pattern="[A-Za-z0-9._-]+" autocapitalize="off"></label>
        <label>Mot de passe initial (12 caractères minimum)<input type="password" name="password" required minlength="12" autocomplete="new-password"></label>
        <label>Votre mot de passe (confirmation)<input type="password" name="current_password" required autocomplete="current-password"></label>
        <button type="submit" class="primary">Ajouter</button>
      </form>
    </section>`);
}

// ── Journal ──

export function journalPage(ctx, { entries }) {
  return layout(ctx, 'Journal', html`
    <h1>Journal d’activité</h1>
    <section class="card"><div class="table-wrap"><table>
      <thead><tr><th>Date</th><th>Admin</th><th>Action</th><th>Détails</th><th>IP</th></tr></thead>
      <tbody>${entries.map((e) => html`<tr><td>${dateFr(e.at)}</td><td>${e.username || '—'}</td><td>${e.action}</td><td class="wrap">${e.details || ''}</td><td class="mono">${e.ip || ''}</td></tr>`)}</tbody>
    </table></div></section>`);
}

// ── Sécurité ──

export function securityPage(ctx, { admin, pendingSecret, pendingUri, error }) {
  return layout(ctx, 'Sécurité', html`
    <h1>Sécurité du compte</h1>
    ${error ? html`<div class="flash error">${error}</div>` : ''}
    <section class="card narrow">
      <h2>Double authentification (2FA)</h2>
      ${admin.totp_enabled
        ? html`<p><span class="badge success">Activée</span></p>
          <form method="post" action="/security/2fa/disable" class="stack">
            ${csrfField(ctx)}
            <label>Mot de passe<input type="password" name="password" required autocomplete="current-password"></label>
            <label>Code actuel<input name="code" required inputmode="numeric" pattern="[0-9 ]{6,7}" autocomplete="one-time-code"></label>
            <button type="submit">Désactiver la 2FA</button>
          </form>`
        : pendingSecret
          ? html`<p>1. Dans Google Authenticator (ou Authy, 1Password…), ajoutez un compte avec cette clé :</p>
            <p class="mono secret">${pendingSecret.replace(/(.{4})/g, '$1 ').trim()}</p>
            <p class="muted">Sur téléphone, vous pouvez aussi <a href="${pendingUri}">ouvrir directement l’application</a>.</p>
            <form method="post" action="/security/2fa/enable" class="stack">
              ${csrfField(ctx)}
              <label>2. Code à 6 chiffres affiché<input name="code" required inputmode="numeric" pattern="[0-9 ]{6,7}" autocomplete="one-time-code"></label>
              <button type="submit" class="primary">Activer</button>
            </form>`
          : html`<p class="muted">Fortement recommandée : un code de votre téléphone sera demandé à chaque connexion et à chaque payout.</p>
            <form method="post" action="/security/2fa/start">${csrfField(ctx)}<button type="submit" class="primary">Configurer la 2FA</button></form>`}
    </section>
    <section class="card narrow">
      <h2>Changer de mot de passe</h2>
      <form method="post" action="/security/password" class="stack">
        ${csrfField(ctx)}
        <label>Mot de passe actuel<input type="password" name="current_password" required autocomplete="current-password"></label>
        <label>Nouveau mot de passe<input type="password" name="password" required minlength="12" autocomplete="new-password"></label>
        <label>Confirmer<input type="password" name="password_confirm" required minlength="12" autocomplete="new-password"></label>
        <button type="submit">Changer le mot de passe</button>
      </form>
      <p class="muted">Changer de mot de passe ferme vos autres sessions.</p>
    </section>`);
}

export function errorPage(ctx, status, message) {
  return layout(ctx, 'Erreur', html`<section class="card narrow"><h1>Erreur ${status}</h1><p>${message}</p><p><a href="/">Retour</a></p></section>`, { bare: !ctx.admin });
}
