'use client';

import { useState, useEffect } from 'react';
import { X, Settings, Shield, BarChart3, Target } from 'lucide-react';

export interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  personalization: boolean;
}

export interface CookieConsentProps {
  onAcceptAll?: (preferences: CookiePreferences) => void;
  onAcceptSelected?: (preferences: CookiePreferences) => void;
  onReject?: () => void;
  locale?: 'fr' | 'en';
  position?: 'bottom' | 'top';
  theme?: 'light' | 'dark';
}

const COOKIE_CONSENT_KEY = 'domaine-vallot-cookie-consent';
const COOKIE_PREFERENCES_KEY = 'domaine-vallot-cookie-preferences';

const translations = {
  fr: {
    title: 'Nous utilisons des cookies',
    description: 'Nous utilisons des cookies pour améliorer votre expérience sur notre site, analyser le trafic et personnaliser le contenu. Vous pouvez choisir quels cookies accepter.',
    acceptAll: 'Accepter tout',
    acceptSelected: 'Accepter la sélection',
    reject: 'Refuser tout',
    customize: 'Personnaliser',
    save: 'Enregistrer mes préférences',
    close: 'Fermer',
    learnMore: 'En savoir plus',
    privacyPolicy: 'Politique de confidentialité',
    categories: {
      necessary: {
        title: 'Cookies nécessaires',
        description: 'Ces cookies sont indispensables au fonctionnement du site et ne peuvent pas être désactivés.',
        required: true,
      },
      analytics: {
        title: 'Cookies analytiques',
        description: 'Ces cookies nous aident à comprendre comment les visiteurs utilisent notre site.',
        required: false,
      },
      marketing: {
        title: 'Cookies marketing',
        description: 'Ces cookies sont utilisés pour afficher des publicités pertinentes et mesurer leur efficacité.',
        required: false,
      },
      personalization: {
        title: 'Cookies de personnalisation',
        description: 'Ces cookies permettent de personnaliser votre expérience en mémorisant vos préférences.',
        required: false,
      },
    },
    purposes: {
      analytics: [
        'Mesurer les performances du site',
        'Analyser le comportement des utilisateurs',
        'Améliorer notre contenu',
      ],
      marketing: [
        'Afficher des publicités personnalisées',
        'Mesurer l\'efficacité des campagnes',
        'Recibler les visiteurs',
      ],
      personalization: [
        'Mémoriser vos préférences linguistiques',
        'Sauvegarder vos paramètres',
        'Personnaliser le contenu',
      ],
    },
  },
  en: {
    title: 'We use cookies',
    description: 'We use cookies to improve your experience on our site, analyze traffic and personalize content. You can choose which cookies to accept.',
    acceptAll: 'Accept all',
    acceptSelected: 'Accept selection',
    reject: 'Reject all',
    customize: 'Customize',
    save: 'Save my preferences',
    close: 'Close',
    learnMore: 'Learn more',
    privacyPolicy: 'Privacy policy',
    categories: {
      necessary: {
        title: 'Necessary cookies',
        description: 'These cookies are essential for the site to function and cannot be disabled.',
        required: true,
      },
      analytics: {
        title: 'Analytics cookies',
        description: 'These cookies help us understand how visitors use our site.',
        required: false,
      },
      marketing: {
        title: 'Marketing cookies',
        description: 'These cookies are used to display relevant ads and measure their effectiveness.',
        required: false,
      },
      personalization: {
        title: 'Personalization cookies',
        description: 'These cookies allow us to personalize your experience by remembering your preferences.',
        required: false,
      },
    },
    purposes: {
      analytics: [
        'Measure site performance',
        'Analyze user behavior',
        'Improve our content',
      ],
      marketing: [
        'Display personalized ads',
        'Measure campaign effectiveness',
        'Retarget visitors',
      ],
      personalization: [
        'Remember your language preferences',
        'Save your settings',
        'Personalize content',
      ],
    },
  },
};

