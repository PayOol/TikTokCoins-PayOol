# Système Multi-API de Paiement

Ce document décrit l'architecture du système multi-API de paiement qui permet de supporter plusieurs fournisseurs de paiement (SoleasPay, BkaPay, etc.).

## Architecture

Le système utilise une architecture basée sur le **Factory Pattern** et des **interfaces** pour permettre l'ajout facile de nouveaux fournisseurs de paiement.

### Structure des fichiers

```
src/utils/paymentProviders/
├── index.ts           # Point d'entrée du module
├── types.ts           # Interfaces et types communs
├── config.ts          # Configuration des fournisseurs
├── factory.ts         # Factory pour créer les instances
├── soleaspay.ts       # Implémentation SoleasPay
└── bkapay.ts          # Implémentation BkaPay
```

## Fournisseurs supportés

### 1. SoleasPay
- **Status**: Actif par défaut
- **Méthode**: Redirection via formulaire POST
- **Documentation**: https://checkout.soleaspay.com

### 2. BkaPay
- **Status**: Disponible (nécessite configuration)
- **Méthode**: Redirection URL
- **Base URL**: https://bkapay.com/api-pay/
- **Documentation**: Voir la documentation API BkaPay

## Configuration

### Activer BkaPay

1. Ouvrez le fichier `src/utils/paymentProviders/config.ts`
2. Ajoutez votre clé publique BkaPay :

```typescript
[PaymentProviderType.BKAPAY]: {
  type: PaymentProviderType.BKAPAY,
  apiKey: 'pk_live_VOTRE_CLE_PUBLIQUE', // Remplacez par votre clé
  enabled: true // Changez à true pour activer
}
```

### Changer le fournisseur par défaut

Le fournisseur par défaut est le premier fournisseur activé dans la configuration. Pour changer l'ordre de priorité, modifiez l'ordre dans `paymentProvidersConfig`.

## Utilisation

### Méthode recommandée (nouveau code)

```typescript
import { initiatePayment, PaymentProviderType } from './utils/payment';

// Utiliser le fournisseur par défaut
await initiatePayment({
  amount: 1000,
  currency: 'XAF',
  description: 'Achat de pièces',
  orderId: 'TKT-12345',
  customerName: 'John Doe',
  customerEmail: 'john@example.com',
  successUrl: 'https://example.com/success',
  failureUrl: 'https://example.com/failure',
  shopName: 'PayOol™'
});

// Utiliser un fournisseur spécifique
await initiatePayment(params, PaymentProviderType.BKAPAY);
```

### Vérifier le statut d'un paiement

```typescript
import { checkPaymentStatus, PaymentProviderType } from './utils/payment';

const status = await checkPaymentStatus('TKT-12345', PaymentProviderType.BKAPAY);
console.log(status); // { orderId: 'TKT-12345', status: 'success' }
```

### Méthode legacy (compatibilité)

```typescript
import { initiateSoleasPayment } from './utils/payment';

// Fonctionne toujours pour la compatibilité ascendante
await initiateSoleasPayment({
  amount: 1000,
  currency: 'XAF',
  description: 'Achat de pièces',
  orderId: 'TKT-12345',
  customerName: 'John Doe',
  customerEmail: 'john@example.com',
  successUrl: 'https://example.com/success',
  failureUrl: 'https://example.com/failure'
});
```

## Ajouter un nouveau fournisseur

### 1. Créer l'implémentation

Créez un nouveau fichier `src/utils/paymentProviders/nouveaufournisseur.ts` :

```typescript
import { PaymentProvider, PaymentParams, PaymentResponse, PaymentStatusResponse } from './types';

export class NouveauFournisseurProvider implements PaymentProvider {
  name = 'NouveauFournisseur';
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  async initiatePayment(params: PaymentParams): Promise<PaymentResponse> {
    // Implémentez la logique de paiement
  }

  async checkPaymentStatus(orderId: string): Promise<PaymentStatusResponse> {
    // Implémentez la vérification du statut
  }
}
```

### 2. Ajouter le type

Dans `src/utils/paymentProviders/types.ts`, ajoutez :

```typescript
export enum PaymentProviderType {
  SOLEASPAY = 'soleaspay',
  BKAPAY = 'bkapay',
  NOUVEAUFOURNISSEUR = 'nouveaufournisseur' // Ajoutez ici
}
```

### 3. Configurer le fournisseur

Dans `src/utils/paymentProviders/config.ts`, ajoutez :

```typescript
[PaymentProviderType.NOUVEAUFOURNISSEUR]: {
  type: PaymentProviderType.NOUVEAUFOURNISSEUR,
  apiKey: 'VOTRE_CLE_API',
  enabled: true
}
```

### 4. Ajouter à la factory

Dans `src/utils/paymentProviders/factory.ts`, ajoutez le case :

```typescript
case PaymentProviderType.NOUVEAUFOURNISSEUR:
  return new NouveauFournisseurProvider(config.apiKey);
```

### 5. Exporter le nouveau provider

Dans `src/utils/paymentProviders/index.ts`, ajoutez :

```typescript
export * from './nouveaufournisseur';
```

## API BkaPay - Détails

### URL de redirection

```
https://bkapay.com/api-pay/VOTRE_CLE_PUBLIQUE?amount=MONTANT&description=DESCRIPTION&callback=URL_RETOUR
```

**Paramètres:**
- `amount`: Montant minimum 200 (XOF, XAF ou CDF selon votre pays)
- `description`: Description du paiement (optionnel)
- `callback`: URL de retour après paiement (optionnel)

### Gestion du retour

Après le paiement, le client est redirigé vers votre URL de callback avec les paramètres suivants:

```
https://votresite.com/success?status=success&transactionId=xxx&amount=5000
```

- `status`: "success" ou "failed"
- `transactionId`: Identifiant unique de la transaction
- `amount`: Montant payé

### Exemple JavaScript pour gérer le retour

```javascript
const urlParams = new URLSearchParams(window.location.search);
const status = urlParams.get("status");
const transactionId = urlParams.get("transactionId");
const amount = urlParams.get("amount");

if (status === "success") {
  console.log("Paiement reussi:", transactionId, amount);
} else {
  console.log("Paiement echoue");
}
```

## Tests

Pour tester un nouveau fournisseur :

1. Configurez la clé API dans `config.ts`
2. Activez le fournisseur (`enabled: true`)
3. Utilisez l'application normalement
4. Vérifiez les logs de la console pour les erreurs

## Sécurité

⚠️ **Important** : Les clés API sont actuellement stockées dans le code source. Pour la production, considérez :

1. Utiliser des variables d'environnement
2. Stocker les clés côté serveur
3. Utiliser un backend pour gérer les paiements

## Support

Pour toute question ou problème :
- SoleasPay : https://checkout.soleaspay.com
- BkaPay : https://bkapay.com
