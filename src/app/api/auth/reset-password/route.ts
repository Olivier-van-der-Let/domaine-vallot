import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerSupabaseClient } from '@/lib/supabase/server'
import { resetPasswordSchema, validateSchema } from '@/lib/validators/schemas'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate request body
    const validation = validateSchema(resetPasswordSchema, body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.errors },
        { status: 400 }
      )
    }

    const { token, password } = validation.data!
    const supabase = createRouteHandlerSupabaseClient()

    // Verify the reset token and update password
    const { data, error } = await supabase.auth.updateUser({
      password: password
    })

    if (error) {
      console.error('Password reset error:', error)

      // Handle specific error cases
      if (error.message.includes('Invalid refresh token')) {
        return NextResponse.json(
          { error: 'Invalid or expired reset token. Please request a new password reset.' },
          { status: 400 }
        )
      }

      if (error.message.includes('Password should be')) {
        return NextResponse.json(
          { error: 'Password does not meet security requirements.' },
          { status: 400 }
        )
      }

      return NextResponse.json(
        { error: 'Failed to reset password. Please try again.' },
        { status: 400 }
      )
    }

    if (!data.user) {
      return NextResponse.json(
        { error: 'Invalid reset token or session expired.' },
        { status: 401 }
      )
    }

    // Update the customer's last update timestamp
    const { error: updateError } = await supabase
      .from('customers')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', data.user.id)

    if (updateError) {
      console.error('Customer update error:', updateError)
      // Don't fail the request if this update fails
    }

    return NextResponse.json({
      success: true,
      message: 'Password has been successfully reset.'
    })

  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}