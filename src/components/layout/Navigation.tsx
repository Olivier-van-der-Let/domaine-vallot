'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import LanguageSwitch from '../ui/LanguageSwitch'
import { useAuthModal } from '../auth/AuthModal'
import { useAuth } from '../auth/AuthProvider'
import { DomaineVallotLogo } from '../ui/DomaineVallotLogo'
import { CartIconWithBadge, InlineCartCount } from '../ui/AnimatedCartBadge'
import { useScrollHeader } from '@/hooks/useScrollHeader'
import { cn } from '@/lib/utils'

interface NavigationProps {
  currentLocale?: string
  cartItemCount?: number
}

export default function Navigation({
  currentLocale = 'en',
  cartItemCount = 0
}: NavigationProps) {
  const { user, signOut, loading, signingIn, isAdmin } = useAuth()
  const isAuthenticated = !!user
  const userName = user?.email?.split('@')[0] || ''
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const mobileMenuRef = useRef<HTMLDivElement>(null)
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()
  const { isScrolled, isVisible, scrollDirection } = useScrollHeader({
    threshold: 50,
    hideOnDown: true
  })

  // Helper function to check if a nav item is active
  const isActiveRoute = (href: string) => {
    if (href === `/${currentLocale}`) {
      return pathname === `/${currentLocale}` || pathname === `/${currentLocale}/`
    }
    return pathname.startsWith(href)
  }

  // Handle escape key to close mobile menu and user menu
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isMobileMenuOpen) {
          setIsMobileMenuOpen(false)
          mobileMenuButtonRef.current?.focus()
        }
        if (userMenuOpen) {
          setUserMenuOpen(false)
        }
      }
    }

    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
    }

    if (isMobileMenuOpen) {
      document.addEventListener('keydown', handleEscape)
      // Focus trap - focus first menu item when menu opens
      const firstMenuItem = mobileMenuRef.current?.querySelector('a, button')
      if (firstMenuItem) {
        (firstMenuItem as HTMLElement).focus()
      }
    }

    if (userMenuOpen) {
      document.addEventListener('keydown', handleEscape)
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isMobileMenuOpen, userMenuOpen])

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
    mobileMenuButtonRef.current?.focus()
  }

  const handleLogout = async () => {
    try {
      await signOut()
      setUserMenuOpen(false)
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  // Helper function to format cart count
  const formatCartCount = (count: number): string => {
    if (count > 99) return '99+'
    return count.toString()
  }

  const navItems = [
    { href: `/${currentLocale}`, label: currentLocale === 'fr' ? 'Accueil' : 'Home' },
    { href: `/${currentLocale}/products`, label: currentLocale === 'fr' ? 'Produits' : 'Products', testId: 'nav-products' },
    { href: `/${currentLocale}/about`, label: currentLocale === 'fr' ? 'À propos' : 'About' },
    { href: `/${currentLocale}/contact`, label: 'Contact' }
  ]

  return (
    <nav className={cn(
      "sticky top-0 z-50 border-b transition-all duration-300 ease-in-out",
      // Background and blur effects based on scroll state
      isScrolled
        ? "bg-heritage-limestone/90 backdrop-blur-md shadow-sm border-heritage-limestone-300/20"
        : "bg-heritage-limestone border-heritage-limestone-300",
      // Header visibility based on scroll direction
      isVisible
        ? "translate-y-0"
        : "-translate-y-full",
      // Focus management for keyboard users
      "focus-within:translate-y-0"
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link
              href={`/${currentLocale}`}
              className={cn(
                "transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-heritage-golden/50 rounded-sm",
                "hover:scale-105",
                // Subtle logo size adjustment on scroll for premium feel
                isScrolled ? "scale-95" : "scale-100"
              )}
              aria-label="Domaine Vallot - Return to homepage"
            >
              <DomaineVallotLogo size="md" variant="heritage" />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center" data-testid="desktop-nav">
            <div className="flex items-center space-x-12">
              {navItems.map((item, index) => {
                const isActive = isActiveRoute(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "relative font-serif text-lg tracking-wide",
                      "transition-all duration-300 ease-out",
                      "focus:outline-none focus-visible:ring-2 focus-visible:ring-heritage-golden/50 rounded-sm",
                      "after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:h-0.5 after:bg-heritage-golden",
                      "after:transition-all after:duration-300",
                      "px-2 py-3",
                      isActive
                        ? "text-heritage-rouge after:w-full"
                        : "text-heritage-slate hover:text-heritage-rouge after:w-0 hover:after:w-full"
                    )}
                    data-testid={item.testId}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <span className="relative z-10">{item.label}</span>
                  </Link>
                )
              })}
            </div>
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center">
            <div className="flex items-center space-x-1 mr-6">
              <LanguageSwitch currentLocale={currentLocale} />
            </div>

            <div className="flex items-center space-x-3 border-l border-heritage-limestone-300/30 pl-6">
              {/* Account Menu */}
              <div className="relative" data-testid="account-menu">
                {signingIn ? (
                  <div className="flex items-center space-x-2 px-3 py-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-heritage-rouge"></div>
                    <span className="text-sm text-heritage-slate">Signing in...</span>
                  </div>
                ) : isAuthenticated ? (
                  <div className="relative" ref={userMenuRef}>
                    <button
                      onClick={() => setUserMenuOpen(!userMenuOpen)}
                      className={cn(
                        "flex items-center space-x-2 px-3 py-2 rounded-md",
                        "text-heritage-slate hover:text-heritage-rouge hover:bg-heritage-limestone-100/50",
                        "transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-heritage-golden/50 focus:ring-offset-2"
                      )}
                      aria-label="User menu"
                      aria-expanded={userMenuOpen}
                    >
                      <span className="text-sm font-medium">
                        Hello, {userName}
                        {isAdmin && <span className="ml-1 text-amber-600 text-xs">👑</span>}
                      </span>
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {/* Dropdown Menu */}
                    {userMenuOpen && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                        <div className="py-1">
                          <Link
                            href={isAdmin ? `/${currentLocale}/admin` : `/${currentLocale}/account`}
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            {isAdmin
                              ? (currentLocale === 'fr' ? 'Panneau d\'administration' : 'Admin Panel')
                              : (currentLocale === 'fr' ? 'Mon Compte' : 'My Account')
                            }
                          </Link>
                          <Link
                            href={`/${currentLocale}/orders`}
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            {currentLocale === 'fr' ? 'Mes Commandes' : 'My Orders'}
                          </Link>
                          <hr className="my-1" />
                          <button
                            onClick={handleLogout}
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                          >
                            {currentLocale === 'fr' ? 'Déconnexion' : 'Logout'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <LoginButton locale={currentLocale} />
                )}
              </div>

              {/* Cart */}
              <Link
                href={`/${currentLocale}/cart`}
                data-testid="cart-link"
              >
                <CartIconWithBadge
                  count={cartItemCount}
                  aria-label={`Shopping cart ${cartItemCount > 0 ? `with ${cartItemCount} items` : '(empty)'}`}
                />
              </Link>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              ref={mobileMenuButtonRef}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-heritage-slate hover:text-heritage-rouge transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-heritage-golden/50 focus:ring-offset-2 rounded-sm p-1"
              data-testid="mobile-nav-trigger"
              aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-menu"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div
            ref={mobileMenuRef}
            id="mobile-menu"
            className="md:hidden border-t border-heritage-limestone-300/30 bg-heritage-limestone/98 backdrop-blur-md shadow-lg"
            data-testid="mobile-nav-menu"
            role="menu"
            aria-label="Mobile navigation"
          >
            <div className="px-4 pt-4 pb-6 space-y-3">
              {navItems.map((item) => {
                const isActive = isActiveRoute(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "block px-4 py-4 text-lg font-serif",
                      "hover:bg-heritage-limestone-100/60 rounded-lg transition-all duration-200",
                      "focus:outline-none focus:ring-2 focus:ring-heritage-golden/50 focus:ring-offset-2",
                      "min-h-[48px] flex items-center border-l-4",
                      isActive
                        ? "text-heritage-rouge border-heritage-rouge bg-heritage-limestone-100/40"
                        : "text-heritage-slate hover:text-heritage-rouge border-transparent hover:border-heritage-golden/30"
                    )}
                    data-testid={`mobile-${item.testId || item.label.toLowerCase()}`}
                    onClick={closeMobileMenu}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    {item.label}
                  </Link>
                )
              })}

              {/* Mobile Account Section */}
              <div className="pt-4 border-t border-heritage-limestone-300/30">
                {signingIn ? (
                  <div className="px-4 py-4 flex items-center space-x-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-heritage-rouge"></div>
                    <span className="text-base text-heritage-slate">Signing in...</span>
                  </div>
                ) : isAuthenticated ? (
                  <div className="space-y-3">
                    <div className="px-4 py-2">
                      <p className="text-sm text-heritage-slate font-medium">Hello, {userName}</p>
                    </div>
                    <Link
                      href={isAdmin ? `/${currentLocale}/admin` : `/${currentLocale}/account`}
                      className={cn(
                        "flex items-center px-4 py-4 text-base font-serif text-heritage-slate hover:text-heritage-rouge",
                        "hover:bg-heritage-limestone-100/60 rounded-lg transition-all duration-200",
                        "focus:outline-none focus:ring-2 focus:ring-heritage-golden/50 focus:ring-offset-2",
                        "min-h-[48px] border-l-4 border-transparent hover:border-heritage-golden/30"
                      )}
                      data-testid="mobile-nav-account"
                      onClick={closeMobileMenu}
                    >
                      <svg className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        {isAdmin ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        )}
                      </svg>
                      {isAdmin
                        ? (currentLocale === 'fr' ? 'Panneau d\'administration' : 'Admin Panel')
                        : (currentLocale === 'fr' ? 'Mon compte' : 'My Account')
                      }
                    </Link>
                    <button
                      className={cn(
                        "flex items-center px-4 py-4 text-base font-serif text-heritage-slate hover:text-heritage-rouge",
                        "hover:bg-heritage-limestone-100/60 rounded-lg transition-all duration-200",
                        "focus:outline-none focus:ring-2 focus:ring-heritage-golden/50 focus:ring-offset-2",
                        "min-h-[48px] border-l-4 border-transparent hover:border-heritage-golden/30 w-full text-left"
                      )}
                      data-testid="logout-link"
                    >
                      <svg className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      {currentLocale === 'fr' ? 'Déconnexion' : 'Logout'}
                    </button>
                  </div>
                ) : (
                  <div className="px-4 py-2" onClick={closeMobileMenu}>
                    <LoginButton locale={currentLocale} mobile />
                  </div>
                )}
              </div>

              {/* Mobile Cart */}
              <Link
                href={`/${currentLocale}/cart`}
                className={cn(
                  "flex items-center px-4 py-4 text-base font-serif text-heritage-slate hover:text-heritage-rouge",
                  "hover:bg-heritage-limestone-100/60 rounded-lg transition-all duration-200",
                  "focus:outline-none focus:ring-2 focus:ring-heritage-golden/50 focus:ring-offset-2",
                  "min-h-[48px] border-l-4 border-transparent hover:border-heritage-golden/30"
                )}
                data-testid="mobile-nav-cart"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <svg className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 0h10l.938 10.314A2 2 0 0116.938 16H7.062a2 2 0 01-1.937-1.686L7 4z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9v2m3-2v2m3-2v2" />
                </svg>
                <span className="flex-1">{currentLocale === 'fr' ? 'Panier' : 'Cart'}</span>
                <InlineCartCount count={cartItemCount} locale={currentLocale} />
              </Link>

              {/* Mobile Language Switch */}
              <div className="pt-4 border-t border-heritage-limestone-300/30">
                <div className="px-4 py-2">
                  <LanguageSwitch currentLocale={currentLocale} />
                </div>
              </div>
            </div>

            {/* Mobile Close Button */}
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="hidden"
              data-testid="mobile-nav-close"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </nav>
  )
}

