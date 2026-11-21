// Mots de passe (scrypt), sessions, double authentification TOTP et limitation des essais.
import { scrypt, randomBytes, timingSafeEqual, createHash, createHmac } from 'node:crypto';

const SCRYPT = { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };
export const SESSION_IDLE_MS = 2 * 60 * 60 * 1000;      // 2 h d'inactivité
export const SESSION_MAX_MS = 12 * 60 * 60 * 1000;      // 12 h au total
export const PENDING_2FA_MS = 5 * 60 * 1000;            // 5 min pour saisir le code

const scryptAsync = (password, salt, keylen) => new Promise((resolve, reject) => {
  scrypt(password, salt, keylen, SCRYPT, (err, key) => (err ? reject(err) : resolve(key)));
});

export async function hashPassword(password) {
  const salt = randomBytes(16);
  const hash = await scryptAsync(password.normalize('NFKC'), salt, 32);
  return `scrypt$${SCRYPT.N}$${SCRYPT.r}$${SCRYPT.p}$${salt.toString('base64')}$${hash.toString('base64')}`;
}

// Hachage factice pour garder un temps de réponse comparable quand le compte n'existe pas.
let dummyHash = null;
export async function verifyPassword(password, stored) {
  if (!stored) {
    dummyHash ??= await hashPassword('mot-de-passe-factice');
    stored = dummyHash;
    await verifyPassword(password, stored);
    return false;
  }
  const [algo, , , , saltB64, hashB64] = stored.split('$');
  if (algo !== 'scrypt') return false;
  const expected = Buffer.from(hashB64, 'base64');
  const actual = await scryptAsync(String(password).normalize('NFKC'), Buffer.from(saltB64, 'base64'), expected.length);
  return timingSafeEqual(actual, expected);
}

export function passwordProblem(password, username = '') {
  if (typeof password !== 'string' || password.length < 12) return 'Le mot de passe doit contenir au moins 12 caractères.';
  if (password.length > 200) return 'Le mot de passe est trop long.';
  if (username && password.toLowerCase().includes(username.toLowerCase())) return 'Le mot de passe ne doit pas contenir l’identifiant.';
  if (new Set(password).size < 6) return 'Le mot de passe est trop simple.';
  return null;
}

export const sha256 = (value) => createHash('sha256').update(value).digest('hex');
export const randomToken = (bytes = 32) => randomBytes(bytes).toString('base64url');

export function safeEqual(a, b) {
  const ba = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

// ── TOTP (RFC 6238, compatible Google Authenticator, Authy, 1Password…) ──
const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function newTotpSecret() {
  const bytes = randomBytes(20);
  let bits = '';
  for (const b of bytes) bits += b.toString(2).padStart(8, '0');
  let out = '';
  for (let i = 0; i + 5 <= bits.length; i += 5) out += B32[parseInt(bits.slice(i, i + 5), 2)];
  return out;
}

function base32Decode(secret) {
  let bits = '';
  for (const ch of secret.replace(/=+$/, '').toUpperCase()) {
    const idx = B32.indexOf(ch);
    if (idx < 0) continue;
    bits += idx.toString(2).padStart(5, '0');
  }
  const bytes = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) bytes.push(parseInt(bits.slice(i, i + 8), 2));
  return Buffer.from(bytes);
}

function totpAt(secret, counter) {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64BE(BigInt(counter));
  const mac = createHmac('sha1', base32Decode(secret)).update(buf).digest();
  const offset = mac[mac.length - 1] & 0x0f;
  const code = (mac.readUInt32BE(offset) & 0x7fffffff) % 1_000_000;
  return String(code).padStart(6, '0');
}

// Accepte le pas courant et ±1 (décalage d'horloge). Renvoie le compteur utilisé, ou null.
export function verifyTotp(secret, code, lastCounter = -1) {
  const clean = String(code || '').replace(/\s+/g, '');
  if (!/^\d{6}$/.test(clean) || !secret) return null;
  const now = Math.floor(Date.now() / 30000);
  for (const c of [now - 1, now, now + 1]) {
    if (c > lastCounter && safeEqual(totpAt(secret, c), clean)) return c;
  }
  return null;
}

export function totpUri(secret, username, issuer = 'TikTok Coins Admin') {
  const label = encodeURIComponent(`${issuer}:${username}`);
  return `otpauth://totp/${label}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
}

// ── Limitation des tentatives (en mémoire) ──
export function createLimiter({ max, windowMs }) {
  const hits = new Map();
  const prune = (key, now) => {
    const list = (hits.get(key) || []).filter((t) => now - t < windowMs);
    if (list.length) hits.set(key, list); else hits.delete(key);
    return list;
  };
  setInterval(() => { const now = Date.now(); for (const key of hits.keys()) prune(key, now); }, windowMs).unref();
  return {
    blocked(key) { return prune(key, Date.now()).length >= max; },
    hit(key) { const now = Date.now(); const list = prune(key, now); list.push(now); hits.set(key, list); },
    reset(key) { hits.delete(key); }
  };
}
