// Age verification service for wine sales compliance

export interface AgeVerificationInput {
  birthDate: string | Date
  country?: string
  documentType?: 'id_card' | 'passport' | 'drivers_license'
  documentNumber?: string
  documentImage?: File | string
}

export interface AgeVerificationResult {
  isValid: boolean
  age: number
  isLegalAge: boolean
  countryMinimumAge: number
  errors: string[]
  warnings: string[]
  verificationLevel: 'self_declared' | 'document_verified' | 'third_party_verified'
  verifiedAt: Date
  expiresAt?: Date
}

export interface CountryAgeRequirement {
  country_code: string
  minimum_age: number
  requires_id: boolean
  allowed_documents: string[]
  additional_restrictions?: string[]
}

// Wine purchasing age requirements by country
const WINE_AGE_REQUIREMENTS: Record<string, CountryAgeRequirement> = {
  // Europe
  'AT': { country_code: 'AT', minimum_age: 16, requires_id: false, allowed_documents: ['id_card', 'passport'] },
  'BE': { country_code: 'BE', minimum_age: 16, requires_id: false, allowed_documents: ['id_card', 'passport'] },
  'BG': { country_code: 'BG', minimum_age: 18, requires_id: false, allowed_documents: ['id_card', 'passport'] },
  'HR': { country_code: 'HR', minimum_age: 18, requires_id: false, allowed_documents: ['id_card', 'passport'] },
  'CY': { country_code: 'CY', minimum_age: 17, requires_id: false, allowed_documents: ['id_card', 'passport'] },
  'CZ': { country_code: 'CZ', minimum_age: 18, requires_id: false, allowed_documents: ['id_card', 'passport'] },
  'DK': { country_code: 'DK', minimum_age: 16, requires_id: false, allowed_documents: ['id_card', 'passport'] },
  'EE': { country_code: 'EE', minimum_age: 18, requires_id: false, allowed_documents: ['id_card', 'passport'] },
  'FI': { country_code: 'FI', minimum_age: 18, requires_id: false, allowed_documents: ['id_card', 'passport'] },
  'FR': { country_code: 'FR', minimum_age: 18, requires_id: false, allowed_documents: ['id_card', 'passport', 'drivers_license'] },
  'DE': { country_code: 'DE', minimum_age: 16, requires_id: false, allowed_documents: ['id_card', 'passport'] },
  'GR': { country_code: 'GR', minimum_age: 17, requires_id: false, allowed_documents: ['id_card', 'passport'] },
  'HU': { country_code: 'HU', minimum_age: 18, requires_id: false, allowed_documents: ['id_card', 'passport'] },
  'IE': { country_code: 'IE', minimum_age: 18, requires_id: false, allowed_documents: ['id_card', 'passport'] },
  'IT': { country_code: 'IT', minimum_age: 18, requires_id: false, allowed_documents: ['id_card', 'passport'] },
  'LV': { country_code: 'LV', minimum_age: 18, requires_id: false, allowed_documents: ['id_card', 'passport'] },
  'LT': { country_code: 'LT', minimum_age: 20, requires_id: false, allowed_documents: ['id_card', 'passport'] },
  'LU': { country_code: 'LU', minimum_age: 16, requires_id: false, allowed_documents: ['id_card', 'passport'] },
  'MT': { country_code: 'MT', minimum_age: 17, requires_id: false, allowed_documents: ['id_card', 'passport'] },
  'NL': { country_code: 'NL', minimum_age: 18, requires_id: false, allowed_documents: ['id_card', 'passport'] },
  'PL': { country_code: 'PL', minimum_age: 18, requires_id: false, allowed_documents: ['id_card', 'passport'] },
  'PT': { country_code: 'PT', minimum_age: 18, requires_id: false, allowed_documents: ['id_card', 'passport'] },
  'RO': { country_code: 'RO', minimum_age: 18, requires_id: false, allowed_documents: ['id_card', 'passport'] },
  'SK': { country_code: 'SK', minimum_age: 18, requires_id: false, allowed_documents: ['id_card', 'passport'] },
  'SI': { country_code: 'SI', minimum_age: 18, requires_id: false, allowed_documents: ['id_card', 'passport'] },
  'ES': { country_code: 'ES', minimum_age: 18, requires_id: false, allowed_documents: ['id_card', 'passport'] },
  'SE': { country_code: 'SE', minimum_age: 20, requires_id: false, allowed_documents: ['id_card', 'passport'] },

  // Other countries with strict requirements
  'US': {
    country_code: 'US',
    minimum_age: 21,
    requires_id: true,
    allowed_documents: ['drivers_license', 'passport', 'id_card'],
    additional_restrictions: ['shipping_restrictions', 'state_compliance_required']
  },
  'CA': {
    country_code: 'CA',
    minimum_age: 19,
    requires_id: true,
    allowed_documents: ['drivers_license', 'passport', 'id_card'],
    additional_restrictions: ['province_compliance_required']
  },
  'AU': {
    country_code: 'AU',
    minimum_age: 18,
    requires_id: true,
    allowed_documents: ['drivers_license', 'passport', 'id_card']
  },
  'NO': {
    country_code: 'NO',
    minimum_age: 18,
    requires_id: false,
    allowed_documents: ['id_card', 'passport'],
    additional_restrictions: ['monopoly_compliance']
  },
  'CH': { country_code: 'CH', minimum_age: 16, requires_id: false, allowed_documents: ['id_card', 'passport'] },
  'GB': { country_code: 'GB', minimum_age: 18, requires_id: false, allowed_documents: ['id_card', 'passport', 'drivers_license'] },
}

