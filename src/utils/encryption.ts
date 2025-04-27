/**
 * Utilitaire pour chiffrer et déchiffrer les données sensibles
 */

// Clé de chiffrement interne à l'application (ne pas modifier)
const ENCRYPTION_KEY = 'PayOol_TikTok_Secure_Key_2025';

/**
 * Chiffre une chaîne de caractères
 * @param text Texte à chiffrer
 * @returns Texte chiffré
 */
export function encrypt(text: string): string {
  // Implémentation simple de chiffrement XOR
  let result = '';
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length);
    result += String.fromCharCode(charCode);
  }
  // Convertir en base64 pour éviter les problèmes de caractères spéciaux
  return btoa(result);
}

/**
 * Déchiffre une chaîne de caractères
 * @param encryptedText Texte chiffré
 * @returns Texte déchiffré
 */
export function decrypt(encryptedText: string): string {
  try {
    // Convertir depuis base64
    const text = atob(encryptedText);
    let result = '';
    for (let i = 0; i < text.length; i++) {
      const charCode = text.charCodeAt(i) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length);
      result += String.fromCharCode(charCode);
    }
    return result;
  } catch (error) {
    console.error('Erreur de déchiffrement:', error);
    return '';
  }
}

/**
 * Utilitaire pour accéder aux variables d'environnement chiffrées
 * @param key Nom de la variable d'environnement
 * @returns Valeur déchiffrée
 */
export function getSecureEnvVariable(key: string): string {
  const value = import.meta.env[key];
  if (!value) return '';
  
  // Si la valeur commence par "ENC:", elle est chiffrée
  if (typeof value === 'string' && value.startsWith('ENC:')) {
    return decrypt(value.substring(4));
  }
  
  return value as string;
}
