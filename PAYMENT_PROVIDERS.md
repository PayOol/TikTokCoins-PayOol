# Systeme Multi-API de Paiement

Ce document decrit la couche paiement de PayOol et l'integration LeekPay mise a jour selon la documentation officielle actuelle:

https://www.leekpay.me/docs

## Architecture

Le systeme utilise une interface commune et une factory pour permettre a l'application de choisir un fournisseur de paiement sans changer le code des formulaires.

```text
src/utils/payment.ts
src/utils/paymentProviders/
  index.ts
  types.ts
  config.ts
  factory.ts
  leekpay.ts
  soleaspay.ts
  bkapay.ts
  sebpay.ts
  afribapay.ts
```

Flux principal:

```text
App.tsx
  -> initiatePayment(params, provider)
  -> PaymentProviderFactory.createProvider(provider)
  -> provider.initiatePayment(params)
  -> page de confirmation / succes / echec
```

## Etat des fournisseurs

La source de verite est `src/utils/paymentProviders/config.ts`.

| Provider | Etat actuel | Methode | Notes |
| --- | --- | --- | --- |
| AfribaPay | actif, recommande | Cloudflare Worker proxy | Premier provider actif, donc provider par defaut |
| SebPay | actif | Cloudflare Worker proxy | Secrets conserves dans le Worker |
| LeekPay | desactive temporairement | Redirection hebergee via Worker | Implementation prete, masquee du selecteur |
| SoleasPay | desactive | Formulaire POST | Disponible si `enabled: true` |
| BkaPay | desactive | Redirection URL | Disponible si `enabled: true` |

## LeekPay

### Methode retenue

PayOol n'utilise plus le SDK JavaScript LeekPay, car ce SDK ouvre une interface de checkout modale. Le flux actuel est une redirection normale vers la page de paiement hebergee par LeekPay:

```text
Frontend PayOol
  -> POST Worker /api/leekpay/checkout
  -> POST LeekPay /api/v1/checkout avec sk_live_xxx
  -> Worker renvoie paymentUrl
  -> window.location.href = paymentUrl
```

La cle secrete `sk_live_xxx` reste cote Cloudflare Worker. Elle ne doit jamais etre placee dans le frontend.

### Configuration

```ts
[PaymentProviderType.LEEKPAY]: {
  type: PaymentProviderType.LEEKPAY,
  apiKey: 'pk_live_xxx',
  enabled: false,
  recommended: false,
  proxyUrl: 'https://sebpay-proxy.sebpay-proxy.workers.dev/api/leekpay'
}
```

`apiKey` reste informatif cote frontend. La creation reelle du checkout REST utilise le secret `LEEKPAY_SECRET_KEY` configure dans le Worker.

### Payload envoye au Worker

`src/utils/paymentProviders/leekpay.ts` envoie:

```json
{
  "amount": 5000,
  "currency": "XOF",
  "description": "Commande #123",
  "returnUrl": "https://site/payment/confirmation?...",
  "cancelUrl": "https://site/payment/failure?...",
  "customerEmail": "client@example.com",
  "metadata": {
    "orderId": "TKT-12345",
    "provider": "leekpay",
    "shopName": "PayOol"
  }
}
```

Notes:

- `XAF` est converti en `XOF` pour LeekPay.
- `description` est limitee a 500 caracteres, selon la doc REST.
- Les identifiants TikTok ne sont pas envoyes dans `customer_name`.
- Le montant financier est ajoute au retour PayOol dans `paid_amount`, afin de ne pas ecraser le parametre `amount` deja utilise pour le nombre de coins achetes.

### API REST LeekPay appelee par le Worker

```text
POST https://leekpay.fr/api/v1/checkout
Authorization: Bearer sk_live_xxx
```

Champs principaux:

| Champ LeekPay | Source PayOol |
| --- | --- |
| `amount` | `PaymentParams.amount` |
| `currency` | `PaymentParams.currency`, avec `XAF -> XOF` |
| `description` | `PaymentParams.description` |
| `return_url` | URL de confirmation PayOol |
| `cancel_url` | URL d'echec PayOol |
| `customer_email` | `PaymentParams.customerEmail` |
| `metadata.orderId` | `PaymentParams.orderId` |

Reponse attendue:

```json
{
  "success": true,
  "data": {
    "id": "checkout_42",
    "payment_url": "https://leekpay.me/pay_AbCdEf1234567890",
    "status": "pending"
  }
}
```

Le frontend redirige ensuite vers `payment_url`.

### Retour PayOol

Le `return_url` envoye a LeekPay contient deja les parametres PayOol necessaires:

```text
payment_provider=leekpay
order_id=<orderId>
status=success
paid_amount=<montant paye>
currency=<devise>
```

Le `cancel_url` contient:

```text
payment_provider=leekpay
order_id=<orderId>
status=cancelled
error=Payment cancelled by user
```

### Statuts

La documentation LeekPay liste:

```text
pending, processing, completed, failed, cancelled, expired
```

L'implementation les mappe vers les statuts internes PayOol:

| LeekPay | PayOol |
| --- | --- |
| `completed`, `success`, `paid`, `successful`, `approved` | `success` |
| `pending`, `processing` | `pending` |
| `cancelled`, `canceled` | `cancelled` |
| `failed`, `failure`, `declined`, `rejected`, `expired`, `error` | `failed` |

`PaymentConfirmation.tsx` traite `failed`, `cancelled`, `expired` et valeurs equivalentes comme des echecs.

## Worker LeekPay

Routes ajoutees:

```text
POST /api/leekpay/checkout
GET  /api/leekpay/checkout/:checkoutId
```

Secrets a configurer:

```bash
wrangler secret put LEEKPAY_SECRET_KEY
```

Optionnel:

```bash
wrangler secret put LEEKPAY_WEBHOOK_URL
```

## Webhooks LeekPay

LeekPay peut envoyer un webhook `payment.success` avec un header `X-LeekPay-Signature`.

Le Worker actuel cree des checkouts et peut verifier un statut, mais il ne traite pas encore les webhooks entrants. Pour une validation de paiement plus robuste, ajouter une route serveur/Worker qui:

1. lit le corps brut de la requete;
2. verifie `X-LeekPay-Signature`;
3. compare le montant, la devise et la commande attendue;
4. marque la commande comme payee;
5. declenche l'envoi de commande.

## Utilisation

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

## Tests rapides LeekPay

1. Configurer `LEEKPAY_SECRET_KEY` sur le Worker.
2. Deployer le Worker.
3. Passer temporairement `PaymentProviderType.LEEKPAY` a `enabled: true` pour tester.
4. Lancer l'application avec `npm run dev`.
5. Choisir un forfait, puis LeekPay.
6. Verifier dans la console `[LeekPay] Creating hosted checkout`.
7. Verifier la redirection vers une URL `https://leekpay.me/...`.
8. Apres paiement ou annulation, verifier le retour vers PayOol.

## Securite

- Ne jamais exposer `sk_live_xxx` dans le frontend.
- Garder les appels REST LeekPay cote Worker.
- Ne pas envoyer les mots de passe TikTok dans `customer_name` ou `metadata`.
- Ne pas confirmer une commande uniquement sur la presence d'une redirection si un webhook ou une verification serveur est disponible.
- Comparer le montant attendu et le montant paye avant livraison.

## Support

- LeekPay: https://www.leekpay.me/docs
- SoleasPay: https://checkout.soleaspay.com
- BkaPay: https://bkapay.com
