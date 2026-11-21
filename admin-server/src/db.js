// Base SQLite (module node:sqlite intégré à Node 24) et chiffrement des secrets.
import { DatabaseSync } from 'node:sqlite';
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync, chmodSync } from 'node:fs';
import { dirname, join } from 'node:path';

const MIGRATIONS = [
  `CREATE TABLE admins (
     id INTEGER PRIMARY KEY,
     username TEXT NOT NULL UNIQUE COLLATE NOCASE,
     password_hash TEXT NOT NULL,
     totp_secret TEXT,
     totp_enabled INTEGER NOT NULL DEFAULT 0,
     disabled INTEGER NOT NULL DEFAULT 0,
     created_at TEXT NOT NULL DEFAULT (datetime('now')),
     last_login_at TEXT
   );
   CREATE TABLE sessions (
     token_hash TEXT PRIMARY KEY,
     admin_id INTEGER NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
     csrf TEXT NOT NULL,
     pending_2fa INTEGER NOT NULL DEFAULT 0,
     created_at INTEGER NOT NULL,
     last_seen_at INTEGER NOT NULL,
     ip TEXT,
     user_agent TEXT
   );
   CREATE TABLE settings (
     key TEXT PRIMARY KEY,
     value TEXT NOT NULL,
     updated_at TEXT NOT NULL DEFAULT (datetime('now'))
   );
   CREATE TABLE payouts (
     id INTEGER PRIMARY KEY,
     order_id TEXT NOT NULL UNIQUE,
     transaction_id TEXT,
     admin_id INTEGER REFERENCES admins(id) ON DELETE SET NULL,
     environment TEXT NOT NULL,
     country TEXT NOT NULL,
     operator TEXT NOT NULL,
     phone TEXT NOT NULL,
     amount INTEGER NOT NULL,
     currency TEXT NOT NULL,
     reference TEXT,
     beneficiary TEXT,
     status TEXT NOT NULL,
     fees REAL,
     taxes REAL,
     amount_total REAL,
     error TEXT,
     created_at TEXT NOT NULL DEFAULT (datetime('now')),
     updated_at TEXT NOT NULL DEFAULT (datetime('now')),
     last_checked_at TEXT
   );
   CREATE INDEX payouts_status ON payouts(status);
   CREATE INDEX payouts_created ON payouts(created_at);
   CREATE TABLE audit (
     id INTEGER PRIMARY KEY,
     at TEXT NOT NULL DEFAULT (datetime('now')),
     admin_id INTEGER,
     username TEXT,
     action TEXT NOT NULL,
     details TEXT,
     ip TEXT
   );`
];

export function openDb(path) {
  const db = new DatabaseSync(path);
  db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;');
  const version = db.prepare('PRAGMA user_version').get().user_version;
  for (let i = version; i < MIGRATIONS.length; i++) {
    db.exec('BEGIN');
    try {
      db.exec(MIGRATIONS[i]);
      db.exec(`PRAGMA user_version = ${i + 1}`);
      db.exec('COMMIT');
    } catch (error) {
      db.exec('ROLLBACK');
      throw error;
    }
  }
  return db;
}

// Clé de chiffrement locale (32 octets) stockée à côté de la base, hors du dépôt.
export function loadSecretKey(dbPath) {
  const file = join(dirname(dbPath), 'secret.key');
  if (!existsSync(file)) {
    writeFileSync(file, randomBytes(32).toString('base64'), { mode: 0o600 });
  }
  try { chmodSync(file, 0o600); } catch { /* volume en lecture seule pour chmod : sans effet */ }
  const key = Buffer.from(readFileSync(file, 'utf8').trim(), 'base64');
  if (key.length !== 32) throw new Error(`Clé de chiffrement invalide : ${file}`);
  return key;
}

export function createSettings(db, key) {
  const get = db.prepare('SELECT value FROM settings WHERE key = ?');
  const set = db.prepare(`INSERT INTO settings (key, value, updated_at) VALUES (?, ?, datetime('now'))
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`);
  const del = db.prepare('DELETE FROM settings WHERE key = ?');

  const encrypt = (plain) => {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    const ct = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
    return 'v1:' + Buffer.concat([iv, cipher.getAuthTag(), ct]).toString('base64');
  };
  const decrypt = (value) => {
    const buf = Buffer.from(value.slice(3), 'base64');
    const decipher = createDecipheriv('aes-256-gcm', key, buf.subarray(0, 12));
    decipher.setAuthTag(buf.subarray(12, 28));
    return Buffer.concat([decipher.update(buf.subarray(28)), decipher.final()]).toString('utf8');
  };

  return {
    get(name, fallback = '') {
      const row = get.get(name);
      return row ? row.value : fallback;
    },
    set(name, value) {
      if (value === '' || value == null) del.run(name);
      else set.run(name, String(value));
    },
    getSecret(name) {
      const row = get.get(name);
      if (!row) return '';
      try { return decrypt(row.value); } catch { return ''; }
    },
    setSecret(name, value) {
      if (value === '' || value == null) del.run(name);
      else set.run(name, encrypt(String(value)));
    },
    has(name) {
      return Boolean(get.get(name));
    }
  };
}
