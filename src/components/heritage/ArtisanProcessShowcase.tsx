'use client'

import { useState } from 'react'

interface ArtisanProcessShowcaseProps {
  locale: string
}

interface ProcessStep {
  id: string
  title: string
  period: string
  description: string
  techniques: string[]
  philosophy: string
  duration: string
}

interface FamilyMember {
  name: string
  role: string
  expertise: string
  years: string
  quote: string
  image: string
}

export default function ArtisanProcessShowcase({ locale }: ArtisanProcessShowcaseProps) {
  const [activeProcess, setActiveProcess] = useState(0)
  const [activeTab, setActiveTab] = useState<'process' | 'family'>('process')

  const processSteps: ProcessStep[] = locale === 'fr' ? [
    {
      id: 'vineyard',
      title: 'Travail de la Vigne',
      period: 'Toute l\'année',
      description: 'Nos vignes sont cultivées selon les principes stricts de la biodynamie, en harmonie avec les cycles lunaires et les saisons.',
      techniques: ['Taille respectueuse', 'Labour manuel', 'Préparations biodynamiques', 'Vendanges manuelles'],
      philosophy: 'Respecter le rythme naturel de la vigne pour révéler l\'expression la plus pure du terroir.',
      duration: '12 mois'
    },
    {
      id: 'harvest',
      title: 'Vendanges',
      period: 'Septembre - Octobre',
      description: 'Chaque parcelle est récoltée à maturité optimale, tôt le matin pour préserver la fraîcheur des raisins.',
      techniques: ['Tri rigoureux', 'Transport en cagettes', 'Récolte matinale', 'Sélection parcellaire'],
      philosophy: 'Capturer le moment parfait où le raisin exprime pleinement son potentiel.',
      duration: '4-6 semaines'
    },
    {
      id: 'vinification',
      title: 'Vinification',
      period: 'Septembre - Décembre',
      description: 'Vinification parcelle par parcelle avec des techniques traditionnelles et un minimum d\'intervention.',
      techniques: ['Fermentation naturelle', 'Pigeage traditionnel', 'Cuvaisons longues', 'Pressurage doux'],
      philosophy: 'Laisser le vin se faire naturellement, en guidant délicatement sans forcer.',
      duration: '3-4 mois'
    },
    {
      id: 'aging',
      title: 'Élevage',
      period: 'Décembre - Mise en bouteille',
      description: 'Élevage en fûts de chêne français et en cuves béton selon le profil recherché pour chaque cuvée.',
      techniques: ['Bâtonnage maîtrisé', 'Soutirages réguliers', 'Collage au blanc d\'œuf', 'Filtration légère'],
      philosophy: 'Permettre au vin de révéler sa complexité et sa personnalité unique.',
      duration: '12-18 mois'
    }
  ] : [
    {
      id: 'vineyard',
      title: 'Vineyard Work',
      period: 'Year-round',
      description: 'Our vines are cultivated according to strict biodynamic principles, in harmony with lunar cycles and seasons.',
      techniques: ['Respectful pruning', 'Manual cultivation', 'Biodynamic preparations', 'Hand harvesting'],
      philosophy: 'Respect the natural rhythm of the vine to reveal the purest expression of terroir.',
      duration: '12 months'
    },
    {
      id: 'harvest',
      title: 'Harvest',
      period: 'September - October',
      description: 'Each plot is harvested at optimal maturity, early in the morning to preserve grape freshness.',
      techniques: ['Rigorous sorting', 'Small crate transport', 'Morning harvest', 'Plot selection'],
      philosophy: 'Capture the perfect moment when grapes fully express their potential.',
      duration: '4-6 weeks'
    },
    {
      id: 'vinification',
      title: 'Vinification',
      period: 'September - December',
      description: 'Plot-by-plot vinification with traditional techniques and minimal intervention.',
      techniques: ['Natural fermentation', 'Traditional punch-down', 'Extended maceration', 'Gentle pressing'],
      philosophy: 'Let wine make itself naturally, guiding gently without forcing.',
      duration: '3-4 months'
    },
    {
      id: 'aging',
      title: 'Aging',
      period: 'December - Bottling',
      description: 'Aging in French oak barrels and concrete vats according to the desired profile for each cuvée.',
      techniques: ['Controlled stirring', 'Regular racking', 'Egg white fining', 'Light filtration'],
      philosophy: 'Allow wine to reveal its complexity and unique personality.',
      duration: '12-18 months'
    }
  ]

  const familyMembers: FamilyMember[] = locale === 'fr' ? [
    {
      name: 'Anaïs Vallot',
      role: 'Directrice du Domaine',
      expertise: 'Vision stratégique et innovation biodynamique',
      years: '5 ans à la tête',
      quote: 'Je porte l\'héritage de sept générations tout en ouvrant de nouveaux horizons pour notre domaine.',
      image: 'https://vmtudbupajnjyauvqnej.supabase.co/storage/v1/object/public/Public/decorative/anais-vallot.jpg'
    },
    {
      name: 'Magali Rousseau',
      role: 'Maître de Chai',
      expertise: 'Vinification et élevage traditionnel',
      years: '15 ans d\'expérience',
      quote: 'Chaque millésime est unique, mon rôle est d\'accompagner le vin vers son expression la plus juste.',
      image: 'https://vmtudbupajnjyauvqnej.supabase.co/storage/v1/object/public/Public/decorative/magali-rousseau.jpg'
    },
    {
      name: 'Christelle Durand',
      role: 'Responsable Vignoble',
      expertise: 'Biodynamie et travail de la vigne',
      years: '12 ans au domaine',
      quote: 'La vigne nous parle, il faut savoir l\'écouter et respecter ses besoins naturels.',
      image: 'https://vmtudbupajnjyauvqnej.supabase.co/storage/v1/object/public/Public/decorative/christelle-durand.jpg'
    },
    {
      name: 'Aurélia Martin',
      role: 'Accueil et Dégustation',
      expertise: 'Transmission et partage',
      years: '8 ans d\'accompagnement',
      quote: 'Faire découvrir nos vins, c\'est transmettre l\'amour de notre terroir et de notre métier.',
      image: 'https://vmtudbupajnjyauvqnej.supabase.co/storage/v1/object/public/Public/decorative/aurelia-martin.jpg'
    }
  ] : [
    {
      name: 'Anaïs Vallot',
      role: 'Estate Director',
      expertise: 'Strategic vision and biodynamic innovation',
      years: '5 years leading',
      quote: 'I carry the heritage of seven generations while opening new horizons for our estate.',
      image: 'https://vmtudbupajnjyauvqnej.supabase.co/storage/v1/object/public/Public/decorative/anais-vallot.jpg'
    },
    {
      name: 'Magali Rousseau',
      role: 'Cellar Master',
      expertise: 'Traditional vinification and aging',
      years: '15 years experience',
      quote: 'Each vintage is unique, my role is to guide wine towards its truest expression.',
      image: 'https://vmtudbupajnjyauvqnej.supabase.co/storage/v1/object/public/Public/decorative/magali-rousseau.jpg'
    },
    {
      name: 'Christelle Durand',
      role: 'Vineyard Manager',
      expertise: 'Biodynamics and vine work',
      years: '12 years at the estate',
      quote: 'The vine speaks to us, we must know how to listen and respect its natural needs.',
      image: 'https://vmtudbupajnjyauvqnej.supabase.co/storage/v1/object/public/Public/decorative/christelle-durand.jpg'
    },
    {
      name: 'Aurélia Martin',
      role: 'Hospitality and Tasting',
      expertise: 'Transmission and sharing',
      years: '8 years accompanying guests',
      quote: 'Sharing our wines means transmitting love for our terroir and our craft.',
      image: 'https://vmtudbupajnjyauvqnej.supabase.co/storage/v1/object/public/Public/decorative/aurelia-martin.jpg'
    }
  ]

  const content = {
    fr: {
      overline: 'Savoir-Faire Artisanal',
      title: 'L\'Art de la Vinification',
      subtitle: 'Tradition et Innovation en Harmonie',
      description: 'Notre processus de vinification allie techniques ancestrales et innovations modernes, guidé par une équipe passionnée qui porte l\'expertise de générations de vignerons.',
      tabs: {
        process: 'Processus',
        family: 'Notre Équipe'
      },
      processDetails: {
        techniques: 'Techniques utilisées',
        philosophy: 'Philosophie',
        duration: 'Durée'
      }
    },
    en: {
      overline: 'Artisan Craftsmanship',
      title: 'The Art of Winemaking',
      subtitle: 'Tradition and Innovation in Harmony',
      description: 'Our winemaking process combines ancestral techniques with modern innovations, guided by a passionate team that carries the expertise of generations of winemakers.',
      tabs: {
        process: 'Process',
        family: 'Our Team'
      },
      processDetails: {
        techniques: 'Techniques used',
        philosophy: 'Philosophy',
        duration: 'Duration'
      }
    }
  }

  const text = content[locale as keyof typeof content] || content.en

  return (
    <section className="py-16 lg:py-24 bg-heritage-golden-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12 lg:mb-16">
          <p className="text-heritage-golden-700 font-serif text-sm md:text-base tracking-wider uppercase mb-4">
            {text.overline}
          </p>
          <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-heritage-slate-900 mb-4">
            {text.title}
          </h2>
          <p className="text-heritage-rouge-600 font-serif text-xl md:text-2xl font-medium mb-6">
            {text.subtitle}
          </p>
          <p className="text-heritage-slate-700 text-lg leading-relaxed max-w-3xl mx-auto">
            {text.description}
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-lg p-1 shadow-lg">
            <button
              onClick={() => setActiveTab('process')}
              className={`px-6 py-3 rounded-md font-medium transition-all duration-200 ${
                activeTab === 'process'
                  ? 'bg-heritage-golden-600 text-white shadow-md'
                  : 'text-heritage-slate-700 hover:text-heritage-golden-600 hover:bg-heritage-limestone-100'
              }`}
            >
              {text.tabs.process}
            </button>
            <button
              onClick={() => setActiveTab('family')}
              className={`px-6 py-3 rounded-md font-medium transition-all duration-200 ${
                activeTab === 'family'
                  ? 'bg-heritage-golden-600 text-white shadow-md'
                  : 'text-heritage-slate-700 hover:text-heritage-golden-600 hover:bg-heritage-limestone-100'
              }`}
            >
              {text.tabs.family}
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'process' ? (
          /* Process Showcase */
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Process Timeline */}
            <div className="lg:col-span-1 space-y-4">
              {processSteps.map((step, index) => (
                <div
                  key={step.id}
                  className={`relative p-4 rounded-lg cursor-pointer transition-all duration-300 ${
                    activeProcess === index
                      ? 'bg-white shadow-lg transform scale-105'
                      : 'bg-heritage-limestone-100 hover:bg-heritage-limestone-200 hover:shadow-md'
                  }`}
                  onClick={() => setActiveProcess(index)}
                >
                  {/* Active Indicator */}
                  {activeProcess === index && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-heritage-golden-500 rounded-r"></div>
                  )}

                  {/* Step Number */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mb-3 ${
                    activeProcess === index
                      ? 'bg-heritage-golden-500 text-white'
                      : 'bg-heritage-limestone-300 text-heritage-slate-600'
                  }`}>
                    {index + 1}
                  </div>

                  <h3 className={`font-serif text-lg font-semibold mb-2 transition-colors duration-200 ${
                    activeProcess === index ? 'text-heritage-slate-900' : 'text-heritage-slate-700'
                  }`}>
                    {step.title}
                  </h3>

                  <p className={`text-sm transition-colors duration-200 ${
                    activeProcess === index ? 'text-heritage-golden-600' : 'text-heritage-slate-600'
                  }`}>
                    {step.period}
                  </p>
                </div>
              ))}
            </div>

            {/* Process Details */}
            <div className="lg:col-span-2 bg-white rounded-lg shadow-xl p-8">
              <div className="space-y-6">
                {/* Title and Period */}
                <div className="border-b border-heritage-limestone-200 pb-4">
                  <h3 className="font-serif text-2xl font-bold text-heritage-slate-900 mb-2">
                    {processSteps[activeProcess].title}
                  </h3>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="px-3 py-1 bg-heritage-golden-100 text-heritage-golden-800 rounded-full">
                      {processSteps[activeProcess].period}
                    </span>
                    <span className="text-heritage-slate-600">
                      {text.processDetails.duration}: {processSteps[activeProcess].duration}
                    </span>
                  </div>
                </div>

                {/* Description */}
                <p className="text-heritage-slate-700 text-lg leading-relaxed">
                  {processSteps[activeProcess].description}
                </p>

                {/* Techniques */}
                <div>
                  <h4 className="font-semibold text-heritage-slate-800 mb-3">
                    {text.processDetails.techniques}
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    {processSteps[activeProcess].techniques.map((technique, index) => (
                      <div key={index} className="flex items-center text-heritage-slate-700">
                        <div className="w-2 h-2 rounded-full bg-heritage-golden-500 mr-3 flex-shrink-0"></div>
                        <span className="text-sm">{technique}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Philosophy */}
                <div className="bg-heritage-golden-50 rounded-lg p-4">
                  <h4 className="font-semibold text-heritage-slate-800 mb-2">
                    {text.processDetails.philosophy}
                  </h4>
                  <p className="text-heritage-slate-700 italic">
                    "{processSteps[activeProcess].philosophy}"
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Family Team Showcase */
          <div className="grid md:grid-cols-2 gap-8">
            {familyMembers.map((member, index) => (
              <div key={index} className="bg-white rounded-lg shadow-xl overflow-hidden hover:shadow-2xl transition-shadow duration-300">
                {/* Member Photo */}
                <div className="aspect-[4/3] relative overflow-hidden">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>

                  {/* Member Info Overlay */}
                  <div className="absolute bottom-4 left-4 text-white">
                    <h3 className="font-serif text-xl font-bold mb-1">{member.name}</h3>
                    <p className="text-heritage-golden-300 text-sm font-medium">{member.role}</p>
                  </div>
                </div>

                {/* Member Details */}
                <div className="p-6 space-y-4">
                  <div>
                    <h4 className="font-semibold text-heritage-slate-800 mb-2">
                      {locale === 'fr' ? 'Expertise' : 'Expertise'}
                    </h4>
                    <p className="text-heritage-slate-700">{member.expertise}</p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-heritage-slate-800 mb-2">
                      {locale === 'fr' ? 'Expérience' : 'Experience'}
                    </h4>
                    <p className="text-heritage-rouge-600 font-medium">{member.years}</p>
                  </div>

                  <div className="bg-heritage-limestone-50 rounded-lg p-4">
                    <p className="text-heritage-slate-700 italic text-sm leading-relaxed">
                      "{member.quote}"
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}