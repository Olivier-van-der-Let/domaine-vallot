import { ResetPasswordPage } from '@/components/auth/ResetPasswordForm'

interface ResetPasswordPageProps {
  params: {
    locale: string
  }
  searchParams: {
    token?: string
  }
}

export default function ResetPassword({ params, searchParams }: ResetPasswordPageProps) {
  return <ResetPasswordPage params={params} searchParams={searchParams} />
}