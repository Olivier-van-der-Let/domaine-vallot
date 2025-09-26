'use client'

import Link from 'next/link'
import ScrollIndicator from '@/components/ui/ScrollIndicator'

interface AboutHeroProps {
  locale: string
}

export default function AboutHero({ locale }: AboutHeroProps) {
  const content = {
    fr: {
      overline: 'La Famille Vallot',
      title: 'Où le Temps S\'écoule comme le Vin',
      subtitle: 'L\'histoire vivante d\'un domaine exceptionnel',
      description: 'Nichés parmi les collines douces de Vinsobres, où les terrasses calcaires rencontrent la brise du Pontias et la silhouette du Mont Ventoux, nos vignes contemplent une mosaïque de vignes et d\'oliviers. Ici, le temps ralentit au rythme des saisons et le Mistral murmure à travers les rangs, portant avec lui les histoires de cinq générations.',
      primaryCta: 'Découvrir Nos Vins',
      secondaryCta: 'Planifier Votre Visite'
    },
    en: {
      overline: 'The Vallot Family',
      title: 'Where Time Flows Like Wine',
      subtitle: 'The living story of an exceptional domain',
      description: 'Nestled among the gentle hills of Vinsobres, where limestone terraces meet the breeze of the Pontias and the silhouette of Mont Ventoux, our vines look out over a mosaic of vines and olive groves. Here, time slows to the rhythm of seasons and the Mistral whispers through the rows, carrying with it the stories of five generations.',
      primaryCta: 'Explore Our Wines',
      secondaryCta: 'Plan Your Visit'
    }
  }

  const text = content[locale as keyof typeof content] || content.en

  return (
    <section
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      role="banner"
      aria-label={locale === 'fr' ? 'Section principale - À propos de Domaine Vallot' : 'Main hero section - About Domaine Vallot'}
    >
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src="https://vmtudbupajnjyauvqnej.supabase.co/storage/v1/object/public/Public/decorative/about-hero-family-vineyard.jpg"
          alt={locale === 'fr'
            ? 'Famille Vallot dans les vignes de Vinsobres au coucher du soleil'
            : 'Vallot family in the Vinsobres vineyards at sunset'
          }
          className="w-full h-full object-cover"
          loading="eager"
          fetchPriority="high"
        />
        {/* Overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="text-heritage-limestone-200">
          {/* Overline - Heritage Element */}
          <p className="text-heritage-golden-500 font-serif text-sm md:text-base mb-4 tracking-wider uppercase opacity-90">
            {text.overline}
          </p>

          {/* Main Headline - Emotional Connection */}
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            {text.title}
          </h1>

          {/* Subtitle */}
          <p className="text-heritage-golden-400 font-serif text-xl md:text-2xl lg:text-3xl mb-8 font-medium opacity-95">
            {text.subtitle}
          </p>

          {/* Compelling Narrative */}
          <p className="text-base sm:text-lg md:text-xl mb-8 max-w-3xl mx-auto leading-relaxed opacity-95">
            {text.description}
          </p>

          {/* Call to Action */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href={`/${locale}/products`}
              className="inline-flex items-center px-6 sm:px-8 py-3 sm:py-4 bg-heritage-golden-500 text-heritage-slate-900 font-semibold rounded-md hover:bg-heritage-golden-600 focus:ring-2 focus:ring-heritage-golden-500 focus:ring-offset-2 focus:ring-offset-black transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 w-full sm:w-auto"
              aria-label={locale === 'fr' ? 'Découvrir notre collection de vins' : 'Explore our wine collection'}
            >
              {text.primaryCta}
            </Link>
            <Link
              href={`/${locale}/contact`}
              className="inline-flex items-center px-6 sm:px-8 py-3 sm:py-4 border-2 border-heritage-limestone-200 text-heritage-limestone-200 font-semibold rounded-md hover:bg-heritage-limestone-200 hover:text-heritage-slate-900 focus:ring-2 focus:ring-heritage-limestone-200 focus:ring-offset-2 focus:ring-offset-black transition-all duration-200 w-full sm:w-auto"
              aria-label={locale === 'fr' ? 'Planifier votre visite du domaine' : 'Plan your visit to the domain'}
            >
              {text.secondaryCta}
            </Link>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <ScrollIndicator locale={locale} />
    </section>
  )
}