import { PaymentProvider, PaymentProviderType } from './types';
import { SoleasPayProvider } from './soleaspay';
import { LygosPayProvider } from './lygospay';
import { getProviderConfig } from './config';

/**
 * Factory class to create payment provider instances
 */
export class PaymentProviderFactory {
  /**
   * Create a payment provider instance
   */
  static createProvider(type: PaymentProviderType): PaymentProvider {
    const config = getProviderConfig(type);
    
    if (!config) {
      throw new Error(`Payment provider ${type} is not configured`);
    }

    if (!config.enabled) {
      throw new Error(`Payment provider ${type} is not enabled`);
    }

    switch (type) {
      case PaymentProviderType.SOLEASPAY:
        return new SoleasPayProvider(config.apiKey);
      
      case PaymentProviderType.LYGOSPAY:
        return new LygosPayProvider(config.apiKey);
      
      default:
        throw new Error(`Unknown payment provider type: ${type}`);
    }
  }

  /**
   * Get all available provider instances
   */
  static getAllProviders(): Map<PaymentProviderType, PaymentProvider> {
    const providers = new Map<PaymentProviderType, PaymentProvider>();
    
    Object.values(PaymentProviderType).forEach(type => {
      try {
        const provider = this.createProvider(type);
        if (provider.isConfigured()) {
          providers.set(type, provider);
        }
      } catch (error) {
        // Provider not available, skip it
        console.warn(`Provider ${type} not available:`, error);
      }
    });
    
    return providers;
  }
}
