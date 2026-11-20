# Payment Proxy - Cloudflare Worker

Ce Cloudflare Worker sert de proxy pour SebPay, AfribaPay et LeekPay. Il gere le CORS, transfere les requetes vers les APIs de paiement et garde les secrets hors du frontend.

## Secrets requis

SebPay:

```bash
wrangler secret put SEBPAY_API_KEY
wrangler secret put SEBPAY_SECRET_KEY
```

AfribaPay:

```bash
wrangler secret put AFRIBAPAY_API_USER
wrangler secret put AFRIBAPAY_API_KEY
```

Optionnels AfribaPay:

```bash
wrangler secret put AFRIBAPAY_MERCHANT_KEY
wrangler secret put AFRIBAPAY_AGENT_ID
wrangler secret put AFRIBAPAY_ENVIRONMENT
```

Relais AfribaPay (IP fixe) :

AfribaPay n'accepte que des adresses IP autorisées, et un Worker Cloudflare n'a pas d'IP fixe.
La variable `AFRIBAPAY_RELAY_URL` (dans `wrangler.toml`) fait passer les appels AfribaPay par le
relais nginx du VPS `srv563641.hstgr.cloud` (IPv4 `185.97.144.133`, à autoriser chez AfribaPay).
Le relais ne stocke aucune clé : il retransmet `/afribapay/v1/*` vers `api.afribapay.com/v1/*`
(et `/afribapay-sandbox/v1/*` vers le sandbox) et n'accepte que les IP Cloudflare.
Configuration : `/etc/nginx/sites-available/afribapay-relay` sur le VPS.
Pour revenir à l'appel direct, supprimer `AFRIBAPAY_RELAY_URL` et redéployer.

LeekPay:

```bash
wrangler secret put LEEKPAY_SECRET_KEY
```

Optionnel LeekPay:

```bash
wrangler secret put LEEKPAY_WEBHOOK_URL
```

## Deploiement

```bash
cd cloudflare-worker
wrangler deploy
```

En environnement de developpement:

```bash
cd cloudflare-worker
wrangler deploy --env development
```

## Endpoints

SebPay:

```text
POST /api/sebpay/collections
GET  /api/sebpay/collections/:id
```

AfribaPay:

```text
GET  /api/afribapay/countries
POST /api/afribapay/payments
GET  /api/afribapay/payments/:orderId
```

LeekPay:

```text
POST /api/leekpay/checkout
GET  /api/leekpay/checkout/:checkoutId
```

Le flux LeekPay cree un checkout REST avec `LEEKPAY_SECRET_KEY`, renvoie `paymentUrl` au frontend, puis le frontend effectue une redirection normale vers la page hebergee LeekPay.

## Exemple LeekPay

```javascript
const response = await fetch('https://sebpay-proxy.sebpay-proxy.workers.dev/api/leekpay/checkout', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    amount: 5000,
    currency: 'XOF',
    description: 'Commande #123',
    returnUrl: 'https://example.com/payment/confirmation?orderId=TKT-12345',
    cancelUrl: 'https://example.com/payment/failure?orderId=TKT-12345',
    customerEmail: 'client@example.com',
    metadata: {
      orderId: 'TKT-12345',
      provider: 'leekpay'
    }
  })
});

const checkout = await response.json();
window.location.href = checkout.paymentUrl;
```

## Securite

- Les secrets ne doivent pas etre commites.
- `LEEKPAY_SECRET_KEY` ne doit jamais etre exposee dans le frontend.
- Le Worker ne doit retourner au frontend que les donnees utiles: `paymentUrl`, `checkoutId`, statut et montant.
- Pour valider definitivement une commande, preferer un webhook signe ou une verification serveur du statut.

## Domaine personnalise

Pour utiliser un domaine propre au lieu de `workers.dev`:

1. Ouvrir Cloudflare Dashboard.
2. Aller dans Workers & Pages.
3. Selectionner le worker.
4. Ouvrir Settings -> Triggers -> Custom Domains.
5. Ajouter le domaine, par exemple `api.votredomaine.com`.
