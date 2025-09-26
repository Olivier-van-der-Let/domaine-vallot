import { z } from 'zod'

// Common validation patterns
const emailSchema = z.string().email('Please enter a valid email address')
const phoneSchema = z.string().regex(
  /^(\+\d{1,3}[- ]?)?\d{8,15}$/,
  'Please enter a valid phone number'
).optional()

const postalCodeSchema = z.string()
  .min(3, 'Postal code must be at least 3 characters')
  .max(10, 'Postal code cannot exceed 10 characters')

const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/\d/, 'Password must contain at least one number')
  .regex(/[!@#$%^&*]/, 'Password must contain at least one special character')

// Age verification schemas
export const ageVerificationSchema = z.object({
  birthDay: z.number()
    .min(1, 'Please select a valid day')
    .max(31, 'Please select a valid day'),
  birthMonth: z.number()
    .min(1, 'Please select a valid month')
    .max(12, 'Please select a valid month'),
  birthYear: z.number()
    .min(1900, 'Please enter a realistic birth year')
    .max(new Date().getFullYear(), 'Birth year cannot be in the future'),
  documentType: z.enum(['id_card', 'passport', 'drivers_license']).optional(),
  documentNumber: z.string().optional(),
  country: z.string().length(2, 'Country must be a 2-letter code').optional()
}).refine(
  (data) => {
    // Validate birth date
    const birthDate = new Date(data.birthYear, data.birthMonth - 1, data.birthDay)
    return !isNaN(birthDate.getTime()) && birthDate <= new Date()
  },
  {
    message: 'Please enter a valid birth date',
    path: ['birthDay']
  }
)

// Customer registration schemas
export const customerRegistrationSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
  firstName: z.string()
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name cannot exceed 50 characters')
    .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, 'First name contains invalid characters'),
  lastName: z.string()
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name cannot exceed 50 characters')
    .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, 'Last name contains invalid characters'),
  phone: phoneSchema,
  birthDate: z.string().refine(
    (date) => {
      const birthDate = new Date(date)
      const age = new Date().getFullYear() - birthDate.getFullYear()
      return !isNaN(birthDate.getTime()) && age >= 16 && age <= 120
    },
    'You must be at least 16 years old to register'
  ),
  acceptTerms: z.boolean().refine(val => val === true, 'You must accept the terms and conditions'),
  acceptPrivacy: z.boolean().refine(val => val === true, 'You must accept the privacy policy'),
  acceptMarketing: z.boolean().optional(),
  country: z.string().length(2, 'Please select a country')
}).refine(
  (data) => data.password === data.confirmPassword,
  {
    message: 'Passwords do not match',
    path: ['confirmPassword']
  }
)

// Authentication schemas
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional()
})

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
  firstName: z.string()
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name cannot exceed 50 characters')
    .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, 'First name contains invalid characters'),
  lastName: z.string()
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name cannot exceed 50 characters')
    .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, 'Last name contains invalid characters'),
  phone: phoneSchema,
  birthDate: z.string().refine(
    (date) => {
      const birthDate = new Date(date)
      const age = new Date().getFullYear() - birthDate.getFullYear()
      return !isNaN(birthDate.getTime()) && age >= 18 && age <= 120
    },
    'You must be at least 18 years old to register'
  ),
  preferredLanguage: z.enum(['en', 'fr']),
  marketingConsent: z.boolean().optional(),
  newsletterConsent: z.boolean().optional(),
  isBusiness: z.boolean().optional(),
  companyName: z.string().min(2, 'Company name is required').optional(),
  vatNumber: z.string().regex(/^[A-Z]{2}[0-9A-Z]+$/, 'Invalid VAT number format').optional(),
  termsAccepted: z.boolean().refine(val => val === true, 'You must accept the terms and conditions'),
  privacyAccepted: z.boolean().refine(val => val === true, 'You must accept the privacy policy')
}).refine(
  (data) => data.password === data.confirmPassword,
  {
    message: 'Passwords do not match',
    path: ['confirmPassword']
  }
).refine(
  (data) => {
    if (data.isBusiness) {
      return data.companyName && data.companyName.length >= 2
    }
    return true
  },
  {
    message: 'Company name is required for business accounts',
    path: ['companyName']
  }
)

