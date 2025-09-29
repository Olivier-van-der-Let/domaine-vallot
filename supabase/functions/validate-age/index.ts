import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface AgeVerificationRequest {
  birthDay: number
  birthMonth: number
  birthYear: number
  country?: string
}

interface AgeVerificationResponse {
  valid: boolean
  age: number
  errors?: string[]
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { birthDay, birthMonth, birthYear, country = 'FR' }: AgeVerificationRequest = await req.json()

    // Validate input parameters
    if (!birthDay || !birthMonth || !birthYear) {
      return new Response(
        JSON.stringify({
          valid: false,
          age: 0,
          errors: ['Birth date fields are required']
        } as AgeVerificationResponse),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      )
    }

    // Validate date ranges
    if (birthDay < 1 || birthDay > 31) {
      return new Response(
        JSON.stringify({
          valid: false,
          age: 0,
          errors: ['Invalid birth day']
        } as AgeVerificationResponse),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      )
    }

    if (birthMonth < 1 || birthMonth > 12) {
      return new Response(
        JSON.stringify({
          valid: false,
          age: 0,
          errors: ['Invalid birth month']
        } as AgeVerificationResponse),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      )
    }

    const currentYear = new Date().getFullYear()
    if (birthYear < 1900 || birthYear > currentYear) {
      return new Response(
        JSON.stringify({
          valid: false,
          age: 0,
          errors: ['Invalid birth year']
        } as AgeVerificationResponse),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      )
    }

    // Create birth date and validate it's a real date
    const birthDate = new Date(birthYear, birthMonth - 1, birthDay)

    if (
      birthDate.getDate() !== birthDay ||
      birthDate.getMonth() !== birthMonth - 1 ||
      birthDate.getFullYear() !== birthYear
    ) {
      return new Response(
        JSON.stringify({
          valid: false,
          age: 0,
          errors: ['Invalid birth date - please check the date is correct']
        } as AgeVerificationResponse),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      )
    }

    // Check if birth date is in the future
    const today = new Date()
    if (birthDate > today) {
      return new Response(
        JSON.stringify({
          valid: false,
          age: 0,
          errors: ['Birth date cannot be in the future']
        } as AgeVerificationResponse),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      )
    }

    // Calculate precise age
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }

    // Get minimum age for country (default to 18 for wine)
    const getMinimumAge = (countryCode: string): number => {
      const minimumAges: Record<string, number> = {
        'US': 21, // United States
        'FR': 18, // France
        'DE': 16, // Germany (beer/wine), 18 (spirits) - we use 18 for wine
        'IT': 18, // Italy
        'ES': 18, // Spain
        'BE': 16, // Belgium (supervised), 18 (unsupervised) - we use 18
        'NL': 18, // Netherlands
        'AT': 16, // Austria (beer/wine), 18 (spirits) - we use 18 for wine
        'PT': 18, // Portugal
        'LU': 16, // Luxembourg (beer/wine), 18 (spirits) - we use 18 for wine
        'GB': 18, // United Kingdom
        'IE': 18, // Ireland
        'DK': 18, // Denmark
        'SE': 20, // Sweden
        'NO': 18, // Norway
        'FI': 18, // Finland
      }
      return minimumAges[countryCode] || 18 // Default to 18
    }

    const minimumAge = getMinimumAge(country)
    const isValid = age >= minimumAge

    const response: AgeVerificationResponse = {
      valid: isValid,
      age,
      ...(isValid ? {} : {
        errors: [`You must be at least ${minimumAge} years old to purchase wine`]
      })
    }

    return new Response(
      JSON.stringify(response),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('Age verification error:', error)

    return new Response(
      JSON.stringify({
        valid: false,
        age: 0,
        errors: ['Internal server error during age verification']
      } as AgeVerificationResponse),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})