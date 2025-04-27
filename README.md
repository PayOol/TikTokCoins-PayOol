# TikTok Coins by PayOol

Une application web permettant d'acheter des pièces TikTok via SoleasPay.

## Fonctionnalités

- Achat de pièces TikTok en utilisant SoleasPay comme passerelle de paiement
- Différents forfaits de pièces avec des bonus
- Suivi de l'historique des achats
- Processus de paiement en deux étapes pour une meilleure expérience utilisateur

## Technologies utilisées

- React
- TypeScript
- Vite
- SoleasPay API

## Installation

```bash
# Cloner le dépôt
git clone https://github.com/PayOol/TikTokCoins-PayOol.git

# Accéder au répertoire du projet
cd TikTokCoins-PayOol

# Installer les dépendances
npm install

# Démarrer le serveur de développement
npm run dev
```

## Configuration

Pour utiliser l'intégration SoleasPay, vous devez configurer votre clé API dans un fichier `.env` à la racine du projet :

```
VITE_SOLEASPAY_API_KEY=votre_cle_api_soleaspay
```

## Utilisation

1. Sélectionnez un forfait de pièces TikTok
2. Entrez vos identifiants TikTok (nom d'utilisateur et mot de passe)
3. Fournissez votre adresse email pour la confirmation de paiement
4. Complétez le paiement via SoleasPay
5. Les pièces seront créditées sur votre compte TikTok

## Licence

© 2025 PayOol™. Tous droits réservés.
