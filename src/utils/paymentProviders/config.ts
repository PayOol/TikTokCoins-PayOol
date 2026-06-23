import { PaymentProviderType } from './types';

/**
 * Payment provider configuration
 */
export interface ProviderConfig {
  type: PaymentProviderType;
  apiKey: string;
  secretKey?: string;
  enabled: boolean;
  recommended?: boolean; // Indique si ce provider est recommandé
  proxyUrl?: string; // URL du proxy pour les providers qui en ont besoin
}

/**
 * Configuration for all payment providers
 */
export const paymentProvidersConfig: Record<PaymentProviderType, ProviderConfig> = {
  [PaymentProviderType.AFRIBAPAY]: {
    type: PaymentProviderType.AFRIBAPAY,
    apiKey: '', // Les identifiants seront stockés dans le proxy Cloudflare Worker
    enabled: true, // Activé pour affichage dans la liste
    recommended: true, // Provider recommandé
    proxyUrl: 'https://sebpay-proxy.sebpay-proxy.workers.dev/api/afribapay'
  },
  [PaymentProviderType.SEBPAY]: {
    type: PaymentProviderType.SEBPAY,
    apiKey: '', // Credentials now in Cloudflare Worker proxy
    secretKey: '', // Credentials now in Cloudflare Worker proxy
    enabled: true,
    recommended: false, 
    proxyUrl: 'https://sebpay-proxy.sebpay-proxy.workers.dev/api/sebpay'
  },
  [PaymentProviderType.SOLEASPAY]: {
    type: PaymentProviderType.SOLEASPAY,
    apiKey: 'D9flUR0hr0HZF63QKtO2g2-CqQGebos04R-bPRf63K8-AP',
    enabled: false // Désactivé
  },
  [PaymentProviderType.LEEKPAY]: {
    type: PaymentProviderType.LEEKPAY,
    apiKey: 'pk_live_OlibyiLyNNrzsQjujN6Txhn7Eieorz9Q', // Remplacer par votre clé publique LeekPay
    enabled: false, // Masqué
    recommended: false
  },
  [PaymentProviderType.BKAPAY]: {
    type: PaymentProviderType.BKAPAY,
    apiKey: 'pk_live_0ce8acd1-ee69-4787-993e-180668077821',
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
 * Get provider configuration
 */
export function getProviderConfig(provider: PaymentProviderType): ProviderConfig | null {
  return paymentProvidersConfig[provider] || null;
}
