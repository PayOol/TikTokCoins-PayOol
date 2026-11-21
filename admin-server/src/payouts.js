// Logique des payouts : validation, envoi, suivi du statut, notifications.
import { randomBytes } from 'node:crypto';
import { AfribaPayError } from './afribapay.js';

const FINAL = new Set(['SUCCESS', 'FAILED']);

export function newOrderId() {
  const d = new Date();
  const stamp = d.toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
  return `TKC-PO-${stamp}-${randomBytes(4).toString('hex').toUpperCase()}`;
}
export const isOrderId = (v) => /^TKC-PO-\d{14}-[0-9A-F]{8}$/.test(String(v || ''));

function mapStatus(raw) {
  const s = String(raw || '').toUpperCase();
  if (s === 'SUCCESS' || s === 'SUCCESSFUL' || s === 'COMPLETED') return 'SUCCESS';
  if (s === 'FAILED' || s === 'FAILURE' || s === 'REJECTED' || s === 'CANCELLED' || s === 'CANCELED') return 'FAILED';
  if (s === 'PENDING' || s === 'PROCESSING' || s === 'INITIATED') return 'PENDING';
  return null;
}

const num = (v) => (v == null || v === '' || Number.isNaN(Number(v)) ? null : Number(v));

// Valide un formulaire de payout par rapport à la liste des pays/opérateurs AfribaPay.
export function validatePayout(form, countries, maxAmount) {
  const country = countries[String(form.country || '').toUpperCase()];
  if (!country) return { error: 'Pays invalide.' };
  const currencies = Object.values(country.currencies || {});
  const currencyEntry = currencies.find((c) => c.currency === form.currency) || currencies[0];
  if (!currencyEntry) return { error: 'Aucune devise disponible pour ce pays.' };
  const operator = (currencyEntry.operators || []).find((o) => o.operator_code === form.operator);
  if (!operator) return { error: 'Opérateur invalide pour ce pays.' };

  let phone = String(form.phone || '').replace(/[^\d+]/g, '');
  phone = phone.replace(/^\+/, '').replace(/^00/, '');
  const prefix = String(country.prefix || '');
  if (prefix && phone.startsWith(prefix) && phone.length - prefix.length >= 8) phone = phone.slice(prefix.length);
  if (!/^\d{6,12}$/.test(phone)) return { error: 'Numéro de téléphone invalide (indiquez le numéro sans l’indicatif du pays).' };

  const amount = Number(String(form.amount || '').replace(/[\s  ]/g, ''));
  if (!Number.isInteger(amount) || amount <= 0) return { error: 'Le montant doit être un nombre entier positif.' };
  if (maxAmount && amount > maxAmount) return { error: `Le montant dépasse le maximum autorisé par payout (${maxAmount.toLocaleString('fr-FR')}).` };

  const clean = (v, max) => String(v || '').replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, max);
  return {
    payout: {
      country: country.country_code,
      operator: operator.operator_code,
      currency: currencyEntry.currency,
      phone,
      amount,
      beneficiary: clean(form.beneficiary, 80),
      reference: clean(form.reference, 60)
    },
    countryName: country.country_name,
    operatorName: operator.operator_name,
    prefix
  };
}

