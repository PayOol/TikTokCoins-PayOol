# Reference rapide - Paiements PayOol

## Etat actuel

Fichier de configuration:

```text
src/utils/paymentProviders/config.ts
```

Providers actifs:

```text
AfribaPay  -> actif, recommande, provider par defaut
SebPay     -> actif
```

Providers disponibles mais desactives:

```text
SoleasPay
BkaPay
LeekPay    -> desactive temporairement, implementation REST prete
```

## LeekPay

Documentation officielle:

```text
https://www.leekpay.me/docs
```

Flux utilise:

```text
Frontend -> Worker /api/leekpay/checkout -> LeekPay REST -> paymentUrl -> redirection
```

Le SDK `LeekPay.checkout(...)` n'est plus utilise, car il ouvre une modale.

## Configuration LeekPay

```ts
[PaymentProviderType.LEEKPAY]: {
  type: PaymentProviderType.LEEKPAY,
  apiKey: 'pk_live_xxx',
  enabled: false,
  recommended: false,
  proxyUrl: 'https://sebpay-proxy.sebpay-proxy.workers.dev/api/leekpay'
}
```

Secret Worker requis:

```bash
wrangler secret put LEEKPAY_SECRET_KEY
```

Optionnel:

```bash
wrangler secret put LEEKPAY_WEBHOOK_URL
```

## Lancer un paiement

```ts
import { initiatePayment, PaymentProviderType } from './utils/payment';

await initiatePayment({
  amount: 5000,
  currency: 'XAF',
  description: 'Achat de pieces TikTok',
  orderId: 'TKT-12345',
  customerName: 'Client PayOol',
  customerEmail: 'client@example.com',
  successUrl: 'https://example.com/payment/confirmation?orderId=TKT-12345',
  failureUrl: 'https://example.com/payment/failure?orderId=TKT-12345',
  shopName: 'PayOol'
}, PaymentProviderType.LEEKPAY);
```

## Notes LeekPay

- `XAF` est converti en `XOF`.
- Le Worker appelle `POST https://leekpay.fr/api/v1/checkout`.
- Le frontend redirige vers `paymentUrl`.
- Le montant paye est place dans `paid_amount`.
- Le parametre URL `amount` reste reserve au nombre de coins achetes.
- `completed` devient `success`.
- `cancelled` et `expired` sont traites comme des echecs.

## Statuts

```text
success   -> paiement confirme
pending   -> paiement en attente
failed    -> echec, expiration ou refus
cancelled -> annulation client
```

Mapping LeekPay:

```text
completed/success/paid -> success
pending/processing     -> pending
failed/expired/error   -> failed
cancelled/canceled     -> cancelled
```

## Tests rapides

```bash
npm run build
npm run dev
```

Checklist LeekPay:

- `LEEKPAY_SECRET_KEY` est configure sur le Worker.
- Le Worker est redeploye.
- Le provider apparait dans le selecteur.
- La console affiche `[LeekPay] Creating hosted checkout`.
- Le navigateur quitte PayOol vers une URL LeekPay hebergee.
- Apres paiement, l'utilisateur revient sur `/payment/confirmation`.
- Apres annulation, l'utilisateur revient sur `/payment/failure`.

## Erreurs courantes

| Message | Cause probable | Action |
| --- | --- | --- |
| `LeekPay proxy URL is not configured` | `proxyUrl` vide | Renseigner `proxyUrl` |
| `LeekPay secret key is not configured` | Secret Worker manquant | Configurer `LEEKPAY_SECRET_KEY` |
| `LeekPay did not return a payment URL` | Reponse REST incomplete | Verifier la reponse API LeekPay |
| `LeekPay does not support currency ...` | Devise non supportee | Utiliser `XOF`, `EUR`, `USD` ou laisser `XAF` etre converti |

## Fichiers utiles

```text
src/utils/paymentProviders/leekpay.ts
src/utils/paymentProviders/config.ts
cloudflare-worker/sebpay-proxy.js
src/pages/PaymentConfirmation.tsx
PAYMENT_PROVIDERS.md
```
