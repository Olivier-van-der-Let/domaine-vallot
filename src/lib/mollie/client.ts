// Mollie payment service for wine e-commerce
// Updated to use latest @mollie/api-client patterns

import createMollieClient, { PaymentMethod, PaymentStatus, SequenceType } from '@mollie/api-client'

export interface MolliePaymentData {
  orderId: string
  amount: number // Amount in cents
  currency?: string
  description: string
  customerEmail: string
  customerName: string
  redirectUrl: string
  webhookUrl: string
  metadata?: Record<string, any>
  locale?: 'en_US' | 'fr_FR' | 'de_DE' | 'es_ES' | 'it_IT' | 'nl_NL'
  method?: PaymentMethod[]
}

export interface MolliePaymentMethod {
  id: string
  name: string
  minimumAmount?: number
  maximumAmount?: number
  image?: string
}

export interface MolliePayment {
  id: string
  status: MolliePaymentStatus
  amount: {
    value: string
    currency: string
  }
  description: string
  method?: string
  metadata?: Record<string, any>
  createdAt: string
  paidAt?: string
  canceledAt?: string
  expiredAt?: string
  failedAt?: string
  links: {
    checkout?: string
    self: string
  }
  orderId?: string
}

// Use official PaymentStatus enum from @mollie/api-client
export type MolliePaymentStatus = PaymentStatus

export interface MollieWebhookPayload {
  id: string
}

export interface MollieRefund {
  id: string
  amount: {
    value: string
    currency: string
  }
  status: 'queued' | 'pending' | 'processing' | 'refunded' | 'failed'
  description?: string
  paymentId: string
  createdAt: string
}

class MollieClient {
  private mollieClient: any
  private apiKey: string
  private isTestMode: boolean

  constructor() {
    this.apiKey = process.env.MOLLIE_API_KEY || ''
    this.isTestMode = this.apiKey.startsWith('test_')

    if (!this.apiKey) {
      throw new Error('MOLLIE_API_KEY environment variable is required')
    }

    // Use the official @mollie/api-client factory function
    this.mollieClient = createMollieClient({
      apiKey: this.apiKey,
    })
  }

  /**
   * Create a new payment using the official client
   */
  async createPayment(paymentData: MolliePaymentData): Promise<MolliePayment> {
    const payload = {
      amount: {
        currency: paymentData.currency || 'EUR',
        value: this.formatAmount(paymentData.amount, paymentData.currency || 'EUR')
      },
      description: paymentData.description,
      redirectUrl: paymentData.redirectUrl,
      webhookUrl: paymentData.webhookUrl,
      metadata: {
        orderId: paymentData.orderId,
        customerEmail: paymentData.customerEmail,
        ...paymentData.metadata
      },
      locale: paymentData.locale || 'en_US',
      method: paymentData.method || undefined
    }

    try {
      const payment = await this.mollieClient.payments.create(payload)
      return this.transformPayment(payment)
    } catch (error: any) {
      throw new MollieError(
        error.title || 'Payment creation failed',
        error.status || 500,
        error.detail || error.message || 'Unknown error',
        error
      )
    }
  }

  /**
   * Get payment details using the official client
   */
  async getPayment(paymentId: string): Promise<MolliePayment> {
    try {
      const payment = await this.mollieClient.payments.get(paymentId)
      return this.transformPayment(payment)
    } catch (error: any) {
      throw new MollieError(
        error.title || 'Payment fetch failed',
        error.status || 500,
        error.detail || error.message || 'Unknown error',
        error
      )
    }
  }

  /**
   * Cancel a payment using the official client
   */
  async cancelPayment(paymentId: string): Promise<MolliePayment> {
    try {
      const payment = await this.mollieClient.payments.cancel(paymentId)
      return this.transformPayment(payment)
    } catch (error: any) {
      throw new MollieError(
        error.title || 'Payment cancellation failed',
        error.status || 500,
        error.detail || error.message || 'Unknown error',
        error
      )
    }
  }

  /**
   * Create a refund
   */
  async createRefund(
    paymentId: string,
    amount?: number,
    description?: string,
    currency = 'EUR'
  ): Promise<MollieRefund> {
    const payload: any = {}

    if (amount) {
      payload.amount = {
        currency,
        value: this.formatAmount(amount, currency)
      }
    }

    if (description) {
      payload.description = description
    }

    const response = await this.makeRequest('POST', `/payments/${paymentId}/refunds`, payload)
    return response as MollieRefund
  }

