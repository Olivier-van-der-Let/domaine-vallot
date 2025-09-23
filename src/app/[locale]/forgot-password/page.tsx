import { ForgotPasswordPage } from '@/components/auth/ForgotPasswordForm'

interface ForgotPasswordPageProps {
  params: {
    locale: string
  }
}

export default function ForgotPassword({ params }: ForgotPasswordPageProps) {
  return <ForgotPasswordPage params={params} />
}