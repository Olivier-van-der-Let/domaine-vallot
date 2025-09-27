// Sendcloud shipping service for wine e-commerce

export interface SendcloudAddress {
  name: string
  company?: string
  address: string
  address_2?: string
  house_number?: string
  city: string
  postal_code: string
  country: string // ISO 2-letter code
  telephone?: string
  email?: string
}

export interface SendcloudParcel {
  name: string
  company?: string
  address: string
  address_2?: string
  house_number?: string
  city: string
  postal_code: string
  country: string
  telephone?: string
  email?: string
  weight: number // in grams
  order_number: string
  insured_value?: number // in cents
  total_order_value_currency?: string
  total_order_value?: number // in cents
  quantity?: number
  shipment_uuid?: string
  external_reference?: string
}

export interface SendcloudShippingMethod {
  id: number
  name: string
  carrier: string
  service_point_input: 'none' | 'optional' | 'required'
  countries: string[]
  price: number // in cents
  currency: string
  min_weight?: number
  max_weight?: number
  delivery_time?: string
  characteristics: {
    is_tracked: boolean
    requires_signature: boolean
    is_express: boolean
  }
}

export interface SendcloudOrder {
  id: string
  order_id: string
  order_number: string
  created_at: string
  modified_at: string
  order_details: {
    integration: {
      id: number
    }
    status: {
      code: string
      message: string
    }
    order_date: string
    order_items: Array<{
      name: string
      quantity: number
      total_price: {
        value: number
        currency: string
      }
    }>
  }
  payment_details: {
    total_price: {
      value: number
      currency: string
    }
    status: {
      code: string
      message: string
    }
  }
  shipping_address: {
    name: string
    address_line_1: string
    house_number?: string
    postal_code: string
    city: string
    country_code: string
    phone_number?: string
  }
}

export interface SendcloudShipment {
  id: number
  name: string
  company?: string
  address: string
  city: string
  postal_code: string
  country: string
  weight: number
  tracking_number?: string
  tracking_url?: string
  status: SendcloudShipmentStatus
  carrier: string
  shipping_method: number
  created_at: string
  updated_at: string
  label?: {
    label_printer: string
    normal_printer: string[]
  }
}

export type SendcloudShipmentStatus =
  | 'announced'
  | 'en_route_to_sorting_center'
  | 'delivered_at_sorting_center'
  | 'sorted'
  | 'en_route'
  | 'delivered'
  | 'exception'
  | 'unknown'

export interface SendcloudRate {
  shipping_method: SendcloudShippingMethod
  price: number // in cents
  currency: string
  delivery_time?: string
  service_point_required: boolean
}

export interface SendcloudServicePoint {
  id: string
  name: string
  street: string
  house_number: string
  postal_code: string
  city: string
  country: string
  latitude: number
  longitude: number
  phone?: string
  opening_hours: Record<string, string>
  distance?: number
}

class SendcloudClient {
  private apiKey: string
  private apiSecret: string
  private baseUrl: string
  private baseUrlV3: string
  private integrationId: number | null
  private isTestMode: boolean

  constructor() {
    this.apiKey = process.env.SENDCLOUD_PUBLIC_KEY || ''
    this.apiSecret = process.env.SENDCLOUD_SECRET_KEY || ''
    this.baseUrl = 'https://panel.sendcloud.sc/api/v2'
    this.baseUrlV3 = 'https://panel.sendcloud.sc/api/v3'
    this.integrationId = process.env.SENDCLOUD_INTEGRATION_ID ? parseInt(process.env.SENDCLOUD_INTEGRATION_ID) : null
    this.isTestMode = process.env.NODE_ENV !== 'production'

    if (!this.apiKey || !this.apiSecret) {
      throw new Error('SENDCLOUD_PUBLIC_KEY and SENDCLOUD_SECRET_KEY environment variables are required')
    }
  }

  /**
   * Get available shipping methods for destination
   */
  async getShippingMethods(
    country: string,
    weight?: number,
    value?: number
  ): Promise<SendcloudShippingMethod[]> {
    const params = new URLSearchParams({
      to_country: country.toUpperCase(),
    })

    if (weight) {
      params.append('weight', weight.toString())
    }

    if (value) {
      params.append('value', (value / 100).toString()) // Convert from cents
    }

    const response = await this.makeRequest('GET', `/shipping_methods?${params.toString()}`)
    return response.shipping_methods || []
  }

