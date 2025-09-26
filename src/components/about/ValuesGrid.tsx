'use client'

import { useState } from 'react'

interface ValuesGridProps {
  locale: string
}

interface Value {
  id: string
  icon: string
  title: string
  description: string
  details: string
  practices: string[]
}

export default function ValuesGrid({ locale }: ValuesGridProps) {
  const [expandedValue, setExpandedValue] = useState<string | null>(null)

  const values: Value[] = locale === 'fr' ? [
    {
      id: 'biodynamic',
      icon: '🌱',
      title: 'Agriculture Biodynamique',
      description: 'Nous cultivons nos vignes en harmonie avec les rythmes naturels et lunaires, renforçant la vitalité du sol et des plantes.',
      details: 'Notre approche biodynamique va au-delà de l\'agriculture biologique. Nous utilisons des préparations naturelles, suivons le calendrier lunaire et considérons notre vignoble comme un organisme vivant complet.',
      practices: [
        'Préparations biodynamiques (500, 501)',
        'Calendrier lunaire pour tous travaux',
        'Compostage naturel enrichi',
        'Biodiversité et écosystème préservés'
      ]
    },
    {
      id: 'heritage',
      icon: '🏠',
      title: 'Héritage Familial',
      description: 'Cinq générations de savoir-faire transmis avec respect, innovation et passion pour notre terroir unique.',
      details: 'Notre héritage n\'est pas seulement une histoire, c\'est un engagement vivant. Chaque génération enrichit la tradition tout en préservant l\'essence de notre terroir.',
      practices: [
        'Techniques traditionnelles préservées',
        'Innovation respectueuse',
        'Transmission du savoir-faire',
        'Mémoire du terroir conservée'
      ]
    },
    {
      id: 'craftsmanship',
      icon: '🍷',
      title: 'Artisanat d\'Excellence',
      description: 'Chaque étape, de la vigne à la bouteille, est réalisée avec un soin minutieux et une attention aux détails.',
      details: 'Notre philosophie artisanale privilégie la qualité sur la quantité. Nous utilisons des cuves en ciment, des levures indigènes et un minimum d\'intervention pour préserver l\'expression du terroir.',
      practices: [
        'Fermentation avec levures indigènes',
        'Cuves en ciment traditionnel',
        'Intervention minimale',
        'Sélection parcellaire rigoureuse'
      ]
    },
    {
      id: 'terroir',
      icon: '🏔️',
      title: 'Terroir d\'Exception',
      description: 'Notre terroir calcaire en altitude offre des conditions uniques, créant des vins d\'une fraîcheur et complexité remarquables.',
      details: 'Situé entre 200 et 450m d\'altitude, notre terroir bénéficie d\'un microclimat unique avec les vents Mistral et Pontias, sur des sols calcaires exceptionnels.',
      practices: [
        'Vendanges manuelles en cagettes',
        'Sélection parcellaire précise',
        'Respect du calendrier de maturité',
        'Préservation de l\'acidité naturelle'
      ]
    }
  ] : [
    {
      id: 'biodynamic',
      icon: '🌱',
      title: 'Biodynamic Agriculture',
      description: 'We cultivate our vines in harmony with natural and lunar rhythms, strengthening soil and plant vitality.',
      details: 'Our biodynamic approach goes beyond organic agriculture. We use natural preparations, follow the lunar calendar, and consider our vineyard as a complete living organism.',
      practices: [
        'Biodynamic preparations (500, 501)',
        'Lunar calendar for all work',
        'Enriched natural composting',
        'Preserved biodiversity and ecosystem'
      ]
    },
    {
      id: 'heritage',
      icon: '🏠',
      title: 'Family Heritage',
      description: 'Five generations of expertise transmitted with respect, innovation, and passion for our unique terroir.',
      details: 'Our heritage is not just a story, it\'s a living commitment. Each generation enriches the tradition while preserving the essence of our terroir.',
      practices: [
        'Preserved traditional techniques',
        'Respectful innovation',
        'Knowledge transmission',
        'Terroir memory conserved'
      ]
    },
    {
      id: 'craftsmanship',
      icon: '🍷',
      title: 'Excellence in Craftsmanship',
      description: 'Every step, from vine to bottle, is carried out with meticulous care and attention to detail.',
      details: 'Our artisanal philosophy prioritizes quality over quantity. We use cement vats, indigenous yeasts, and minimal intervention to preserve terroir expression.',
      practices: [
        'Fermentation with indigenous yeasts',
        'Traditional cement vats',
        'Minimal intervention',
        'Rigorous parcel selection'
      ]
    },
    {
      id: 'terroir',
      icon: '🏔️',
      title: 'Exceptional Terroir',
      description: 'Our high-altitude limestone terroir offers unique conditions, creating wines of remarkable freshness and complexity.',
      details: 'Located between 200 and 450m altitude, our terroir benefits from a unique microclimate with Mistral and Pontias winds, on exceptional limestone soils.',
      practices: [
        'Manual harvest in small crates',
        'Precise parcel selection',
        'Respect for maturity calendar',
        'Natural acidity preservation'
      ]
    }
  ]

  const content = {
    fr: {
      overline: 'Nos Valeurs',
      title: 'Les Piliers de Notre Excellence',
      subtitle: 'Quatre principes guident chacune de nos actions',
      expandLabel: 'En savoir plus',
      collapseLabel: 'Réduire',
      practicesTitle: 'Nos Pratiques'
    },
    en: {
      overline: 'Our Values',
      title: 'The Pillars of Our Excellence',
      subtitle: 'Four principles guide each of our actions',
      expandLabel: 'Learn more',
      collapseLabel: 'Collapse',
      practicesTitle: 'Our Practices'
    }
  }

  const text = content[locale as keyof typeof content] || content.en

  const toggleExpanded = (valueId: string) => {
    setExpandedValue(expandedValue === valueId ? null : valueId)
  }

  return (
    <section className="py-16 lg:py-24 bg-heritage-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-heritage-slate-600 font-serif text-sm md:text-base tracking-wider uppercase mb-4">
            {text.overline}
          </p>
          <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-heritage-slate-900 mb-4">
            {text.title}
          </h2>
          <p className="text-heritage-rouge-600 font-serif text-xl md:text-2xl font-medium mb-6">
            {text.subtitle}
          </p>
        </div>

        {/* Values Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-8">
          {values.map((value) => {
            const isExpanded = expandedValue === value.id
            
            return (
              <div
                key={value.id}
                className={`bg-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden ${
                  isExpanded ? 'ring-2 ring-heritage-golden-500 ring-opacity-50' : ''
                }`}
              >
                <div className="p-6 lg:p-8">
                  {/* Icon and Title */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className="text-4xl flex-shrink-0">{value.icon}</div>
                    <div className="flex-1">
                      <h3 className="font-serif text-xl lg:text-2xl font-bold text-heritage-slate-900 mb-2">
                        {value.title}
                      </h3>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-heritage-slate-700 leading-relaxed mb-6">
                    {value.description}
                  </p>

                  {/* Expand/Collapse Button */}
                  <button
                    onClick={() => toggleExpanded(value.id)}
                    className="inline-flex items-center gap-2 text-heritage-rouge-600 hover:text-heritage-rouge-800 font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-heritage-rouge-500 focus:ring-opacity-50 rounded-md px-2 py-1"
                    aria-expanded={isExpanded}
                  >
                    {isExpanded ? text.collapseLabel : text.expandLabel}
                    <svg
                      className={`h-4 w-4 transition-transform duration-200 ${
                        isExpanded ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="mt-6 pt-6 border-t border-heritage-limestone-300 animate-fade-in">
                      <p className="text-heritage-slate-700 leading-relaxed mb-6">
                        {value.details}
                      </p>

                      {/* Practices */}
                      <div>
                        <h4 className="font-semibold text-heritage-slate-800 mb-3">
                          {text.practicesTitle}
                        </h4>
                        <div className="space-y-2">
                          {value.practices.map((practice, index) => (
                            <div key={index} className="flex items-start gap-3">
                              <div className="w-1.5 h-1.5 rounded-full bg-heritage-golden-500 mt-2 flex-shrink-0"></div>
                              <span className="text-heritage-slate-600 text-sm leading-relaxed">
                                {practice}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Bottom Quote */}
        <div className="mt-16 text-center">
          <div className="max-w-2xl mx-auto">
            <blockquote className="font-serif text-xl lg:text-2xl text-heritage-slate-700 italic leading-relaxed">
              {locale === 'fr'
                ? '"Ces valeurs ne sont pas des mots sur papier, mais des engagements vivants qui guident chacun de nos gestes."'
                : '"These values are not words on paper, but living commitments that guide each of our actions."'
              }
            </blockquote>
            <cite className="block text-heritage-slate-600 font-medium mt-4 not-italic">
              — {locale === 'fr' ? 'Domaine Vallot' : 'Domaine Vallot'}
            </cite>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </section>
  )
}