export function createPayoutService({ db, afribapay, audit, publicUrl }) {
  const byId = db.prepare('SELECT * FROM payouts WHERE id = ?');
  const byOrder = db.prepare('SELECT * FROM payouts WHERE order_id = ?');
  const insert = db.prepare(`INSERT INTO payouts
    (order_id, admin_id, environment, country, operator, phone, amount, currency, reference, beneficiary, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'SUBMITTING')`);
  const update = db.prepare(`UPDATE payouts SET status = ?, transaction_id = COALESCE(?, transaction_id),
    fees = COALESCE(?, fees), taxes = COALESCE(?, taxes), amount_total = COALESCE(?, amount_total),
    error = ?, updated_at = datetime('now'), last_checked_at = datetime('now') WHERE id = ?`);
  const touch = db.prepare(`UPDATE payouts SET last_checked_at = datetime('now'), error = ? WHERE id = ?`);

  function applyRemote(p, data, fallbackStatus) {
    const status = mapStatus(data.status) || fallbackStatus || p.status;
    update.run(status, data.transaction_id || null, num(data.fees), num(data.taxes), num(data.amount_total),
      status === 'FAILED' ? (data.message || data.reason || p.error || 'Échec signalé par AfribaPay.') : null, p.id);
    return byId.get(p.id);
  }

  return {
    get: (id) => byId.get(id),
    getByOrderId: (orderId) => byOrder.get(orderId),

    // Envoie le payout. L'enregistrement est créé AVANT l'appel : un double clic ou une
    // coupure ne peut pas produire deux envois avec le même order_id.
    async send(payout, { orderId, admin, ip }) {
      const existing = byOrder.get(orderId);
      if (existing) return { payout: existing, duplicate: true };
      const environment = afribapay.environment();
      const { lastInsertRowid } = insert.run(orderId, admin.id, environment, payout.country, payout.operator, payout.phone,
        payout.amount, payout.currency, payout.reference || null, payout.beneficiary || null);
      let p = byId.get(Number(lastInsertRowid));
      audit(admin, 'payout.envoi', `${payout.amount} ${payout.currency} → ${payout.country} ${payout.operator} ${payout.phone} (${orderId})`, ip);
      try {
        const data = await afribapay.payout({ ...payout, orderId, notifyUrl: publicUrl ? `${publicUrl}/webhooks/afribapay` : '' });
        p = applyRemote(p, data, 'PENDING');
        audit(admin, 'payout.reponse', `${orderId} : ${p.status}${p.transaction_id ? ` (${p.transaction_id})` : ''}`, ip);
      } catch (error) {
        // Une erreur HTTP ne prouve pas que le payout a échoué : on vérifie le statut.
        const message = error instanceof AfribaPayError ? error.message : String(error.message || error);
        update.run('TO_CHECK', null, null, null, null, message, p.id);
        p = byId.get(p.id);
        audit(admin, 'payout.erreur', `${orderId} : ${message}`, ip);
        try {
          const data = await afribapay.status({ orderId });
          if (mapStatus(data.status)) p = applyRemote(p, data);
        } catch { /* statut introuvable : le payout reste « À vérifier » */ }
      }
      return { payout: p, duplicate: false };
    },

    async refresh(p) {
      if (FINAL.has(p.status)) return p;
      try {
        const data = await afribapay.status(p.transaction_id ? { transactionId: p.transaction_id } : { orderId: p.order_id });
        if (mapStatus(data.status)) return applyRemote(p, data);
        touch.run(p.error, p.id);
      } catch (error) {
        const notFound = error instanceof AfribaPayError && error.httpStatus === 404;
        touch.run(notFound
          ? 'AfribaPay ne trouve pas ce payout : il n’a probablement pas été créé. Vérifiez dans votre tableau de bord AfribaPay avant de renvoyer.'
          : `Vérification impossible : ${error.message}`, p.id);
      }
      return byId.get(p.id);
    },

    // Vérifie périodiquement les payouts non finalisés (si une notification se perd).
    async refreshOpen() {
      const open = db.prepare(`SELECT * FROM payouts WHERE status IN ('PENDING', 'TO_CHECK', 'SUBMITTING')
        AND created_at > datetime('now', '-7 days')
        AND (last_checked_at IS NULL OR last_checked_at < datetime('now', '-2 minutes'))
        ORDER BY created_at LIMIT 20`).all();
      for (const p of open) {
        if (p.environment !== afribapay.environment()) continue;
        const before = p.status;
        const after = await this.refresh(p);
        if (after.status !== before) audit(null, 'payout.statut', `${p.order_id} : ${before} → ${after.status} (vérification automatique)`, null);
      }
    },

    // Notification AfribaPay (signature déjà vérifiée).
    handleNotification(payload, ip) {
      const data = payload?.data || payload || {};
      const p = (data.order_id && byOrder.get(String(data.order_id))) || null;
      if (!p) return { handled: false };
      const status = mapStatus(data.status);
      if (!status) return { handled: true };
      // Contrôle de cohérence avant de modifier l'enregistrement.
      const original = num(data.original_amount);
      if ((data.currency && data.currency !== p.currency) || (original != null && original !== p.amount)) {
        audit(null, 'notification.incoherente', `${p.order_id} : montant/devise différents (${data.original_amount} ${data.currency})`, ip);
        return { handled: true };
      }
      if (FINAL.has(p.status) && p.status !== status) {
        audit(null, 'notification.ignoree', `${p.order_id} : déjà ${p.status}, reçu ${status}`, ip);
        return { handled: true };
      }
      const before = p.status;
      const after = applyRemote(p, data);
      if (before !== after.status) audit(null, 'payout.statut', `${p.order_id} : ${before} → ${after.status} (notification AfribaPay)`, ip);
      return { handled: true };
    }
  };
}
