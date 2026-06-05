# Architecture du projet

Ce document decrit l'architecture actuellement presente dans le depot.

## Point important

Le projet ne contient pas de backend Express/Nodemailer.

Il n'existe pas dans ce depot:

- de dossier `backend/`;
- de serveur `server.js`;
- d'endpoint `/api/send-credentials`;
- de configuration PM2;
- de reverse proxy Nginx dedie a une API locale.

La logique actuelle est une application frontend React/Vite qui utilise des
services externes cote navigateur.

## Vue d'ensemble

```text
Utilisateur
   |
   v
Application React/Vite
   |
   +-- Formulaires client
   +-- Selection de forfait
   +-- Selection fournisseur paiement
   +-- Historique localStorage
   |
   +--> Fournisseur de paiement externe
   |
   +--> Page de confirmation
           |
           +--> EmailJS
```

## Frontend

Les points d'entree principaux sont:

```text
src/main.tsx
src/App.tsx
```

`src/main.tsx` configure le router:

- `/`
- `/payment/confirmation`
- `/payment/success`
- `/payment/failure`

`src/App.tsx` orchestre le parcours principal:

- choix du service;
- selection d'un forfait;
- ouverture des modales;
- lancement du paiement;
- ajout de l'achat en attente dans l'historique local.

## Services proposes

Deux services sont geres par l'interface:

- `coins`: achat de TikTok Coins;
- `accounts`: achat de forfaits de comptes TikTok.

Les forfaits sont declares dans:

```text
src/data/coinPackages.ts
src/data/accountPackages.ts
```

## Paiements

La couche paiement est separee en plusieurs fichiers:

```text
src/utils/payment.ts
src/utils/paymentProviders/types.ts
src/utils/paymentProviders/config.ts
src/utils/paymentProviders/factory.ts
src/utils/paymentProviders/leekpay.ts
src/utils/paymentProviders/soleaspay.ts
src/utils/paymentProviders/bkapay.ts
```

Le principe est le suivant:

```text
App.tsx
  |
  v
initiatePayment(...)
  |
  v
PaymentProviderFactory
  |
  +-- LeekPayProvider
  +-- SoleasPayProvider
  +-- BkaPayProvider
```

La configuration des fournisseurs est dans:

```text
src/utils/paymentProviders/config.ts
```

## Confirmation de commande

La page:

```text
src/pages/PaymentConfirmation.tsx
```

lit les parametres de retour de paiement dans l'URL, puis envoie les donnees de
commande via EmailJS.

Ce comportement est cote frontend. Aucun appel a `/api/send-credentials` n'est
present dans l'implementation actuelle.

## Historique local

Les achats sont conserves dans le navigateur:

```text
src/utils/localStorage.ts
```

Cles utilisees:

- `tiktok_user`
- `purchaseHistory`
- `totalCoins`
- `pendingOrders`

## PWA et Android

La PWA est configuree dans:

```text
vite.config.ts
```

Capacitor est configure dans:

```text
capacitor.config.ts
android/
```

## Internationalisation

La configuration i18n est dans:

```text
src/i18n.ts
src/locales/fr/translation.js
src/locales/en/translation.js
```

## Evolution possible

Un backend peut etre ajoute plus tard, mais ce serait une evolution a part
entiere. Dans ce cas, il faudra:

- creer le dossier backend;
- ajouter les endpoints reels;
- brancher le frontend sur ces endpoints;
- retirer ou remplacer l'envoi EmailJS cote frontend;
- documenter la nouvelle architecture apres implementation.