export const forgotPasswordSchema = z.object({
  email: emailSchema
})

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: passwordSchema,
  confirmPassword: z.string()
}).refine(
  (data) => data.password === data.confirmPassword,
  {
    message: 'Passwords do not match',
    path: ['confirmPassword']
  }
)

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
  confirmPassword: z.string()
}).refine(
  (data) => data.newPassword === data.confirmPassword,
  {
    message: 'Passwords do not match',
    path: ['confirmPassword']
  }
)

// Legacy alias for backward compatibility
export const customerLoginSchema = loginSchema

// Address schemas
export const addressSchema = z.object({
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(2, 'Last name is required'),
  company: z.string().optional(),
  address: z.string().min(5, 'Street address is required'),
  address2: z.string().optional(),
  city: z.string().min(2, 'City is required'),
  postalCode: postalCodeSchema,
  country: z.string().length(2, 'Please select a country'),
  phone: phoneSchema
})

// Checkout schemas
export const checkoutCustomerSchema = z.object({
  email: emailSchema,
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(2, 'Last name is required'),
  phone: phoneSchema,
  createAccount: z.boolean().optional(),
  password: z.string().optional()
}).refine(
  (data) => {
    if (data.createAccount) {
      return data.password && data.password.length >= 8
    }
    return true
  },
  {
    message: 'Password is required when creating an account',
    path: ['password']
  }
)

export const checkoutShippingSchema = addressSchema

export const checkoutBillingSchema = addressSchema.extend({
  sameAsShipping: z.boolean().optional()
})

export const checkoutPaymentSchema = z.object({
  paymentMethod: z.enum(['mollie', 'stripe', 'paypal']),
  savePaymentMethod: z.boolean().optional(),
  acceptTerms: z.boolean().refine(val => val === true, 'You must accept the terms and conditions')
})

export const completeCheckoutSchema = z.object({
  customer: checkoutCustomerSchema,
  shipping: checkoutShippingSchema,
  billing: checkoutBillingSchema,
  payment: checkoutPaymentSchema,
  ageVerification: ageVerificationSchema,
  vatNumber: z.string().optional(),
  specialInstructions: z.string().max(500, 'Special instructions cannot exceed 500 characters').optional()
})

// Cart schemas
export const addToCartSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
  quantity: z.number()
    .min(1, 'Quantity must be at least 1')
    .max(24, 'Maximum 24 bottles per product')
    .int('Quantity must be a whole number'),
  variantId: z.string().optional()
})

export const updateCartItemSchema = z.object({
  quantity: z.number()
    .min(0, 'Quantity must be 0 or more')
    .max(24, 'Maximum 24 bottles per product')
    .int('Quantity must be a whole number')
})

// Product schemas (for admin)
export const productSchema = z.object({
  name: z.string()
    .min(3, 'Product name must be at least 3 characters')
    .max(100, 'Product name cannot exceed 100 characters'),
  sku: z.string()
    .min(3, 'SKU must be at least 3 characters')
    .max(50, 'SKU cannot exceed 50 characters')
    .regex(/^[A-Z0-9-]+$/, 'SKU must contain only uppercase letters, numbers, and hyphens'),
  description: z.string()
    .min(10, 'Description must be at least 10 characters')
    .max(2000, 'Description cannot exceed 2000 characters'),
  price: z.number()
    .min(1, 'Price must be at least €0.01')
    .max(100000, 'Price cannot exceed €1,000.00'),
  stockQuantity: z.number()
    .min(0, 'Stock quantity cannot be negative')
    .max(10000, 'Stock quantity cannot exceed 10,000')
    .int('Stock quantity must be a whole number'),
  category: z.enum(['red_wine', 'white_wine', 'rose_wine', 'sparkling_wine', 'dessert_wine', 'fortified_wine']),
  vintage: z.number()
    .min(1800, 'Vintage must be realistic')
    .max(new Date().getFullYear(), 'Vintage cannot be in the future')
    .optional(),
  alcoholContent: z.number()
    .min(0.5, 'Alcohol content must be at least 0.5%')
    .max(20, 'Alcohol content cannot exceed 20%')
    .optional(),
  grapeVariety: z.string().max(100, 'Grape variety name too long').optional(),
  region: z.string().max(100, 'Region name too long').optional(),
  producer: z.string().max(100, 'Producer name too long').optional(),
  volume: z.number()
    .min(187, 'Minimum volume is 187ml')
    .max(3000, 'Maximum volume is 3000ml')
    .optional(),
  servingTemperature: z.string().max(50, 'Serving temperature description too long').optional(),
  agingPotential: z.string().max(100, 'Aging potential description too long').optional(),
  pairingNotes: z.string().max(500, 'Pairing notes too long').optional(),
  status: z.enum(['active', 'inactive', 'out_of_stock', 'discontinued']),
  isFeatured: z.boolean().optional(),
  isOrganic: z.boolean().optional(),
  isBiodynamic: z.boolean().optional(),
  imageUrl: z.string().url('Please enter a valid image URL').optional(),
  galleryImages: z.array(z.string().url()).max(10, 'Maximum 10 gallery images').optional()
})

