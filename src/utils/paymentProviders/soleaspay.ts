import { PaymentProvider, PaymentParams, PaymentResponse, PaymentStatusResponse } from './types';

/**
 * SoleasPay-specific parameters
 */
interface SoleasPayParams extends PaymentParams {
  service?: number;
  line?: string;
}

/**
 * SoleasPay payment provider implementation
 */
export class SoleasPayProvider implements PaymentProvider {
  name = 'SoleasPay';
  private apiKey: string;
  private checkoutUrl = 'https://checkout.soleaspay.com';

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
   * Initiate a payment with SoleasPay using form submission
   */
  async initiatePayment(params: PaymentParams): Promise<PaymentResponse> {
    return new Promise((resolve, reject) => {
      try {
        if (!this.isConfigured()) {
          reject(new Error('SoleasPay API key is not configured'));
          return;
        }

        // Validate field lengths according to SoleasPay requirements
        if (params.description.length > 50) {
          reject(new Error('description : Cette chaîne est trop longue. Elle doit avoir au maximum 50 caractères.'));
          return;
        }
        
        if (params.orderId.length > 32) {
          reject(new Error('orderId : Cette chaîne est trop longue. Elle doit avoir au maximum 32 caractères.'));
          return;
        }

        // Create a form dynamically
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = this.checkoutUrl;

        // Add required fields
        const fields: Record<string, string | number> = {
          amount: params.amount,
          currency: params.currency || 'XAF',
          description: params.description,
          orderId: params.orderId,
          apiKey: this.apiKey,
          shopName: params.shopName || 'PayOolTM',
          successUrl: params.successUrl,
          failureUrl: params.failureUrl
        };

        // Add optional fields if provided (SoleasPay specific)
        const soleasParams = params as SoleasPayParams;
        if (soleasParams.service) {
          fields.service = soleasParams.service;
        }

        if (soleasParams.line) {
          fields.line = soleasParams.line;
        }

        // Create form fields
        Object.entries(fields).forEach(([key, value]) => {
          const input = document.createElement('input');
          input.type = ['apiKey', 'shopName'].includes(key) ? 'hidden' : 'text';
          input.name = key;
          input.value = String(value);
          form.appendChild(input);
        });

        // Add customer information
        const customerNameInput = document.createElement('input');
        customerNameInput.type = 'text';
        customerNameInput.name = 'customer[name]';
        customerNameInput.value = params.customerName;
        form.appendChild(customerNameInput);

        const customerEmailInput = document.createElement('input');
        customerEmailInput.type = 'text';
        customerEmailInput.name = 'customer[email]';
        customerEmailInput.value = params.customerEmail;
        form.appendChild(customerEmailInput);

        // Add form to document and submit
        document.body.appendChild(form);
        
        // Submit the form (this will redirect the page)
        form.submit();
        
        // Resolve immediately as the redirect will happen
        resolve({
          success: true,
          paymentUrl: this.checkoutUrl
        });
        
        // Don't remove the form to avoid interfering with submission
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Check payment status (SoleasPay doesn't provide a direct API for this)
   * This would need to be implemented based on SoleasPay's webhook or callback mechanism
   */
  async checkPaymentStatus(orderId: string): Promise<PaymentStatusResponse> {
    // SoleasPay doesn't provide a direct status check API
    // Status is typically handled through success/failure URL callbacks
    console.warn('SoleasPay does not provide a direct status check API');
    
    return {
      orderId,
      status: 'pending',
      error: 'Status check not available for SoleasPay'
    };
  }
}
