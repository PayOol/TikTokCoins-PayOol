import { PaymentProviderType } from './types';

/**
 * Payment provider configuration
 */
export interface ProviderConfig {
  type: PaymentProviderType;
  apiKey: string;
  enabled: boolean;
}

/**
 * Configuration for all payment providers
 */
export const paymentProvidersConfig: Record<PaymentProviderType, ProviderConfig> = {
  [PaymentProviderType.BKAPAY]: {
    type: PaymentProviderType.BKAPAY,
    apiKey: 'pk_live_0ce8acd1-ee69-4787-993e-180668077821',
    enabled: true // Premier dans la liste = Recommande par defaut
  },
  [PaymentProviderType.SOLEASPAY]: {
    type: PaymentProviderType.SOLEASPAY,
    apiKey: 'D9flUR0hr0HZF63QKtO2g2-CqQGebos04R-bPRf63K8-AP',
    enabled: true
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
