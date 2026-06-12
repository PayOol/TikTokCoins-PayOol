import { PaymentProviderType } from './types';
import { decrypt } from '../encryption';

/**
 * Payment provider configuration
 */
export interface ProviderConfig {
  type: PaymentProviderType;
  apiKey: string;
  secretKey?: string;
  enabled: boolean;
  recommended?: boolean; // Indique si ce provider est recommandé
}

/**
 * Configuration for all payment providers
 */
export const paymentProvidersConfig: Record<PaymentProviderType, ProviderConfig> = {
  [PaymentProviderType.SEBPAY]: {
    type: PaymentProviderType.SEBPAY,
    apiKey: 'IAomIwYaNjoNLzAUEVAtQ3JgBWMWQXg1KAsWDhQUViAHEFxXU3IXOB8fCjhhVQUf',
    secretKey: 'IwomIwYaNjpTRCMNKgocdX5VZREjAygqGB0zCUMhLAMrHWoHeHczAjElWCE4JlInORYvRQx6WWJQHlUDfTUIAgYONyM=',
    enabled: true,
    recommended: true // Provider recommandé
  },
  [PaymentProviderType.LEEKPAY]: {
    type: PaymentProviderType.LEEKPAY,
    apiKey: 'IAomIwYaNjosGRsHMgw1S358RioSKCUaBh1TNw0aC3wgEFdfQE5pMA==',
    enabled: true
  },
  [PaymentProviderType.SOLEASPAY]: {
    type: PaymentProviderType.SOLEASPAY,
    apiKey: 'FFgfIzo+Yw0RRTo/DVNKY3tGe2IGS2IsHQIiBhcdFntRKx9SYmY2V0oEV0ESNQ==',
    enabled: false // Désactivé temporairement
  },
  [PaymentProviderType.BKAPAY]: {
    type: PaymentProviderType.BKAPAY,
    apiKey: 'IAomIwYaNjpTFhddKgYdAx1XUWZYVHtYVGRIWkxBAGZUQQIGBAxgVk53XV0=',
    enabled: false // Désactivé
  }
};

/**
 * Get the default payment provider
 */
export function getDefaultProvider(): PaymentProviderType {
  // Return the first enabled provider
  const enabledProviders = Object.values(paymentProvidersConfig).filter(config => config.enabled);
  
  if (enabledProviders.length === 0) {
    throw new Error('No payment provider is enabled');
  }
  
  return enabledProviders[0].type;
}

/**
 * Get all enabled payment providers
 */
export function getEnabledProviders(): PaymentProviderType[] {
  return Object.values(paymentProvidersConfig)
    .filter(config => config.enabled)
    .map(config => config.type);
}

/**
 * Check if a provider is enabled
 */
export function isProviderEnabled(provider: PaymentProviderType): boolean {
  return paymentProvidersConfig[provider]?.enabled || false;
}

/**
 * Get provider configuration with decrypted keys
 */
export function getProviderConfig(provider: PaymentProviderType): ProviderConfig | null {
  const config = paymentProvidersConfig[provider];
  if (!config) return null;
  
  return {
    ...config,
    apiKey: decrypt(config.apiKey),
    secretKey: config.secretKey ? decrypt(config.secretKey) : undefined
  };
}
