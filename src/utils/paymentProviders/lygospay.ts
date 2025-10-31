import { PaymentProvider, PaymentParams, PaymentResponse, PaymentStatusResponse } from './types';

/**
 * LygosPay payment provider implementation
 */
export class LygosPayProvider implements PaymentProvider {
  name = 'LygosPay';
  private apiKey: string;
  private baseUrl = 'https://api.lygosapp.com/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Check if the provider is properly configured
   */
  isConfigured(): boolean {
    return !!this.apiKey && this.apiKey.length > 0;
  }

  /**
   * Initiate a payment with LygosPay
   */
  async initiatePayment(params: PaymentParams): Promise<PaymentResponse> {
    try {
      if (!this.isConfigured()) {
        throw new Error('LygosPay API key is not configured');
      }

      // Create gateway using LygosPay API
      const response = await fetch(`${this.baseUrl}/gateway`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': this.apiKey
        },
        body: JSON.stringify({
          amount: params.amount,
          shop_name: params.shopName || 'PayOol™',
          order_id: params.orderId,
          message: params.message || params.description,
          success_url: params.successUrl,
          failure_url: params.failureUrl
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // LygosPay returns a payment link that we need to redirect to
      if (data.link) {
        // Redirect to the payment page
        window.location.href = data.link;
        
        return {
          success: true,
          paymentUrl: data.link,
          gatewayId: data.id
        };
      } else {
        throw new Error('No payment link received from LygosPay');
      }
    } catch (error) {
      console.error('LygosPay payment initiation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Check the status of a payment
   */
  async checkPaymentStatus(orderId: string): Promise<PaymentStatusResponse> {
    try {
      if (!this.isConfigured()) {
        throw new Error('LygosPay API key is not configured');
      }

      const response = await fetch(`${this.baseUrl}/gateway/payin/${orderId}`, {
        method: 'GET',
        headers: {
          'api-key': this.apiKey
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Map LygosPay status to our internal status
      let status: 'pending' | 'success' | 'failed' | 'cancelled' = 'pending';
      
      if (data.status) {
        const lygosStatus = data.status.toLowerCase();
        if (lygosStatus.includes('success') || lygosStatus.includes('completed') || lygosStatus.includes('paid')) {
          status = 'success';
        } else if (lygosStatus.includes('fail') || lygosStatus.includes('error')) {
          status = 'failed';
        } else if (lygosStatus.includes('cancel')) {
          status = 'cancelled';
        }
      }

      return {
        orderId: data.order_id || orderId,
        status
      };
    } catch (error) {
      console.error('LygosPay status check error:', error);
      return {
        orderId,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}