export class AgeVerificationService {
  private requirements: Record<string, CountryAgeRequirement>

  constructor(customRequirements?: Record<string, CountryAgeRequirement>) {
    this.requirements = customRequirements || WINE_AGE_REQUIREMENTS
  }

  /**
   * Verify age for wine purchase
   */
  verifyAge(input: AgeVerificationInput): AgeVerificationResult {
    const errors: string[] = []
    const warnings: string[] = []

    // Parse birth date
    const birthDate = new Date(input.birthDate)
    if (isNaN(birthDate.getTime())) {
      errors.push('Invalid birth date provided')
      return this.createFailedResult(errors, warnings)
    }

    // Calculate age
    const age = this.calculateAge(birthDate)

    // Get country requirements
    const countryCode = (input.country || 'FR').toUpperCase()
    const requirements = this.getCountryRequirements(countryCode)

    // Validate minimum age
    const isLegalAge = age >= requirements.minimum_age

    if (!isLegalAge) {
      errors.push(`You must be at least ${requirements.minimum_age} years old to purchase wine`)
    }

    // Check document requirements
    let verificationLevel: AgeVerificationResult['verificationLevel'] = 'self_declared'

    if (requirements.requires_id) {
      if (!input.documentType || !input.documentNumber) {
        errors.push('Identity document verification is required for this country')
      } else if (!requirements.allowed_documents.includes(input.documentType)) {
        errors.push(`Document type ${input.documentType} is not accepted for this country`)
      } else {
        verificationLevel = 'document_verified'

        // Validate document format
        const documentValidation = this.validateDocument(
          input.documentType,
          input.documentNumber,
          countryCode
        )

        if (!documentValidation.isValid) {
          errors.push(`Invalid ${input.documentType} format`)
        }
      }
    }

    // Check additional restrictions
    if (requirements.additional_restrictions) {
      for (const restriction of requirements.additional_restrictions) {
        warnings.push(this.getRestrictionWarning(restriction, countryCode))
      }
    }

    // Age-specific warnings
    if (age < 25 && isLegalAge) {
      warnings.push('Additional age verification may be required upon delivery')
    }

    // Set expiration for verification (24 hours for self-declared, 30 days for document verified)
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + (verificationLevel === 'self_declared' ? 24 : 24 * 30))

