/**
 * Simple encryption utility for API keys
 * Uses XOR cipher with a static key for obfuscation
 */

const ENCRYPTION_KEY = 'PayOolSecureKey2024';

/**
 * Encrypt a string using XOR cipher
 */
export function encrypt(text: string): string {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(
      text.charCodeAt(i) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length)
    );
  }
  return btoa(result); // Base64 encoding for safe storage
}

/**
 * Decrypt a string using XOR cipher
 */
export function decrypt(encrypted: string): string {
  try {
    const decoded = atob(encrypted); // Base64 decoding
    let result = '';
    for (let i = 0; i < decoded.length; i++) {
      result += String.fromCharCode(
        decoded.charCodeAt(i) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length)
      );
    }
    return result;
  } catch (error) {
    console.error('Decryption error:', error);
    return '';
  }
}
