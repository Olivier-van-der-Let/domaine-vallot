import { RegisterPage } from '@/components/auth/RegisterForm'

interface RegisterPageProps {
  params: {
    locale: string
  }
}

export default function Register({ params }: RegisterPageProps) {
  return <RegisterPage params={params} />
}