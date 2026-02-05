# Guide de référence rapide - Système Multi-API

## 🚀 Démarrage rapide

### 1. Activer BkaPay (5 minutes)

```typescript
// Fichier: src/utils/paymentProviders/config.ts

[PaymentProviderType.BKAPAY]: {
  type: PaymentProviderType.BKAPAY,
  apiKey: 'pk_live_VOTRE_CLE_PUBLIQUE', // Ajoutez votre clé ici
  enabled: true                      // Changez à true
}
```

### 2. Utilisation dans le code

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

### 3. Vérifier le statut d'un paiement

```typescript
import { checkPaymentStatus, PaymentProviderType } from './utils/payment';

const status = await checkPaymentStatus('TKT-12345', PaymentProviderType.BKAPAY);
// { orderId: 'TKT-12345', status: 'success' | 'pending' | 'failed' | 'cancelled' }
```

## 📂 Structure des fichiers

```
src/utils/paymentProviders/
├── types.ts          → Interfaces et types
├── config.ts         → Configuration (CLE API ICI)
├── factory.ts        → Creation des instances
├── soleaspay.ts      → Implementation SoleasPay
└── bkapay.ts         → Implementation BkaPay

src/components/
└── PaymentProviderSelector.tsx → UI de selection

Documentation/
├── PAYMENT_PROVIDERS.md        → Doc technique complete
├── IMPLEMENTATION_SUMMARY.md   → Resume implementation
└── QUICK_REFERENCE.md          → Ce fichier
```

## 🔧 Configuration rapide

### Changer le fournisseur par défaut

Le premier fournisseur avec `enabled: true` est utilisé par défaut.

```typescript
// Pour utiliser BkaPay par defaut, mettez-le en premier
export const paymentProvidersConfig = {
  [PaymentProviderType.BKAPAY]: {
    enabled: true,
    // ...
  },
  [PaymentProviderType.SOLEASPAY]: {
    enabled: true,
    // ...
  }
};
```

### Désactiver un fournisseur

```typescript
[PaymentProviderType.SOLEASPAY]: {
  enabled: false, // ← Désactive SoleasPay
  // ...
}
```

## 🎨 Interface utilisateur

Le sélecteur de fournisseur apparaît automatiquement dans le formulaire de paiement si plusieurs fournisseurs sont activés.

**Pour masquer le sélecteur**: Activez un seul fournisseur.

## 🔍 Debugging

### Vérifier les logs

```javascript
// Dans la console du navigateur
console.log('Payment initiated successfully');
console.error('Payment initiation error:', error);
```

### Erreurs courantes

| Erreur | Cause | Solution |
|--------|-------|----------|
| 401 | Clé API invalide | Vérifier `config.ts` |
| 422 | Données invalides | Vérifier les paramètres |
| Provider not enabled | Fournisseur désactivé | `enabled: true` dans config |
| No payment provider enabled | Aucun fournisseur actif | Activer au moins un fournisseur |

## 📊 Comparaison rapide

| | SoleasPay | BkaPay |
|---|---|---|
| **Methode** | Formulaire POST | Redirection URL |
| **Statut** | Actif | Actif |
| **Config** | Pret | Cle publique requise |

## 🎯 Cas d'usage

### Cas 1: Utiliser uniquement SoleasPay (par defaut)
```typescript
// config.ts
[PaymentProviderType.SOLEASPAY]: { enabled: true }
[PaymentProviderType.BKAPAY]: { enabled: false }
```

### Cas 2: Utiliser uniquement BkaPay
```typescript
// config.ts
[PaymentProviderType.SOLEASPAY]: { enabled: false }
[PaymentProviderType.BKAPAY]: { enabled: true, apiKey: 'VOTRE_CLE' }
```

### Cas 3: Laisser l'utilisateur choisir
```typescript
// config.ts
[PaymentProviderType.SOLEASPAY]: { enabled: true }
[PaymentProviderType.BKAPAY]: { enabled: true, apiKey: 'VOTRE_CLE' }
// → Le selecteur apparait automatiquement
```

## 🔐 Sécurité

### ⚠️ À faire avant la production

- [ ] Migrer les clés API vers des variables d'environnement
- [ ] Implémenter une validation côté serveur
- [ ] Configurer HTTPS
- [ ] Implémenter les webhooks
- [ ] Ajouter des logs de sécurité

### Variables d'environnement (recommandé)

```typescript
// .env
VITE_SOLEASPAY_API_KEY=votre_cle_soleaspay
VITE_BKAPAY_API_KEY=votre_cle_bkapay

// config.ts
apiKey: import.meta.env.VITE_BKAPAY_API_KEY || ''
```

## 🧪 Tests rapides

### Test 1: SoleasPay
1. Sélectionner un package
2. Remplir le formulaire
3. Vérifier la redirection vers checkout.soleaspay.com

### Test 2: BkaPay
1. Configurer la cle publique
2. Activer BkaPay
3. Selectionner un package
4. Choisir BkaPay dans le selecteur
5. Verifier la redirection vers BkaPay

### Test 3: Sélecteur
1. Activer les deux fournisseurs
2. Le sélecteur doit apparaître
3. Tester le changement de fournisseur

## 📞 Aide rapide

| Besoin | Fichier a consulter |
|--------|---------------------|
| Configuration | `PAYMENT_PROVIDERS.md` |
| Architecture | `PAYMENT_PROVIDERS.md` |
| Resume complet | `IMPLEMENTATION_SUMMARY.md` |
| API BkaPay | Documentation API BkaPay |

## 💡 Astuces

### Forcer un fournisseur dans le code

```typescript
// Toujours utiliser BkaPay pour ce paiement
await initiatePayment(params, PaymentProviderType.BKAPAY);
```

### Vérifier si un fournisseur est disponible

```typescript
import { isProviderEnabled } from './utils/paymentProviders';

if (isProviderEnabled(PaymentProviderType.BKAPAY)) {
  // BkaPay est disponible
}
```

### Obtenir tous les fournisseurs actifs

```typescript
import { getEnabledProviders } from './utils/paymentProviders';

const providers = getEnabledProviders();
// ['soleaspay', 'bkapay']
```

## ⚡ Commandes utiles

```bash
# Démarrer le serveur de développement
npm run dev

# Build pour la production
npm run build

# Vérifier les types TypeScript
npm run type-check
```

## 🎓 Bonnes pratiques

✅ **DO**
- Utiliser `initiatePayment()` pour les nouveaux codes
- Gérer les erreurs avec try/catch
- Vérifier le statut des paiements
- Documenter les changements

❌ **DON'T**
- Ne pas hardcoder les clés API en production
- Ne pas ignorer les erreurs
- Ne pas modifier directement les fichiers de provider
- Ne pas commiter les clés API

## 🚀 Checklist de déploiement

- [ ] Clés API configurées
- [ ] Tests effectués
- [ ] Variables d'environnement configurées
- [ ] HTTPS activé
- [ ] Webhooks configurés (si applicable)
- [ ] Logs de monitoring en place
- [ ] Documentation à jour

---

**Pret a commencer?** Configurez votre cle publique BkaPay dans `src/utils/paymentProviders/config.ts` !
