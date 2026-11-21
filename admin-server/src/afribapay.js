// Client AfribaPay (https://docs.afribapay.com/).
// Les appels partent du VPS, dont l'IP est autorisée chez AfribaPay.
import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

export const HOSTS = {
  production: { api: 'https://api.afribapay.com/v1', payout: 'https://api-payout.afribapay.com/v1' },
  sandbox: { api: 'https://api-sandbox.afribapay.com/v1', payout: 'https://api-payout-sandbox.afribapay.com/v1' }
};

export class AfribaPayError extends Error {
  constructor(message, { httpStatus = 0, body = null, network = false } = {}) {
    super(message);
    this.httpStatus = httpStatus;
    this.body = body;
    this.network = network;
  }
}

function extractError(data, httpStatus) {
  if (!data) return `AfribaPay a répondu HTTP ${httpStatus}`;
  const e = data.error;
  if (typeof e === 'string') return e;
  if (e && typeof e === 'object') return e.message || e.status || JSON.stringify(e);
  return data.message || `AfribaPay a répondu HTTP ${httpStatus}`;
}

export function createAfribaPay(getConfig) {
  let tokenCache = null; // { fingerprint, token, expiresAt }
  let countriesCache = null; // { fingerprint, data, at }

  const fingerprint = (cfg) => createHash('sha256').update(`${cfg.environment}|${cfg.apiUser}|${cfg.apiKey}`).digest('hex');

  function config() {
    const cfg = getConfig();
    if (!cfg.apiUser || !cfg.apiKey) {
      throw new AfribaPayError('Les identifiants AfribaPay ne sont pas configurés (menu Paramètres).');
    }
    if (!HOSTS[cfg.environment]) throw new AfribaPayError('Environnement AfribaPay inconnu.');
    return cfg;
  }

  async function call(url, { method = 'GET', headers = {}, body, timeoutMs = 30000 } = {}) {
    let res;
    try {
      res = await fetch(url, {
        method,
        headers: { Accept: 'application/json', ...(body ? { 'Content-Type': 'application/json' } : {}), ...headers },
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(timeoutMs)
      });
    } catch (error) {
      throw new AfribaPayError(`AfribaPay injoignable : ${error.name === 'TimeoutError' ? 'délai dépassé' : error.message}`, { network: true });
    }
    const text = await res.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch {
      throw new AfribaPayError(`Réponse AfribaPay illisible (HTTP ${res.status}).`, { httpStatus: res.status, body: text.slice(0, 500) });
    }
    if (!res.ok) throw new AfribaPayError(extractError(data, res.status), { httpStatus: res.status, body: data });
    return data;
  }

  async function token(cfg, force = false) {
    const fp = fingerprint(cfg);
    if (!force && tokenCache && tokenCache.fingerprint === fp && tokenCache.expiresAt - 5 * 60 * 1000 > Date.now()) {
      return tokenCache.token;
    }
    const basic = Buffer.from(`${cfg.apiUser}:${cfg.apiKey}`).toString('base64');
    const data = await call(`${HOSTS[cfg.environment].api}/token`, {
      method: 'POST',
      headers: { Authorization: `Basic ${basic}` },
      body: {}
    });
    const d = data?.data || data || {};
    const value = d.access_token || d.token;
    if (!value) throw new AfribaPayError('AfribaPay n’a pas renvoyé de jeton d’accès.');
    const expiresIn = Number(d.expires_in) || 3600;
    tokenCache = { fingerprint: fp, token: value, expiresAt: Date.now() + expiresIn * 1000 };
    return value;
  }

  // Appel authentifié ; en cas de 401, un nouveau jeton est demandé une seule fois.
  async function authed(kind, path, options = {}) {
    const cfg = config();
    const url = `${HOSTS[cfg.environment][kind]}${path}`;
    try {
      return await call(url, { ...options, headers: { Authorization: `Bearer ${await token(cfg)}` } });
    } catch (error) {
      if (error instanceof AfribaPayError && error.httpStatus === 401) {
        return call(url, { ...options, headers: { Authorization: `Bearer ${await token(cfg, true)}` } });
      }
      throw error;
    }
  }

  return {
    isConfigured() {
      const cfg = getConfig();
      return Boolean(cfg.apiUser && cfg.apiKey && cfg.merchantKey);
    },
    environment() { return getConfig().environment; },
    resetCache() { tokenCache = null; countriesCache = null; },

    async countries() {
      const cfg = config();
      const fp = fingerprint(cfg);
      if (countriesCache && countriesCache.fingerprint === fp && Date.now() - countriesCache.at < 60 * 60 * 1000) {
        return countriesCache.data;
      }
      const data = await authed('api', '/countries');
      const map = data?.data || data || {};
      countriesCache = { fingerprint: fp, data: map, at: Date.now() };
      return map;
    },

    async balance() {
      const data = await authed('api', '/balance');
      return Array.isArray(data?.data) ? data.data : [];
    },

    async payout({ operator, country, phone, amount, currency, orderId, reference, notifyUrl }) {
      const cfg = config();
      if (!cfg.merchantKey) throw new AfribaPayError('La clé marchand AfribaPay n’est pas configurée (menu Paramètres).');
      const body = {
        operator,
        country,
        phone_number: phone,
        amount,
        currency,
        order_id: orderId,
        merchant_key: cfg.merchantKey,
        reference_id: reference || orderId,
        lang: 'fr'
      };
      if (notifyUrl) body.notify_url = notifyUrl;
      const data = await authed('payout', '/pay/payout', { method: 'POST', body, timeoutMs: 60000 });
      return data?.data || data || {};
    },

    async status({ orderId, transactionId }) {
      const query = transactionId
        ? `transaction_id=${encodeURIComponent(transactionId)}`
        : `order_id=${encodeURIComponent(orderId)}`;
      const data = await authed('api', `/status?${query}`);
      return data?.data || data || {};
    },

    // Signature des notifications : HMAC-SHA256 du corps brut avec la clé API, en-tête Afribapay-Sign.
    verifySignature(rawBody, signature) {
      const cfg = getConfig();
      if (!cfg.apiKey || !signature) return false;
      const expected = createHmac('sha256', cfg.apiKey).update(rawBody).digest('hex');
      const a = Buffer.from(expected);
      const b = Buffer.from(String(signature).trim().toLowerCase());
      return a.length === b.length && timingSafeEqual(a, b);
    }
  };
}
