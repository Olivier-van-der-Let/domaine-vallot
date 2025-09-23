import { NextRequest, NextResponse } from 'next/server'
import { verifyAge } from '@/lib/verification/age-validator'
import { ageVerificationSchema, validateSchema } from '@/lib/validators/schemas'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Convert day/month/year to birthDate
    const { birthDay, birthMonth, birthYear, ...rest } = body
    const birthDate = new Date(birthYear, birthMonth - 1, birthDay)

    const validationData = {
      birthDate: birthDate.toISOString(),
      ...rest
    }

    const verification = verifyAge(validationData)

    return NextResponse.json({
      verification: {
        ...verification,
        verifiedAt: verification.verifiedAt.toISOString(),
        expiresAt: verification.expiresAt?.toISOString()
      }
    })

  } catch (error) {
    console.error('Age verification error:', error)
    return NextResponse.json(
      { error: 'Age verification failed' },
      { status: 500 }
    )
  }
}