// Login button component that triggers the auth modal
function LoginButton({ locale, mobile = false }: { locale: string; mobile?: boolean }) {
  const { openModal } = useAuthModal()

  const handleClick = () => {
    openModal('login')
  }

  if (mobile) {
    return (
      <button
        onClick={(e) => {
          handleClick();
          e.currentTarget.blur();
        }}
        className={cn(
          "w-full px-6 py-3 rounded-full border border-heritage-rouge/20",
          "text-heritage-rouge hover:text-heritage-limestone hover:bg-heritage-rouge",
          "font-medium text-base tracking-wide transition-all duration-300",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-heritage-golden/50",
          "hover:border-heritage-rouge hover:shadow-md min-h-[48px]"
        )}
        data-testid="mobile-login-button"
      >
        {locale === 'fr' ? 'Connexion' : 'Login'}
      </button>
    )
  }

  return (
    <button
      onClick={(e) => {
        handleClick();
        e.currentTarget.blur();
      }}
      className={cn(
        "px-6 py-2.5 rounded-full border border-heritage-slate/20",
        "text-heritage-slate hover:text-heritage-limestone hover:bg-heritage-rouge",
        "font-medium text-sm tracking-wide transition-all duration-300",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-heritage-golden/50",
        "hover:border-heritage-rouge hover:shadow-sm"
      )}
      data-testid="login-button"
    >
      {locale === 'fr' ? 'Connexion' : 'Login'}
    </button>
  )
}