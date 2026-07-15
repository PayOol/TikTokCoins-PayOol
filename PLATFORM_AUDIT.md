# Audit technique de la plateforme PayOol

Date: 2026-07-15

## Portee et limite

L'audit couvre l'architecture React/Vite, les routes, les composants, les
donnees, les paiements, le stockage local, l'internationalisation, le SEO, la
PWA, le responsive code et la chaine de build.

La verification visuelle interactive n'a pas ete executee: a la demande de
l'utilisateur, aucun outil de connexion au navigateur n'a ete utilise. Les
constats UX visuels et d'accessibilite dynamique restent donc a confirmer sur
de vrais appareils.

## Vue d'ensemble

- Frontend React 18 + TypeScript + Vite + Tailwind.
- Routage React Router avec quatre services et trois pages de retour paiement.
- Paiements delegues a plusieurs fournisseurs, avec deux fournisseurs actifs
  relies a un Worker Cloudflare.
- Historique, solde et commandes en attente stockes dans le navigateur.
- Confirmation de commande envoyee depuis le navigateur par EmailJS.
- PWA avec service worker `autoUpdate` et application Android Capacitor.
- Internationalisation francaise et anglaise avec i18next.

## Points solides

- La fabrique de fournisseurs de paiement isole correctement les integrations.
- Les secrets AfribaPay et SebPay sont places derriere le proxy Worker plutot
  que dans le bundle frontend.
- Les catalogues sont separes des composants et types en TypeScript.
- Le design utilise des tokens coherents pour les fonds, textes, bordures,
  rayons et ombres.
- Les routes de services mettent a jour les metadonnees SEO et le schema
  `Service`.
- La PWA precache les ressources et nettoie les anciens caches.

## Risques prioritaires

### P0 - Les mots de passe TikTok et eFootball sont exposes

Les parcours TikTok et eFootball collectent le mot de passe du client,
l'inserent dans les donnees transmises au prestataire de paiement, puis le
placent dans l'URL de retour. La page de confirmation journalise tous les
parametres, envoie le mot de passe par EmailJS et le conserve dans
`pendingOrders` dans `localStorage`.

Impact: fuite possible via historique du navigateur, journaux, referer,
captures, extensions, fournisseur de paiement, EmailJS ou script tiers. Ce
risque doit bloquer une mise en production publique du parcours TikTok actuel.

Action recommandee: ne jamais demander le mot de passe TikTok. Utiliser un
identifiant public lorsque le fournisseur le permet, sinon creer un backend de
commande avec un jeton ephemere et une procedure d'acces qui ne traverse ni
l'URL, ni le prestataire de paiement, ni le stockage local.

### P1 - La confirmation de commande est pilotee par le client

La page de confirmation considere le paiement exploitable tant que le statut
URL n'est pas explicitement un echec et que les parametres attendus sont
presents. L'envoi EmailJS et la prevention du double traitement reposent sur
le navigateur et `localStorage`.

Impact: une URL construite manuellement peut declencher un email de commande;
le navigateur ne peut pas constituer une source de verite de paiement.

Action recommandee: creer et stocker la commande cote serveur, verifier le
paiement via webhook ou API fournisseur, rendre l'operation idempotente cote
serveur, puis afficher au frontend un statut signe et sans donnees sensibles.

### P1 - `App.tsx` concentre trop de responsabilites

Le composant principal gere le routage de services, le SEO, tous les etats de
modales, trois parcours d'achat, les fournisseurs de paiement, l'historique et
une video d'aide.

Impact: chaque nouveau service augmente le risque de regression et rend les
tests unitaires difficiles.

Action recommandee: separer les pages de service, extraire un hook de commande
par type de produit et conserver dans `App` uniquement l'orchestration de haut
niveau.

### P2 - La chaine ESLint est incompatible

`npm run lint` echoue avant d'analyser le code: ESLint 9.36.0 est installe avec
`typescript-eslint` 8.8.1 et la regle `no-unused-expressions` plante au
chargement.

Impact: aucune verification lint fiable en local ou en CI.

Action recommandee: aligner les versions ESLint/typescript-eslint dans le
lockfile, puis ajouter `npm run lint` et `npm run build` comme controles CI.

### P2 - Le popup PWA est tres intrusif

La modale d'installation apparait deux secondes apres l'arrivee, meme sans
signal d'intention de l'utilisateur.

Impact: elle interrompt le parcours d'achat et peut reduire la confiance sur
mobile.

Action recommandee: proposer l'installation apres une interaction utile ou
une seconde visite, et garder un bouton non bloquant dans l'interface.

### P2 - Les URLs de paiement sont liees a un chemin de deploiement fixe

Plusieurs retours utilisent directement `/TikTokCoins-PayOol/` au lieu de la
base Vite configuree.

Impact: les retours paiement cassent lors d'un changement de domaine ou de
sous-dossier.

Action recommandee: construire toutes les URLs avec `import.meta.env.BASE_URL`
ou une origine publique configuree.

### P2 - Des donnees SEO ne sont pas reliees a une source verifiable

Le JSON-LD global annonce une note de 4,8 et 1 250 avis, ainsi qu'une fourchette
de prix qui ne correspond pas a tous les catalogues actuels.

Impact: donnees structurees trompeuses ou refusees par les moteurs de
recherche.

Action recommandee: supprimer l'`AggregateRating` tant qu'une source publique
reelle n'existe pas et generer les offres depuis les catalogues.

## Changement eFootball et navigation mobile

- Nouvelle route `/pieces-efootball` et fallback statique de production.
- 18 forfaits reproduits depuis la grille fournie: 10 iOS/Android et 8 Steam.
- Le parcours eFootball collecte l'ID KONAMI ou l'e-mail, le mot de passe et le
  numero WhatsApp avant de rejoindre les fournisseurs de paiement existants.
- Les commandes eFootball sont ajoutees a l'historique et traitees par la page
  de confirmation commune.
- Navigation inferieure fixe vers les quatre services sur mobile et PWA.
- Prise en charge de la zone sure iOS et repositionnement du bouton WhatsApp.
- Remise en haut de page lors d'un changement de service et acces direct a
  l'historique depuis le menu lateral.
- Noms PWA et entetes PayOol generalises pour ne plus presenter l'application
  comme exclusivement TikTok.
- Catalogue, interface, traductions, metadonnees SEO et sitemap separes.

## Validation realisee

- `npx tsc -b --pretty false`: succes.
- `npm run build`: succes, service worker et fallbacks generes.
- Sitemap XML valide: 5 URLs, dont `/pieces-efootball`.
- Fallback de production `dist/pieces-efootball/index.html`: genere.
- Route locale `/pieces-efootball`: reponse HTTP 200.
- `npm run lint`: bloque par l'incompatibilite de versions decrite plus haut.
- Validation visuelle navigateur: non executee selon la contrainte utilisateur.

## Ordre de traitement recommande

1. Supprimer immediatement la collecte et la circulation du mot de passe TikTok.
2. Deplacer la confirmation, l'idempotence et l'envoi de commande cote serveur.
3. Reparer la chaine ESLint et ajouter les controles CI.
4. Decouper `App.tsx` en pages et hooks de commande testables.
5. Tester les quatre routes sur iPhone, Android, PWA installee et desktop.
