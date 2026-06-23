import { PaymentProvider, PaymentParams, PaymentResponse, PaymentStatusResponse } from './types';
import { getProviderConfig } from './config';

/**
 * AfribaPay payment provider implementation
 * Uses proxy-based integration to secure credentials and handle payment session creation
 */
export class AfribaPayProvider implements PaymentProvider {
  name = 'AfribaPay';
  private proxyUrl: string;

  constructor() {
    const config = getProviderConfig('afribapay' as any);
    this.proxyUrl = config?.proxyUrl || '';
  }

  /**
   * Check if the provider is properly configured
   */
  isConfigured(): boolean {
    return !!this.proxyUrl && this.proxyUrl.length > 0;
  }

  private wait(ms: number): Promise<void> {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
  }

  private buildFailureUrl(params: PaymentParams, error: string) {
    const failureUrl = new URL(params.failureUrl);
    failureUrl.searchParams.set('payment_provider', 'afribapay');
    failureUrl.searchParams.set('status', 'failed');
    failureUrl.searchParams.set('order_id', params.orderId);
    failureUrl.searchParams.set('error', error);
    return failureUrl.toString();
  }

  private async waitForFinalStatus(params: PaymentParams, transactionId?: string): Promise<PaymentResponse> {
    const statusReference = params.orderId || transactionId;
    if (!statusReference) {
      return { success: false, error: 'Identifiant de transaction manquant' };
    }

    const maxAttempts = 45; // ~4.5 minutes
    const pollInterval = 6000;

    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      await this.wait(pollInterval);

      const statusResponse = await this.checkPaymentStatus(statusReference);

      if (statusResponse.status === 'success') {
        window.location.href = params.successUrl;
        return {
          success: true,
          gatewayId: statusResponse.transactionId || transactionId
        };
      }

      if (statusResponse.status === 'failed' || statusResponse.status === 'cancelled') {
        const error = statusResponse.error || 'Le paiement AfribaPay a été rejeté ou annulé.';
        window.location.href = this.buildFailureUrl(params, error);
        return {
          success: false,
          gatewayId: statusResponse.transactionId || transactionId,
          error
        };
      }
    }

    return {
      success: false,
      gatewayId: transactionId,
      error: 'Le paiement AfribaPay est toujours en attente. Veuillez valider la transaction sur votre téléphone.'
    };
  }

  /**
   * Initiate a payment with AfribaPay
   * Calls the proxy to create a session, then redirects the user or polls for USSD push
   */
  async initiatePayment(params: PaymentParams): Promise<PaymentResponse> {
    try {
      if (!this.isConfigured()) {
        throw new Error('Le proxy AfribaPay n\'est pas configuré');
      }

      if (!params.sebPay) {
        throw new Error('Les informations Mobile Money (téléphone, opérateur) sont requises pour AfribaPay');
      }

      const phone = params.sebPay.phone.replace(/\D/g, '');
      if (!phone) {
        throw new Error('Le numéro de téléphone est requis');
      }

      // Prepare request payload for proxy
      const body = {
        amount: Math.round(params.sebPay.amount || params.amount),
        currency: params.sebPay.currency || params.currency || 'XOF',
        description: params.description || 'Achat de pièces TikTok',
        orderId: params.orderId,
        customerName: params.customerName,
        customerEmail: params.customerEmail,
        successUrl: params.successUrl,
        failureUrl: params.failureUrl,
        phone,
        operator: params.sebPay.operator,
        country: params.sebPay.country,
        otpCode: params.sebPay.otpCode
      };

      // Call the secure proxy to initiate the session
      const response = await fetch(`${this.proxyUrl}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        let errMsg = `Erreur d'initiation AfribaPay (${response.status})`;
        if (errData) {
          if (typeof errData.error === 'string') {
            errMsg = errData.error;
          } else if (errData.error && typeof errData.error === 'object') {
            errMsg = errData.error.message || errData.error.status || JSON.stringify(errData.error);
          } else if (errData.message) {
            errMsg = errData.message;
          }
        }
        throw new Error(errMsg);
      }

      const result = await response.json();

      if (!result.success) {
        let errMsg = 'Aucune réponse valide renvoyée par AfribaPay';
        if (typeof result.error === 'string') {
          errMsg = result.error;
        } else if (result.error && typeof result.error === 'object') {
          errMsg = result.error.message || result.error.status || JSON.stringify(result.error);
        } else if (result.message) {
          errMsg = result.message;
        }
        throw new Error(errMsg);
      }

      // If a checkout/provider redirect URL is returned (e.g. Wave), open it
      if (result.paymentUrl) {
        window.open(result.paymentUrl, '_blank', 'noopener,noreferrer');
      }

      // Start waiting/polling for the transaction status (especially for USSD Push prompts)
      return await this.waitForFinalStatus(params, result.transactionId);
    } catch (error) {
      console.error('AfribaPay payment initiation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Une erreur inconnue est survenue'
      };
    }
  }

  /**
   * Parse payment callback parameters from redirect URL
   */
  static parseCallback(url: string): { status: 'success' | 'failed' | 'cancelled'; orderId?: string; transactionId?: string } | null {
    try {
      const urlObj = new URL(url);
      const provider = urlObj.searchParams.get('payment_provider');

      if (provider !== 'afribapay') {
        return null;
      }

      const status = urlObj.searchParams.get('status');
      const orderId = urlObj.searchParams.get('order_id');
      const transactionId = urlObj.searchParams.get('transactionId');

      return {
        status: status === 'success' ? 'success' : status === 'cancelled' ? 'cancelled' : 'failed',
        orderId: orderId || undefined,
        transactionId: transactionId || undefined
      };
    } catch (error) {
      console.error('Error parsing AfribaPay callback:', error);
      return null;
    }
  }

  /**
   * Check payment status by calling the proxy
   */
  async checkPaymentStatus(orderId: string): Promise<PaymentStatusResponse> {
    try {
      if (!this.isConfigured()) {
        throw new Error('Le proxy AfribaPay n\'est pas configuré');
      }

      // First check local URL parameters (quick fallback)
      const callbackData = AfribaPayProvider.parseCallback(window.location.href);
      if (callbackData && callbackData.orderId === orderId) {
        return {
          orderId,
          status: callbackData.status,
          transactionId: callbackData.transactionId
        };
      }

      // Query the proxy server-to-server check
      const response = await fetch(`${this.proxyUrl}/payments/${encodeURIComponent(orderId)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Erreur vérification statut (${response.status})`);
      }

      const result = await response.json();

      return {
        orderId,
        status: result.status || 'pending',
        transactionId: result.transactionId
      };
    } catch (error) {
      console.error('AfribaPay status check error:', error);
      return {
        orderId,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Erreur inconnue de statut'
      };
    }
  }
}
