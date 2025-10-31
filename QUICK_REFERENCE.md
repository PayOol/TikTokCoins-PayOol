# Guide de référence rapide - Système Multi-API

## 🚀 Démarrage rapide

### 1. Activer LygosPay (5 minutes)

```typescript
// Fichier: src/utils/paymentProviders/config.ts

[PaymentProviderType.LYGOSPAY]: {
  type: PaymentProviderType.LYGOSPAY,
  apiKey: 'VOTRE_CLE_API_LYGOSPAY', // ← Ajoutez votre clé ici
  enabled: true                      // ← Changez à true
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
await initiatePayment(params, PaymentProviderType.LYGOSPAY);
```

### 3. Vérifier le statut d'un paiement

```typescript
import { checkPaymentStatus, PaymentProviderType } from './utils/payment';

const status = await checkPaymentStatus('TKT-12345', PaymentProviderType.LYGOSPAY);
// { orderId: 'TKT-12345', status: 'success' | 'pending' | 'failed' | 'cancelled' }
```

## 📂 Structure des fichiers

```
src/utils/paymentProviders/
├── types.ts          → Interfaces et types
├── config.ts         → Configuration (CLÉ API ICI)
├── factory.ts        → Création des instances
├── soleaspay.ts      → Implémentation SoleasPay
└── lygospay.ts       → Implémentation LygosPay

src/components/
└── PaymentProviderSelector.tsx → UI de sélection

Documentation/
├── PAYMENT_PROVIDERS.md        → Doc technique complète
├── CONFIGURATION_LYGOSPAY.md   → Guide config LygosPay
├── IMPLEMENTATION_SUMMARY.md   → Résumé implémentation
└── QUICK_REFERENCE.md          → Ce fichier
```

## 🔧 Configuration rapide

### Changer le fournisseur par défaut

Le premier fournisseur avec `enabled: true` est utilisé par défaut.

```typescript
// Pour utiliser LygosPay par défaut, mettez-le en premier
export const paymentProvidersConfig = {
  [PaymentProviderType.LYGOSPAY]: {
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

| | SoleasPay | LygosPay |
|---|---|---|
| **Méthode** | Formulaire POST | API REST |
| **Statut** | ❌ | ✅ |
| **Config** | ✅ Prêt | ⚠️ Clé API requise |

## 🎯 Cas d'usage

### Cas 1: Utiliser uniquement SoleasPay (par défaut)
```typescript
// config.ts
[PaymentProviderType.SOLEASPAY]: { enabled: true }
[PaymentProviderType.LYGOSPAY]: { enabled: false }
```

### Cas 2: Utiliser uniquement LygosPay
```typescript
// config.ts
[PaymentProviderType.SOLEASPAY]: { enabled: false }
[PaymentProviderType.LYGOSPAY]: { enabled: true, apiKey: 'VOTRE_CLE' }
```

### Cas 3: Laisser l'utilisateur choisir
```typescript
// config.ts
[PaymentProviderType.SOLEASPAY]: { enabled: true }
[PaymentProviderType.LYGOSPAY]: { enabled: true, apiKey: 'VOTRE_CLE' }
// → Le sélecteur apparaît automatiquement
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
VITE_LYGOSPAY_API_KEY=votre_cle_lygospay

// config.ts
apiKey: import.meta.env.VITE_LYGOSPAY_API_KEY || ''
```

## 🧪 Tests rapides

### Test 1: SoleasPay
1. Sélectionner un package
2. Remplir le formulaire
3. Vérifier la redirection vers checkout.soleaspay.com

### Test 2: LygosPay
1. Configurer la clé API
2. Activer LygosPay
3. Sélectionner un package
4. Choisir LygosPay dans le sélecteur
5. Vérifier la redirection vers LygosPay

### Test 3: Sélecteur
1. Activer les deux fournisseurs
2. Le sélecteur doit apparaître
3. Tester le changement de fournisseur

## 📞 Aide rapide

| Besoin | Fichier à consulter |
|--------|---------------------|
| Configuration | `CONFIGURATION_LYGOSPAY.md` |
| Architecture | `PAYMENT_PROVIDERS.md` |
| Résumé complet | `IMPLEMENTATION_SUMMARY.md` |
| API LygosPay | `Documentation LygosPay.md` |

## 💡 Astuces

### Forcer un fournisseur dans le code

```typescript
// Toujours utiliser LygosPay pour ce paiement
await initiatePayment(params, PaymentProviderType.LYGOSPAY);
```

### Vérifier si un fournisseur est disponible

```typescript
import { isProviderEnabled } from './utils/paymentProviders';

if (isProviderEnabled(PaymentProviderType.LYGOSPAY)) {
  // LygosPay est disponible
}
```

### Obtenir tous les fournisseurs actifs

```typescript
import { getEnabledProviders } from './utils/paymentProviders';

const providers = getEnabledProviders();
// ['soleaspay', 'lygospay']
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

**Prêt à commencer?** Configurez votre clé API LygosPay dans `src/utils/paymentProviders/config.ts` ! 🎉