  /**
   * Get available payment methods using the official client
   */
  async getPaymentMethods(
    amount?: number,
    currency = 'EUR',
    locale?: string
  ): Promise<MolliePaymentMethod[]> {
    try {
      const options: any = {}

      if (amount) {
        options.amount = {
          currency,
          value: this.formatAmount(amount, currency)
        }
      }

      if (locale) {
        options.locale = locale
      }

      const methodsResponse = await this.mollieClient.methods.list(options)
      return methodsResponse.map((method: any) => ({
        id: method.id,
        name: method.description,
        minimumAmount: method.minimumAmount ? parseFloat(method.minimumAmount.value) * 100 : undefined,
        maximumAmount: method.maximumAmount ? parseFloat(method.maximumAmount.value) * 100 : undefined,
        image: method.image?.size2x || method.image?.size1x
      }))
    } catch (error: any) {
      throw new MollieError(
        error.title || 'Payment methods fetch failed',
        error.status || 500,
        error.detail || error.message || 'Unknown error',
        error
      )
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(body: string, signature: string): boolean {
    // Mollie doesn't use webhook signatures by default
    // Instead, verify by making API call to get payment status
    // This is handled in the webhook verification method
    return true
  }

  /**
   * Verify webhook by fetching payment from Mollie
   */
  async verifyWebhook(paymentId: string): Promise<MolliePayment | null> {
    try {
      return await this.getPayment(paymentId)
    } catch (error) {
      console.error('Failed to verify webhook:', error)
      return null
    }
  }

  /**
   * Check if payment is successful (using official enum)
   */
  isPaymentSuccessful(status: MolliePaymentStatus): boolean {
    return status === PaymentStatus.paid || status === PaymentStatus.authorized
  }

  /**
   * Check if payment is pending (using official enum)
   */
  isPaymentPending(status: MolliePaymentStatus): boolean {
    return status === PaymentStatus.open || status === PaymentStatus.pending
  }

  /**
   * Check if payment failed (using official enum)
   */
  isPaymentFailed(status: MolliePaymentStatus): boolean {
    return status === PaymentStatus.failed ||
           status === PaymentStatus.canceled ||
           status === PaymentStatus.expired
  }

  /**
   * Get wine-appropriate payment methods (using official enum)
   * Excludes methods not suitable for alcohol sales
   */
  getWineCompatibleMethods(): PaymentMethod[] {
    return [
      PaymentMethod.ideal,          // iDEAL (Netherlands)
      PaymentMethod.creditcard,     // Credit card
      PaymentMethod.bancontact,     // Bancontact (Belgium)
      PaymentMethod.sofort,         // SOFORT Banking
      PaymentMethod.eps,            // EPS (Austria)
      PaymentMethod.giropay,        // Giropay (Germany)
      PaymentMethod.belfius,        // Belfius Pay Button (Belgium)
      PaymentMethod.paypal,         // PayPal
      PaymentMethod.applepay,       // Apple Pay
      PaymentMethod.przelewy24,     // Przelewy24 (Poland)
    ]
  }

  /**
   * Format amount for Mollie API (string with 2 decimals)
   */
  private formatAmount(amount: number, currency: string): string {
    // Amount is in cents, convert to decimal string
    const decimalAmount = amount / 100
    return decimalAmount.toFixed(2)
  }

  /**
   * Transform Mollie API response to our internal format
   */
  private transformPayment(payment: any): MolliePayment {
    return {
      id: payment.id,
      status: payment.status as MolliePaymentStatus,
      amount: {
        value: payment.amount.value,
        currency: payment.amount.currency
      },
      description: payment.description,
      method: payment.method,
      metadata: payment.metadata,
      createdAt: payment.createdAt,
      paidAt: payment.paidAt,
      canceledAt: payment.canceledAt,
      expiredAt: payment.expiredAt,
      failedAt: payment.failedAt,
      links: {
        checkout: payment.getCheckoutUrl?.() || payment._links?.checkout?.href,
        self: payment._links?.self?.href
      },
      orderId: payment.metadata?.orderId
    }
  }
}

export class MollieError extends Error {
  public status: number
  public detail: string
  public data?: any

  constructor(message: string, status: number, detail: string, data?: any) {
    super(message)
    this.name = 'MollieError'
    this.status = status
    this.detail = detail
    this.data = data
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      status: this.status,
      detail: this.detail,
      data: this.data,
    }
  }
}

// Export singleton instance
export const mollieClient = new MollieClient()

// Helper functions
export const createWinePayment = async (orderData: {
  orderId: string
  amount: number
  customerEmail: string
  customerName: string
  description?: string
  locale?: 'en_US' | 'fr_FR'
}): Promise<MolliePayment> => {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || (process.env.VERCEL_URL ? 'https://' + process.env.VERCEL_URL : 'http://localhost:3000')

  return mollieClient.createPayment({
    orderId: orderData.orderId,
    amount: orderData.amount,
    currency: 'EUR',
    description: orderData.description || `Wine order ${orderData.orderId}`,
    customerEmail: orderData.customerEmail,
    customerName: orderData.customerName,
    redirectUrl: `${baseUrl}/orders/${orderData.orderId}?payment=success`,
    webhookUrl: `${baseUrl}/api/webhooks/mollie`,
    locale: orderData.locale || 'en_US',
    method: mollieClient.getWineCompatibleMethods(),
    metadata: {
      orderType: 'wine',
      customerAge: 'verified' // Assume age verification completed
    }
  })
}

export const handlePaymentWebhook = async (paymentId: string) => {
  const payment = await mollieClient.verifyWebhook(paymentId)

  if (!payment) {
    throw new Error('Invalid payment webhook')
  }

  return {
    payment,
    isSuccessful: mollieClient.isPaymentSuccessful(payment.status),
    isPending: mollieClient.isPaymentPending(payment.status),
    isFailed: mollieClient.isPaymentFailed(payment.status),
  }
}

export const formatPaymentAmount = (amount: number, currency = 'EUR'): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
  }).format(amount / 100)
}

// Payment status helpers for UI
export const getPaymentStatusColor = (status: MolliePaymentStatus): string => {
  switch (status) {
    case PaymentStatus.paid:
    case PaymentStatus.authorized:
      return 'green'
    case PaymentStatus.open:
    case PaymentStatus.pending:
      return 'blue'
    case PaymentStatus.failed:
    case PaymentStatus.canceled:
    case PaymentStatus.expired:
      return 'red'
    default:
      return 'gray'
  }
}

export const getPaymentStatusLabel = (status: MolliePaymentStatus): string => {
  switch (status) {
    case PaymentStatus.open:
      return 'Awaiting payment'
    case PaymentStatus.paid:
      return 'Paid'
    case PaymentStatus.authorized:
      return 'Authorized'
    case PaymentStatus.pending:
      return 'Processing'
    case PaymentStatus.canceled:
      return 'Canceled'
    case PaymentStatus.expired:
      return 'Expired'
    case PaymentStatus.failed:
      return 'Failed'
    default:
      return 'Unknown'
  }
}