'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { VATCalculation, VATRate } from '@/types'

interface UseVATOptions {
  amount?: number
  countryCode?: string
  productCategory?: string
  autoCalculate?: boolean
}

interface UseVATReturn {
  // Calculation result
  calculation: VATCalculation | null
  loading: boolean
  error: string | null

  // Actions
  calculate: (amount: number, countryCode: string, productCategory?: string) => Promise<VATCalculation | null>
  reset: () => void

  // Computed values
  netAmount: number
  vatAmount: number
  grossAmount: number
  vatRate: number
  isReverseCharge: boolean
  isValid: boolean
}

export function useVAT(options: UseVATOptions = {}): UseVATReturn {
  const {
    amount,
    countryCode,
    productCategory = 'wine',
    autoCalculate = false
  } = options

  const [calculation, setCalculation] = useState<VATCalculation | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Calculate VAT
  const calculate = useCallback(async (
    calcAmount: number,
    calcCountryCode: string,
    calcProductCategory: string = 'wine'
  ): Promise<VATCalculation | null> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/vat/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: calcAmount,
          countryCode: calcCountryCode,
          productCategory: calcProductCategory
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'VAT calculation failed')
      }

      const result = await response.json()
      const calcResult = result.data

      setCalculation(calcResult)
      return calcResult
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'VAT calculation failed'
      setError(errorMessage)
      setCalculation(null)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  // Reset calculation
  const reset = useCallback(() => {
    setCalculation(null)
    setError(null)
  }, [])

  // Auto-calculate when dependencies change
  useEffect(() => {
    if (autoCalculate && amount && countryCode) {
      calculate(amount, countryCode, productCategory)
    }
  }, [autoCalculate, amount, countryCode, productCategory, calculate])

  // Computed values
  const netAmount = calculation?.netAmount || 0
  const vatAmount = calculation?.vatAmount || 0
  const grossAmount = calculation?.grossAmount || 0
  const vatRate = calculation?.vatRate || 0
  const isReverseCharge = calculation?.reverseCharge || false
  const isValid = calculation !== null && !error

  return {
    // Calculation result
    calculation,
    loading,
    error,

    // Actions
    calculate,
    reset,

    // Computed values
    netAmount,
    vatAmount,
    grossAmount,
    vatRate,
    isReverseCharge,
    isValid
  }
}

// Hook for VAT rates lookup
export function useVATRates() {
  const [rates, setRates] = useState<VATRate[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchRates = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/vat/rates')

      if (!response.ok) {
        throw new Error('Failed to fetch VAT rates')
      }

      const result = await response.json()
      setRates(result.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load VAT rates')
      setRates([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRates()
  }, [fetchRates])

  // Get rate for specific country and product
  const getRateForCountry = useCallback((countryCode: string, productCategory: string = 'wine') => {
    return rates.find(rate =>
      rate.countryCode === countryCode &&
      rate.productCategory === productCategory &&
      rate.appliesToWine
    )
  }, [rates])

  // Get all countries with wine VAT rates
  const getCountriesWithWineRates = useCallback(() => {
    return Array.from(
      new Set(
        rates
          .filter(rate => rate.appliesToWine)
          .map(rate => rate.countryCode)
      )
    ).sort()
  }, [rates])

  return {
    rates,
    loading,
    error,
    refetch: fetchRates,
    getRateForCountry,
    getCountriesWithWineRates
  }
}

// Hook for cart VAT calculation
export function useCartVAT(cartItems: Array<{ productId: string; quantity: number; unitPrice: number }>, countryCode?: string) {
  const [calculations, setCalculations] = useState<Map<string, VATCalculation>>(new Map())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const calculateCartVAT = useCallback(async () => {
    if (!countryCode || cartItems.length === 0) {
      setCalculations(new Map())
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Calculate VAT for each line item
      const calculationPromises = cartItems.map(async (item) => {
        const lineTotal = item.quantity * item.unitPrice

        const response = await fetch('/api/vat/calculate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: lineTotal,
            countryCode,
            productCategory: 'wine'
          })
        })

        if (!response.ok) {
          throw new Error(`VAT calculation failed for item ${item.productId}`)
        }

        const result = await response.json()
        return {
          productId: item.productId,
          calculation: result.data
        }
      })

      const results = await Promise.all(calculationPromises)
      const newCalculations = new Map()

      results.forEach(({ productId, calculation }) => {
        newCalculations.set(productId, calculation)
      })

      setCalculations(newCalculations)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Cart VAT calculation failed')
      setCalculations(new Map())
    } finally {
      setLoading(false)
    }
  }, [cartItems, countryCode])

  useEffect(() => {
    calculateCartVAT()
  }, [calculateCartVAT])

  // Computed totals
  const totals = useMemo(() => {
    const calculationArray = Array.from(calculations.values())

    const totalNet = calculationArray.reduce((sum, calc) => sum + calc.netAmount, 0)
    const totalVAT = calculationArray.reduce((sum, calc) => sum + calc.vatAmount, 0)
    const totalGross = calculationArray.reduce((sum, calc) => sum + calc.grossAmount, 0)

    // Average VAT rate (weighted by amount)
    const avgVATRate = totalNet > 0 ? totalVAT / totalNet : 0

    return {
      netAmount: totalNet,
      vatAmount: totalVAT,
      grossAmount: totalGross,
      vatRate: avgVATRate,
      reverseCharge: calculationArray.some(calc => calc.reverseCharge)
    }
  }, [calculations])

  return {
    calculations,
    totals,
    loading,
    error,
    recalculate: calculateCartVAT,
    getCalculationForProduct: (productId: string) => calculations.get(productId) || null
  }
}

