export interface WineProduct {
  id: string
  sku: string
  name: string
  vintage: number
  varietal: string
  region?: string
  alcoholContent: number
  volumeMl: number
  priceEur: number
  stockQuantity: number
  description: string
  tastingNotes?: string
  foodPairing?: string
  productionNotes?: string
  allergens?: string[]
  organicCertified: boolean
  biodynamicCertified: boolean
  veganFriendly: boolean
  isActive: boolean
  featured: boolean
  slug: string
  images: ProductImage[]
  certifications?: ProductCertification[]
  createdAt: string
  updatedAt: string
}

export interface ProductImage {
  id: string
  productId: string
  url: string
  altText?: string
  displayOrder: number
  imageType: 'bottle' | 'label' | 'vineyard' | 'winemaker'
  width?: number
  height?: number
  fileSize?: number
  isPrimary: boolean
  createdAt: string
}

export interface ProductCertification {
  id: string
  productId: string
  certificationType: 'organic' | 'biodynamic' | 'vegan' | 'sustainable'
  certifyingBody: string
  certificateNumber: string
  issuedDate: string
  expiryDate: string
  certificateUrl?: string
  verified: boolean
  displayLogo: boolean
  createdAt: string
}

export interface Customer {
  id: string
  email: string
  firstName?: string
  lastName?: string
  phone?: string
  birthDate?: string
  preferredLanguage: 'en' | 'fr'
  marketingConsent: boolean
  newsletterConsent: boolean
  ageVerified: boolean
  ageVerifiedAt?: string
  ageVerificationMethod?: 'id_document' | 'third_party' | 'manual'
  isBusiness: boolean
  vatNumber?: string
  vatValidated: boolean
  vatValidatedAt?: string
  companyName?: string
  totalOrders: number
  totalSpentEur: number
  addresses?: CustomerAddress[]
  createdAt: string
  updatedAt: string
}

export interface CustomerAddress {
  id: string
  customerId: string
  type: 'shipping' | 'billing' | 'both'
  firstName: string
  lastName: string
  company?: string
  addressLine1: string
  addressLine2?: string
  city: string
  stateProvince?: string
  postalCode: string
  countryCode: string
  phone?: string
  deliveryInstructions?: string
  isDefaultShipping: boolean
  isDefaultBilling: boolean
  createdAt: string
  updatedAt: string
}

export interface ContentPage {
  id: string
  slugEn: string
  slugFr: string
  titleEn?: string
  titleFr?: string
  contentEn?: string
  contentFr?: string
  metaTitleEn?: string
  metaTitleFr?: string
  metaDescriptionEn?: string
  metaDescriptionFr?: string
  featuredImageUrl?: string
  pageType: 'heritage' | 'practices' | 'about' | 'legal' | 'custom'
  isPublished: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
  createdBy?: string
  updatedBy?: string
}

export interface Order {
  id: string
  orderNumber: string
  customerId: string
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
  currency: string
  subtotalEur: number
  vatRate: number
  vatAmountEur: number
  shippingCostEur: number
  totalEur: number
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded' | 'partially_refunded'
  paymentMethod: string
  molliePaymentId?: string
  shippingAddress: CustomerAddress
  billingAddress: CustomerAddress
  shippingMethod: string
  trackingNumber?: string
  estimatedDelivery?: string
  shippedAt?: string
  deliveredAt?: string
  notes?: string
  items: OrderItem[]
  createdAt: string
  updatedAt: string
}

export interface OrderItem {
  id: string
  orderId: string
  productId: string
  productSnapshot: Partial<WineProduct>
  quantity: number
  unitPriceEur: number
  vatRate: number
  vatAmountEur: number
  lineTotalEur: number
  createdAt: string
}

export interface CartItem {
  id: string
  customerId: string
  productId: string
  product?: WineProduct
  quantity: number
  addedAt: string
  updatedAt: string
}

export interface CartItemWithProduct extends CartItem {
  product: WineProduct & {
    primaryImageUrl?: string
    inStock: boolean
    lineTotalEur: number
  }
}

export interface CartSummary {
  itemCount: number
  totalQuantity: number
  subtotalEur: number
}

export interface CartValidation {
  isValid: boolean
  errorMessage?: string
  invalidItems: Array<{
    id: string
    productId: string
    name: string
    error: string
    available?: number
    requested?: number
  }>
}

export interface VATRate {
  id: string
  countryCode: string
  productCategory: string
  standardRate: number
  reducedRate?: number
  appliesToWine: boolean
  effectiveFrom: string
  effectiveTo?: string
  createdAt: string
}

export interface ShippingRate {
  carrier: string
  service: string
  price: number
  estimatedDays: number
  servicePoints: boolean
}

export interface PaymentIntent {
  id: string
  amount: number
  currency: string
  status: string
  checkoutUrl?: string
}

export interface AgeVerificationResult {
  verified: boolean
  method: string
  verifiedAt: string
}

export interface VATCalculation {
  netAmount: number
  vatRate: number
  vatAmount: number
  grossAmount: number
  reverseCharge: boolean
}

// Utility types
export type Locale = 'en' | 'fr'

