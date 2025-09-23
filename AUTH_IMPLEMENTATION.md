# Authentication Flow Implementation for Domaine Vallot

## Overview

This document outlines the comprehensive authentication system implemented for the Domaine Vallot e-commerce wine application. The system provides a secure, user-friendly authentication flow with age verification, internationalization, and mobile-first design.

## Architecture

### Technology Stack
- **Frontend**: Next.js 14+ with App Router
- **Authentication**: Supabase Auth
- **Database**: PostgreSQL via Supabase
- **Forms**: React Hook Form with Zod validation
- **Styling**: Tailwind CSS
- **Internationalization**: next-intl (English/French)
- **TypeScript**: Full type safety

### Key Features
1. **Complete Authentication Flow**
   - User registration with age verification (18+)
   - Email/password login
   - Forgot password flow
   - Password reset functionality
   - Email verification

2. **French Wine E-commerce Specific**
   - Age verification (18+ requirement for wine purchases)
   - Business account support with VAT handling
   - French/English internationalization
   - GDPR compliant data handling

3. **User Experience**
   - Mobile-first responsive design
   - Real-time form validation
   - Clear error messaging
   - Loading states and success feedback
   - Accessibility compliant (WCAG 2.1 AA)

## File Structure

```
src/
├── components/
│   ├── auth/
│   │   ├── AuthProvider.tsx           # Auth context and state management
│   │   ├── LoginForm.tsx              # Login component
│   │   ├── RegisterForm.tsx           # Registration component
│   │   ├── ForgotPasswordForm.tsx     # Forgot password component
│   │   └── ResetPasswordForm.tsx      # Password reset component
│   ├── ui/
│   │   └── form/
│   │       ├── FormField.tsx          # Reusable form components
│   │       └── Button.tsx             # Form button component
│   └── verification/
│       └── AgeVerification.tsx        # Age verification component
├── app/
│   ├── api/
│   │   └── auth/
│   │       ├── login/route.ts         # Login API endpoint
│   │       ├── register/route.ts      # Registration API endpoint
│   │       ├── forgot-password/route.ts # Forgot password API
│   │       └── reset-password/route.ts  # Reset password API
│   └── [locale]/
│       ├── login/page.tsx             # Login page
│       ├── register/page.tsx          # Registration page
│       ├── forgot-password/page.tsx   # Forgot password page
│       └── reset-password/page.tsx    # Reset password page
├── lib/
│   └── validators/
│       └── schemas.ts                 # Zod validation schemas
└── public/
    └── locales/
        ├── en/common.json             # English translations
        └── fr/common.json             # French translations
```

## Components

### 1. AuthProvider (`/src/components/auth/AuthProvider.tsx`)

**Purpose**: Centralized authentication state management using React Context.

**Key Features**:
- Manages user session state
- Handles Supabase auth state changes
- Provides authentication methods
- Route protection logic
- Customer profile integration

**API**:
```typescript
interface AuthContextType {
  user: User | null
  customer: Customer | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error?: string }>
  signUp: (email: string, password: string, metadata?: any) => Promise<{ error?: string }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error?: string }>
  updatePassword: (password: string) => Promise<{ error?: string }>
  refreshUser: () => Promise<void>
}
```

### 2. Form Components

#### LoginForm (`/src/components/auth/LoginForm.tsx`)
- Email/password authentication
- Remember me functionality
- Error handling and validation
- Redirect handling
- Success states

#### RegisterForm (`/src/components/auth/RegisterForm.tsx`)
- User registration with validation
- Business/personal account types
- Age verification integration
- Marketing consent handling
- VAT number validation for business accounts

#### ForgotPasswordForm (`/src/components/auth/ForgotPasswordForm.tsx`)
- Email-based password reset request
- Success confirmation
- Error handling

#### ResetPasswordForm (`/src/components/auth/ResetPasswordForm.tsx`)
- Token-based password reset
- Password strength validation
- Success/error feedback

### 3. UI Components

#### FormField (`/src/components/ui/form/FormField.tsx`)
- Reusable input, textarea, select, and checkbox components
- Built-in validation display
- Password visibility toggles
- Accessibility features

#### Button (`/src/components/ui/form/Button.tsx`)
- Loading states
- Multiple variants (primary, secondary, outline, ghost, danger)
- Full-width option
- Icon support

### 4. Age Verification (`/src/components/verification/AgeVerification.tsx`)
- 18+ age verification for wine purchases
- Date input validation
- Modal and inline variants
- GDPR compliant

## API Routes

### 1. Login (`/src/app/api/auth/login/route.ts`)
- Authenticates users with Supabase
- Returns user profile data
- Handles validation errors

### 2. Register (`/src/app/api/auth/register/route.ts`)
- Creates new user accounts
- Validates age requirements (18+)
- Creates customer profile
- Handles business account data
- Sends email verification

### 3. Forgot Password (`/src/app/api/auth/forgot-password/route.ts`)
- Sends password reset emails
- Prevents email enumeration attacks
- Handles Supabase integration

### 4. Reset Password (`/src/app/api/auth/reset-password/route.ts`)
- Validates reset tokens
- Updates user passwords
- Handles security requirements

## Validation Schemas

Located in `/src/lib/validators/schemas.ts`:

```typescript
// Key schemas
export const loginSchema        // Email/password login
export const registerSchema     // User registration with business support
export const forgotPasswordSchema // Email for password reset
export const resetPasswordSchema  // Token + new password
```

