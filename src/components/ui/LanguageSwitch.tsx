'use client'

import React, { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'

interface LanguageSwitchProps {
  currentLocale?: string
  className?: string
}

const languages = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' }
]

export default function LanguageSwitch({ currentLocale = 'en', className = '' }: LanguageSwitchProps) {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  const currentLanguage = languages.find(lang => lang.code === currentLocale) || languages[0]

  const handleLanguageChange = (newLocale: string) => {
    setIsOpen(false)

    // Replace the locale in the current path
    const segments = pathname.split('/')
    if (segments[1] && languages.some(lang => lang.code === segments[1])) {
      segments[1] = newLocale
    } else {
      segments.splice(1, 0, newLocale)
    }

    const newPath = segments.join('/')
    router.push(newPath)
  }

  return (
    <div className={`relative ${className}`} data-testid="language-switcher">
      <button
        onClick={(e) => {
          setIsOpen(!isOpen);
          e.currentTarget.blur();
        }}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-heritage-slate hover:text-heritage-rouge transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-heritage-golden/50 rounded-sm"
        aria-label="Switch language"
        aria-expanded={isOpen}
      >
        <span>{currentLanguage.flag}</span>
        <span className="hidden sm:block">{currentLanguage.name}</span>
        <svg
          className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-48 bg-heritage-limestone rounded-lg shadow-lg border border-heritage-limestone-300/30 z-20 backdrop-blur-sm">
            <div className="py-1">
              {languages.map((language) => (
                <button
                  key={language.code}
                  onClick={(e) => {
                    handleLanguageChange(language.code);
                    e.currentTarget.blur();
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2 text-sm text-left hover:bg-heritage-limestone-100/60 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-heritage-golden/50 rounded-md mx-1 ${
                    currentLocale === language.code ? 'bg-heritage-limestone-100/60 text-heritage-rouge font-medium' : 'text-heritage-slate'
                  }`}
                  data-testid={`language-option-${language.code}`}
                >
                  <span className="text-lg">{language.flag}</span>
                  <span>{language.name}</span>
                  {currentLocale === language.code && (
                    <svg className="ml-auto h-4 w-4 text-heritage-golden" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}