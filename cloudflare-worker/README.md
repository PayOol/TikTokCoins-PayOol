# SebPay Proxy - Cloudflare Worker

Ce Cloudflare Worker sert de proxy pour l'API SebPay, gérant le CORS et transférant les requêtes de manière sécurisée.

## Configuration des identifiants

Les identifiants SebPay sont stockés en tant que **secrets** dans Cloudflare Workers, PAS dans le code.

### Méthode 1: Via CLI (Wrangler)

1. Installer Wrangler:
```bash
npm install -g wrangler
```

2. Se connecter à Cloudflare:
```bash
wrangler login
```

3. Définir les secrets:
```bash
wrangler secret put SEBPAY_API_KEY
# Entrez votre clé publique SebPay quand demandé

wrangler secret put SEBPAY_SECRET_KEY
# Entrez votre clé secrète SebPay quand demandé
```

### Méthode 2: Via Dashboard Cloudflare

1. Allez sur [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Naviguez vers **Workers & Pages**
3. Sélectionnez votre worker `sebpay-proxy`
4. Cliquez sur **Settings** → **Variables**
5. Ajoutez les secrets:
   - **SEBPAY_API_KEY**: Votre clé publique SebPay
   - **SEBPAY_SECRET_KEY**: Votre clé secrète SebPay

## Déploiement

### Déployer en production:
```bash
cd cloudflare-worker
wrangler deploy
```

### Déployer en développement:
```bash
cd cloudflare-worker
wrangler deploy --env development
```

## Utilisation

Une fois déployé, le worker sera accessible à:
- Production: `https://sebpay-proxy-prod.YOUR_SUBDOMAIN.workers.dev`
- Développement: `https://sebpay-proxy-dev.YOUR_SUBDOMAIN.workers.dev`

### Endpoints

Le proxy accepte les requêtes sur le chemin `/api/sebpay`:

- `POST /api/sebpay/collections` - Créer un paiement
- `GET /api/sebpay/collections/:id` - Vérifier un paiement
- etc.

Exemple d'utilisation depuis votre application:
```javascript
const response = await fetch('https://sebpay-proxy.sebpay-proxy.workers.dev/api/sebpay/collections', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    amount: 1000,
    currency: 'XOF',
    phone: '+229XXXXXXXX',
    operator: 'moov',
    country: 'BJ',
    // ... autres paramètres
  })
});
```

## Sécurité

- ✅ Les identifiants ne sont PAS dans le code (pas dans Git)
- ✅ Les secrets sont chiffrés par Cloudflare
- ✅ CORS configuré pour autoriser votre domaine
- ✅ Le proxy ajoute automatiquement les en-têtes d'authentification

## Configuration du domaine (Optionnel)

Pour utiliser votre propre domaine au lieu de `workers.dev`:

1. Dans Cloudflare Dashboard, allez dans **Workers & Pages**
2. Sélectionnez votre worker
3. Cliquez sur **Settings** → **Triggers** → **Custom Domains**
4. Ajoutez votre domaine (ex: `api.votredomaine.com`)
