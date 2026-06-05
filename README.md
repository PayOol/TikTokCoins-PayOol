# TikTok Coins by PayOol

Application web/PWA permettant de vendre des services TikTok via plusieurs
passerelles de paiement.

## Perimetre actuel du projet

Ce depot contient l'application frontend uniquement.

Il ne contient pas de backend Express, pas d'endpoint `/api/send-credentials`,
pas de configuration PM2/Nginx, et pas de serveur Nodemailer local au projet.

Le traitement actuel des commandes est fait cote frontend:

- selection d'un forfait TikTok Coins ou compte TikTok;
- collecte des informations client via les formulaires React;
- paiement via LeekPay, SoleasPay ou BkaPay selon la configuration;
- retour sur les pages de confirmation/succes/echec;
- envoi de la commande via EmailJS depuis `src/pages/PaymentConfirmation.tsx`;
- historique local stocke dans le navigateur avec `localStorage`.

## Fonctionnalites

- Achat de forfaits TikTok Coins.
- Achat de forfaits de comptes TikTok.
- Forfait personnalise pour les coins.
- Selection du fournisseur de paiement.
- Pages de confirmation, succes et echec de paiement.
- Historique local des achats.
- Interface bilingue francais/anglais avec i18next.
- Theme clair/sombre.
- PWA avec installation possible sur mobile/desktop.
- Projet Android via Capacitor.

## Technologies utilisees

- React 18
- TypeScript
- Vite
- TailwindCSS
- React Router
- i18next
- EmailJS
- Capacitor
- vite-plugin-pwa

## Installation

```bash
npm install
npm run dev
```

L'application est servie par Vite, generalement sur:

```text
http://localhost:5173/TikTokCoins-PayOol/
```

## Build

```bash
npm run build
```

Le build de production est genere dans `dist/`.

## Paiements

Les fournisseurs de paiement sont configures dans:

```text
src/utils/paymentProviders/config.ts
```

Providers presents:

- LeekPay: active
- SoleasPay: active
- BkaPay: present mais desactive

La logique commune est dans:

```text
src/utils/payment.ts
src/utils/paymentProviders/
```

## Commandes et notifications

La page de confirmation utilise EmailJS:

```text
src/pages/PaymentConfirmation.tsx
```

Il n'y a pas de backend dans ce depot pour recevoir les commandes. Si un backend
est ajoute plus tard, il devra etre implemente, documente et branche dans le
code avant d'etre presente comme faisant partie de l'architecture.

## Stockage local

L'historique des achats et le solde affiche sont stockes cote navigateur:

```text
src/utils/localStorage.ts
```

## Structure principale

```text
src/
  App.tsx
  main.tsx
  components/
  data/
  pages/
  utils/
    payment.ts
    localStorage.ts
    paymentProviders/
```

## Licence

Copyright 2025 PayOol. Tous droits reserves.
