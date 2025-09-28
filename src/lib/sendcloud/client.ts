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

export interface SendcloudShippingOption {
  code: string
  carrier: {
    code: string
    name: string
  }
  product: {
    code: string
    name: string
  }
  functionalities: {
    b2b: boolean
    b2c: boolean
    tracked: boolean
    signature: boolean
    insurance: number
    last_mile: string
    first_mile: string
    service_area: string
    delivery_deadline: string
    [key: string]: any
  }
  weight: {
    min: { value: string; unit: string }
    max: { value: string; unit: string }
  }
  billed_weight: {
    unit: string
    value: string
    volumetric: boolean
  }
  quotes?: Array<{
    price: { value: number; currency: string }
    delivery_time?: string
  }>
}

export interface CarrierOption {
  code: string
  name: string
  shipping_options: SendcloudShippingOption[]
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

  constructor(options?: { skipValidation?: boolean }) {
    this.apiKey = process.env.SENDCLOUD_PUBLIC_KEY || ''
    this.apiSecret = process.env.SENDCLOUD_SECRET_KEY || ''
    this.baseUrl = 'https://panel.sendcloud.sc/api/v2'
    this.baseUrlV3 = 'https://panel.sendcloud.sc/api/v3'
    this.integrationId = process.env.SENDCLOUD_INTEGRATION_ID ? parseInt(process.env.SENDCLOUD_INTEGRATION_ID) : null
    this.isTestMode = process.env.NODE_ENV !== 'production'

    if (!options?.skipValidation && (!this.apiKey || !this.apiSecret)) {
      // In development, log warning instead of throwing error to prevent crashes
      if (this.isTestMode) {
        console.warn('WARNING: SENDCLOUD_PUBLIC_KEY and SENDCLOUD_SECRET_KEY environment variables are missing. Shipping calculations will use fallback options.')
      } else {
        throw new Error('SENDCLOUD_PUBLIC_KEY and SENDCLOUD_SECRET_KEY environment variables are required')
      }
    }
  }

  /**
   * Check if the client has valid credentials
   */
  hasValidCredentials(): boolean {
    return !!(this.apiKey && this.apiSecret)
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

    try {
      const response = await this.makeRequest('GET', `/shipping_methods?${params.toString()}`)
      const shippingMethods = response.shipping_methods || []

      // Validate and filter shipping methods
      const validMethods = shippingMethods.filter((method: any, index: number) => {
        // Basic validation
        if (!method || typeof method !== 'object') {
          console.warn(`Invalid shipping method at index ${index}:`, method)
          return false
        }

        // Check required fields (currency is optional, will be inferred)
        const requiredFields = ['id', 'name', 'carrier', 'price']
        const missingFields = requiredFields.filter(field => method[field] === undefined || method[field] === null)

        if (missingFields.length > 0) {
          console.warn(`Shipping method missing required fields:`, {
            method: {
              id: method.id,
              name: method.name,
              carrier: method.carrier
            },
            missingFields
          })
          return false
        }

        // Add currency fallback for French wine merchant if not present
        if (!method.currency) {
          method.currency = 'EUR'
          console.log(`Added currency fallback (EUR) for shipping method: ${method.name} (${method.carrier})`)
        }

        // Log warning if characteristics are missing (but don't filter out)
        if (!method.characteristics) {
          console.warn(`Shipping method missing characteristics:`, {
            id: method.id,
            name: method.name,
            carrier: method.carrier
          })
        }

        return true
      })

      console.log(`Sendcloud API returned ${shippingMethods.length} methods, ${validMethods.length} valid for ${country}`)
      return validMethods

    } catch (error) {
      console.error('Error fetching shipping methods:', error)
      // Return empty array to allow graceful degradation
      return []
    }
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
    return wineCompatibleMethods.map(method => {
      // Extract price for destination country if main price is 0
      let actualPrice = method.price || 0
      let actualCurrency = method.currency || 'EUR'

      // If method price is 0, look for country-specific pricing
      if (actualPrice === 0 && method.countries && Array.isArray(method.countries)) {
        const countryData = method.countries.find(
          (c: any) => c.iso_2?.toUpperCase() === destination.country.toUpperCase()
        )

        if (countryData && countryData.price) {
          actualPrice = Math.round(countryData.price * 100) // Convert euros to cents
          console.log(`Found country-specific price for ${method.name} to ${destination.country}: €${countryData.price}`)
        }
      }

      return {
        shipping_method: method,
        price: actualPrice,
        currency: actualCurrency,
        delivery_time: method.delivery_time,
        service_point_required: method.service_point_input === 'required'
      }
    })
  }

  /**
   * Fetch shipping options using V3 API with carrier grouping
   */
  async fetchShippingOptions(
    origin: Pick<SendcloudAddress, 'country' | 'postal_code'>,
    destination: Pick<SendcloudAddress, 'country' | 'postal_code'>,
    packageInfo: {
      weight: number // in grams
      value?: number // in cents
      length?: number // in cm
      width?: number // in cm
      height?: number // in cm
    }
  ): Promise<SendcloudShippingOption[]> {
    const payload = {
      from_country: origin.country.toUpperCase(),
      to_country: destination.country.toUpperCase(),
      from_postal_code: origin.postal_code,
      to_postal_code: destination.postal_code,
      weight: {
        value: (packageInfo.weight / 1000).toFixed(3), // Convert grams to kg
        unit: 'kg'
      },
      ...(packageInfo.length && packageInfo.width && packageInfo.height && {
        dimensions: {
          length: packageInfo.length.toString(),
          width: packageInfo.width.toString(),
          height: packageInfo.height.toString(),
          unit: 'cm'
        }
      })
    }

    const response = await this.makeRequestV3('POST', '/fetch-shipping-options', payload)
    return response.data || []
  }

