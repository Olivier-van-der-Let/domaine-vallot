'use client'

import { useState, useEffect } from 'react'

interface LivingVineyardExperienceProps {
  locale: string
}

interface Season {
  id: string
  name: string
  period: string
  description: string
  activities: string[]
  image: string
  color: string
}

export default function LivingVineyardExperience({ locale }: LivingVineyardExperienceProps) {
  const [activeSeason, setActiveSeason] = useState(0)
  const [isAutoplay, setIsAutoplay] = useState(true)

  const seasons: Season[] = locale === 'fr' ? [
    {
      id: 'spring',
      name: 'Printemps',
      period: 'Mars - Mai',
      description: 'Le réveil du vignoble. Les bourgeons éclatent, la sève monte, et nos vignes biodynamiques s\'éveillent selon les rythmes lunaires. C\'est le moment du débourrement et de la sortie des premières feuilles.',
      activities: ['Taille de printemps', 'Labour des sols', 'Plantation selon le calendrier lunaire', 'Préparations biodynamiques'],
      image: 'https://vmtudbupajnjyauvqnej.supabase.co/storage/v1/object/public/Public/decorative/spring.jpg',
      color: 'heritage-olive-500'
    },
    {
      id: 'summer',
      name: 'Été',
      period: 'Juin - Août',
      description: 'L\'épanouissement. Les vignes se développent sous le soleil méditerranéen, les grappes se forment. Nos terroirs calcaires emmagasinent la chaleur du jour et la restituent la nuit.',
      activities: ['Rognage et effeuillage', 'Traitements biodynamiques', 'Surveillance de la véraison', 'Travail du sol en surface'],
      image: 'https://vmtudbupajnjyauvqnej.supabase.co/storage/v1/object/public/Public/decorative/summer.jpg',
      color: 'heritage-golden-500'
    },
    {
      id: 'autumn',
      name: 'Automne',
      period: 'Septembre - Novembre',
      description: 'Les vendanges et la transformation. Moment crucial où le terroir s\'exprime pleinement dans les raisins. Chaque parcelle est récoltée à maturité optimale selon nos observations biodynamiques.',
      activities: ['Vendanges manuelles', 'Vinification parcellaire', 'Fermentation naturelle', 'Début de l\'élevage'],
      image: 'https://vmtudbupajnjyauvqnej.supabase.co/storage/v1/object/public/Public/decorative/autumn.jpg',
      color: 'heritage-rouge-600'
    },
    {
      id: 'winter',
      name: 'Hiver',
      period: 'Décembre - Février',
      description: 'Le repos et la réflexion. Les vignes entrent en dormance, nous préparons les amendements biodynamiques et planifions la nouvelle année viticole en harmonie avec les cycles naturels.',
      activities: ['Taille d\'hiver', 'Préparation du compost', 'Analyse des sols', 'Planification biodynamique'],
      image: 'https://vmtudbupajnjyauvqnej.supabase.co/storage/v1/object/public/Public/decorative/winter.jpg',
      color: 'heritage-slate-600'
    }
  ] : [
    {
      id: 'spring',
      name: 'Spring',
      period: 'March - May',
      description: 'The vineyard awakens. Buds burst, sap rises, and our biodynamic vines awaken according to lunar rhythms. This is the time of bud break and the emergence of the first leaves.',
      activities: ['Spring pruning', 'Soil cultivation', 'Planting according to lunar calendar', 'Biodynamic preparations'],
      image: 'https://vmtudbupajnjyauvqnej.supabase.co/storage/v1/object/public/Public/decorative/spring.jpg',
      color: 'heritage-olive-500'
    },
    {
      id: 'summer',
      name: 'Summer',
      period: 'June - August',
      description: 'The blooming. Vines develop under the Mediterranean sun, clusters form. Our limestone terroirs store the heat of the day and release it at night.',
      activities: ['Topping and leaf removal', 'Biodynamic treatments', 'Veraison monitoring', 'Surface soil work'],
      image: 'https://vmtudbupajnjyauvqnej.supabase.co/storage/v1/object/public/Public/decorative/summer.jpg',
      color: 'heritage-golden-500'
    },
    {
      id: 'autumn',
      name: 'Autumn',
      period: 'September - November',
      description: 'Harvest and transformation. The crucial moment when terroir fully expresses itself in the grapes. Each plot is harvested at optimal maturity according to our biodynamic observations.',
      activities: ['Manual harvest', 'Plot-by-plot vinification', 'Natural fermentation', 'Beginning of aging'],
      image: 'https://vmtudbupajnjyauvqnej.supabase.co/storage/v1/object/public/Public/decorative/autumn.jpg',
      color: 'heritage-rouge-600'
    },
    {
      id: 'winter',
      name: 'Winter',
      period: 'December - February',
      description: 'Rest and reflection. Vines enter dormancy, we prepare biodynamic amendments and plan the new wine year in harmony with natural cycles.',
      activities: ['Winter pruning', 'Compost preparation', 'Soil analysis', 'Biodynamic planning'],
      image: 'https://vmtudbupajnjyauvqnej.supabase.co/storage/v1/object/public/Public/decorative/winter.jpg',
      color: 'heritage-slate-600'
    }
  ]

  const content = {
    fr: {
      overline: 'Le Vignoble Vivant',
      title: 'Un Organisme qui Respire',
      subtitle: 'Les Quatre Saisons du Terroir',
      description: 'Notre vignoble se transforme au rythme des saisons, révélant la beauté d\'un écosystème en harmonie. Chaque saison apporte ses défis, ses joies et ses enseignements, façonnant le caractère unique de nos vins.',
    },
    en: {
      overline: 'The Living Vineyard',
      title: 'A Breathing Organism',
      subtitle: 'The Four Seasons of Terroir',
      description: 'Our vineyard transforms with the rhythm of the seasons, revealing the beauty of an ecosystem in harmony. Each season brings its challenges, joys and teachings, shaping the unique character of our wines.',
    }
  }

  const text = content[locale as keyof typeof content] || content.en

  // Auto-advance seasons
  useEffect(() => {
    if (!isAutoplay) return

    const interval = setInterval(() => {
      setActiveSeason((prev) => (prev + 1) % seasons.length)
    }, 4000)

    return () => clearInterval(interval)
  }, [isAutoplay, seasons.length])

  return (
    <section className="py-16 lg:py-24 bg-heritage-olive-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12 lg:mb-16">
          <p className="text-heritage-olive-700 font-serif text-sm md:text-base tracking-wider uppercase mb-4">
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

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left: Season Image and Details */}
          <div className="order-2 lg:order-1">
            <div className="relative rounded-lg overflow-hidden shadow-2xl">
              {/* Main Image */}
              <div className="aspect-[4/3] relative">
                <img
                  src={seasons[activeSeason].image}
                  alt={`${seasons[activeSeason].name} vineyard scene`}
                  className="w-full h-full object-cover transition-all duration-700 ease-in-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>

                {/* Season Badge */}
                <div className="absolute top-4 left-4">
                  <div className={`px-3 py-1 rounded-full text-white font-medium text-sm bg-${seasons[activeSeason].color}/90 backdrop-blur-sm`}>
                    {seasons[activeSeason].period}
                  </div>
                </div>

                {/* Autoplay Control */}
                <button
                  onClick={() => setIsAutoplay(!isAutoplay)}
                  className="absolute top-4 right-4 p-2 rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-all duration-200"
                  aria-label={isAutoplay ? 'Pause slideshow' : 'Play slideshow'}
                >
                  {isAutoplay ? (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  )}
                </button>
              </div>

              {/* Season Details */}
              <div className="p-6 bg-white">
                <div className="mb-4">
                  <h3 className="font-serif text-2xl font-bold text-heritage-slate-900 mb-2">
                    {seasons[activeSeason].name}
                  </h3>
                  <p className="text-heritage-slate-700 leading-relaxed">
                    {seasons[activeSeason].description}
                  </p>
                </div>

                {/* Activities */}
                <div>
                  <h4 className="font-semibold text-heritage-slate-800 mb-3">
                    {locale === 'fr' ? 'Activités de saison :' : 'Seasonal activities:'}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {seasons[activeSeason].activities.map((activity, index) => (
                      <div key={index} className="flex items-center text-sm text-heritage-slate-600">
                        <div className={`w-2 h-2 rounded-full bg-${seasons[activeSeason].color} mr-2 flex-shrink-0`}></div>
                        {activity}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Season Selector */}
          <div className="order-1 lg:order-2">
            <div className="space-y-4">
              {seasons.map((season, index) => (
                <div
                  key={season.id}
                  className={`relative p-6 rounded-lg cursor-pointer transition-all duration-300 ${
                    activeSeason === index
                      ? 'bg-white shadow-lg transform scale-105'
                      : 'bg-heritage-limestone-100 hover:bg-heritage-limestone-200 hover:shadow-md'
                  }`}
                  onClick={() => {
                    setActiveSeason(index)
                    setIsAutoplay(false)
                  }}
                >
                  {/* Active Indicator */}
                  {activeSeason === index && (
                    <div className={`absolute left-0 top-0 bottom-0 w-1 bg-${season.color} rounded-r`}></div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`w-3 h-3 rounded-full bg-${season.color} flex-shrink-0`}></div>
                        <h4 className={`font-serif text-xl font-semibold transition-colors duration-200 ${
                          activeSeason === index ? 'text-heritage-slate-900' : 'text-heritage-slate-700'
                        }`}>
                          {season.name}
                        </h4>
                        <span className={`text-sm px-2 py-1 rounded transition-colors duration-200 ${
                          activeSeason === index
                            ? 'bg-heritage-golden-100 text-heritage-golden-800'
                            : 'bg-heritage-limestone-200 text-heritage-slate-600'
                        }`}>
                          {season.period}
                        </span>
                      </div>
                      <p className={`text-sm leading-relaxed transition-colors duration-200 ${
                        activeSeason === index ? 'text-heritage-slate-700' : 'text-heritage-slate-600'
                      }`}>
                        {season.description.slice(0, 120)}...
                      </p>
                    </div>

                    {/* Progress Indicator */}
                    {activeSeason === index && isAutoplay && (
                      <div className="ml-4">
                        <div className="w-8 h-8 relative">
                          <svg className="w-8 h-8 transform -rotate-90" viewBox="0 0 36 36">
                            <path
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              fill="none"
                              stroke="rgba(0,0,0,0.1)"
                              strokeWidth="2"
                            />
                            <path
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              fill="none"
                              stroke={`var(--${season.color})`}
                              strokeWidth="2"
                              strokeDasharray="100, 100"
                              className="animate-[progress_4s_linear_infinite]"
                            />
                          </svg>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes progress {
          from {
            stroke-dasharray: 0 100;
          }
          to {
            stroke-dasharray: 100 100;
          }
        }
      `}</style>
    </section>
  )
}