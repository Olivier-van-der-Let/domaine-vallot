import { LoginPage } from '@/components/auth/LoginForm'

interface LoginPageProps {
  params: {
    locale: string
  }
}

export default function Login({ params }: LoginPageProps) {
  return <LoginPage params={params} />
}