export default function CookieConsent({
  onAcceptAll,
  onAcceptSelected,
  onReject,
  locale = 'fr',
  position = 'bottom',
  theme = 'light',
}: CookieConsentProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isDetailView, setIsDetailView] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true,
    analytics: false,
    marketing: false,
    personalization: false,
  });

  const t = translations[locale];

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    const savedPreferences = localStorage.getItem(COOKIE_PREFERENCES_KEY);

    if (!consent) {
      // Show banner after a short delay
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    } else if (savedPreferences) {
      // Load saved preferences
      try {
        setPreferences(JSON.parse(savedPreferences));
      } catch (error) {
        console.error('Failed to parse cookie preferences:', error);
      }
    }
  }, []);

  const handleAcceptAll = () => {
    const allAccepted: CookiePreferences = {
      necessary: true,
      analytics: true,
      marketing: true,
      personalization: true,
    };

    savePreferences(allAccepted);
    onAcceptAll?.(allAccepted);
    setIsVisible(false);
  };

  const handleAcceptSelected = () => {
    savePreferences(preferences);
    onAcceptSelected?.(preferences);
    setIsVisible(false);
  };

  const handleReject = () => {
    const rejected: CookiePreferences = {
      necessary: true,
      analytics: false,
      marketing: false,
      personalization: false,
    };

    savePreferences(rejected);
    onReject?.();
    setIsVisible(false);
  };

  const savePreferences = (prefs: CookiePreferences) => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'true');
    localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify(prefs));

    // Apply or remove tracking based on preferences
    applyTrackingPreferences(prefs);
  };

  const applyTrackingPreferences = (prefs: CookiePreferences) => {
    // Google Analytics
    if (prefs.analytics && typeof window !== 'undefined') {
      // Enable GA if not already loaded
      if (!window.gtag) {
        const script = document.createElement('script');
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`;
        document.head.appendChild(script);

        window.dataLayer = window.dataLayer || [];
        window.gtag = function gtag() {
          window.dataLayer.push(arguments);
        };
        window.gtag('js', new Date());
        window.gtag('config', process.env.NEXT_PUBLIC_GA_ID);
      }
    } else if (typeof window !== 'undefined' && window.gtag) {
      // Disable GA
      window.gtag('config', process.env.NEXT_PUBLIC_GA_ID, {
        send_page_view: false,
      });
    }

    // Meta Pixel
    if (prefs.marketing && typeof window !== 'undefined') {
      // Enable Meta Pixel if not already loaded
      if (!window.fbq && process.env.NEXT_PUBLIC_META_PIXEL_ID) {
        const script = document.createElement('script');
        script.innerHTML = `
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${process.env.NEXT_PUBLIC_META_PIXEL_ID}');
          fbq('track', 'PageView');
        `;
        document.head.appendChild(script);
      }
    }

    // Personalization (local storage preferences)
    if (!prefs.personalization && typeof window !== 'undefined') {
      // Clear personalization data except for cookie preferences
      const keysToKeep = [COOKIE_CONSENT_KEY, COOKIE_PREFERENCES_KEY];
      Object.keys(localStorage).forEach(key => {
        if (!keysToKeep.includes(key)) {
          localStorage.removeItem(key);
        }
      });
    }
  };

  const togglePreference = (category: keyof CookiePreferences) => {
    if (category === 'necessary') return; // Can't toggle necessary cookies

    setPreferences(prev => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  const renderCategoryIcon = (category: string) => {
    switch (category) {
      case 'analytics':
        return <BarChart3 className="w-5 h-5" />;
      case 'marketing':
        return <Target className="w-5 h-5" />;
      case 'personalization':
        return <Settings className="w-5 h-5" />;
      default:
        return <Shield className="w-5 h-5" />;
    }
  };

  if (!isVisible) return null;

  const baseClasses = `
    fixed left-4 right-4 z-50 max-w-md mx-auto sm:max-w-lg lg:max-w-xl
    ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}
    rounded-lg shadow-2xl border
    ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}
    transition-all duration-300 ease-in-out
  `;

  const positionClasses = position === 'bottom' ? 'bottom-4' : 'top-4';

  return (
    <div className={`${baseClasses} ${positionClasses}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-600" />
          {t.title}
        </h3>
        <button
          onClick={() => setIsVisible(false)}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          aria-label={t.close}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        {!isDetailView ? (
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              {t.description}
            </p>

            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={handleAcceptAll}
                className="px-4 py-2 bg-wine-700 hover:bg-wine-800 text-white rounded-lg font-medium transition-colors"
              >
                {t.acceptAll}
              </button>
              <button
                onClick={() => setIsDetailView(true)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg font-medium transition-colors"
              >
                {t.customize}
              </button>
              <button
                onClick={handleReject}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium transition-colors"
              >
                {t.reject}
              </button>
            </div>

            <div className="mt-3 text-center">
              <a
                href="/privacy-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
              >
                {t.privacyPolicy}
              </a>
            </div>
          </div>
        ) : (
          <div>
            <div className="space-y-4 max-h-80 overflow-y-auto">
              {Object.entries(t.categories).map(([key, category]) => (
                <div key={key} className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-b-0">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {renderCategoryIcon(key)}
                      <h4 className="font-medium">{category.title}</h4>
                    </div>
                    <div className="flex items-center">
                      {category.required ? (
                        <span className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-gray-600 dark:text-gray-400">
                          Requis
                        </span>
                      ) : (
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={preferences[key as keyof CookiePreferences]}
                            onChange={() => togglePreference(key as keyof CookiePreferences)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                        </label>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                    {category.description}
                  </p>
                  {key !== 'necessary' && t.purposes[key as keyof typeof t.purposes] && (
                    <ul className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                      {t.purposes[key as keyof typeof t.purposes].map((purpose, index) => (
                        <li key={index} className="flex items-center gap-1">
                          <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                          {purpose}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={handleAcceptSelected}
                className="px-4 py-2 bg-wine-700 hover:bg-wine-800 text-white rounded-lg font-medium transition-colors"
              >
                {t.save}
              </button>
              <button
                onClick={() => setIsDetailView(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg font-medium transition-colors"
              >
                Retour
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Hook to check if cookies are accepted
export function useCookieConsent() {
  const [preferences, setPreferences] = useState<CookiePreferences | null>(null);
  const [hasConsent, setHasConsent] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
      const savedPreferences = localStorage.getItem(COOKIE_PREFERENCES_KEY);

      setHasConsent(!!consent);

      if (savedPreferences) {
        try {
          setPreferences(JSON.parse(savedPreferences));
        } catch (error) {
          console.error('Failed to parse cookie preferences:', error);
        }
      }
    }
  }, []);

  const updatePreferences = (newPreferences: CookiePreferences) => {
    setPreferences(newPreferences);
    localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify(newPreferences));
  };

  const clearConsent = () => {
    localStorage.removeItem(COOKIE_CONSENT_KEY);
    localStorage.removeItem(COOKIE_PREFERENCES_KEY);
    setHasConsent(false);
    setPreferences(null);
  };

  return {
    preferences,
    hasConsent,
    updatePreferences,
    clearConsent,
    canTrack: {
      analytics: preferences?.analytics || false,
      marketing: preferences?.marketing || false,
      personalization: preferences?.personalization || false,
    },
  };
}

// Utility function to check if a specific tracking type is allowed
export function canTrack(type: keyof Omit<CookiePreferences, 'necessary'>): boolean {
  if (typeof window === 'undefined') return false;

  const savedPreferences = localStorage.getItem(COOKIE_PREFERENCES_KEY);
  if (!savedPreferences) return false;

  try {
    const preferences: CookiePreferences = JSON.parse(savedPreferences);
    return preferences[type] || false;
  } catch {
    return false;
  }
}

// Component to conditionally render content based on cookie consent
export function ConditionalTrackingScript({
  type,
  children,
}: {
  type: keyof Omit<CookiePreferences, 'necessary'>;
  children: React.ReactNode;
}) {
  const { canTrack: trackingAllowed } = useCookieConsent();

  if (!trackingAllowed[type]) {
    return null;
  }

  return <>{children}</>;
}