    return {
      isValid: errors.length === 0,
      age,
      isLegalAge,
      countryMinimumAge: requirements.minimum_age,
      errors,
      warnings,
      verificationLevel,
      verifiedAt: new Date(),
      expiresAt
    }
  }

  /**
   * Calculate accurate age accounting for birth date
   */
  private calculateAge(birthDate: Date): number {
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }

    return age
  }

  /**
   * Get country-specific age requirements
   */
  private getCountryRequirements(countryCode: string): CountryAgeRequirement {
    return this.requirements[countryCode] || {
      country_code: countryCode,
      minimum_age: 18, // Default to 18
      requires_id: false,
      allowed_documents: ['id_card', 'passport']
    }
  }

  /**
   * Validate document format (basic validation)
   */
  private validateDocument(
    type: string,
    number: string,
    countryCode: string
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!number || number.trim().length === 0) {
      errors.push('Document number is required')
      return { isValid: false, errors }
    }

    // Remove spaces and special characters for validation
    const cleanNumber = number.replace(/[\s-]/g, '').toUpperCase()

    switch (type) {
      case 'passport':
        // Basic passport format validation
        if (cleanNumber.length < 6 || cleanNumber.length > 12) {
          errors.push('Passport number must be 6-12 characters')
        }
        break

      case 'drivers_license':
        // Country-specific drivers license validation
        if (countryCode === 'FR' && !/^[0-9]{12}$/.test(cleanNumber)) {
          errors.push('French drivers license must be 12 digits')
        } else if (countryCode === 'GB' && cleanNumber.length !== 16) {
          errors.push('UK drivers license must be 16 characters')
        } else if (cleanNumber.length < 5) {
          errors.push('Drivers license number too short')
        }
        break

      case 'id_card':
        // Basic ID card validation
        if (cleanNumber.length < 5 || cleanNumber.length > 20) {
          errors.push('ID card number must be 5-20 characters')
        }
        break

      default:
        errors.push('Unknown document type')
    }

    return { isValid: errors.length === 0, errors }
  }

  /**
   * Get warning message for country restrictions
   */
  private getRestrictionWarning(restriction: string, countryCode: string): string {
    const warnings: Record<string, string> = {
      'shipping_restrictions': 'Additional shipping restrictions may apply',
      'state_compliance_required': 'State-specific alcohol laws may apply',
      'province_compliance_required': 'Provincial alcohol laws may apply',
      'monopoly_compliance': 'State monopoly regulations apply'
    }

    return warnings[restriction] || 'Additional restrictions may apply'
  }

  /**
   * Create failed verification result
   */
  private createFailedResult(errors: string[], warnings: string[]): AgeVerificationResult {
    return {
      isValid: false,
      age: 0,
      isLegalAge: false,
      countryMinimumAge: 18,
      errors,
      warnings,
      verificationLevel: 'self_declared',
      verifiedAt: new Date()
    }
  }

  /**
   * Check if verification is still valid
   */
  isVerificationValid(verificationResult: AgeVerificationResult): boolean {
    if (!verificationResult.isValid) return false
    if (!verificationResult.expiresAt) return true

    return new Date() < verificationResult.expiresAt
  }

  /**
   * Get all supported countries
   */
  getSupportedCountries(): CountryAgeRequirement[] {
    return Object.values(this.requirements)
  }

  /**
   * Check if country allows wine purchases
   */
  isCountrySupported(countryCode: string): boolean {
    return countryCode.toUpperCase() in this.requirements
  }

  /**
   * Get minimum age for country
   */
  getMinimumAge(countryCode: string): number {
    const requirements = this.getCountryRequirements(countryCode.toUpperCase())
    return requirements.minimum_age
  }

  /**
   * Check if document verification is required
   */
  requiresDocumentVerification(countryCode: string): boolean {
    const requirements = this.getCountryRequirements(countryCode.toUpperCase())
    return requirements.requires_id
  }
}

// Export singleton instance
export const ageVerificationService = new AgeVerificationService()

// Helper functions
export const verifyAge = (input: AgeVerificationInput): AgeVerificationResult =>
  ageVerificationService.verifyAge(input)

export const isLegalDrinkingAge = (birthDate: Date | string, country = 'FR'): boolean => {
  const result = ageVerificationService.verifyAge({ birthDate, country })
  return result.isLegalAge
}

export const getMinimumDrinkingAge = (country: string): number =>
  ageVerificationService.getMinimumAge(country)

export const requiresIdVerification = (country: string): boolean =>
  ageVerificationService.requiresDocumentVerification(country)

// Browser storage helpers for verification state
export const saveVerificationToStorage = (result: AgeVerificationResult): void => {
  if (typeof window !== 'undefined') {
    const data = {
      ...result,
      verifiedAt: result.verifiedAt.toISOString(),
      expiresAt: result.expiresAt?.toISOString()
    }
    localStorage.setItem('wine_age_verification', JSON.stringify(data))
  }
}

export const getVerificationFromStorage = (): AgeVerificationResult | null => {
  if (typeof window === 'undefined') return null

  try {
    const stored = localStorage.getItem('wine_age_verification')
    if (!stored) return null

    const data = JSON.parse(stored)
    const result: AgeVerificationResult = {
      ...data,
      verifiedAt: new Date(data.verifiedAt),
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined
    }

    // Check if verification is still valid
    if (!ageVerificationService.isVerificationValid(result)) {
      localStorage.removeItem('wine_age_verification')
      return null
    }

    return result
  } catch (error) {
    console.error('Error reading age verification from storage:', error)
    localStorage.removeItem('wine_age_verification')
    return null
  }
}

export const clearVerificationFromStorage = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('wine_age_verification')
  }
}

// Validation helpers for forms
export const validateBirthDate = (date: string | Date): string[] => {
  const errors: string[] = []
  const birthDate = new Date(date)

  if (isNaN(birthDate.getTime())) {
    errors.push('Please enter a valid birth date')
    return errors
  }

  const today = new Date()
  if (birthDate > today) {
    errors.push('Birth date cannot be in the future')
  }

  const maxAge = 120
  const minYear = today.getFullYear() - maxAge
  if (birthDate.getFullYear() < minYear) {
    errors.push('Please enter a realistic birth date')
  }

  return errors
}

export const formatAgeVerificationError = (errors: string[]): string => {
  if (errors.length === 0) return ''
  if (errors.length === 1) return errors[0]

  return `${errors.slice(0, -1).join(', ')}, and ${errors[errors.length - 1]}`
}