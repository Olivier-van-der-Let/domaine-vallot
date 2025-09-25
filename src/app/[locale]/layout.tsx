import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'
import Navigation from '@/components/layout/Navigation'
import StructuredData from '@/components/seo/StructuredData'
import { AuthProvider } from '@/components/auth/AuthProvider'
import { AuthModalProvider } from '@/components/auth/AuthModal'
import { ToastProvider } from '@/components/ui/ToastProvider'
import { generateStructuredData } from '@/lib/seo/metadata'

interface RootLayoutProps {
  children: React.ReactNode
  params: Promise<{
    locale: string
  }>
}

export function generateStaticParams() {
  return [{ locale: 'en' }, { locale: 'fr' }]
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const isValidLocale = ['en', 'fr'].includes(locale)

  if (!isValidLocale) {
    notFound()
  }

  return {
    title: {
      template: '%s | Domaine Vallot',
      default: locale === 'fr'
        ? 'Domaine Vallot - Vins Biodynamiques Premium'
        : 'Domaine Vallot - Premium Biodynamic Wines'
    },
    description: locale === 'fr'
      ? 'Découvrez nos vins biodynamiques premium directement de notre domaine familial en France.'
      : 'Discover our premium biodynamic wines direct from our family vineyard in France.',
    keywords: locale === 'fr'
      ? 'vin biodynamique, domaine viticole, France, vente directe, vin premium'
      : 'biodynamic wine, vineyard, France, direct sales, premium wine',
    openGraph: {
      title: locale === 'fr'
        ? 'Domaine Vallot - Vins Biodynamiques Premium'
        : 'Domaine Vallot - Premium Biodynamic Wines',
      description: locale === 'fr'
        ? 'Découvrez nos vins biodynamiques premium directement de notre domaine familial en France.'
        : 'Discover our premium biodynamic wines direct from our family vineyard in France.',
      url: 'https://domainevallot.com',
      siteName: 'Domaine Vallot',
      locale: locale === 'fr' ? 'fr_FR' : 'en_US',
      type: 'website',
    },
    alternates: {
      canonical: `https://domainevallot.com/${locale}`,
      languages: {
        'en': 'https://domainevallot.com/en',
        'fr': 'https://domainevallot.com/fr',
      },
    },
  }
}

export default async function RootLayout({
  children,
  params,
}: RootLayoutProps) {
  const { locale } = await params
  const isValidLocale = ['en', 'fr'].includes(locale)

  if (!isValidLocale) {
    notFound()
  }

  const messages = await getMessages()

  const organizationData = generateStructuredData('organization');
  const wineryData = generateStructuredData('winery');

  return (
    <>
      <StructuredData data={[organizationData, wineryData]} />
      <NextIntlClientProvider locale={locale} messages={messages}>
        <AuthProvider>
          <AuthModalProvider locale={locale}>
            <ToastProvider>
              <div className="flex flex-col min-h-screen">
                <Navigation currentLocale={locale} />
                <main className="flex-1">
                  {children}
                </main>
                <footer className="bg-gray-900 text-white py-8">
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                      <p className="text-gray-400">
                        © 2025 Domaine Vallot. {locale === 'fr' ? 'Tous droits réservés.' : 'All rights reserved.'}
                      </p>
                    </div>
                  </div>
                </footer>
              </div>
            </ToastProvider>
          </AuthModalProvider>
        </AuthProvider>
      </NextIntlClientProvider>
    </>
  )
}