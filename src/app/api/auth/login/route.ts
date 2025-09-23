import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { loginSchema } from '@/lib/validators/schemas'
import { validateSchema } from '@/lib/validators/schemas'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate request body
    const validation = validateSchema(loginSchema, body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.errors },
        { status: 400 }
      )
    }

    const { email, password } = validation.data!

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

    // Sign in with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error || !data.user) {
      console.error('Supabase auth error:', error)
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('customers')
      .select('*')
      .eq('id', data.user.id)
      .single()

    if (profileError) {
      console.error('Profile fetch error:', profileError)
      // Still return success if auth worked but profile fetch failed
    }

    const userData = {
      id: data.user.id,
      email: data.user.email,
      emailVerified: !!data.user.email_confirmed_at,
      ageVerified: profile?.age_verified || false,
      firstName: profile?.first_name || '',
      lastName: profile?.last_name || '',
      phone: profile?.phone || '',
      birthDate: profile?.birth_date || null,
      preferredLanguage: profile?.preferred_language || 'en',
      marketingConsent: profile?.marketing_consent || false,
      newsletterConsent: profile?.newsletter_consent || false,
      isBusiness: profile?.is_business || false,
      companyName: profile?.company_name || null,
      vatNumber: profile?.vat_number || null,
      vatValidated: profile?.vat_validated || false,
      totalOrders: profile?.total_orders || 0,
      totalSpentEur: profile?.total_spent_eur || 0,
      createdAt: profile?.created_at || data.user.created_at,
      updatedAt: profile?.updated_at || data.user.updated_at || data.user.created_at
    }

    // Update the response with user data
    const successResponse = NextResponse.json({
      success: true,
      data: userData,
      message: 'Login successful'
    })

    // Copy cookies from the original response
    response.cookies.getAll().forEach(cookie => {
      successResponse.cookies.set(cookie.name, cookie.value, cookie)
    })

    return successResponse

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}