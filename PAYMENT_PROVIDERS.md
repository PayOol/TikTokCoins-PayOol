# Système Multi-API de Paiement

Ce document décrit l'architecture du système multi-API de paiement qui permet de supporter plusieurs fournisseurs de paiement (SoleasPay, LygosPay, etc.).

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
└── lygospay.ts        # Implémentation LygosPay
```

## Fournisseurs supportés

### 1. SoleasPay
- **Status**: Actif par défaut
- **Méthode**: Redirection via formulaire POST
- **Documentation**: https://checkout.soleaspay.com

### 2. LygosPay
- **Status**: Disponible (nécessite configuration)
- **Méthode**: API REST
- **Base URL**: https://api.lygosapp.com/v1/
- **Documentation**: Voir `Documentation LygosPay.md`

## Configuration

### Activer LygosPay

1. Ouvrez le fichier `src/utils/paymentProviders/config.ts`
2. Ajoutez votre clé API LygosPay :

```typescript
[PaymentProviderType.LYGOSPAY]: {
  type: PaymentProviderType.LYGOSPAY,
  apiKey: 'VOTRE_CLE_API_LYGOSPAY', // Remplacez par votre clé
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
  shopName: 'PayOolTM'
});

// Utiliser un fournisseur spécifique
await initiatePayment(params, PaymentProviderType.LYGOSPAY);
```

### Vérifier le statut d'un paiement

```typescript
import { checkPaymentStatus, PaymentProviderType } from './utils/payment';

const status = await checkPaymentStatus('TKT-12345', PaymentProviderType.LYGOSPAY);
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
  LYGOSPAY = 'lygospay',
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

## API LygosPay - Détails

### Endpoints utilisés

#### Créer un gateway de paiement
```
POST https://api.lygosapp.com/v1/gateway
Headers: api-key: <votre-clé>
Body: {
  amount: number,
  shop_name: string,
  order_id: string,
  message: string,
  success_url: string,
  failure_url: string
}
```

#### Vérifier le statut d'un paiement
```
GET https://api.lygosapp.com/v1/gateway/payin/{order_id}
Headers: api-key: <votre-clé>
```

### Codes de statut

- **200**: Succès
- **401**: Non autorisé (clé API invalide)
- **404**: Ressource non trouvée
- **422**: Données invalides

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
- LygosPay : https://api.lygosapp.com
