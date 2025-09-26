'use client'

import { useState } from 'react'

interface FamilyStoryTimelineProps {
  locale: string
}

interface TimelineEvent {
  year: string
  title: string
  description: string
  details: string
  image?: string
}

export default function FamilyStoryTimeline({ locale }: FamilyStoryTimelineProps) {
  const [activeEvent, setActiveEvent] = useState(0)

  const timelineEvents: TimelineEvent[] = locale === 'fr' ? [
    {
      year: '1900',
      title: 'Les Racines',
      description: 'La famille Vallot plante ses premières vignes sur les coteaux calcaires de Vinsobres.',
      details: 'En 1900, la famille Vallot décide de s\'installer sur ces terres exceptionnelles. Ces coteaux calcaires, avec leur exposition parfaite et leur altitude unique, offrent un terroir idéal pour la viticulture.'
    },
    {
      year: '1960-1990',
      title: 'L\'Héritage Grandit',
      description: 'Transmission du savoir-faire familial et développement des méthodes traditionnelles.',
      details: 'Pendant ces décennies cruciales, chaque génération a enrichi le patrimoine viticole, perfectionnant les techniques de culture et établissant les fondements de notre philosophie actuelle.'
    },
    {
      year: '1995',
      title: 'La Révolution Biodynamique',
      description: 'François Vallot, pionnier visionnaire, amorce la conversion vers l\'agriculture biodynamique.',
      details: 'Bien avant que cela ne devienne à la mode, François comprend que l\'avenir de la viticulture réside dans le respect des cycles naturels et la santé du sol.'
    },
    {
      year: '2003-2007',
      title: 'Certification & Reconnaissance',
      description: 'Obtention de la certification Ecocert (2003) puis Demeter (2007).',
      details: 'Ces certifications reconnues internationalement confirment notre engagement envers une viticulture respectueuse de l\'environnement et attestent de la qualité de nos pratiques biodynamiques.'
    },
    {
      year: '2006',
      title: 'Premier Cru de Drôme Provençale',
      description: 'Vinsobres obtient le statut de Cru, premier et unique de Drôme Provençale.',
      details: 'Cette reconnaissance officielle confirme l\'exceptionalité de notre terroir et place Vinsobres parmi les appellations les plus prestigieuses de la vallée du Rhône.'
    },
    {
      year: '2013',
      title: 'Anaïs Revient aux Sources',
      description: 'Après une carrière internationale dans l\'hôtellerie de luxe, Anaïs revient au domaine.',
      details: 'Formée chez Four Seasons et ayant géré des hôtels 5 étoiles à Genève, Anaïs apporte une vision globale et une expertise en hospitalité de luxe. Son stage au Château d\'Yquem enrichit sa maîtrise vinicole.'
    }
  ] : [
    {
      year: '1900',
      title: 'The Roots',
      description: 'The Vallot family plants their first vines on the limestone hillsides of Vinsobres.',
      details: 'In 1900, the Vallot family decided to settle on this exceptional land. These limestone hillsides, with their perfect exposure and unique altitude, offer an ideal terroir for viticulture.'
    },
    {
      year: '1960-1990',
      title: 'Heritage Grows',
      description: 'Transfer of family expertise and development of traditional methods.',
      details: 'During these crucial decades, each generation enriched the viticultural heritage, perfecting cultivation techniques and establishing the foundations of our current philosophy.'
    },
    {
      year: '1995',
      title: 'The Biodynamic Revolution',
      description: 'François Vallot, visionary pioneer, begins conversion to biodynamic agriculture.',
      details: 'Long before it became fashionable, François understood that the future of viticulture lies in respecting natural cycles and soil health.'
    },
    {
      year: '2003-2007',
      title: 'Certification & Recognition',
      description: 'Obtaining Ecocert certification (2003) then Demeter (2007).',
      details: 'These internationally recognized certifications confirm our commitment to environmentally respectful viticulture and attest to the quality of our biodynamic practices.'
    },
    {
      year: '2006',
      title: 'First Cru of Drôme Provençale',
      description: 'Vinsobres obtains Cru status, first and only in Drôme Provençale.',
      details: 'This official recognition confirms the exceptionality of our terroir and places Vinsobres among the most prestigious appellations of the Rhône Valley.'
    },
    {
      year: '2013',
      title: 'Anaïs Returns to Her Roots',
      description: 'After an international career in luxury hospitality, Anaïs returns to the domain.',
      details: 'Trained at Four Seasons and having managed 5-star hotels in Geneva, Anaïs brings a global vision and luxury hospitality expertise. Her internship at Château d\'Yquem enriches her winemaking mastery.'
    }
  ]

  const content = {
    fr: {
      overline: 'Notre Héritage',
      title: 'Racines qui Traversent le Temps',
      subtitle: 'Cinq générations de passion',
      description: 'Chaque génération a transmis son savoir-faire tout en apportant sa propre vision, créant une continuité remarquable entre tradition et innovation. Aujourd\'hui, Anaïs perpétue cet héritage avec une perspective mondiale.'
    },
    en: {
      overline: 'Our Heritage',
      title: 'Roots That Cross Time',
      subtitle: 'Five generations of passion',
      description: 'Each generation has transmitted its expertise while bringing its own vision, creating a remarkable continuity between tradition and innovation. Today, Anaïs perpetuates this heritage with a global perspective.'
    }
  }

  const text = content[locale as keyof typeof content] || content.en

  return (
    <section className="py-16 lg:py-24 bg-heritage-limestone-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12 lg:mb-16">
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
          {/* Timeline Visualization */}
          <div className="bg-white rounded-lg shadow-xl p-6 lg:p-8 lg:sticky lg:top-8">
            <h3 className="font-serif text-2xl font-bold text-heritage-slate-900 mb-8 text-center">
              {locale === 'fr' ? 'Chronologie Familiale' : 'Family Timeline'}
            </h3>

            <div className="space-y-4">
              {timelineEvents.map((event, index) => (
                <div
                  key={index}
                  className={`relative pl-8 pb-6 cursor-pointer transition-all duration-300 hover:bg-heritage-limestone-50 rounded-lg p-3 -m-3 ${
                    activeEvent === index ? 'bg-heritage-limestone-50 ring-2 ring-heritage-golden-500 ring-opacity-30' : ''
                  }`}
                  onClick={() => setActiveEvent(index)}
                >
                  {/* Timeline Line */}
                  {index < timelineEvents.length - 1 && (
                    <div className="absolute left-3 top-8 w-px h-full bg-heritage-olive-300"></div>
                  )}

                  {/* Timeline Dot */}
                  <div className={`absolute left-0 top-3 transform -translate-x-1/2 w-4 h-4 rounded-full border-2 transition-all duration-300 ${
                    activeEvent === index
                      ? 'bg-heritage-golden-500 border-heritage-golden-600 scale-125 shadow-lg'
                      : 'bg-heritage-limestone-100 border-heritage-olive-400 hover:border-heritage-golden-400'
                  }`}></div>

                  {/* Event Content */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span className={`font-bold text-sm px-3 py-1 rounded-full transition-all duration-300 ${
                        activeEvent === index
                          ? 'bg-heritage-golden-100 text-heritage-golden-800'
                          : 'bg-heritage-limestone-100 text-heritage-slate-600'
                      }`}>
                        {event.year}
                      </span>
                      <h4 className={`font-serif text-lg font-semibold transition-all duration-300 ${
                        activeEvent === index ? 'text-heritage-slate-900' : 'text-heritage-slate-700'
                      }`}>
                        {event.title}
                      </h4>
                    </div>
                    <p className={`text-sm leading-relaxed transition-all duration-300 ${
                      activeEvent === index ? 'text-heritage-slate-700' : 'text-heritage-slate-500'
                    }`}>
                      {event.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Active Event Details */}
          <div className="space-y-8">
            <div className="bg-white rounded-lg shadow-xl p-6 lg:p-8">
              <div className="mb-6">
                <span className="text-heritage-golden-600 font-bold text-2xl">
                  {timelineEvents[activeEvent].year}
                </span>
                <h3 className="font-serif text-2xl lg:text-3xl font-bold text-heritage-slate-900 mt-2 mb-4">
                  {timelineEvents[activeEvent].title}
                </h3>
              </div>
              
              <p className="text-heritage-slate-700 text-lg leading-relaxed mb-6">
                {timelineEvents[activeEvent].description}
              </p>
              
              <div className="border-l-4 border-heritage-golden-500 pl-6 bg-heritage-golden-50 py-4">
                <p className="text-heritage-slate-600 leading-relaxed italic">
                  {timelineEvents[activeEvent].details}
                </p>
              </div>
            </div>

            {/* Heritage Quote */}
            <div className="bg-heritage-rouge-50 border-l-4 border-heritage-rouge-500 p-6 rounded-lg">
              <blockquote className="text-heritage-rouge-800 font-serif text-lg italic leading-relaxed">
                {locale === 'fr'
                  ? '"Nous sommes les gardiens d\'un paysage vivant, transmettant à chaque génération l\'amour du terroir et le respect de la terre."'
                  : '"We are guardians of a living landscape, transmitting to each generation the love of terroir and respect for the earth."'
                }
              </blockquote>
              <cite className="block text-heritage-rouge-600 font-medium mt-3 not-italic">
                — {locale === 'fr' ? 'Famille Vallot' : 'The Vallot Family'}
              </cite>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}