// Order schemas
export const orderSchema = z.object({
  customerId: z.string().uuid('Invalid customer ID').optional(),
  customerEmail: emailSchema,
  customerFirstName: z.string().min(2, 'First name is required'),
  customerLastName: z.string().min(2, 'Last name is required'),
  shippingAddress: addressSchema,
  billingAddress: addressSchema,
  items: z.array(z.object({
    productId: z.string().uuid('Invalid product ID'),
    quantity: z.number().min(1, 'Quantity must be at least 1').int(),
    unitPrice: z.number().min(1, 'Unit price must be positive')
  })).min(1, 'Order must contain at least one item'),
  subtotal: z.number().min(0, 'Subtotal cannot be negative'),
  vatAmount: z.number().min(0, 'VAT amount cannot be negative'),
  shippingCost: z.number().min(0, 'Shipping cost cannot be negative'),
  totalAmount: z.number().min(1, 'Total amount must be positive'),
  paymentMethod: z.string().min(1, 'Payment method is required'),
  specialInstructions: z.string().max(500, 'Special instructions too long').optional(),
  giftMessage: z.string().max(200, 'Gift message too long').optional()
})

// Contact form schemas
export const contactFormSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name cannot exceed 100 characters'),
  email: emailSchema,
  subject: z.string()
    .min(5, 'Subject must be at least 5 characters')
    .max(100, 'Subject cannot exceed 100 characters'),
  message: z.string()
    .min(10, 'Message must be at least 10 characters')
    .max(1000, 'Message cannot exceed 1000 characters'),
  phone: phoneSchema,
  category: z.enum(['general', 'orders', 'products', 'shipping', 'returns', 'technical']).optional()
})

// Wine estate contact form schema - specialized for Domaine Vallot
const frenchPhoneSchema = z.string().regex(
  /^(\+33|0)[1-9](\d{8})$/,
  'Veuillez entrer un numéro de téléphone français valide (ex: 01 23 45 67 89)'
).optional()

