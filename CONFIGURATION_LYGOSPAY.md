# Configuration de LygosPay

## Guide rapide pour activer LygosPay

### Étape 1: Obtenir votre clé API LygosPay

1. Créez un compte sur [Lygos](https://lygosapp.com)
2. Accédez à votre tableau de bord
3. Générez une clé API dans la section API/Développeur
4. Copiez votre clé API

### Étape 2: Configurer la clé API dans le code

Ouvrez le fichier `src/utils/paymentProviders/config.ts` et modifiez la section LygosPay :

```typescript
[PaymentProviderType.LYGOSPAY]: {
  type: PaymentProviderType.LYGOSPAY,
  apiKey: 'VOTRE_CLE_API_ICI', // ← Collez votre clé API ici
  enabled: true // ← Changez à true pour activer
}
```

### Étape 3: Tester l'intégration

1. Redémarrez votre application de développement
2. Sélectionnez un package de pièces
3. Dans le formulaire de paiement, vous verrez maintenant un sélecteur de méthode de paiement
4. Choisissez "LygosPay" et complétez le paiement

## Fonctionnalités LygosPay

### ✅ Implémenté

- ✅ Création de gateway de paiement
- ✅ Redirection vers la page de paiement LygosPay
- ✅ Vérification du statut de paiement
- ✅ Gestion des URLs de succès/échec
- ✅ Sélecteur de fournisseur de paiement dans l'interface

### Endpoints utilisés

#### Créer un paiement
```
POST https://api.lygosapp.com/v1/gateway
```

**Headers:**
```
api-key: VOTRE_CLE_API
Content-Type: application/json
```

**Body:**
```json
{
  "amount": 1000,
  "shop_name": "PayOolTM",
  "order_id": "TKT-XXXXX",
  "message": "Achat de pièces TikTok",
  "success_url": "https://votre-site.com/success",
  "failure_url": "https://votre-site.com/failure"
}
```

#### Vérifier le statut
```
GET https://api.lygosapp.com/v1/gateway/payin/{order_id}
```

**Headers:**
```
api-key: VOTRE_CLE_API
```

## Basculer entre les fournisseurs

### Définir le fournisseur par défaut

Le premier fournisseur activé (`enabled: true`) dans `config.ts` sera utilisé par défaut.

Pour faire de LygosPay le fournisseur par défaut :
1. Assurez-vous que `enabled: true` pour LygosPay
2. Si vous voulez désactiver SoleasPay, mettez `enabled: false`

### Utilisation dans le code

```typescript
// Utiliser le fournisseur par défaut
await initiatePayment(params);

// Utiliser un fournisseur spécifique
await initiatePayment(params, PaymentProviderType.LYGOSPAY);
await initiatePayment(params, PaymentProviderType.SOLEASPAY);
```

## Sélection par l'utilisateur

Si plusieurs fournisseurs sont activés, l'utilisateur verra automatiquement un sélecteur dans le formulaire de paiement lui permettant de choisir sa méthode préférée.

## Gestion des erreurs

Les erreurs courantes et leurs solutions :

### Erreur 401 - Non autorisé
- **Cause**: Clé API invalide ou manquante
- **Solution**: Vérifiez que votre clé API est correcte dans `config.ts`

### Erreur 422 - Données invalides
- **Cause**: Format de données incorrect
- **Solution**: Vérifiez que tous les champs requis sont présents et valides

### Erreur 500 - Erreur serveur
- **Cause**: Problème côté LygosPay
- **Solution**: Réessayez plus tard ou contactez le support LygosPay

## Webhooks (à implémenter)

Pour une intégration complète, vous devriez implémenter des webhooks pour recevoir les notifications de paiement en temps réel :

1. Configurez un endpoint webhook sur votre serveur
2. Enregistrez l'URL du webhook dans votre compte LygosPay
3. Traitez les notifications de paiement reçues

## Support

- **Documentation LygosPay**: Voir `Documentation LygosPay.md`
- **Documentation multi-API**: Voir `PAYMENT_PROVIDERS.md`
- **Support LygosPay**: https://lygosapp.com/support

## Sécurité

⚠️ **Important**: 
- Ne commitez jamais vos clés API dans un dépôt public
- Utilisez des variables d'environnement en production
- Implémentez une validation côté serveur pour les paiements
- Utilisez HTTPS pour toutes les communications

## Prochaines étapes

1. ✅ Configuration de base terminée
2. 🔄 Tester en environnement de développement
3. ⏳ Implémenter les webhooks pour les notifications
4. ⏳ Migrer les clés API vers des variables d'environnement
5. ⏳ Déployer en production
