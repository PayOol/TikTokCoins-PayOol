import { PaymentProvider, PaymentParams, PaymentResponse, PaymentStatusResponse } from './types';

type LeekPayInternalStatus = PaymentStatusResponse['status'];

interface LeekPayCheckoutResponse {
  success?: boolean;
  paymentUrl?: string;
  checkoutId?: string;
  status?: string;
  amount?: number;
  currency?: string;
  error?: string;
  message?: string;
}

const LEEKPAY_SUPPORTED_CURRENCIES = ['XOF', 'EUR', 'USD'] as const;
type LeekPayCurrency = typeof LEEKPAY_SUPPORTED_CURRENCIES[number];

/**
 * LeekPay payment provider implementation.
 * Uses REST checkout through the Cloudflare Worker, then redirects to LeekPay's hosted page.
 */
export class LeekPayProvider implements PaymentProvider {
  name = 'LeekPay';
  private publicKey: string;
  private proxyUrl: string;

  constructor(publicKey: string, proxyUrl = '') {
    this.publicKey = publicKey;
    this.proxyUrl = proxyUrl.replace(/\/$/, '');
  }

  /**
   * Check if the provider is properly configured.
   */
  isConfigured(): boolean {
    return !!this.proxyUrl;
  }

  private static normalizeCurrency(currency: string): LeekPayCurrency {
    const normalizedCurrency = currency.toUpperCase() === 'XAF'
      ? 'XOF'
      : currency.toUpperCase();

    if (!LEEKPAY_SUPPORTED_CURRENCIES.includes(normalizedCurrency as LeekPayCurrency)) {
      throw new Error(`LeekPay does not support currency ${currency}`);
    }

    return normalizedCurrency as LeekPayCurrency;
  }

  private static normalizeAmount(amount: number): number {
    const roundedAmount = Math.round(amount);

    if (!Number.isFinite(roundedAmount) || roundedAmount <= 0) {
      throw new Error('LeekPay amount must be a positive number');
    }

    return roundedAmount;
  }

  private static sanitizeDescription(description: string): string {
    const trimmedDescription = description.trim();

    if (trimmedDescription.length <= 500) {
      return trimmedDescription;
    }

    return `${trimmedDescription.substring(0, 497)}...`;
  }

  private static normalizeStatus(
    status: string | null | undefined,
    fallback: LeekPayInternalStatus = 'pending'
  ): LeekPayInternalStatus {
    if (!status) {
      return fallback;
    }

    const normalizedStatus = status.toLowerCase();

    if (['success', 'completed', 'paid', 'successful', 'approved'].includes(normalizedStatus)) {
      return 'success';
    }

    if (['cancelled', 'canceled'].includes(normalizedStatus)) {
      return 'cancelled';
    }

    if (['failed', 'failure', 'declined', 'rejected', 'expired', 'error'].includes(normalizedStatus)) {
      return 'failed';
    }

    if (['pending', 'processing'].includes(normalizedStatus)) {
      return 'pending';
    }

    return fallback;
  }

  private buildSuccessUrl(params: PaymentParams, amount: number, currency: LeekPayCurrency): string {
    const successUrl = new URL(params.successUrl);
    successUrl.searchParams.set('payment_provider', 'leekpay');
    successUrl.searchParams.set('order_id', params.orderId);
    successUrl.searchParams.set('status', 'success');
    successUrl.searchParams.set('paid_amount', amount.toString());
    successUrl.searchParams.set('currency', currency);

    return successUrl.toString();
  }

  private buildCancelUrl(params: PaymentParams): string {
    const cancelUrl = new URL(params.failureUrl);
    cancelUrl.searchParams.set('payment_provider', 'leekpay');
    cancelUrl.searchParams.set('order_id', params.orderId);
    cancelUrl.searchParams.set('status', 'cancelled');
    cancelUrl.searchParams.set('error', 'Payment cancelled by user');

    return cancelUrl.toString();
  }

  /**
   * Initiate a LeekPay hosted checkout and redirect the customer to it.
   */
  async initiatePayment(params: PaymentParams): Promise<PaymentResponse> {
    try {
      if (!this.isConfigured()) {
        throw new Error('LeekPay proxy URL is not configured');
      }

      const currency = LeekPayProvider.normalizeCurrency(params.currency || 'XOF');
      const description = LeekPayProvider.sanitizeDescription(params.description || '');
      const amount = LeekPayProvider.normalizeAmount(params.amount);
      const returnUrl = this.buildSuccessUrl(params, amount, currency);
      const cancelUrl = this.buildCancelUrl(params);

      console.log('[LeekPay] Creating hosted checkout:', {
        amount,
        currency,
        description,
        proxyUrl: this.proxyUrl,
        publicKey: this.publicKey ? 'set' : 'missing',
        customerEmail: params.customerEmail
      });

      const response = await fetch(`${this.proxyUrl}/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount,
          currency,
          description,
          returnUrl,
          cancelUrl,
          customerEmail: params.customerEmail,
          metadata: {
            orderId: params.orderId,
            provider: 'leekpay',
            shopName: params.shopName || 'PayOol'
          }
        })
      });

      const checkout = await response.json().catch(() => null) as LeekPayCheckoutResponse | null;

      if (!response.ok || !checkout?.success || !checkout.paymentUrl) {
        throw new Error(
          checkout?.error
          || checkout?.message
          || `LeekPay checkout creation failed (${response.status})`
        );
      }

      window.setTimeout(() => {
        window.location.href = checkout.paymentUrl as string;
      }, 0);

      return {
        success: true,
        paymentUrl: checkout.paymentUrl,
        gatewayId: checkout.checkoutId
      };
    } catch (error) {
      console.error('LeekPay payment initiation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Parse the internal LeekPay callback URL.
   */
  static parseCallback(url: string): {
    status: LeekPayInternalStatus;
    paymentId?: string;
    amount?: number;
    currency?: string;
    orderId?: string;
    rawStatus?: string;
  } | null {
    try {
      const urlObj = new URL(url);
      const provider = urlObj.searchParams.get('payment_provider');

      if (provider && provider !== 'leekpay') {
        return null;
      }

      const status = urlObj.searchParams.get('status');
      const rawStatus = urlObj.searchParams.get('leekpay_status') || status;
      const paymentId = urlObj.searchParams.get('payment_id')
        || urlObj.searchParams.get('paymentId')
        || urlObj.searchParams.get('checkout_id')
        || urlObj.searchParams.get('checkoutId');
      const paidAmount = urlObj.searchParams.get('paid_amount') || urlObj.searchParams.get('amount');
      const currency = urlObj.searchParams.get('currency');
      const orderId = urlObj.searchParams.get('order_id') || urlObj.searchParams.get('orderId');

      if (!provider && !status && !rawStatus && !paymentId) {
        return null;
      }

      return {
        status: LeekPayProvider.normalizeStatus(status || rawStatus, paymentId ? 'success' : 'pending'),
        paymentId: paymentId || undefined,
        amount: paidAmount ? parseInt(paidAmount, 10) : undefined,
        currency: currency || undefined,
        orderId: orderId || undefined,
        rawStatus: rawStatus || undefined
      };
    } catch (error) {
      console.error('Error parsing LeekPay callback:', error);
      return null;
    }
  }

  /**
   * Check payment status from the current callback URL.
   */
  async checkPaymentStatus(orderId: string): Promise<PaymentStatusResponse> {
    try {
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
