# Admin TikTok Coins (payouts AfribaPay)

Le site client reste statique sur GitHub Pages. Cette partie est un petit serveur
hébergé sur le VPS : connexion administrateur et **payouts AfribaPay** (AfribaPay
n’autorise les payouts que par API, depuis une IP autorisée).

- Node 24, **aucune dépendance npm** (SQLite intégré `node:sqlite`).
- Pages rendues côté serveur, en français, utilisables sur téléphone.
- Les appels AfribaPay partent du VPS (IP `185.97.144.133`, à autoriser chez AfribaPay).

## Fonctions

- **Connexion** : mot de passe (scrypt), double authentification TOTP (Google
  Authenticator…), blocage après trop d’essais, sessions de 2 h d’inactivité / 12 h max.
- **Tableau de bord** : soldes AfribaPay (payin et payout par pays), derniers payouts.
- **Nouveau payout** : pays → opérateur (liste `/v1/countries`), numéro, montant,
  bénéficiaire, référence. Page de vérification, puis confirmation par **mot de passe
  et code 2FA**. Montant maximum par payout réglable.
- **Suivi** : statut `PENDING` / `SUCCESS` / `FAILED` par notification signée
  (`/webhooks/afribapay`, HMAC-SHA256 avec la clé API, en-tête `Afribapay-Sign`),
  vérification manuelle et vérification automatique toutes les 3 minutes.
  En cas de réponse incertaine, le payout passe « À vérifier » : ne pas renvoyer
  avant d’avoir vérifié.
- **Paramètres** : identifiants AfribaPay saisis dans l’interface, chiffrés en base
  (AES-256-GCM, clé dans `/data/secret.key`), jamais réaffichés. Bouton de test.
- **Administrateurs** et **journal d’activité**.

Un payout est enregistré avec son `order_id` **avant** l’appel à AfribaPay :
un double clic ou une coupure ne peut pas provoquer deux envois.

## Production (VPS)

- Dépôt : `/root/TikTokCoins-PayOol` (clone HTTPS public), dossier `admin-server/`.
- Conteneur `tiktokcoins_admin`, `127.0.0.1:8093`, système de fichiers en lecture seule.
- Données : `/root/TikTokCoins-data` (base SQLite + clé de chiffrement) — **à sauvegarder**,
  hors dépôt.
- Adresse : **https://srv563641.hstgr.cloud** (nom d’hôte du VPS, aucun DNS à gérer).
- nginx de l’hôte : `/etc/nginx/sites-available/srv563641.hstgr.cloud` (copie : `deploy/nginx-host.conf`),
  avec les snippets `tiktokcoins-admin-proxy.conf` et `cloudflare-only.conf` (copies dans `deploy/`).
  Le même site sert le relais AfribaPay du Worker (`/afribapay/…`, réservé à Cloudflare).

Installation : au premier démarrage, un **code d’installation** est écrit dans les
journaux (`docker logs tiktokcoins_admin`). Il permet de créer le premier
administrateur sur `/setup`, puis la page se ferme.

Mise à jour :

```bash
cd /root/TikTokCoins-PayOol && git pull --ff-only origin main
cd admin-server && docker compose up -d --build
```

## Développement local

```bash
cd admin-server
ADMIN_DB_PATH=./data/admin.db PORT=3000 node src/server.js
```

Les cookies de session sont `Secure` : en local, passer par `localhost`.
