# TikTok Coins by PayOol

Application web pour l'achat de pièces TikTok avec intégration de paiement SoleasPay.

## Fonctionnalités

- Achat de packs de pièces TikTok prédéfinis
- Option de pack personnalisé
- Historique des achats
- Intégration de paiement sécurisé via SoleasPay

## Technologies utilisées

- React
- TypeScript
- Tailwind CSS
- Vite

## Installation

```bash
# Cloner le dépôt
git clone https://github.com/votre-nom/tiktok-coins-payool.git

# Accéder au répertoire
cd tiktok-coins-payool

# Installer les dépendances
npm install

# Lancer l'application en mode développement
npm run dev
```

## Configuration

Créez un fichier `.env` à la racine du projet avec les variables suivantes :

```
VITE_SOLEASPAY_API_KEY=votre_api_key_soleaspay
```

## Intégration SoleasPay

L'application utilise l'API SoleasPay pour le traitement des paiements. Le processus se déroule en deux étapes :

1. L'utilisateur saisit ses identifiants TikTok (nom d'utilisateur et mot de passe)
2. L'utilisateur fournit son adresse email pour la confirmation de paiement
3. Le paiement est initié via SoleasPay

## Licence

MIT
