import { PaymentProviderFactory, PaymentProviderType, PaymentParams, getDefaultProvider } from './paymentProviders';

// Re-export for convenience
export { PaymentProviderType, getDefaultProvider } from './paymentProviders';
export type { PaymentParams } from './paymentProviders';

/**
 * Legacy interface for backward compatibility with SoleasPay
 */
interface SoleasPayParams {
  amount: number;
  currency: string;
  description: string;
  orderId: string;
  service?: number;
  customerName: string;
  customerEmail: string;
  line?: string;
  successUrl: string;
  failureUrl: string;
}

/**
 * Initiates a payment using the specified provider or the default one
 * @param params Payment parameters
 * @param providerType Optional provider type (defaults to configured default)
 * @returns A promise that resolves with success status or rejects with error message
 */
export async function initiatePayment(
  params: PaymentParams,
  providerType?: PaymentProviderType
): Promise<boolean> {
  try {
    // Use specified provider or get default
    const provider = providerType || getDefaultProvider();
    
    // Create provider instance
    const paymentProvider = PaymentProviderFactory.createProvider(provider);
    
    // Initiate payment
    const response = await paymentProvider.initiatePayment(params);
    
    if (!response.success) {
      throw new Error(response.error || 'Payment initiation failed');
    }
    
    return true;
  } catch (error) {
    console.error('Payment initiation error:', error);
    throw error instanceof Error ? error.message : 'Unknown error occurred';
  }
}

/**
 * Legacy function for backward compatibility with existing SoleasPay integration
 * @deprecated Use initiatePayment instead
 */
export function initiateSoleasPayment(params: SoleasPayParams): Promise<boolean> {
  // Convert to new PaymentParams format
  const paymentParams: PaymentParams = {
    amount: params.amount,
    currency: params.currency,
    description: params.description,
    orderId: params.orderId,
    customerName: params.customerName,
    customerEmail: params.customerEmail,
    successUrl: params.successUrl,
    failureUrl: params.failureUrl,
    shopName: 'PayOol™'
  };
  
  // Use SoleasPay provider explicitly
  return initiatePayment(paymentParams, PaymentProviderType.SOLEASPAY);
}

/**
 * Check payment status for a given order
 * @param orderId Order ID to check
 * @param providerType Optional provider type (defaults to configured default)
 */
export async function checkPaymentStatus(
  orderId: string,
  providerType?: PaymentProviderType
) {
  try {
    const provider = providerType || getDefaultProvider();
    const paymentProvider = PaymentProviderFactory.createProvider(provider);
    
    return await paymentProvider.checkPaymentStatus(orderId);
  } catch (error) {
    console.error('Payment status check error:', error);
    throw error;
  }
}