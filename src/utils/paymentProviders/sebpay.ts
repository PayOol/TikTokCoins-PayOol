import { PaymentProvider, PaymentParams, PaymentResponse, PaymentStatusResponse } from './types';
import { getProviderConfig } from './config';

interface SebPayApiEnvelope<T> {
  success?: boolean;
  data?: T;
  message?: string;
  error?: string | { message?: string; code?: number };
  errors?: Record<string, string[] | string>;
}

interface SebPayCollection {
  transaction_id?: string;
  external_reference?: string;
  status?: 'pending' | 'approved' | 'rejected' | string;
  amount?: number;
  currency?: string;
  provider_link?: string;
  message?: string;
}

const SEBPAY_STATUS_POLL_INTERVAL_MS = 5000;
const SEBPAY_STATUS_MAX_ATTEMPTS = 60;

const getSebPayErrorMessage = (error: unknown) => {
  if (error instanceof TypeError && error.message === 'Failed to fetch') {
    return 'SebPay bloque les appels directs depuis le navigateur. Utilisez un proxy/backend pour cet appel.';
  }

  return error instanceof Error ? error.message : 'Unknown error occurred';
};

const formatSebPayApiError = (
  payload: SebPayApiEnvelope<SebPayCollection> | null,
  collection: SebPayCollection | null,
  status: number
) => {
  const nestedError = typeof payload?.error === 'string'
    ? payload.error
    : payload?.error?.message;
  const fieldErrors = payload?.errors
    ? Object.entries(payload.errors)
        .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
        .join(' | ')
    : '';
  const parsedMessageError = payload?.message?.match(/"message"\s*:\s*"([^"]+)"/)?.[1];

  return nestedError || fieldErrors || parsedMessageError || payload?.message || collection?.message || `Erreur SebPay (${status})`;
};

/**
 * SebPay payment provider implementation.
 * SebPay requires phone, operator, country and merchant API keys.
 */
export class SebPayProvider implements PaymentProvider {
  name = 'SebPay';
  private proxyUrl: string;

  constructor() {
    const config = getProviderConfig('sebpay' as any);
    this.proxyUrl = config?.proxyUrl || '';
  }

  isConfigured(): boolean {
    return !!this.proxyUrl;
  }

  private buildHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json'
    };
  }

  private mapStatus(status?: string): PaymentStatusResponse['status'] {
    switch (status) {
      case 'approved':
      case 'success':
        return 'success';
      case 'rejected':
      case 'failed':
        return 'failed';
      case 'cancelled':
        return 'cancelled';
      default:
        return 'pending';
    }
  }

  private wait(ms: number): Promise<void> {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
  }

  private buildFailureUrl(params: PaymentParams, error: string) {
    const failureUrl = new URL(params.failureUrl);
    failureUrl.searchParams.set('payment_provider', 'sebpay');
    failureUrl.searchParams.set('status', 'failed');
    failureUrl.searchParams.set('order_id', params.orderId);
    failureUrl.searchParams.set('error', error);
    return failureUrl.toString();
  }

  private async waitForFinalStatus(params: PaymentParams, transactionId?: string): Promise<PaymentResponse> {
    const statusReference = transactionId || params.orderId;

    for (let attempt = 0; attempt < SEBPAY_STATUS_MAX_ATTEMPTS; attempt += 1) {
      await this.wait(SEBPAY_STATUS_POLL_INTERVAL_MS);

      const statusResponse = await this.checkPaymentStatus(statusReference);

      if (statusResponse.status === 'success') {
        window.location.href = params.successUrl;
        return {
          success: true,
          gatewayId: statusResponse.transactionId || transactionId
        };
      }

      if (statusResponse.status === 'failed' || statusResponse.status === 'cancelled') {
        const error = statusResponse.error || 'Le paiement SebPay a ete rejete ou annule.';
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
      error: 'Le paiement SebPay est toujours en attente. Veuillez verifier votre telephone ou reessayer.'
    };
  }

  async initiatePayment(params: PaymentParams): Promise<PaymentResponse> {
    try {
      if (!this.isConfigured()) {
        throw new Error('Les cles API SebPay ne sont pas configurees');
      }

      if (!params.sebPay) {
        throw new Error('Les informations SebPay sont requises');
      }

      const phone = params.sebPay.phone.replace(/\D/g, '');
      if (!phone) {
        throw new Error('Le numero de telephone SebPay est requis');
      }

      const body = {
        amount: Math.round(params.sebPay.amount || params.amount),
        currency: params.sebPay.currency || params.currency || 'XOF',
        phone,
        operator: params.sebPay.operator,
        country: params.sebPay.country,
        external_reference: params.orderId,
        callback_url: params.sebPay.callbackUrl || params.successUrl
      };

      const response = await fetch(`${this.proxyUrl}/collections`, {
        method: 'POST',
        headers: this.buildHeaders(),
        body: JSON.stringify(body)
      });

      const payload = await response.json().catch(() => null) as SebPayApiEnvelope<SebPayCollection> | null;
      const collection = payload?.data || (payload as SebPayCollection | null);

      if (!response.ok || payload?.success === false) {
        throw new Error(formatSebPayApiError(payload, collection, response.status));
      }

      if (collection?.provider_link) {
        window.open(collection.provider_link, '_blank', 'noopener,noreferrer');
      }

      return await this.waitForFinalStatus(params, collection?.transaction_id);
    } catch (error) {
      console.error('SebPay payment initiation error:', error);
      return {
        success: false,
        error: getSebPayErrorMessage(error)
      };
    }
  }

  async checkPaymentStatus(orderId: string): Promise<PaymentStatusResponse> {
    try {
      if (!this.isConfigured()) {
        throw new Error('Les cles API SebPay ne sont pas configurees');
      }

      const response = await fetch(`${this.proxyUrl}/collections/${encodeURIComponent(orderId)}`, {
        method: 'GET',
        headers: this.buildHeaders()
      });

      const payload = await response.json().catch(() => null) as SebPayApiEnvelope<SebPayCollection> | null;
      const collection = payload?.data || (payload as SebPayCollection | null);

      if (!response.ok || payload?.success === false) {
        throw new Error(formatSebPayApiError(payload, collection, response.status));
      }

      return {
        orderId: collection?.external_reference || orderId,
        status: this.mapStatus(collection?.status),
        transactionId: collection?.transaction_id
      };
    } catch (error) {
      console.error('SebPay status check error:', error);
      return {
        orderId,
        status: 'failed',
        error: getSebPayErrorMessage(error)
      };
    }
  }
}
