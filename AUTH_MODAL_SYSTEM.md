# Authentication Modal System

This document explains how the new modal-based authentication system works, replacing the previous page-based authentication flow.

## Overview

The authentication system has been converted from separate pages to modal popups using shadcn/ui components. This provides a better user experience with seamless authentication flows without page navigation.

## Architecture

### Core Components

1. **AuthModal.tsx** - Main modal container that handles all authentication flows
2. **AuthModalProvider.tsx** - Context provider for managing modal state globally
3. **Updated Form Components** - Modified to work both in pages and modals

### Key Features

- **Unified Modal Interface**: Single modal that can switch between login, register, forgot password, and reset password flows
- **Smooth Transitions**: Users can navigate between different auth states without closing the modal
- **Mobile Responsive**: Optimized for both desktop and mobile experiences
- **Accessibility**: Proper focus management, ARIA labels, and keyboard navigation
- **Integration Ready**: Easy to trigger from any component in the app

## Implementation Details

### AuthModal Component

```typescript
interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  defaultMode?: 'login' | 'register' | 'forgot-password' | 'reset-password'
  locale: string
  redirectTo?: string
  className?: string
}
```

**Features:**
- Dynamic content switching based on mode
- Success state handling with auto-close
- URL parameter support for reset password tokens
- Proper dialog accessibility with shadcn/ui Dialog components

### AuthModalProvider

The provider wraps the entire app and provides:
- Global modal state management
- `openModal(mode, redirectTo?)` function
- `closeModal()` function
- `switchMode(mode)` function for internal navigation

### Updated Form Components

All authentication forms now support:
- **Modal Mode**: `showHeader={false}` hides titles when used in modals
- **Callback Props**: `onSwitchToLogin`, `onSwitchToRegister`, etc. for internal navigation
- **Success Callbacks**: `onSuccess()` for handling completion

## Usage Examples

### Opening Authentication Modal

```typescript
import { useAuthModal } from '@/components/auth/AuthModal'

function MyComponent() {
  const { openModal } = useAuthModal()

  return (
    <button onClick={() => openModal('login')}>
      Login
    </button>
  )
}
```

### Navigation Component Integration

The navigation component has been updated to use the modal system:

```typescript
// Before: Link to /login page
<Link href="/login">Login</Link>

// After: Trigger modal
<button onClick={() => openModal('login')}>Login</button>
```

### Redirecting After Authentication

```typescript
// Open login modal and redirect to /checkout after success
openModal('login', '/checkout')
```

## Authentication Flow

### Login Flow
1. User clicks login button → `openModal('login')`
2. Modal opens with LoginForm
3. User can switch to register → `switchMode('register')`
4. User can go to forgot password → `switchMode('forgot-password')`
5. On successful login → modal closes, redirects if specified

### Registration Flow
1. User clicks register → `openModal('register')`
2. Modal opens with RegisterForm (larger width for more fields)
3. User can switch back to login → `switchMode('login')`
4. Age verification handled within modal
5. On success → shows success message, then closes

### Password Reset Flow
1. User clicks "Forgot Password" → `switchMode('forgot-password')`
2. User enters email → success message shown
3. User clicks reset link in email → opens modal with `reset-password` mode
4. Token automatically extracted from URL
5. On success → switches to login mode

## Technical Details

### Styling and Responsiveness

- Modal adapts width based on content (register form gets more space)
- Mobile-optimized with proper touch targets
- Smooth animations using Radix UI transitions
- Consistent with existing design system

### Accessibility

- Proper focus management when modal opens/closes
- Screen reader friendly with appropriate ARIA labels
- Keyboard navigation support (Tab, Escape, Enter)
- High contrast mode support

### State Management

- Modal state persists during mode switches
- Success states with auto-close timers
- Error handling with inline error messages
- Loading states for better UX

## Setup and Configuration

### 1. Install Dependencies

```bash
npm install @radix-ui/react-dialog @radix-ui/react-icons
npx shadcn@latest add dialog button
```

### 2. Add Provider to Layout

```typescript
// app/[locale]/layout.tsx
import { AuthModalProvider } from '@/components/auth/AuthModal'

export default function Layout({ children, params: { locale } }) {
  return (
    <AuthProvider>
      <AuthModalProvider locale={locale}>
        {children}
      </AuthModalProvider>
    </AuthProvider>
  )
}
```

### 3. Update Navigation

Replace authentication links with modal triggers using `useAuthModal()`.

## Benefits

### User Experience
- **No Page Refreshes**: Authentication happens in-place
- **Context Preservation**: Users don't lose their current page state
- **Quick Access**: Can authenticate from anywhere in the app
- **Seamless Flow**: Easy switching between login/register/forgot password

### Developer Experience
- **Reusable**: Same forms work in both modal and page contexts
- **Flexible**: Easy to trigger from any component
- **Maintainable**: Centralized authentication state management
- **Type Safe**: Full TypeScript support with proper interfaces

### Performance
- **Reduced Bundle Size**: No separate page components needed
- **Better Caching**: Forms are loaded once and reused
- **Faster Navigation**: No full page loads for auth flows

## Testing

A test page is available at `/test-auth` to verify all modal functionality:
- Login modal
- Register modal
- Forgot password modal
- User state management
- Sign out functionality

## Migration Notes

### From Page-Based Auth

1. **Existing Pages**: Keep existing auth pages for direct URL access and SEO
2. **Update Links**: Replace navigation links with modal triggers
3. **Redirect Logic**: Update any hardcoded redirects to use modal system
4. **Form Components**: Use new props (`showHeader={false}`) when embedding in modals

### Backward Compatibility

- Original auth pages still work for direct URL access
- Forms work in both modal and page contexts
- Existing API endpoints unchanged
- All validation and error handling preserved

## Future Enhancements

- **Social Login**: Add OAuth buttons to modal
- **Two-Factor Auth**: Extend modal to support 2FA flow
- **Progressive Enhancement**: Graceful fallback to pages if JavaScript disabled
- **A/B Testing**: Easy to test modal vs page performance