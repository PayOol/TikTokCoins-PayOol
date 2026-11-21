// Petits utilitaires HTTP (sans framework).

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export function readBody(req, limit = 32 * 1024) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > limit) {
        reject(new HttpError(413, 'Requête trop volumineuse.'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export async function readForm(req) {
  const type = req.headers['content-type'] || '';
  if (!type.startsWith('application/x-www-form-urlencoded')) throw new HttpError(415, 'Format de formulaire non pris en charge.');
  const params = new URLSearchParams((await readBody(req)).toString('utf8'));
  const form = {};
  for (const [k, v] of params) form[k] = v;
  return form;
}

export function parseCookies(req) {
  const out = {};
  for (const part of (req.headers.cookie || '').split(';')) {
    const i = part.indexOf('=');
    if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

const SECURITY_HEADERS = {
  'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; form-action 'self'; frame-ancestors 'none'; base-uri 'none'",
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'no-referrer',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Cache-Control': 'no-store'
};

export function send(res, status, body, headers = {}) {
  res.writeHead(status, { ...SECURITY_HEADERS, ...headers });
  res.end(body);
}

export function sendHtml(res, status, html, headers = {}) {
  send(res, status, String(html), { 'Content-Type': 'text/html; charset=utf-8', ...headers });
}

export function redirect(res, location, headers = {}) {
  send(res, 303, '', { Location: location, ...headers });
}

// IP réelle : nginx de l'hôte (127.0.0.1) transmet X-Real-IP.
export function clientIp(req) {
  const remote = req.socket.remoteAddress || '';
  const trusted = remote === '127.0.0.1' || remote === '::1' || remote === '::ffff:127.0.0.1' || remote.startsWith('172.') || remote.startsWith('::ffff:172.');
  if (trusted && req.headers['x-real-ip']) return String(req.headers['x-real-ip']);
  return remote;
}
