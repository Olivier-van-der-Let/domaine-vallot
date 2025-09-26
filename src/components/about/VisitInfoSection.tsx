'use client'

import Link from 'next/link'

interface VisitInfoSectionProps {
  locale: string
}

export default function VisitInfoSection({ locale }: VisitInfoSectionProps) {
  const content = {
    fr: {
      overline: 'Venez Nous Rendre Visite',
      title: 'L\'Histoire Continue avec Vous',
      subtitle: 'Découvrez notre domaine et dégustez nos vins',
      description: 'Nous vous invitons à découvrir notre domaine, à marcher parmi nos vignes et à goûter l\'expression authentique de notre terroir. Chaque visite est une rencontre, chaque dégustation une histoire partagée.',
      address: {
        title: 'Adresse',
        street: 'Domaine Vallot',
        location: 'Vinsobres, Drôme Provençale',
        country: 'France'
      },
      visitInfo: {
        title: 'Informations Pratiques',
        hours: 'Visites sur rendez-vous uniquement',
        duration: 'Durée : 1h30 - 2h',
        included: 'Dégustation et visite des vignes incluses',
        booking: 'Réservation recommandée 48h à l\'avance'
      },
      experiences: [
        {
          title: 'Visite Découverte',
          description: 'Tour des vignes, chai et dégustation de 3 vins',
          duration: '1h30',
          icon: '🍷'
        },
        {
          title: 'Expérience Terroir',
          description: 'Visite approfondie avec dégustation accord mets-vins',
          duration: '2h30',
          icon: '🍾'
        },
        {
          title: 'Rencontre Vigneronne',
          description: 'Rencontrez Anaïs et découvrez ses secrets de vinification',
          duration: '2h',
          icon: '👩‍🌾'
        }
      ],
      contact: {
        title: 'Nous Contacter',
        phone: '+33 (0)4 75 27 65 59',
        email: 'contact@domainevallot.com',
        website: 'www.domainevallot.com'
      },
      cta: {
        primary: 'Réserver une Visite',
        secondary: 'Nous Contacter',
        newsletter: 'Suivre Notre Histoire'
      },
      certifications: [
        { name: 'Ecocert Biologique', year: '2003' },
        { name: 'Demeter Biodynamie', year: '2007' },
        { name: 'AOC Vinsobres', year: '2006' },
        { name: 'Agriculture Biologique', year: 'EU' }
      ]
    },
    en: {
      overline: 'Come Visit Us',
      title: 'The Story Continues with You',
      subtitle: 'Discover our domain and taste our wines',
      description: 'We invite you to discover our domain, walk among our vines, and taste the authentic expression of our terroir. Every visit is an encounter, every tasting a shared story.',
      address: {
        title: 'Address',
        street: 'Domaine Vallot',
        location: 'Vinsobres, Drôme Provençale',
        country: 'France'
      },
      visitInfo: {
        title: 'Practical Information',
        hours: 'Visits by appointment only',
        duration: 'Duration: 1h30 - 2h',
        included: 'Tasting and vineyard visit included',
        booking: 'Booking recommended 48h in advance'
      },
      experiences: [
        {
          title: 'Discovery Visit',
          description: 'Vineyard tour, cellar and tasting of 3 wines',
          duration: '1h30',
          icon: '🍷'
        },
        {
          title: 'Terroir Experience',
          description: 'In-depth visit with food and wine pairing',
          duration: '2h30',
          icon: '🍾'
        },
        {
          title: 'Meet the Winemaker',
          description: 'Meet Anaïs and discover her winemaking secrets',
          duration: '2h',
          icon: '👩‍🌾'
        }
      ],
      contact: {
        title: 'Contact Us',
        phone: '+33 (0)4 75 27 65 59',
        email: 'contact@domainevallot.com',
        website: 'www.domainevallot.com'
      },
      cta: {
        primary: 'Book a Visit',
        secondary: 'Contact Us',
        newsletter: 'Follow Our Story'
      },
      certifications: [
        { name: 'Ecocert Organic', year: '2003' },
        { name: 'Demeter Biodynamic', year: '2007' },
        { name: 'AOC Vinsobres', year: '2006' },
        { name: 'Organic Agriculture', year: 'EU' }
      ]
    }
  }

  const text = content[locale as keyof typeof content] || content.en

  return (
    <section className="py-16 lg:py-24 bg-heritage-limestone-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-heritage-rouge-600 font-serif text-sm md:text-base tracking-wider uppercase mb-4">
            {text.overline}
          </p>
          <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-heritage-slate-900 mb-4">
            {text.title}
          </h2>
          <p className="text-heritage-golden-600 font-serif text-xl md:text-2xl font-medium mb-6">
            {text.subtitle}
          </p>
          <p className="text-heritage-slate-700 text-lg leading-relaxed max-w-3xl mx-auto">
            {text.description}
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          {/* Left Column - Visit Information */}
          <div className="space-y-8">
            {/* Address */}
            <div className="bg-white rounded-lg shadow-lg p-6 lg:p-8">
              <h3 className="font-serif text-2xl font-bold text-heritage-slate-900 mb-4 flex items-center gap-3">
                <span className="text-2xl">🏠</span>
                {text.address.title}
              </h3>
              <div className="space-y-2 text-heritage-slate-700">
                <p className="font-medium">{text.address.street}</p>
                <p>{text.address.location}</p>
                <p>{text.address.country}</p>
              </div>
            </div>

            {/* Visit Information */}
            <div className="bg-white rounded-lg shadow-lg p-6 lg:p-8">
              <h3 className="font-serif text-2xl font-bold text-heritage-slate-900 mb-4 flex items-center gap-3">
                <span className="text-2xl">ℹ️</span>
                {text.visitInfo.title}
              </h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-heritage-rouge-500 mt-2 flex-shrink-0"></div>
                  <p className="text-heritage-slate-700">{text.visitInfo.hours}</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-heritage-rouge-500 mt-2 flex-shrink-0"></div>
                  <p className="text-heritage-slate-700">{text.visitInfo.duration}</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-heritage-rouge-500 mt-2 flex-shrink-0"></div>
                  <p className="text-heritage-slate-700">{text.visitInfo.included}</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-heritage-rouge-500 mt-2 flex-shrink-0"></div>
                  <p className="text-heritage-slate-700">{text.visitInfo.booking}</p>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-white rounded-lg shadow-lg p-6 lg:p-8">
              <h3 className="font-serif text-2xl font-bold text-heritage-slate-900 mb-4 flex items-center gap-3">
                <span className="text-2xl">📞</span>
                {text.contact.title}
              </h3>
              <div className="space-y-3">
                <a 
                  href={`tel:${text.contact.phone.replace(/\s/g, '')}`}
                  className="flex items-center gap-3 text-heritage-slate-700 hover:text-heritage-rouge-600 transition-colors"
                >
                  <span className="text-lg">📞</span>
                  {text.contact.phone}
                </a>
                <a 
                  href={`mailto:${text.contact.email}`}
                  className="flex items-center gap-3 text-heritage-slate-700 hover:text-heritage-rouge-600 transition-colors"
                >
                  <span className="text-lg">✉️</span>
                  {text.contact.email}
                </a>
                <div className="flex items-center gap-3 text-heritage-slate-700">
                  <span className="text-lg">🌐</span>
                  {text.contact.website}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Experiences & CTAs */}
          <div className="space-y-8">
            {/* Experience Options */}
            <div className="bg-white rounded-lg shadow-lg p-6 lg:p-8">
              <h3 className="font-serif text-2xl font-bold text-heritage-slate-900 mb-6">
                {locale === 'fr' ? 'Nos Expériences' : 'Our Experiences'}
              </h3>
              <div className="space-y-6">
                {text.experiences.map((experience, index) => (
                  <div key={index} className="border-l-4 border-heritage-golden-500 pl-4 py-2">
                    <div className="flex items-start gap-3 mb-2">
                      <span className="text-2xl">{experience.icon}</span>
                      <div>
                        <h4 className="font-semibold text-heritage-slate-800">
                          {experience.title}
                        </h4>
                        <p className="text-sm text-heritage-rouge-600 font-medium">
                          {experience.duration}
                        </p>
                      </div>
                    </div>
                    <p className="text-heritage-slate-700 text-sm leading-relaxed">
                      {experience.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Certifications */}
            <div className="bg-white rounded-lg shadow-lg p-6 lg:p-8">
              <h3 className="font-serif text-2xl font-bold text-heritage-slate-900 mb-6">
                {locale === 'fr' ? 'Nos Certifications' : 'Our Certifications'}
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {text.certifications.map((cert, index) => (
                  <div key={index} className="text-center p-3 bg-heritage-limestone-50 rounded-lg">
                    <div className="text-2xl mb-2">🏅</div>
                    <h4 className="font-medium text-heritage-slate-800 text-sm mb-1">
                      {cert.name}
                    </h4>
                    <p className="text-heritage-golden-600 text-xs font-semibold">
                      {cert.year}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Call to Actions */}
            <div className="space-y-4">
              <Link
                href={`/${locale}/contact`}
                className="w-full inline-flex items-center justify-center px-6 py-4 bg-heritage-rouge-600 text-white font-semibold rounded-lg hover:bg-heritage-rouge-700 focus:ring-2 focus:ring-heritage-rouge-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                {text.cta.primary}
                <svg className="ml-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
              
              <Link
                href={`/${locale}/contact`}
                className="w-full inline-flex items-center justify-center px-6 py-4 border-2 border-heritage-golden-500 text-heritage-golden-700 font-semibold rounded-lg hover:bg-heritage-golden-50 focus:ring-2 focus:ring-heritage-golden-500 focus:ring-offset-2 transition-all duration-200"
              >
                {text.cta.secondary}
              </Link>

              <button className="w-full inline-flex items-center justify-center px-6 py-3 text-heritage-slate-600 font-medium rounded-lg hover:bg-heritage-limestone-100 focus:ring-2 focus:ring-heritage-slate-500 focus:ring-offset-2 transition-all duration-200">
                {text.cta.newsletter}
                <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Quote */}
        <div className="mt-16 text-center">
          <div className="max-w-2xl mx-auto bg-white rounded-lg p-8 shadow-lg">
            <blockquote className="font-serif text-xl lg:text-2xl text-heritage-slate-700 italic leading-relaxed mb-4">
              {locale === 'fr'
                ? '"Venez partager un moment avec nous, goûter à l\'authenticité de nos vins et découvrir la beauté de notre terroir."'
                : '"Come share a moment with us, taste the authenticity of our wines, and discover the beauty of our terroir."'
              }
            </blockquote>
            <cite className="block text-heritage-rouge-600 font-medium not-italic">
              — Anaïs Vallot
            </cite>
          </div>
        </div>
      </div>
    </section>
  )
}