// Hook for shipping VAT calculation
export function useShippingVAT(shippingAmount: number, countryCode?: string) {
  return useVAT({
    amount: shippingAmount,
    countryCode,
    productCategory: 'shipping',
    autoCalculate: true
  })
}

// Hook for VAT validation (business customers)
export function useVATValidation() {
  const [validationResults, setValidationResults] = useState<Map<string, {
    isValid: boolean
    companyName?: string
    address?: string
    isActive?: boolean
    validatedAt: string
  }>>(new Map())
  const [loading, setLoading] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)

  const validateVATNumber = useCallback(async (vatNumber: string, countryCode: string) => {
    if (!vatNumber || !countryCode) return null

    const key = `${countryCode}-${vatNumber}`

    // Check if already validating
    if (loading.has(key)) return null

    // Check cache (24h expiry)
    const cached = validationResults.get(key)
    if (cached) {
      const age = Date.now() - new Date(cached.validatedAt).getTime()
      if (age < 24 * 60 * 60 * 1000) { // 24 hours
        return cached
      }
    }

    try {
      setLoading(prev => new Set(prev).add(key))
      setError(null)

      const response = await fetch('/api/vat/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vatNumber,
          countryCode
        })
      })

      if (!response.ok) {
        throw new Error('VAT validation failed')
      }

      const result = await response.json()
      const validation = {
        ...result.data,
        validatedAt: new Date().toISOString()
      }

      setValidationResults(prev => new Map(prev).set(key, validation))
      return validation
    } catch (err) {
      setError(err instanceof Error ? err.message : 'VAT validation failed')
      return null
    } finally {
      setLoading(prev => {
        const newSet = new Set(prev)
        newSet.delete(key)
        return newSet
      })
    }
  }, [validationResults, loading])

  const isValidating = useCallback((vatNumber: string, countryCode: string) => {
    return loading.has(`${countryCode}-${vatNumber}`)
  }, [loading])

  const getValidation = useCallback((vatNumber: string, countryCode: string) => {
    return validationResults.get(`${countryCode}-${vatNumber}`) || null
  }, [validationResults])

  return {
    validateVATNumber,
    isValidating,
    getValidation,
    error,
    clearError: () => setError(null)
  }
}

// Hook for VAT exemption checking
export function useVATExemption(customerData?: {
  countryCode?: string
  vatNumber?: string
  isBusiness?: boolean
}) {
  const isEUCountry = useCallback((countryCode: string) => {
    const euCountries = [
      'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
      'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
      'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE'
    ]
    return euCountries.includes(countryCode)
  }, [])

  const isReverseChargeApplicable = useMemo(() => {
    if (!customerData?.countryCode || !customerData?.isBusiness) {
      return false
    }

    // Reverse charge applies for B2B sales to other EU countries
    // when customer has valid VAT number
    return (
      customerData.countryCode !== 'FR' && // Not domestic
      isEUCountry(customerData.countryCode) && // EU country
      customerData.isBusiness && // Business customer
      customerData.vatNumber // Has VAT number
    )
  }, [customerData, isEUCountry])

  const isVATExempt = useMemo(() => {
    if (!customerData?.countryCode) {
      return false
    }

    // VAT exempt for:
    // 1. Non-EU countries (export)
    // 2. B2B EU sales with valid VAT (reverse charge)
    return (
      !isEUCountry(customerData.countryCode) || // Non-EU export
      isReverseChargeApplicable // EU B2B reverse charge
    )
  }, [customerData, isEUCountry, isReverseChargeApplicable])

  return {
    isEUCountry: customerData?.countryCode ? isEUCountry(customerData.countryCode) : false,
    isReverseChargeApplicable,
    isVATExempt,
    exemptionReason: isVATExempt
      ? !isEUCountry(customerData?.countryCode || '')
        ? 'export'
        : 'reverse_charge'
      : null
  }
}