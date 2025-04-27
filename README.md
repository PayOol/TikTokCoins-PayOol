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

Pour utiliser l'intégration SoleasPay, vous devez configurer votre clé API dans un fichier `.env` à la racine du projet. Pour des raisons de sécurité, les données sensibles sont chiffrées et ne peuvent pas être copiées ou lues directement.

Suivez ces étapes pour générer une valeur chiffrée pour votre clé API :

1. Ouvrez un terminal à la racine du projet
2. Exécutez le script de génération avec votre clé API :

```bash
node scripts/generate-env.js votre_cle_api_soleaspay
```

3. Copiez la ligne générée dans votre fichier `.env` :

```
VITE_SOLEASPAY_API_KEY=ENC:AbCdEfGhIjKlMnOpQrStUvWxYz==
```

La valeur chiffrée (commençant par "ENC:") sera automatiquement déchiffrée par l'application lors de son exécution. Cela empêche toute personne non autorisée de voir ou de copier votre clé API, même si elle a accès au fichier `.env`.

## Utilisation

1. Sélectionnez un forfait de pièces TikTok
2. Entrez vos identifiants TikTok (nom d'utilisateur et mot de passe)
3. Fournissez votre adresse email pour la confirmation de paiement
4. Complétez le paiement via SoleasPay
5. Les pièces seront créditées sur votre compte TikTok

## Licence

© 2025 PayOol™. Tous droits réservés.
