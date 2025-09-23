import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { registerSchema, validateSchema } from '@/lib/validators/schemas'

export async function POST(request: NextRequest) {
  try {
    let body
    try {
      body = await request.json()
    } catch (jsonError) {
      console.error('JSON parsing error:', jsonError)
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    console.log('Request body received:', JSON.stringify(body, null, 2))

    // Validate request body
    const validation = validateSchema(registerSchema, body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.errors },
        { status: 400 }
      )
    }

    const data = validation.data!

    // Create response to handle cookies
    const response = NextResponse.json({ success: true })

    // Create Supabase client with proper cookie handling
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name) {
            return request.cookies.get(name)?.value
          },
          set(name, value, options) {
            request.cookies.set(name, value)
            response.cookies.set(name, value, options)
          },
          remove(name, options) {
            request.cookies.set(name, '', { ...options, maxAge: 0 })
            response.cookies.set(name, '', { ...options, maxAge: 0 })
          },
        },
      }
    )

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('customers')
      .select('email')
      .eq('email', data.email)
      .single()

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      )
    }

    // Validate age (must be 18+)
    const birthDate = new Date(data.birthDate)
    const age = new Date().getFullYear() - birthDate.getFullYear()
    if (age < 18) {
      return NextResponse.json(
        { error: 'You must be at least 18 years old to register' },
        { status: 400 }
      )
    }

    // Validate VAT number if business account
    if (data.isBusiness && data.vatNumber) {
      const vatRegex = /^[A-Z]{2}[0-9A-Z]+$/
      if (!vatRegex.test(data.vatNumber)) {
        return NextResponse.json(
          { error: 'Invalid VAT number format' },
          { status: 400 }
        )
      }
    }

    // Sign up with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          first_name: data.firstName,
          last_name: data.lastName,
          preferred_language: data.preferredLanguage,
          is_business: data.isBusiness || false
        }
      }
    })

    if (authError || !authData.user) {
      console.error('Supabase auth error:', authError)
      return NextResponse.json(
        { error: authError?.message || 'Registration failed' },
        { status: 400 }
      )
    }

    // Create customer profile
    const customerData = {
      id: authData.user.id,
      email: data.email,
      first_name: data.firstName,
      last_name: data.lastName,
      phone: data.phone || null,
      birth_date: data.birthDate,
      preferred_language: data.preferredLanguage,
      marketing_consent: data.marketingConsent || false,
      newsletter_consent: data.newsletterConsent || false,
      age_verified: true, // Since we validated age during registration
      age_verified_at: new Date().toISOString(),
      age_verification_method: 'manual',
      is_business: data.isBusiness || false,
      company_name: data.companyName || null,
      vat_number: data.vatNumber || null,
      vat_validated: false, // Will be validated separately if provided
      total_orders: 0,
      total_spent_eur: 0
    }

    const { error: profileError } = await supabase
      .from('customers')
      .insert(customerData)

    if (profileError) {
      console.error('Profile creation error:', profileError)
      // If profile creation fails, we should clean up the auth user
      // but Supabase doesn't provide an easy way to do this in the API
      // The user will need to try again or contact support
      return NextResponse.json(
        { error: 'Failed to create user profile. Please try again.' },
        { status: 500 }
      )
    }

    // Send email verification if not already confirmed
    if (!authData.user.email_confirmed_at) {
      const { error: emailError } = await supabase.auth.resend({
        type: 'signup',
        email: data.email
      })

      if (emailError) {
        console.error('Email verification send error:', emailError)
        // Don't fail registration if email send fails
      }
    }

    const userData = {
      id: authData.user.id,
      email: authData.user.email,
      emailVerified: !!authData.user.email_confirmed_at,
      ageVerified: true,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone || '',
      birthDate: data.birthDate,
      preferredLanguage: data.preferredLanguage,
      marketingConsent: data.marketingConsent || false,
      newsletterConsent: data.newsletterConsent || false,
      isBusiness: data.isBusiness || false,
      companyName: data.companyName || null,
      vatNumber: data.vatNumber || null,
      vatValidated: false,
      totalOrders: 0,
      totalSpentEur: 0,
      createdAt: authData.user.created_at,
      updatedAt: authData.user.created_at
    }

    // Update the response with user data
    const successResponse = NextResponse.json({
      success: true,
      data: userData,
      message: authData.user.email_confirmed_at
        ? 'Registration successful'
        : 'Registration successful. Please check your email to verify your account.'
    })

    // Copy cookies from the original response
    response.cookies.getAll().forEach(cookie => {
      successResponse.cookies.set(cookie.name, cookie.value, cookie)
    })

    return successResponse

  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}