export const wineContactFormSchema = z.object({
  firstName: z.string()
    .min(2, 'Le prénom doit contenir au moins 2 caractères')
    .max(50, 'Le prénom ne peut pas dépasser 50 caractères')
    .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, 'Le prénom contient des caractères invalides'),
  lastName: z.string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(50, 'Le nom ne peut pas dépasser 50 caractères')
    .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, 'Le nom contient des caractères invalides'),
  email: z.string()
    .email('Veuillez entrer une adresse email valide')
    .max(255, 'L\'adresse email est trop longue'),
  phone: frenchPhoneSchema,
  company: z.string()
    .max(100, 'Le nom de la société ne peut pas dépasser 100 caractères')
    .optional(),
  inquiryType: z.enum([
    'wine_tasting',
    'group_visit',
    'wine_orders',
    'business_partnership',
    'press_media',
    'general_inquiry'
  ], {
    errorMap: () => ({ message: 'Veuillez sélectionner le type de demande' })
  }),
  groupSize: z.number()
    .min(1, 'Le nombre de personnes doit être d\'au moins 1')
    .max(50, 'Nous ne pouvons accueillir plus de 50 personnes par groupe')
    .int('Le nombre de personnes doit être un nombre entier')
    .optional(),
  preferredDate: z.string()
    .refine(
      (date) => {
        if (!date) return true // Optional field
        const selectedDate = new Date(date)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        return selectedDate >= today
      },
      'La date préférée ne peut pas être dans le passé'
    )
    .optional(),
  message: z.string()
    .min(20, 'Votre message doit contenir au moins 20 caractères')
    .max(1500, 'Votre message ne peut pas dépasser 1500 caractères')
    .refine(
      (msg) => !/<[^>]*>/g.test(msg),
      'Le message ne peut pas contenir de HTML'
    ),
  // Wine-specific fields
  winePreferences: z.string()
    .max(300, 'Les préférences vinicoles ne peuvent pas dépasser 300 caractères')
    .optional(),
  budgetRange: z.string()
    .max(50, 'La fourchette budgétaire ne peut pas dépasser 50 caractères')
    .optional(),
  specialRequirements: z.string()
    .max(300, 'Les exigences spéciales ne peuvent pas dépasser 300 caractères')
    .optional(),
  // Compliance fields
  ageVerified: z.boolean().refine(
    val => val === true,
    'Vous devez confirmer avoir l\'âge légal pour consommer de l\'alcool'
  ),
  privacyAccepted: z.boolean().refine(
    val => val === true,
    'Vous devez accepter la politique de confidentialité'
  ),
  marketingConsent: z.boolean().optional(),
  // Anti-spam field (honeypot)
  website: z.string().max(0, 'Ce champ doit rester vide').optional(),
}).refine(
  (data) => {
    // Require group size for group visits and tastings
    if (['wine_tasting', 'group_visit'].includes(data.inquiryType)) {
      return data.groupSize && data.groupSize >= 1
    }
    return true
  },
  {
    message: 'Le nombre de personnes est requis pour les dégustations et visites de groupe',
    path: ['groupSize']
  }
).refine(
  (data) => {
    // Validate business partnership requires company name
    if (data.inquiryType === 'business_partnership') {
      return data.company && data.company.trim().length >= 2
    }
    return true
  },
  {
    message: 'Le nom de la société est requis pour les partenariats commerciaux',
    path: ['company']
  }
)

// Newsletter subscription schema
export const newsletterSchema = z.object({
  email: emailSchema,
  firstName: z.string().min(2, 'First name is required').optional(),
  preferences: z.object({
    newProducts: z.boolean().optional(),
    specialOffers: z.boolean().optional(),
    wineEvents: z.boolean().optional(),
    wineEducation: z.boolean().optional()
  }).optional(),
  acceptTerms: z.boolean().refine(val => val === true, 'You must accept the terms and conditions')
})

// Admin schemas
export const adminLoginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
  twoFactorCode: z.string().regex(/^\d{6}$/, '2FA code must be 6 digits').optional()
})

export const adminUserSchema = z.object({
  email: emailSchema,
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(2, 'Last name is required'),
  role: z.enum(['admin', 'manager', 'staff']),
  permissions: z.array(z.string()).optional(),
  isActive: z.boolean(),
  password: passwordSchema.optional()
})

// Inventory management schemas
export const inventoryAdjustmentSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
  adjustment: z.number()
    .min(-1000, 'Adjustment too large')
    .max(1000, 'Adjustment too large')
    .int('Adjustment must be a whole number'),
  reason: z.enum(['received', 'sold', 'damaged', 'expired', 'returned', 'correction', 'other']),
  notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional(),
  reference: z.string().max(100, 'Reference cannot exceed 100 characters').optional()
})

// Shipping rate calculation schema
export const shippingRateSchema = z.object({
  destination: z.object({
    country: z.string().length(2, 'Country must be a 2-letter code'),
    postalCode: postalCodeSchema,
    city: z.string().min(2, 'City is required')
  }),
  items: z.array(z.object({
    productId: z.string().uuid('Invalid product ID'),
    quantity: z.number().min(1, 'Quantity must be at least 1').int(),
    weight: z.number().min(1, 'Weight must be positive').optional()
  })).min(1, 'At least one item is required'),
  totalValue: z.number().min(1, 'Total value must be positive')
})

