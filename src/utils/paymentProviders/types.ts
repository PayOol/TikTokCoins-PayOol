/**
 * Common payment parameters interface
 */
export interface PaymentParams {
  amount: number;
  currency: string;
  description: string;
  orderId: string;
  customerName: string;
  customerEmail: string;
  successUrl: string;
  failureUrl: string;
  shopName?: string;
  message?: string;
}

/**
 * Payment provider response
 */
export interface PaymentResponse {
  success: boolean;
  paymentUrl?: string;
  gatewayId?: string;
  error?: string;
}

/**
 * Payment status response
 */
export interface PaymentStatusResponse {
  orderId: string;
  status: 'pending' | 'success' | 'failed' | 'cancelled';
  error?: string;
}

/**
 * Payment provider interface that all providers must implement
 */
export interface PaymentProvider {
  name: string;
  
  /**
   * Initialize a payment
   */
  initiatePayment(params: PaymentParams): Promise<PaymentResponse>;
  
  /**
   * Check payment status
   */
  checkPaymentStatus(orderId: string): Promise<PaymentStatusResponse>;
  
  /**
   * Validate provider configuration
   */
  isConfigured(): boolean;
}

/**
 * Payment provider types
 */
export enum PaymentProviderType {
  SOLEASPAY = 'soleaspay',
  LYGOSPAY = 'lygospay'
}
