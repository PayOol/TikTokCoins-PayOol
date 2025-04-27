/**
 * Script pour générer des valeurs chiffrées pour le fichier .env
 * 
 * Utilisation:
 * node generate-env.js votre_cle_api_soleaspay
 */

// Fonction de chiffrement simplifiée (doit correspondre à celle dans encryption.ts)
const ENCRYPTION_KEY = 'PayOol_TikTok_Secure_Key_2025';

function encrypt(text) {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length);
    result += String.fromCharCode(charCode);
  }
  return Buffer.from(result).toString('base64');
}

function generateSecureEnvValue(value) {
  return `ENC:${encrypt(value)}`;
}

// Récupérer la valeur à chiffrer depuis les arguments de ligne de commande
const apiKey = process.argv[2];

if (!apiKey) {
  console.error('Erreur: Veuillez fournir une clé API en argument.');
  console.error('Exemple: node generate-env.js votre_cle_api_soleaspay');
  process.exit(1);
}

const encryptedValue = generateSecureEnvValue(apiKey);
console.log('\nCopiez la ligne suivante dans votre fichier .env:');
console.log('----------------------------------------------');
console.log(`VITE_SOLEASPAY_API_KEY=${encryptedValue}`);
console.log('----------------------------------------------');
console.log('\nCette valeur est chiffrée et ne peut pas être déchiffrée sans accéder au code source de l\'application.');
