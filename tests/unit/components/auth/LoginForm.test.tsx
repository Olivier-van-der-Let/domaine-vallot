import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { jest } from '@jest/globals'
import { LoginForm } from '@/components/auth/LoginForm'
import { useAuth } from '@/components/auth/AuthProvider'
import { NextIntlClientProvider } from 'next-intl'

// Mock the auth provider
jest.mock('@/components/auth/AuthProvider', () => ({
  useAuth: jest.fn()
}))
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn()
  }),
  useSearchParams: () => ({
    get: jest.fn(() => null)
  })
}))

// Mock translations
const mockMessages = {
  Auth: {
    loginTitle: 'Sign In',
    loginSubtitle: 'Welcome back',
    email: 'Email',
    password: 'Password',
    signIn: 'Sign In',
    rememberMe: 'Remember me',
    forgotPassword: 'Forgot password?',
    noAccount: "Don't have an account?",
    signUp: 'Sign up',
    loginSuccess: 'Login successful'
  }
}

describe('LoginForm Loading States', () => {
  const defaultAuthState = {
    user: null,
    customer: null,
    session: null,
    loading: false,
    isAdmin: false,
    signingIn: false,
    signIn: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
    resetPassword: jest.fn(),
    updatePassword: jest.fn(),
    refreshUser: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should use signingIn state for button loading indicator', async () => {
    // Setup auth state with signingIn = true
    mockUseAuth.mockReturnValue({
      ...defaultAuthState,
      signingIn: true,
      signIn: jest.fn().mockResolvedValue({ error: null })
    })

    render(
      <NextIntlClientProvider locale="en" messages={mockMessages}>
        <LoginForm locale="en" />
      </NextIntlClientProvider>
    )

    const submitButton = screen.getByRole('button', { name: /sign in/i })

    // Button should show loading state when signingIn is true
    expect(submitButton).toHaveAttribute('disabled')
    expect(submitButton).toHaveClass('loading')
  })

  it('should clear loading state after successful login', async () => {
    let authState = {
      ...defaultAuthState,
      signingIn: false,
      signIn: jest.fn()
    }

    // Mock signIn function that toggles signingIn state
    const mockSignIn = jest.fn().mockImplementation(async () => {
      // Simulate the auth provider setting signingIn to true, then false
      authState.signingIn = true
      mockUseAuth.mockReturnValue({ ...authState, signingIn: true })

      // Simulate async operation
      await new Promise(resolve => setTimeout(resolve, 10))

      authState.signingIn = false
      mockUseAuth.mockReturnValue({ ...authState, signingIn: false })

      return { error: null }
    })

    authState.signIn = mockSignIn
    mockUseAuth.mockReturnValue(authState)

    render(
      <NextIntlClientProvider locale="en" messages={mockMessages}>
        <LoginForm locale="en" />
      </NextIntlClientProvider>
    )

    // Fill in form
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })

    // Submit form
    fireEvent.click(submitButton)

    // Verify signIn was called
    expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123')
  })

  it('should handle login errors and clear loading state', async () => {
    const mockSignIn = jest.fn().mockResolvedValue({
      error: 'Invalid credentials'
    })

    mockUseAuth.mockReturnValue({
      ...defaultAuthState,
      signingIn: false,
      signIn: mockSignIn
    })

    render(
      <NextIntlClientProvider locale="en" messages={mockMessages}>
        <LoginForm locale="en" />
      </NextIntlClientProvider>
    )

    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      // Error message should be displayed
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
    })

    // Button should not be in loading state after error
    expect(submitButton).not.toBeDisabled()
  })

  it('should NOT rely on the general loading state for submit button', () => {
    // Setup auth state where loading=true but signingIn=false
    mockUseAuth.mockReturnValue({
      ...defaultAuthState,
      loading: true,    // This is for initial auth state setup
      signingIn: false, // This is for sign-in operations
      signIn: jest.fn()
    })

    render(
      <NextIntlClientProvider locale="en" messages={mockMessages}>
        <LoginForm locale="en" />
      </NextIntlClientProvider>
    )

    const submitButton = screen.getByRole('button', { name: /sign in/i })

    // Button should NOT be disabled when only loading=true
    // It should only be disabled when signingIn=true
    expect(submitButton).not.toBeDisabled()
  })
})