  /**
   * Calculate shipping rates for specific destination and package
   */
  async calculateRates(
    destination: Pick<SendcloudAddress, 'country' | 'postal_code' | 'city'>,
    packageInfo: {
      weight: number // in grams
      value?: number // in cents
      length?: number // in cm
      width?: number // in cm
      height?: number // in cm
    }
  ): Promise<SendcloudRate[]> {
    // Get available shipping methods
    const methods = await this.getShippingMethods(
      destination.country,
      packageInfo.weight,
      packageInfo.value
    )

    // Filter methods suitable for wine shipping
    const wineCompatibleMethods = methods.filter(method =>
      this.isWineCompatibleMethod(method, destination.country)
    )

    // Calculate rates
    return wineCompatibleMethods.map(method => ({
      shipping_method: method,
      price: method.price,
      currency: method.currency,
      delivery_time: method.delivery_time,
      service_point_required: method.service_point_input === 'required'
    }))
  }

  /**
   * Create a shipment
   */
  async createShipment(
    parcel: SendcloudParcel,
    shippingMethodId: number,
    servicePointId?: string
  ): Promise<SendcloudShipment> {
    const payload = {
      parcel: {
        ...parcel,
        weight: parcel.weight.toString(),
        shipping_method: shippingMethodId,
        service_point: servicePointId,
        // Wine-specific handling
        customs_declaration: {
          contents: 1, // Gift = 1, Commercial goods = 2, Sample = 3, Return = 4
          invoice_number: parcel.order_number,
          weight: parcel.weight,
          items: [{
            description: 'Wine',
            quantity: parcel.quantity || 1,
            weight: parcel.weight,
            value: Math.round((parcel.total_order_value || 0) / 100), // Convert to euros
            hs_code: '220421', // HS code for wine
            origin_country: 'FR' // Assuming French wine
          }]
        }
      }
    }

    const response = await this.makeRequest('POST', '/parcels', payload)
    return response.parcel
  }

  /**
   * Get shipment details
   */
  async getShipment(shipmentId: number): Promise<SendcloudShipment> {
    const response = await this.makeRequest('GET', `/parcels/${shipmentId}`)
    return response.parcel
  }

  /**
   * Cancel a shipment
   */
  async cancelShipment(shipmentId: number): Promise<boolean> {
    try {
      await this.makeRequest('POST', `/parcels/${shipmentId}/cancel`)
      return true
    } catch (error) {
      console.error('Failed to cancel shipment:', error)
      return false
    }
  }

