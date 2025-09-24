import { Metadata } from 'next'
import Link from 'next/link'
import ScrollIndicator from '@/components/ui/ScrollIndicator'
import HeritageStorySection from '@/components/heritage/HeritageStorySection'
import LivingVineyardExperience from '@/components/heritage/LivingVineyardExperience'
import TerroirDeepDive from '@/components/heritage/TerroirDeepDive'
import CuratedWineDiscovery from '@/components/heritage/CuratedWineDiscovery'
import ArtisanProcessShowcase from '@/components/heritage/ArtisanProcessShowcase'
import ConnectDiscoverSection from '@/components/heritage/ConnectDiscoverSection'
import { getFeaturedProducts } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Home',
}

export default async function HomePage({
  params
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const featuredProducts = await getFeaturedProducts(6)

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section
        className="relative min-h-screen flex items-center justify-center overflow-hidden"
        role="banner"
        aria-label={locale === 'fr' ? 'Section principale - Domaine Vallot' : 'Main hero section - Domaine Vallot'}
      >
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src="https://vmtudbupajnjyauvqnej.supabase.co/storage/v1/object/public/Public/decorative/hero-shot(1920x1080).jpg"
            alt={locale === 'fr'
              ? 'Vignoble du Domaine Vallot avec bouteille L\'exception sur pierres calcaires au coucher du soleil'
              : 'Domaine Vallot vineyard with L\'exception wine bottle on limestone stones at golden hour'
            }
            className="w-full h-full object-cover"
            loading="eager"
            fetchPriority="high"
          />
          {/* Overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="text-heritage-limestone-200">
            {/* Overline - Heritage Element */}
            <p className="text-heritage-golden-500 font-serif text-sm md:text-base mb-4 tracking-wider uppercase opacity-90">
              {locale === 'fr'
                ? 'Sept Générations de Savoir-Faire'
                : 'Seven Generations of Craftsmanship'
              }
            </p>

            {/* Main Headline - Emotional Connection */}
            <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              {locale === 'fr'
                ? (
                  <>
                    Dégustez le <span className="text-heritage-golden-500">Terroir</span>
                    <br className="hidden sm:block" />
                    <span className="block text-2xl sm:text-3xl md:text-4xl lg:text-5xl mt-2 font-normal opacity-90">
                      Ressentez l'Héritage
                    </span>
                  </>
                )
                : (
                  <>
                    Taste the <span className="text-heritage-golden-500">Terroir</span>
                    <br className="hidden sm:block" />
                    <span className="block text-2xl sm:text-3xl md:text-4xl lg:text-5xl mt-2 font-normal opacity-90">
                      Feel the Heritage
                    </span>
                  </>
                )
              }
            </h1>

            {/* Compelling Narrative */}
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl mb-8 max-w-3xl mx-auto leading-relaxed opacity-95">
              {locale === 'fr'
                ? 'Dans chaque bouteille, la terre calcaire de nos vignes biodynamiques raconte l\'histoire vivante de notre domaine. Ici, le vignoble respire comme un organisme unique, façonné par les mains de sept générations.'
                : 'In every bottle, the limestone soil of our biodynamic vines tells the living story of our domain. Here, the vineyard breathes as a single organism, shaped by the hands of seven generations.'
              }
            </p>

            {/* Call to Action */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href={`/${locale}/products`}
                className="inline-flex items-center px-6 sm:px-8 py-3 sm:py-4 bg-heritage-golden-500 text-heritage-slate-900 font-semibold rounded-md hover:bg-heritage-golden-600 focus:ring-2 focus:ring-heritage-golden-500 focus:ring-offset-2 focus:ring-offset-black transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 w-full sm:w-auto"
                aria-label={locale === 'fr' ? 'Découvrir notre collection de vins' : 'Explore our wine collection'}
              >
                {locale === 'fr' ? 'Découvrir nos Vins' : 'Explore Our Wines'}
              </Link>
              <Link
                href={`/${locale}/about`}
                className="inline-flex items-center px-6 sm:px-8 py-3 sm:py-4 border-2 border-heritage-limestone-200 text-heritage-limestone-200 font-semibold rounded-md hover:bg-heritage-limestone-200 hover:text-heritage-slate-900 focus:ring-2 focus:ring-heritage-limestone-200 focus:ring-offset-2 focus:ring-offset-black transition-all duration-200 w-full sm:w-auto"
                aria-label={locale === 'fr' ? 'En savoir plus sur notre héritage familial' : 'Learn more about our family heritage'}
              >
                {locale === 'fr' ? 'Notre Histoire' : 'Our Heritage'}
              </Link>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <ScrollIndicator locale={locale} />
      </section>

      {/* Heritage Story Section */}
      <HeritageStorySection locale={locale} />

      {/* Living Vineyard Experience */}
      <LivingVineyardExperience locale={locale} />

      {/* Terroir Deep Dive */}
      <TerroirDeepDive locale={locale} />

      {/* Curated Wine Discovery */}
      <CuratedWineDiscovery locale={locale} products={featuredProducts} />

      {/* Artisan Process Showcase */}
      <ArtisanProcessShowcase locale={locale} />

      {/* Connect & Discover Section */}
      <ConnectDiscoverSection locale={locale} />
    </div>
  )
}