// VAT calculation schema
export const vatCalculationSchema = z.object({
  amount: z.number().min(1, 'Amount must be positive'),
  shippingAmount: z.number().min(0, 'Shipping amount cannot be negative').optional(),
  country: z.string().length(2, 'Country must be a 2-letter code'),
  customerType: z.enum(['consumer', 'business']).optional(),
  vatNumber: z.string().optional()
})

// Search and filter schemas
export const productSearchSchema = z.object({
  query: z.string().max(100, 'Search query too long').optional(),
  category: z.enum(['red_wine', 'white_wine', 'rose_wine', 'sparkling_wine', 'dessert_wine', 'fortified_wine']).optional(),
  minPrice: z.number().min(0, 'Minimum price cannot be negative').optional(),
  maxPrice: z.number().min(0, 'Maximum price cannot be negative').optional(),
  vintage: z.number().min(1800, 'Vintage too old').max(new Date().getFullYear(), 'Vintage cannot be in the future').optional(),
  region: z.string().max(100, 'Region name too long').optional(),
  inStock: z.boolean().optional(),
  isOrganic: z.boolean().optional(),
  sortBy: z.enum(['name', 'price', 'vintage', 'created_at', 'popularity']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  limit: z.number().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100').optional(),
  offset: z.number().min(0, 'Offset cannot be negative').optional()
})

// File upload schemas
export const imageUploadSchema = z.object({
  file: z.any().refine(
    (file) => file instanceof File,
    'Please select a valid file'
  ).refine(
    (file) => file.size <= 5 * 1024 * 1024, // 5MB
    'File size must be less than 5MB'
  ).refine(
    (file) => ['image/jpeg', 'image/png', 'image/webp'].includes(file.type),
    'File must be JPEG, PNG, or WebP format'
  ),
  alt: z.string().max(200, 'Alt text cannot exceed 200 characters').optional()
})

// Type exports for TypeScript
export type AgeVerificationData = z.infer<typeof ageVerificationSchema>
export type CustomerRegistrationData = z.infer<typeof customerRegistrationSchema>
export type LoginData = z.infer<typeof loginSchema>
export type RegisterData = z.infer<typeof registerSchema>
export type ForgotPasswordData = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordData = z.infer<typeof resetPasswordSchema>
export type ChangePasswordData = z.infer<typeof changePasswordSchema>
export type CustomerLoginData = z.infer<typeof customerLoginSchema>
export type AddressData = z.infer<typeof addressSchema>
export type CheckoutData = z.infer<typeof completeCheckoutSchema>
export type AddToCartData = z.infer<typeof addToCartSchema>
export type UpdateCartItemData = z.infer<typeof updateCartItemSchema>
export type ProductData = z.infer<typeof productSchema>
export type OrderData = z.infer<typeof orderSchema>
export type ContactFormData = z.infer<typeof contactFormSchema>
export type WineContactFormData = z.infer<typeof wineContactFormSchema>
export type NewsletterData = z.infer<typeof newsletterSchema>
export type AdminLoginData = z.infer<typeof adminLoginSchema>
export type InventoryAdjustmentData = z.infer<typeof inventoryAdjustmentSchema>
export type ShippingRateData = z.infer<typeof shippingRateSchema>
export type VatCalculationData = z.infer<typeof vatCalculationSchema>
export type ProductSearchData = z.infer<typeof productSearchSchema>
export type ImageUploadData = z.infer<typeof imageUploadSchema>

// Validation helper functions
export const validateSchema = <T>(schema: z.ZodSchema<T>, data: unknown): {
  success: boolean
  data?: T
  errors?: Record<string, string[]>
} => {
  try {
    const result = schema.parse(data)
    return { success: true, data: result }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string[]> = {}

      for (const issue of error.issues) {
        const path = issue.path.join('.')
        if (!errors[path]) {
          errors[path] = []
        }
        errors[path].push(issue.message)
      }

      return { success: false, errors }
    }

    return { success: false, errors: { general: ['Validation failed'] } }
  }
}

export const getErrorMessage = (errors: Record<string, string[]>, field: string): string => {
  return errors[field]?.[0] || ''
}

export const hasErrors = (errors: Record<string, string[]>): boolean => {
  return Object.keys(errors).length > 0
}