  /**
   * Create order in Sendcloud using Orders V3 API
   */
  async createOrder(
    orderData: {
      order_id: string
      order_number: string
      customer_email: string
      customer_name: string
      shipping_address: SendcloudAddress
      billing_address: SendcloudAddress
      items: Array<{
        name: string
        quantity: number
        unit_price: number // in cents
      }>
      total_amount: number // in cents
      currency: string
    }
  ): Promise<SendcloudOrder> {
    if (!this.integrationId) {
      throw new Error('SENDCLOUD_INTEGRATION_ID environment variable is required for order creation')
    }

    const payload = [{
      order_id: orderData.order_id,
      order_number: orderData.order_number,
      order_details: {
        integration: {
          id: this.integrationId
        },
        status: {
          code: 'processing_awaiting_shipment',
          message: 'Processing awaiting shipment'
        },
        order_created_at: new Date().toISOString(),
        order_items: orderData.items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          total_price: {
            value: (item.unit_price * item.quantity) / 100, // Convert to euros
            currency: orderData.currency
          }
        }))
      },
      payment_details: {
        total_price: {
          value: orderData.total_amount / 100, // Convert to euros
          currency: orderData.currency
        },
        status: {
          code: 'paid',
          message: 'Paid'
        }
      },
      shipping_address: {
        name: orderData.customer_name,
        address_line_1: orderData.shipping_address.address,
        house_number: orderData.shipping_address.house_number,
        postal_code: orderData.shipping_address.postal_code,
        city: orderData.shipping_address.city,
        country_code: orderData.shipping_address.country,
        phone_number: orderData.shipping_address.telephone
      }
    }]

    const response = await this.makeRequestV3('POST', '/orders', payload)
    return response.data[0]
  }

  /**
   * Get order from Sendcloud
   */
  async getOrder(orderId: string): Promise<SendcloudOrder> {
    const response = await this.makeRequestV3('GET', `/orders/${orderId}`)
    return response
  }

  /**
   * Update order in Sendcloud
   */
  async updateOrder(
    orderId: string,
    updates: {
      status?: {
        code: string
        message: string
      }
      shipping_address?: Partial<SendcloudAddress>
    }
  ): Promise<SendcloudOrder> {
    const payload = [{
      order_id: orderId,
      order_details: updates.status ? {
        status: updates.status
      } : undefined,
      shipping_address: updates.shipping_address
    }]

    const response = await this.makeRequestV3('POST', '/orders', payload)
    return response.data[0]
  }

  /**
   * Create shipping label for order
   */
  async createLabel(
    orderId: string,
    shippingMethodId?: number
  ): Promise<{
    integration_id: number
    order: {
      order_id: string
    }
    ship_with?: {
      shipping_option_code: string
    }
  }> {
    if (!this.integrationId) {
      throw new Error('SENDCLOUD_INTEGRATION_ID environment variable is required for label creation')
    }

    const payload = {
      integration_id: this.integrationId,
      order: {
        order_id: orderId
      }
    }

    if (shippingMethodId) {
      payload.ship_with = {
        shipping_option_code: shippingMethodId.toString()
      }
    }

    const response = await this.makeRequestV3('POST', '/ship-an-order', payload)
    return response
  }

  /**
   * Get tracking information
   */
  async getTracking(shipmentId: number): Promise<{
    tracking_number: string
    tracking_url: string
    status: SendcloudShipmentStatus
    status_message: string
  }> {
    const shipment = await this.getShipment(shipmentId)

    return {
      tracking_number: shipment.tracking_number || '',
      tracking_url: shipment.tracking_url || '',
      status: shipment.status,
      status_message: this.getStatusMessage(shipment.status)
    }
  }

  /**
   * Find service points near address
   */
  async findServicePoints(
    country: string,
    postalCode: string,
    carrier?: string,
    limit = 5
  ): Promise<SendcloudServicePoint[]> {
    const params = new URLSearchParams({
      country: country.toUpperCase(),
      postal_code: postalCode,
      limit: limit.toString()
    })

    if (carrier) {
      params.append('carrier', carrier)
    }

    const response = await this.makeRequest('GET', `/service_points?${params.toString()}`)
    return response.service_points || []
  }

  /**
   * Generate shipping labels
   */
  async generateLabel(shipmentId: number, format = 'pdf'): Promise<{
    label_printer: string
    normal_printer: string[]
  }> {
    const response = await this.makeRequest('GET', `/labels/${format}?ids=${shipmentId}`)
    return response
  }

  /**
   * Check if shipping method is compatible with wine
   */
  private isWineCompatibleMethod(
    method: SendcloudShippingMethod,
    destinationCountry: string
  ): boolean {
    // Wine shipping restrictions

    // Must support tracking for valuable items
    if (!method.characteristics.is_tracked) {
      return false
    }

    // Some carriers don't support alcohol shipping
    const alcoholRestrictedCarriers = ['amazon', 'fedex_envelope']
    if (alcoholRestrictedCarriers.includes(method.carrier.toLowerCase())) {
      return false
    }

    // Country-specific restrictions
    const restrictedCountries = ['US', 'CA', 'AU'] // Countries with strict alcohol import laws
    if (restrictedCountries.includes(destinationCountry.toUpperCase())) {
      // Only allow express/registered methods for restricted countries
      return method.characteristics.is_express || method.characteristics.requires_signature
    }

    return true
  }

  /**
   * Get human-readable status message
   */
  private getStatusMessage(status: SendcloudShipmentStatus): string {
    const messages: Record<SendcloudShipmentStatus, string> = {
      announced: 'Shipment announced',
      en_route_to_sorting_center: 'En route to sorting center',
      delivered_at_sorting_center: 'Delivered at sorting center',
      sorted: 'Package sorted',
      en_route: 'Out for delivery',
      delivered: 'Delivered',
      exception: 'Delivery exception',
      unknown: 'Status unknown'
    }

    return messages[status] || 'Unknown status'
  }

  /**
   * Make HTTP request to Sendcloud API V2
   */
  private async makeRequest(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    body?: any
  ): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`

    // Create basic auth header
    const credentials = Buffer.from(`${this.apiKey}:${this.apiSecret}`).toString('base64')

    const headers: Record<string, string> = {
      'Authorization': `Basic ${credentials}`,
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
        throw new SendcloudError(
          errorData.error?.message || 'Shipping API error',
          response.status,
          errorData.error?.code || response.statusText,
          errorData
        )
      }

      return await response.json()
    } catch (error) {
      if (error instanceof SendcloudError) {
        throw error
      }

      throw new SendcloudError(
        'Shipping service unavailable',
        500,
        'Unable to connect to shipping provider',
        { originalError: error }
      )
    }
  }

  /**
   * Make HTTP request to Sendcloud API V3
   */
  private async makeRequestV3(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    body?: any
  ): Promise<any> {
    const url = `${this.baseUrlV3}${endpoint}`

    // Create basic auth header
    const credentials = Buffer.from(`${this.apiKey}:${this.apiSecret}`).toString('base64')

    const headers: Record<string, string> = {
      'Authorization': `Basic ${credentials}`,
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
        throw new SendcloudError(
          errorData.error?.message || 'Shipping API V3 error',
          response.status,
          errorData.error?.code || response.statusText,
          errorData
        )
      }

      return await response.json()
    } catch (error) {
      if (error instanceof SendcloudError) {
        throw error
      }

      throw new SendcloudError(
        'Shipping service V3 unavailable',
        500,
        'Unable to connect to shipping provider V3',
        { originalError: error }
      )
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(body: string, signature: string): boolean {
    // Sendcloud webhook verification would be implemented here
    // For now, we'll accept all webhooks in development
    if (this.isTestMode) {
      return true
    }

    // TODO: Implement proper signature verification when available
    return true
  }
}

export class SendcloudError extends Error {
  public status: number
  public code: string
  public data?: any

  constructor(message: string, status: number, code: string, data?: any) {
    super(message)
    this.name = 'SendcloudError'
    this.status = status
    this.code = code
    this.data = data
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      status: this.status,
      code: this.code,
      data: this.data,
    }
  }
}

// Export singleton instance
export const sendcloudClient = new SendcloudClient()

// Helper functions for wine shipping
export const calculateWineShipping = async (
  destination: SendcloudAddress,
  bottles: number,
  totalValue: number // in cents
): Promise<SendcloudRate[]> => {
  // Calculate weight (average wine bottle ~750g + packaging)
  const bottleWeight = 750 // grams
  const packagingWeight = Math.max(200, bottles * 50) // Base packaging + per bottle
  const totalWeight = (bottles * bottleWeight) + packagingWeight

  return sendcloudClient.calculateRates(
    {
      country: destination.country,
      postal_code: destination.postal_code,
      city: destination.city
    },
    {
      weight: totalWeight,
      value: totalValue,
      length: bottles <= 6 ? 35 : 45, // cm
      width: bottles <= 6 ? 25 : 35,  // cm
      height: bottles <= 6 ? 30 : 35  // cm
    }
  )
}

export const createWineShipment = async (
  orderData: {
    orderId: string
    recipient: SendcloudAddress
    bottles: number
    totalValue: number
    weight?: number
  },
  shippingMethodId: number
): Promise<SendcloudShipment> => {
  const weight = orderData.weight || (orderData.bottles * 750 + 200)

  const parcel: SendcloudParcel = {
    name: orderData.recipient.name,
    company: orderData.recipient.company,
    address: orderData.recipient.address,
    address_2: orderData.recipient.address_2,
    city: orderData.recipient.city,
    postal_code: orderData.recipient.postal_code,
    country: orderData.recipient.country,
    telephone: orderData.recipient.telephone,
    email: orderData.recipient.email,
    weight,
    order_number: orderData.orderId,
    insured_value: orderData.totalValue,
    total_order_value: orderData.totalValue,
    total_order_value_currency: 'EUR',
    quantity: orderData.bottles,
    external_reference: `wine-order-${orderData.orderId}`
  }

  return sendcloudClient.createShipment(parcel, shippingMethodId)
}

export const formatShippingPrice = (price: number, currency = 'EUR'): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
  }).format(price / 100)
}

export const getDeliveryEstimate = (method: SendcloudShippingMethod): string => {
  if (method.delivery_time) {
    return method.delivery_time
  }

  // Fallback estimates based on method characteristics
  if (method.characteristics.is_express) {
    return '1-2 business days'
  }

  return '3-5 business days'
}

// Wine-specific shipping validations
export const validateWineShipment = (
  destination: SendcloudAddress,
  bottles: number
): string[] => {
  const errors: string[] = []

  // Age verification required countries
  const ageVerificationCountries = ['US', 'CA', 'AU', 'NO', 'SE']
  if (ageVerificationCountries.includes(destination.country.toUpperCase())) {
    errors.push('Age verification required for this destination')
  }

  // Bottle limits for certain countries
  if (destination.country.toUpperCase() === 'NO' && bottles > 1) {
    errors.push('Norway allows maximum 1 bottle per shipment')
  }

  // Postal code validation for wine shipping
  if (!destination.postal_code || destination.postal_code.trim().length === 0) {
    errors.push('Postal code is required for wine shipping')
  }

  return errors
}