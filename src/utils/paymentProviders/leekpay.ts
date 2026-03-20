import { PaymentProvider, PaymentParams, PaymentResponse, PaymentStatusResponse } from './types';

/**
 * LeekPay payment provider implementation
 * Uses JavaScript SDK with popup/redirect flow
 */
export class LeekPayProvider implements PaymentProvider {
  name = 'LeekPay';
  private publicKey: string;
  private sdkUrl = 'https://leekpay.fr/js/leekpay.js';
  private sdkLoaded = false;

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
   * Load the LeekPay SDK script
   */
  private loadSDK(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Check if already loaded
      if (this.sdkLoaded || (window as any).LeekPay) {
        this.sdkLoaded = true;
        resolve();
        return;
      }

      // Check if script tag already exists
      const existingScript = document.querySelector(`script[src="${this.sdkUrl}"]`);
      if (existingScript) {
        // Wait for it to load
        existingScript.addEventListener('load', () => {
          this.sdkLoaded = true;
          resolve();
        });
        existingScript.addEventListener('error', reject);
        return;
      }

      // Create and append script
      const script = document.createElement('script');
      script.src = this.sdkUrl;
      script.async = true;
      
      script.onload = () => {
        this.sdkLoaded = true;
        resolve();
      };
      
      script.onerror = () => {
        reject(new Error('Failed to load LeekPay SDK'));
      };

      document.head.appendChild(script);
    });
  }

  /**
   * Initiate a payment with LeekPay using JavaScript SDK
   */
  async initiatePayment(params: PaymentParams): Promise<PaymentResponse> {
    try {
      if (!this.isConfigured()) {
        throw new Error('LeekPay public key is not configured');
      }

      // Load SDK if not already loaded
      await this.loadSDK();

      const LeekPay = (window as any).LeekPay;
      if (!LeekPay) {
        throw new Error('LeekPay SDK not available');
      }

      // Build success URL with payment info for callback handling
      const successUrlWithParams = new URL(params.successUrl);
      successUrlWithParams.searchParams.set('payment_provider', 'leekpay');
      successUrlWithParams.searchParams.set('order_id', params.orderId);

      return new Promise((resolve) => {
        // LeekPay accepts XOF, EUR, USD - convert XAF to XOF (1:1 equivalent)
        let currency = params.currency || 'XOF';
        if (currency === 'XAF') {
          currency = 'XOF';
        }
        
        // Validate and sanitize description (max 100 chars for LeekPay)
        let description = params.description || '';
        if (description.length > 100) {
          description = description.substring(0, 97) + '...';
        }
        
        // Ensure amount is a valid integer
        const amount = Math.round(params.amount);
        
        // Log for debugging
        console.log('[LeekPay] Checkout params:', {
          amount,
          currency,
          description,
          apiKey: this.publicKey ? 'set' : 'missing',
          customerEmail: params.customerEmail
        });
        
        // Launch checkout with callbacks directly in the checkout call
        LeekPay.checkout({
          amount: amount,
          currency: currency,
          apiKey: this.publicKey,
          description: description,
          customerEmail: params.customerEmail,
          
          onSuccess: (data: { status: string; amount: number; currency: string; payment_id: string }) => {
            // Redirect to success URL with payment data
            const redirectUrl = new URL(successUrlWithParams.toString());
            redirectUrl.searchParams.set('payment_id', data.payment_id);
            redirectUrl.searchParams.set('status', data.status);
            redirectUrl.searchParams.set('amount', data.amount.toString());
            redirectUrl.searchParams.set('currency', data.currency);
            
            window.location.href = redirectUrl.toString();
            
            resolve({
              success: true,
              gatewayId: data.payment_id
            });
          },
          
          onCancel: () => {
            // Redirect to failure URL
            const failureUrl = new URL(params.failureUrl);
            failureUrl.searchParams.set('payment_provider', 'leekpay');
            failureUrl.searchParams.set('status', 'cancelled');
            failureUrl.searchParams.set('order_id', params.orderId);
            
            window.location.href = failureUrl.toString();
            
            resolve({
              success: false,
              error: 'Payment cancelled by user'
            });
          }
        });
      });
    } catch (error) {
      console.error('LeekPay payment initiation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Parse payment callback from URL parameters
   * LeekPay redirects with: ?payment_id=xxx&status=success&amount=5000&currency=XOF
   */
  static parseCallback(url: string): { 
    status: 'success' | 'failed' | 'cancelled'; 
    paymentId?: string; 
    amount?: number;
    currency?: string;
    orderId?: string;
  } | null {
    try {
      const urlObj = new URL(url);
      const provider = urlObj.searchParams.get('payment_provider');
      
      if (provider !== 'leekpay') {
        return null;
      }

      const status = urlObj.searchParams.get('status');
      const paymentId = urlObj.searchParams.get('payment_id');
      const amount = urlObj.searchParams.get('amount');
      const currency = urlObj.searchParams.get('currency');
      const orderId = urlObj.searchParams.get('order_id');

      return {
        status: status === 'success' ? 'success' : status === 'cancelled' ? 'cancelled' : 'failed',
        paymentId: paymentId || undefined,
        amount: amount ? parseInt(amount, 10) : undefined,
        currency: currency || undefined,
        orderId: orderId || undefined
      };
    } catch (error) {
      console.error('Error parsing LeekPay callback:', error);
      return null;
    }
  }

  /**
   * Check payment status from current URL
   * To be called on the callback/success page
   */
  async checkPaymentStatus(orderId: string): Promise<PaymentStatusResponse> {
    try {
      // For LeekPay, we check the current URL parameters
      const callbackData = LeekPayProvider.parseCallback(window.location.href);
      
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
        transactionId: callbackData.paymentId
      };
    } catch (error) {
      console.error('LeekPay status check error:', error);
      return {
        orderId,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}