  /**
   * Get available carriers grouped by carrier with shipping options
   */
  async getAvailableCarriers(
    origin: Pick<SendcloudAddress, 'country' | 'postal_code'>,
    destination: Pick<SendcloudAddress, 'country' | 'postal_code'>,
    packageInfo: {
      weight: number // in grams
      value?: number // in cents
      length?: number // in cm
      width?: number // in cm
      height?: number // in cm
    }
  ): Promise<CarrierOption[]> {
    const shippingOptions = await this.fetchShippingOptions(origin, destination, packageInfo)

    // Filter wine-compatible options
    const wineCompatibleOptions = shippingOptions.filter(option =>
      this.isWineCompatibleShippingOption(option, destination.country)
    )

    // Group by carrier
    const carrierMap = new Map<string, CarrierOption>()

    wineCompatibleOptions.forEach(option => {
      const carrierCode = option.carrier.code

      if (!carrierMap.has(carrierCode)) {
        carrierMap.set(carrierCode, {
          code: carrierCode,
          name: option.carrier.name,
          shipping_options: []
        })
      }

      carrierMap.get(carrierCode)!.shipping_options.push(option)
    })

    return Array.from(carrierMap.values())
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

    const payload: any = {
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

    // Defensive check: ensure method exists
    if (!method) {
      console.warn('Shipping method is null/undefined')
      return false
    }

    // Some carriers don't support alcohol shipping
    const alcoholRestrictedCarriers = ['amazon', 'fedex_envelope']
    if (method.carrier && alcoholRestrictedCarriers.includes(method.carrier.toLowerCase())) {
      return false
    }

    // Country-specific restrictions for international shipments
    const restrictedCountries = ['US', 'CA', 'AU'] // Countries with strict alcohol import laws
    if (restrictedCountries.includes(destinationCountry.toUpperCase())) {
      // For restricted countries, only allow signature-based methods or express services
      const hasSignature = method.name.toLowerCase().includes('signature') ||
                           method.name.toLowerCase().includes('adult signature')
      const isExpress = method.name.toLowerCase().includes('express') ||
                        method.name.toLowerCase().includes('priority')

      return hasSignature || isExpress
    }

    // For EU/domestic shipping, most carriers are acceptable for wine
    // We'll rely on proper packaging and carrier selection
    const trustedCarriers = ['colissimo', 'ups', 'dhl', 'dpd', 'mondial_relay']
    if (method.carrier && trustedCarriers.includes(method.carrier.toLowerCase())) {
      return true
    }

    // Allow sendcloud test methods for development
    if (method.carrier === 'sendcloud' && method.name.toLowerCase().includes('unstamped')) {
      return true
    }

    // Default to allowing other methods but log for review
    console.log(`Wine compatibility check: allowing carrier ${method.carrier} (${method.name}) - please verify wine shipping support`)
    return true
  }

  /**
   * Check if shipping option (V3 API) is compatible with wine
   */
  private isWineCompatibleShippingOption(
    option: SendcloudShippingOption,
    destinationCountry: string
  ): boolean {
    // Wine shipping restrictions

    // Defensive check: ensure option, functionalities, and carrier exist
    if (!option || !option.functionalities || !option.carrier) {
      console.warn('Shipping option missing required properties:', {
        option: option ? {
          code: option.code,
          hasFunctionalities: !!option.functionalities,
          hasCarrier: !!option.carrier,
          carrier: option.carrier ? {
            code: option.carrier.code,
            name: option.carrier.name
          } : null
        } : null
      })
      // Conservative fallback: reject incomplete options
      return false
    }

    // Must support tracking for valuable items
    if (!option.functionalities.tracked) {
      return false
    }

    // Some carriers don't support alcohol shipping
    const alcoholRestrictedCarriers = ['amazon', 'fedex_envelope']
    if (option.carrier.code && alcoholRestrictedCarriers.includes(option.carrier.code.toLowerCase())) {
      return false
    }

    // Country-specific restrictions
    const restrictedCountries = ['US', 'CA', 'AU'] // Countries with strict alcohol import laws
    if (restrictedCountries.includes(destinationCountry.toUpperCase())) {
      // Only allow signature required methods for restricted countries
      return !!option.functionalities.signature
    }

    // Must be suitable for home delivery or service point
    const validLastMiles = ['home_delivery', 'service_point']
    if (!option.functionalities.last_mile || !validLastMiles.includes(option.functionalities.last_mile)) {
      return false
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

// Lazy instantiation to avoid build-time errors when env vars are missing
let _sendcloudClient: SendcloudClient | null = null

export const getSendcloudClient = (): SendcloudClient => {
  if (!_sendcloudClient) {
    _sendcloudClient = new SendcloudClient()
  }
  return _sendcloudClient
}

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

  return getSendcloudClient().calculateRates(
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

  return getSendcloudClient().createShipment(parcel, shippingMethodId)
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