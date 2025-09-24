// Mollie payment service for wine e-commerce

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
  method?: MolliePaymentMethod[]
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

export type MolliePaymentStatus =
  | 'open'
  | 'canceled'
  | 'pending'
  | 'authorized'
  | 'expired'
  | 'failed'
  | 'paid'

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
  private apiKey: string
  private baseUrl: string
  private isTestMode: boolean

  constructor() {
    this.apiKey = process.env.MOLLIE_API_KEY || ''
    this.isTestMode = this.apiKey.startsWith('test_')
    this.baseUrl = 'https://api.mollie.com/v2'

    if (!this.apiKey) {
      throw new Error('MOLLIE_API_KEY environment variable is required')
    }
  }

  /**
   * Create a new payment
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
      method: paymentData.method?.map(m => m.id)
    }

    const response = await this.makeRequest('POST', '/payments', payload)
    return response as MolliePayment
  }

  /**
   * Get payment details
   */
  async getPayment(paymentId: string): Promise<MolliePayment> {
    const response = await this.makeRequest('GET', `/payments/${paymentId}`)
    return response as MolliePayment
  }

  /**
   * Cancel a payment
   */
  async cancelPayment(paymentId: string): Promise<MolliePayment> {
    const response = await this.makeRequest('DELETE', `/payments/${paymentId}`)
    return response as MolliePayment
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
   * Get available payment methods for amount and locale
   */
  async getPaymentMethods(
    amount?: number,
    currency = 'EUR',
    locale?: string
  ): Promise<MolliePaymentMethod[]> {
    let url = '/methods'
    const params = new URLSearchParams()

    if (amount) {
      params.append('amount[currency]', currency)
      params.append('amount[value]', this.formatAmount(amount, currency))
    }

    if (locale) {
      params.append('locale', locale)
    }

    if (params.toString()) {
      url += `?${params.toString()}`
    }

    const response = await this.makeRequest('GET', url)
    return response._embedded?.methods || []
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
   * Check if payment is successful
   */
  isPaymentSuccessful(status: MolliePaymentStatus): boolean {
    return status === 'paid' || status === 'authorized'
  }

  /**
   * Check if payment is pending
   */
  isPaymentPending(status: MolliePaymentStatus): boolean {
    return status === 'open' || status === 'pending'
  }

  /**
   * Check if payment failed
   */
  isPaymentFailed(status: MolliePaymentStatus): boolean {
    return status === 'failed' || status === 'canceled' || status === 'expired'
  }

  /**
   * Get wine-appropriate payment methods
   * Excludes methods not suitable for alcohol sales
   */
  getWineCompatibleMethods(): string[] {
    return [
      'ideal',          // iDEAL (Netherlands)
      'creditcard',     // Credit card
      'bancontact',     // Bancontact (Belgium)
      'sofort',         // SOFORT Banking
      'eps',            // EPS (Austria)
      'giropay',        // Giropay (Germany)
      'belfius',        // Belfius Pay Button (Belgium)
      'paypal',         // PayPal
      'applepay',       // Apple Pay
      'przelewy24',     // Przelewy24 (Poland)
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
   * Make HTTP request to Mollie API
   */
  private async makeRequest(
    method: 'GET' | 'POST' | 'DELETE',
    endpoint: string,
    body?: any
  ): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    }

    const config: RequestInit = {
      method,
      headers,
    }

    if (body) {
      config.body = JSON.stringify(body)
    }

    try {
      const response = await fetch(url, config)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new MollieError(
          errorData.title || 'Payment API error',
          response.status,
          errorData.detail || response.statusText,
          errorData
        )
      }

      return await response.json()
    } catch (error) {
      if (error instanceof MollieError) {
        throw error
      }

      throw new MollieError(
        'Payment service unavailable',
        500,
        'Unable to connect to payment provider',
        { originalError: error }
      )
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
    method: mollieClient.getWineCompatibleMethods().map(id => ({ id, name: id })),
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
    case 'paid':
    case 'authorized':
      return 'green'
    case 'open':
    case 'pending':
      return 'blue'
    case 'failed':
    case 'canceled':
    case 'expired':
      return 'red'
    default:
      return 'gray'
  }
}

export const getPaymentStatusLabel = (status: MolliePaymentStatus): string => {
  switch (status) {
    case 'open':
      return 'Awaiting payment'
    case 'paid':
      return 'Paid'
    case 'authorized':
      return 'Authorized'
    case 'pending':
      return 'Processing'
    case 'canceled':
      return 'Canceled'
    case 'expired':
      return 'Expired'
    case 'failed':
      return 'Failed'
    default:
      return 'Unknown'
  }
}