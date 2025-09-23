import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerSupabaseClient } from '@/lib/supabase/server'
import { forgotPasswordSchema, validateSchema } from '@/lib/validators/schemas'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate request body
    const validation = validateSchema(forgotPasswordSchema, body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.errors },
        { status: 400 }
      )
    }

    const { email } = validation.data!
    const supabase = createRouteHandlerSupabaseClient()

    // Check if user exists
    const { data: user } = await supabase
      .from('customers')
      .select('email')
      .eq('email', email)
      .single()

    // Always return success to prevent email enumeration attacks
    // Even if the user doesn't exist, we'll return a success message
    if (!user) {
      return NextResponse.json({
        success: true,
        message: 'If an account with that email exists, we have sent a password reset link.'
      })
    }

    // Send password reset email
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3002'}/reset-password`
    })

    if (error) {
      console.error('Password reset email error:', error)
      // Still return success to prevent information leakage
      return NextResponse.json({
        success: true,
        message: 'If an account with that email exists, we have sent a password reset link.'
      })
    }

    return NextResponse.json({
      success: true,
      message: 'If an account with that email exists, we have sent a password reset link.'
    })

  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}