**Features**:
- Zod-based validation
- French character support (accents, etc.)
- Business account validation
- Age verification
- Password strength requirements
- VAT number format validation

## Internationalization

### Supported Languages
- **English** (`en`): Default language
- **French** (`fr`): Full localization

### Translation Files
- `/public/locales/en/common.json`
- `/public/locales/fr/common.json`

### Key Translation Sections
```json
{
  "Auth": {
    "signIn": "Sign In / Se Connecter",
    "signUp": "Sign Up / S'Inscrire",
    "email": "Email / E-mail",
    // ... comprehensive auth translations
  },
  "AgeVerification": {
    "title": "Age Verification Required / Vérification d'Âge Requise",
    // ... age verification translations
  }
}
```

## Database Schema

### customers Table
```sql
CREATE TABLE customers (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  birth_date DATE,
  preferred_language TEXT DEFAULT 'en',
  marketing_consent BOOLEAN DEFAULT false,
  newsletter_consent BOOLEAN DEFAULT false,
  age_verified BOOLEAN DEFAULT false,
  age_verified_at TIMESTAMPTZ,
  age_verification_method TEXT,
  is_business BOOLEAN DEFAULT false,
  vat_number TEXT,
  vat_validated BOOLEAN DEFAULT false,
  vat_validated_at TIMESTAMPTZ,
  company_name TEXT,
  total_orders INTEGER DEFAULT 0,
  total_spent_eur DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Security Features

### 1. Input Validation
- Server-side validation using Zod schemas
- Client-side real-time validation
- SQL injection prevention
- XSS protection

### 2. Password Security
- Minimum 8 characters
- Required uppercase, lowercase, number, special character
- Secure password reset flow
- Password visibility toggles

### 3. Age Verification
- 18+ requirement for wine purchases
- Date validation
- GDPR compliant data handling

### 4. Business Accounts
- VAT number validation
- Company information requirements
- Business-specific features

### 5. GDPR Compliance
- Explicit consent checkboxes
- Marketing opt-in/opt-out
- Data processing transparency
- Right to access/delete (via Supabase)

## Error Handling

### Client-Side
- Real-time form validation
- User-friendly error messages
- Loading states
- Success confirmations

### Server-Side
- Comprehensive error logging
- Sanitized error responses
- Rate limiting (via Supabase)
- Input validation

## Accessibility

### WCAG 2.1 AA Compliance
- Semantic HTML structure
- ARIA attributes
- Keyboard navigation
- Screen reader support
- Color contrast compliance
- Focus management

### Form Accessibility
- Proper labeling
- Error announcements
- Required field indicators
- Instructions and hints

## Mobile Optimization

### Responsive Design
- Mobile-first approach
- Touch-friendly interface
- Optimized form layouts
- Smooth animations
- Performance optimized

### Features
- Auto-zoom prevention on inputs
- Appropriate input types
- Touch gestures support
- Offline capability (via service worker)

## Testing Strategy

### Unit Tests
- Component testing with React Testing Library
- Form validation testing
- API route testing
- Utility function testing

### Integration Tests
- End-to-end auth flows
- Cross-browser testing
- Mobile device testing
- Accessibility testing

### Performance Tests
- Page load times
- Form submission performance
- Bundle size optimization
- Core Web Vitals compliance

## Deployment Considerations

### Environment Variables
```bash
# Required environment variables
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_SITE_URL=https://domainevallot.com
```

### Supabase Configuration
- Email templates customization
- Auth settings configuration
- RLS policies setup
- Database migrations

## Usage Examples

### Basic Login
```tsx
import { LoginForm } from '@/components/auth/LoginForm'

export default function LoginPage({ params: { locale } }) {
  return <LoginForm locale={locale} />
}
```

### Protected Route
```tsx
import { withAuth } from '@/components/auth/AuthProvider'

function ProfilePage() {
  return <div>User Profile</div>
}

export default withAuth(ProfilePage)
```

### Using Auth Context
```tsx
import { useAuth } from '@/components/auth/AuthProvider'

function UserProfile() {
  const { user, customer, signOut } = useAuth()

  return (
    <div>
      <h1>Welcome, {customer?.firstName}</h1>
      <button onClick={signOut}>Sign Out</button>
    </div>
  )
}
```

## Maintenance and Updates

### Regular Tasks
- Security updates
- Translation updates
- Performance monitoring
- Error tracking
- User feedback integration

### Monitoring
- Authentication success/failure rates
- Form completion rates
- Error frequency
- Performance metrics

## Future Enhancements

### Planned Features
1. **Social Authentication**
   - Google OAuth
   - Apple Sign In
   - Facebook Login

2. **Advanced Security**
   - Two-factor authentication
   - Biometric authentication
   - Device fingerprinting

3. **Enhanced UX**
   - Progressive form filling
   - Smart defaults
   - Personalization

4. **Analytics**
   - Authentication funnel analysis
   - A/B testing integration
   - User behavior tracking

## Support and Documentation

### Resources
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Next.js App Router](https://nextjs.org/docs/app)
- [React Hook Form](https://react-hook-form.com/)
- [Zod Validation](https://zod.dev/)

### Contact
For technical support or questions about this implementation, refer to the project documentation or contact the development team.

---

This authentication system provides a robust, secure, and user-friendly foundation for the Domaine Vallot e-commerce platform, specifically designed for French wine sales with proper age verification and regulatory compliance.