export type ApiResponse<T> = {
  data: T
  error: null
} | {
  data: null
  error: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export interface FilterOptions {
  category?: string
  featured?: boolean
  inStock?: boolean
  minPrice?: number
  maxPrice?: number
  vintage?: number
  varietal?: string
  certification?: 'organic' | 'biodynamic' | 'vegan'
}

export interface SortOptions {
  field: 'name' | 'price' | 'vintage' | 'created_at'
  direction: 'asc' | 'desc'
}

// Business Logic Types
export interface WineProductWithDetails extends WineProduct {
  availableQuantity: number
  isInStock: boolean
  primaryImage?: ProductImage
  allImages: ProductImage[]
  activeCertifications: ProductCertification[]
  localizedSlug: string
}

export interface CustomerProfile extends Customer {
  defaultShippingAddress?: CustomerAddress
  defaultBillingAddress?: CustomerAddress
  allAddresses: CustomerAddress[]
  orderHistory: Order[]
  customerTier: 'new' | 'regular' | 'premium'
}

export interface OrderWithDetails extends Order {
  customer: Customer
  itemsWithProducts: Array<OrderItem & { product: WineProduct }>
  shippingAddressFull: CustomerAddress
  billingAddressFull: CustomerAddress
  vatCalculation: VATCalculation
}

// Form Types
export interface AddressFormData {
  firstName: string
  lastName: string
  company?: string
  addressLine1: string
  addressLine2?: string
  city: string
  stateProvince?: string
  postalCode: string
  countryCode: string
  phone?: string
  deliveryInstructions?: string
  type: 'shipping' | 'billing' | 'both'
  isDefaultShipping?: boolean
  isDefaultBilling?: boolean
}

export interface CheckoutFormData {
  shippingAddress: AddressFormData
  billingAddress: AddressFormData
  sameAsBilling: boolean
  shippingMethod: string
  paymentMethod: string
  marketingConsent: boolean
  termsAccepted: boolean
  notes?: string
}

// Carrier Selection Types
export interface CarrierOption {
  code: string
  name: string
  shipping_options: ShippingOptionDetails[]
}

export interface ShippingOptionDetails {
  code: string
  name: string
  carrier_code: string
  carrier_name: string
  price: number // in cents
  currency: string
  price_display: string
  delivery_time?: string
  service_point_required: boolean
  characteristics: {
    is_tracked: boolean
    requires_signature: boolean
    is_express: boolean
    insurance: number
    last_mile: string
  }
  weight_range: {
    min: number
    max: number
    unit: string
  }
}

export interface CarrierSelectionResponse {
  carriers: CarrierOption[]
  destination: {
    country: string
    postalCode: string
    city: string
  }
  package_info: {
    total_bottles: number
    estimated_weight: number
    dimensions: {
      length: number
      width: number
      height: number
      weight: number
      value?: number
    }
  }
  origin: {
    country: string
    postal_code: string
  }
}

export interface SelectedShippingOption {
  carrier_code: string
  carrier_name: string
  option_code: string
  option_name: string
  price: number
  currency: string
  delivery_time?: string
  service_point_required: boolean
}

export interface CustomerRegistrationData {
  email: string
  password: string
  firstName: string
  lastName: string
  phone?: string
  birthDate: string
  preferredLanguage: 'en' | 'fr'
  marketingConsent: boolean
  newsletterConsent: boolean
  isBusiness: boolean
  vatNumber?: string
  companyName?: string
}

// Search and Filtering
export interface ProductSearchFilters extends FilterOptions {
  query?: string
  region?: string
  alcoholMin?: number
  alcoholMax?: number
  volumeMl?: number[]
  certifications?: Array<'organic' | 'biodynamic' | 'vegan'>
}

export interface ProductSearchResult {
  products: WineProductWithDetails[]
  totalCount: number
  filters: {
    varietals: Array<{ value: string; count: number }>
    regions: Array<{ value: string; count: number }>
    vintages: Array<{ value: number; count: number }>
    priceRange: { min: number; max: number }
  }
}

// Shipping and Logistics
export interface ShippingOption {
  id: string
  carrier: string
  service: string
  name: string
  description?: string
  priceEur: number
  estimatedDaysMin: number
  estimatedDaysMax: number
  trackingAvailable: boolean
  requiresSignature: boolean
  servicePoints: boolean
}

export interface ShippingCalculation {
  options: ShippingOption[]
  freeShippingThreshold?: number
  freeShippingAmount?: number
}

// Age Verification
export interface AgeVerificationRequest {
  customerId: string
  method: 'id_document' | 'third_party' | 'manual'
  documentType?: string
  documentNumber?: string
  documentImages?: string[]
}

// Analytics and Reporting
export interface ProductAnalytics {
  productId: string
  views: number
  cartAdds: number
  purchases: number
  conversionRate: number
  revenue: number
  averageRating?: number
}

export interface CustomerAnalytics {
  customerId: string
  lifetimeValue: number
  averageOrderValue: number
  orderFrequency: number
  lastOrderDate?: string
  preferredProducts: string[]
}

// Error Handling
export interface ValidationError {
  field: string
  message: string
  code?: string
}

export interface ApiError {
  message: string
  code: string
  details?: any
  timestamp: string
}

// Feature Flags and Configuration
export interface FeatureFlags {
  enableAgeVerification: boolean
  enableVATValidation: boolean
  enableInventoryManagement: boolean
  enableProductReviews: boolean
  enableWishlist: boolean
  maintenanceMode: boolean
}

export interface SiteConfiguration {
  siteName: string
  supportEmail: string
  maxOrderQuantity: number
  freeShippingThreshold: number
  vatIncluded: boolean
  defaultCurrency: string
  supportedLanguages: Locale[]
  ageVerificationRequired: boolean
}