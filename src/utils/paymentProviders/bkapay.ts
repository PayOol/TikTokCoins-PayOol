import { PaymentProvider, PaymentParams, PaymentResponse, PaymentStatusResponse } from './types';

/**
 * BkaPay payment provider implementation
 * Uses simple redirect-based payment flow
 */
export class BkaPayProvider implements PaymentProvider {
  name = 'BkaPay';
  private publicKey: string;
  private baseUrl = 'https://bkapay.com/api-pay';

  constructor(publicKey: string) {
    this.publicKey = publicKey;
  }

  /**
   * Check if the provider is properly configured
   */
  isConfigured(): boolean {
    return !!this.publicKey && this.publicKey.length > 0;
  }

  /**
   * Initiate a payment with BkaPay
   * Redirects to BkaPay payment page
   */
  async initiatePayment(params: PaymentParams): Promise<PaymentResponse> {
    try {
      if (!this.isConfigured()) {
        throw new Error('BkaPay public key is not configured');
      }

      // Validate minimum amount (200)
      if (params.amount < 200) {
        throw new Error('Le montant minimum pour BkaPay est de 200');
      }

      // Build the payment URL with query parameters
      const queryParams = new URLSearchParams();
      queryParams.set('amount', params.amount.toString());
      
      if (params.description) {
        queryParams.set('description', params.description);
      }
      
      if (params.successUrl) {
        queryParams.set('callback', params.successUrl);
      }

      const paymentUrl = `${this.baseUrl}/${this.publicKey}?${queryParams.toString()}`;

      // Redirect to the payment page
      window.location.href = paymentUrl;

      return {
        success: true,
        paymentUrl: paymentUrl
      };
    } catch (error) {
      console.error('BkaPay payment initiation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Parse payment callback from URL parameters
   * BkaPay redirects to callback URL with: ?status=success&transactionId=xxx&amount=5000
   */
  static parseCallback(url: string): { status: 'success' | 'failed'; transactionId?: string; amount?: number } | null {
    try {
      const urlObj = new URL(url);
      const status = urlObj.searchParams.get('status');
      const transactionId = urlObj.searchParams.get('transactionId');
      const amount = urlObj.searchParams.get('amount');

      if (!status) {
        return null;
      }

      return {
        status: status === 'success' ? 'success' : 'failed',
        transactionId: transactionId || undefined,
        amount: amount ? parseInt(amount, 10) : undefined
      };
    } catch (error) {
      console.error('Error parsing BkaPay callback:', error);
      return null;
    }
  }

  /**
   * Check payment status from current URL
   * To be called on the callback/success page
   */
  async checkPaymentStatus(orderId: string): Promise<PaymentStatusResponse> {
    try {
      // For BkaPay, we check the current URL parameters
      const callbackData = BkaPayProvider.parseCallback(window.location.href);
      
      if (!callbackData) {
        return {
          orderId,
          status: 'pending',
          error: 'No callback data found in URL'
        };
      }

      return {
        orderId,
        status: callbackData.status,
        transactionId: callbackData.transactionId
      };
    } catch (error) {
      console.error('BkaPay status check error:', error);
      return {
        orderId,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}
