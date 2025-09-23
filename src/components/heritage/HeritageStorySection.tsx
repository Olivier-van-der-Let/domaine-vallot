'use client'

import { useState } from 'react'

interface HeritageStorySectionProps {
  locale: string
}

interface TimelineEvent {
  year: string
  title: string
  description: string
}

export default function HeritageStorySection({ locale }: HeritageStorySectionProps) {
  const [activeEvent, setActiveEvent] = useState(0)

  const timelineEvents: TimelineEvent[] = locale === 'fr' ? [
    {
      year: '1890',
      title: 'Les Racines',
      description: 'Fondation du domaine par la famille Vallot sur les coteaux calcaires de Vinsobres.'
    },
    {
      year: '1920',
      title: 'L\'Expansion',
      description: 'Acquisition des terrasses historiques et développement des techniques de culture traditionnelles.'
    },
    {
      year: '1960',
      title: 'La Tradition',
      description: 'Transmission du savoir-faire familial et préservation des méthodes ancestrales.'
    },
    {
      year: '1995',
      title: 'La Biodynamie',
      description: 'Conversion vers l\'agriculture biodynamique, respectant les cycles naturels.'
    },
    {
      year: '2010',
      title: 'La Certification',
      description: 'Obtention de la certification Demeter et reconnaissance AOC Vinsobres.'
    },
    {
      year: '2024',
      title: 'Anaïs Vallot',
      description: 'Première femme à diriger le domaine, alliant tradition et innovation moderne.'
    }
  ] : [
    {
      year: '1890',
      title: 'The Roots',
      description: 'Foundation of the domain by the Vallot family on the limestone hillsides of Vinsobres.'
    },
    {
      year: '1920',
      title: 'The Expansion',
      description: 'Acquisition of historic terraces and development of traditional cultivation techniques.'
    },
    {
      year: '1960',
      title: 'The Tradition',
      description: 'Transfer of family expertise and preservation of ancestral methods.'
    },
    {
      year: '1995',
      title: 'Biodynamics',
      description: 'Conversion to biodynamic agriculture, respecting natural cycles.'
    },
    {
      year: '2010',
      title: 'Certification',
      description: 'Demeter certification and AOC Vinsobres recognition obtained.'
    },
    {
      year: '2024',
      title: 'Anaïs Vallot',
      description: 'First woman to lead the domain, combining tradition with modern innovation.'
    }
  ]

  const content = {
    fr: {
      overline: 'Notre Héritage',
      title: 'Sept Générations de Passion',
      subtitle: 'Une Histoire Vivante',
      description: 'Depuis 1890, sept générations de vignerons se sont succédé sur ces terres calcaires exceptionnelles. Chaque génération a transmis son savoir-faire tout en apportant sa propre vision, créant une continuité remarquable entre tradition et innovation.',
      wisdom: 'Aujourd\'hui, Anaïs est la première femme à la tête de ce merveilleux patrimoine, perpétuant l\'engouement et l\'expertise d\'une belle équipe de viticulteurs.',
      cta: 'Découvrir Notre Histoire'
    },
    en: {
      overline: 'Our Heritage',
      title: 'Seven Generations of Passion',
      subtitle: 'A Living History',
      description: 'Since 1890, seven generations of winemakers have succeeded one another on these exceptional limestone lands. Each generation has transmitted its expertise while bringing its own vision, creating a remarkable continuity between tradition and innovation.',
      wisdom: 'Today, Anaïs is the first woman to head this wonderful heritage, perpetuating the enthusiasm and expertise of a beautiful team of winemakers.',
      cta: 'Discover Our Story'
    }
  }

  const text = content[locale as keyof typeof content] || content.en

  return (
    <section className="py-16 lg:py-24 bg-heritage-limestone-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Heritage Story */}
          <div className="space-y-8">
            {/* Overline */}
            <p className="text-heritage-rouge-600 font-serif text-sm md:text-base tracking-wider uppercase">
              {text.overline}
            </p>

            {/* Main Title */}
            <div>
              <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-heritage-slate-900 mb-4">
                {text.title}
              </h2>
              <p className="text-heritage-golden-600 font-serif text-xl md:text-2xl font-medium">
                {text.subtitle}
              </p>
            </div>

            {/* Description */}
            <div className="space-y-6">
              <p className="text-heritage-slate-700 text-lg leading-relaxed">
                {text.description}
              </p>
              <p className="text-heritage-slate-600 text-base leading-relaxed italic">
                {text.wisdom}
              </p>
            </div>

            {/* CTA */}
            <div>
              <button className="inline-flex items-center px-6 py-3 bg-heritage-rouge-700 text-heritage-limestone-50 font-semibold rounded-md hover:bg-heritage-rouge-800 focus:ring-2 focus:ring-heritage-rouge-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                {text.cta}
                <svg className="ml-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </button>
            </div>
          </div>

          {/* Right: Interactive Timeline */}
          <div className="bg-white rounded-lg shadow-xl p-6 lg:p-8">
            <div className="space-y-6">
              {/* Timeline Header */}
              <div className="text-center mb-8">
                <h3 className="font-serif text-2xl font-bold text-heritage-slate-900 mb-2">
                  {locale === 'fr' ? 'Chronologie Familiale' : 'Family Timeline'}
                </h3>
                <div className="w-16 h-1 bg-heritage-golden-500 mx-auto rounded-full"></div>
              </div>

              {/* Timeline Events */}
              <div className="space-y-4">
                {timelineEvents.map((event, index) => (
                  <div
                    key={index}
                    className={`relative pl-8 pb-6 cursor-pointer transition-all duration-200 ${
                      activeEvent === index ? 'opacity-100' : 'opacity-70 hover:opacity-90'
                    }`}
                    onClick={() => setActiveEvent(index)}
                  >
                    {/* Timeline Line */}
                    <div className="absolute left-0 top-0 w-px h-full bg-heritage-olive-300">
                      {index < timelineEvents.length - 1 && (
                        <div className="absolute top-6 left-0 w-px h-full bg-heritage-olive-300"></div>
                      )}
                    </div>

                    {/* Timeline Dot */}
                    <div className={`absolute left-0 top-1 transform -translate-x-1/2 w-3 h-3 rounded-full border-2 transition-all duration-200 ${
                      activeEvent === index
                        ? 'bg-heritage-golden-500 border-heritage-golden-600 scale-125'
                        : 'bg-heritage-limestone-100 border-heritage-olive-400'
                    }`}></div>

                    {/* Event Content */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <span className={`font-bold text-sm px-2 py-1 rounded transition-all duration-200 ${
                          activeEvent === index
                            ? 'bg-heritage-golden-100 text-heritage-golden-800'
                            : 'bg-heritage-limestone-100 text-heritage-slate-600'
                        }`}>
                          {event.year}
                        </span>
                        <h4 className={`font-serif text-lg font-semibold transition-all duration-200 ${
                          activeEvent === index ? 'text-heritage-slate-900' : 'text-heritage-slate-700'
                        }`}>
                          {event.title}
                        </h4>
                      </div>
                      <p className={`text-sm leading-relaxed transition-all duration-200 ${
                        activeEvent === index ? 'text-heritage-slate-700' : 'text-heritage-slate-500'
                      }`}>
                        {event.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}