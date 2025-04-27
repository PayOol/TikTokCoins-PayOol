/**
 * Utilitaire pour générer des valeurs chiffrées pour le fichier .env
 * Cet outil est à utiliser uniquement par les administrateurs
 */

import { encrypt } from './encryption';

/**
 * Génère une valeur chiffrée pour le fichier .env
 * @param value Valeur à chiffrer
 * @returns Valeur chiffrée au format "ENC:xxx"
 */
export function generateSecureEnvValue(value: string): string {
  return `ENC:${encrypt(value)}`;
}

// Exemple d'utilisation (à exécuter dans un environnement Node.js sécurisé)
// Pour générer une valeur chiffrée pour le fichier .env:
// 
// import { generateSecureEnvValue } from './envGenerator';
// 
// const apiKey = 'votre_cle_api_soleaspay';
// const encryptedValue = generateSecureEnvValue(apiKey);
// console.log(`VITE_SOLEASPAY_API_KEY=${encryptedValue}`);
// 
// Copiez ensuite cette valeur dans votre fichier .env
