'use client'

import { useState } from 'react'

interface TerroirDeepDiveProps {
  locale: string
}

interface TerroirLayer {
  id: string
  name: string
  depth: string
  composition: string
  impact: string
  percentage: number
}

interface ClimateData {
  label: string
  value: string
  icon: string
}

export default function TerroirDeepDive({ locale }: TerroirDeepDiveProps) {
  const [activeLayer, setActiveLayer] = useState(0)
  const [activeTab, setActiveTab] = useState('soil')

  const terroirLayers: TerroirLayer[] = locale === 'fr' ? [
    {
      id: 'topsoil',
      name: 'Terre végétale',
      depth: '0-30 cm',
      composition: 'Argile calcaire et matière organique riche en humus biodynamique',
      impact: 'Nutrition immédiate des racines et rétention d\'eau optimale',
      percentage: 15
    },
    {
      id: 'clay',
      name: 'Argile calcaire',
      depth: '30-80 cm',
      composition: 'Argile compacte mélangée à des fragments de calcaire du Jurassique',
      impact: 'Réserve hydrique et régulation thermique naturelle',
      percentage: 35
    },
    {
      id: 'limestone',
      name: 'Calcaire dur',
      depth: '80-150 cm',
      composition: 'Calcaire massif du Jurassique avec veines de marnes',
      impact: 'Drainage profond et apport minéral constant',
      percentage: 40
    },
    {
      id: 'bedrock',
      name: 'Roche mère',
      depth: '150+ cm',
      composition: 'Substrat géologique de calcaire dur et schistes anciens',
      impact: 'Fondation minérale du terroir et caractère unique',
      percentage: 10
    }
  ] : [
    {
      id: 'topsoil',
      name: 'Topsoil',
      depth: '0-30 cm',
      composition: 'Calcareous clay and organic matter rich in biodynamic humus',
      impact: 'Immediate root nutrition and optimal water retention',
      percentage: 15
    },
    {
      id: 'clay',
      name: 'Calcareous Clay',
      depth: '30-80 cm',
      composition: 'Compact clay mixed with Jurassic limestone fragments',
      impact: 'Water reserve and natural thermal regulation',
      percentage: 35
    },
    {
      id: 'limestone',
      name: 'Hard Limestone',
      depth: '80-150 cm',
      composition: 'Massive Jurassic limestone with marl veins',
      impact: 'Deep drainage and constant mineral supply',
      percentage: 40
    },
    {
      id: 'bedrock',
      name: 'Bedrock',
      depth: '150+ cm',
      composition: 'Geological substrate of hard limestone and ancient shales',
      impact: 'Mineral foundation of terroir and unique character',
      percentage: 10
    }
  ]

  const climateData: ClimateData[] = locale === 'fr' ? [
    { label: 'Altitude', value: '220-350m', icon: '🏔️' },
    { label: 'Exposition', value: 'Sud-Est', icon: '☀️' },
    { label: 'Précipitations', value: '750mm/an', icon: '🌧️' },
    { label: 'Température moy.', value: '13.5°C', icon: '🌡️' },
    { label: 'Ensoleillement', value: '2800h/an', icon: '☀️' },
    { label: 'Mistral', value: '120 j/an', icon: '💨' }
  ] : [
    { label: 'Altitude', value: '220-350m', icon: '🏔️' },
    { label: 'Exposure', value: 'South-East', icon: '☀️' },
    { label: 'Rainfall', value: '750mm/year', icon: '🌧️' },
    { label: 'Avg. Temperature', value: '13.5°C', icon: '🌡️' },
    { label: 'Sunshine', value: '2800h/year', icon: '☀️' },
    { label: 'Mistral', value: '120 days/year', icon: '💨' }
  ]

  const content = {
    fr: {
      overline: 'Terroir Exceptionnel',
      title: 'La Terre Parle à Travers le Vin',
      subtitle: 'Géologie et Microlimat de Vinsobres',
      description: 'Notre terroir unique combine 150 millions d\'années de géologie avec un microclimat méditerranéen exceptionnel. Chaque couche de sol raconte l\'histoire de cette terre et influence le caractère de nos vins.',
      tabs: {
        soil: 'Sol & Géologie',
        climate: 'Climat & Exposition',
        wine: 'Expression Vinicole'
      },
      wineExpression: {
        title: 'Comment le Terroir S\'exprime',
        description: 'Chaque élément de notre terroir se retrouve dans le verre :',
        elements: [
          {
            source: 'Calcaire',
            expression: 'Minéralité fine et élégance structurelle',
            wines: 'Particulièrement dans nos Vinsobres'
          },
          {
            source: 'Argile',
            expression: 'Rondeur, ampleur et potentiel de garde',
            wines: 'Nos cuvées "Claude" et "Exception"'
          },
          {
            source: 'Exposition Sud-Est',
            expression: 'Fraîcheur matinale et maturité optimale',
            wines: 'Équilibre de tous nos vins'
          },
          {
            source: 'Mistral',
            expression: 'Concentration des arômes et santé des raisins',
            wines: 'Pureté aromatique signature'
          }
        ]
      }
    },
    en: {
      overline: 'Exceptional Terroir',
      title: 'The Land Speaks Through Wine',
      subtitle: 'Geology and Microclimate of Vinsobres',
      description: 'Our unique terroir combines 150 million years of geology with an exceptional Mediterranean microclimate. Each soil layer tells the story of this land and influences the character of our wines.',
      tabs: {
        soil: 'Soil & Geology',
        climate: 'Climate & Exposure',
        wine: 'Wine Expression'
      },
      wineExpression: {
        title: 'How Terroir Expresses Itself',
        description: 'Each element of our terroir is found in the glass:',
        elements: [
          {
            source: 'Limestone',
            expression: 'Fine minerality and structural elegance',
            wines: 'Particularly in our Vinsobres'
          },
          {
            source: 'Clay',
            expression: 'Roundness, amplitude and aging potential',
            wines: 'Our "Claude" and "Exception" cuvées'
          },
          {
            source: 'South-East Exposure',
            expression: 'Morning freshness and optimal maturity',
            wines: 'Balance of all our wines'
          },
          {
            source: 'Mistral',
            expression: 'Aroma concentration and grape health',
            wines: 'Signature aromatic purity'
          }
        ]
      }
    }
  }

  const text = content[locale as keyof typeof content] || content.en

  return (
    <section className="py-16 lg:py-24 bg-heritage-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12 lg:mb-16">
          <p className="text-heritage-slate-600 font-serif text-sm md:text-base tracking-wider uppercase mb-4">
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
            {(['soil', 'climate', 'wine'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 rounded-md font-medium transition-all duration-200 ${
                  activeTab === tab
                    ? 'bg-heritage-rouge-600 text-white shadow-md'
                    : 'text-heritage-slate-700 hover:text-heritage-rouge-600 hover:bg-heritage-limestone-100'
                }`}
              >
                {text.tabs[tab]}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="max-w-6xl mx-auto">
          {/* Soil & Geology Tab */}
          {activeTab === 'soil' && (
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
              {/* Soil Cross-Section Visualization */}
              <div className="bg-white rounded-lg shadow-xl p-6">
                <h3 className="font-serif text-2xl font-bold text-heritage-slate-900 mb-6 text-center">
                  {locale === 'fr' ? 'Coupe Géologique' : 'Geological Cross-Section'}
                </h3>

                <div className="space-y-2 mb-6">
                  {terroirLayers.map((layer, index) => (
                    <div
                      key={layer.id}
                      className={`relative cursor-pointer transition-all duration-300 rounded-lg overflow-hidden ${
                        activeLayer === index ? 'ring-2 ring-heritage-golden-500' : ''
                      }`}
                      onClick={() => setActiveLayer(index)}
                    >
                      {/* Layer Visualization */}
                      <div
                        className={`h-16 relative ${
                          layer.id === 'topsoil' ? 'bg-gradient-to-r from-heritage-olive-400 to-heritage-olive-500' :
                          layer.id === 'clay' ? 'bg-gradient-to-r from-heritage-rouge-300 to-heritage-rouge-400' :
                          layer.id === 'limestone' ? 'bg-gradient-to-r from-heritage-limestone-300 to-heritage-limestone-400' :
                          'bg-gradient-to-r from-heritage-slate-400 to-heritage-slate-500'
                        }`}
                      >
                        <div className="absolute inset-0 flex items-center justify-between px-4 text-white">
                          <span className="font-semibold text-sm">{layer.name}</span>
                          <span className="text-xs opacity-90">{layer.depth}</span>
                        </div>

                        {/* Percentage Bar */}
                        <div className="absolute bottom-0 left-0 h-1 bg-heritage-golden-400 transition-all duration-500"
                             style={{ width: `${layer.percentage}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Layer Details */}
                <div className="bg-heritage-limestone-50 rounded-lg p-4">
                  <h4 className="font-serif text-lg font-semibold text-heritage-slate-900 mb-2">
                    {terroirLayers[activeLayer].name}
                  </h4>
                  <div className="space-y-2 text-sm">
                    <p className="text-heritage-slate-700">
                      <span className="font-medium">
                        {locale === 'fr' ? 'Composition:' : 'Composition:'}
                      </span> {terroirLayers[activeLayer].composition}
                    </p>
                    <p className="text-heritage-slate-700">
                      <span className="font-medium">
                        {locale === 'fr' ? 'Impact:' : 'Impact:'}
                      </span> {terroirLayers[activeLayer].impact}
                    </p>
                  </div>
                </div>
              </div>

              {/* Geological History */}
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-xl p-6">
                  <h3 className="font-serif text-2xl font-bold text-heritage-slate-900 mb-4">
                    {locale === 'fr' ? 'Histoire Géologique' : 'Geological History'}
                  </h3>
                  <div className="space-y-4">
                    <div className="border-l-4 border-heritage-golden-500 pl-4">
                      <h4 className="font-semibold text-heritage-slate-800">
                        {locale === 'fr' ? 'Jurassique (150 Ma)' : 'Jurassic (150 Ma)'}
                      </h4>
                      <p className="text-heritage-slate-600 text-sm">
                        {locale === 'fr'
                          ? 'Formation des calcaires durs dans un environnement marin tropical.'
                          : 'Formation of hard limestone in a tropical marine environment.'
                        }
                      </p>
                    </div>
                    <div className="border-l-4 border-heritage-rouge-500 pl-4">
                      <h4 className="font-semibold text-heritage-slate-800">
                        {locale === 'fr' ? 'Miocène (20 Ma)' : 'Miocene (20 Ma)'}
                      </h4>
                      <p className="text-heritage-slate-600 text-sm">
                        {locale === 'fr'
                          ? 'Surrection alpine et fracturation du substrat calcaire.'
                          : 'Alpine uplift and fracturing of limestone substrate.'
                        }
                      </p>
                    </div>
                    <div className="border-l-4 border-heritage-olive-500 pl-4">
                      <h4 className="font-semibold text-heritage-slate-800">
                        {locale === 'fr' ? 'Quaternaire (2 Ma)' : 'Quaternary (2 Ma)'}
                      </h4>
                      <p className="text-heritage-slate-600 text-sm">
                        {locale === 'fr'
                          ? 'Érosion et formation des sols argilo-calcaires actuels.'
                          : 'Erosion and formation of current calcareous clay soils.'
                        }
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-xl p-6">
                  <h3 className="font-serif text-2xl font-bold text-heritage-slate-900 mb-4">
                    {locale === 'fr' ? 'Analyses de Sol' : 'Soil Analysis'}
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-heritage-slate-700">pH:</span>
                      <span className="ml-2 text-heritage-slate-600">7.8-8.2</span>
                    </div>
                    <div>
                      <span className="font-medium text-heritage-slate-700">
                        {locale === 'fr' ? 'Calcaire actif:' : 'Active limestone:'}
                      </span>
                      <span className="ml-2 text-heritage-slate-600">15-25%</span>
                    </div>
                    <div>
                      <span className="font-medium text-heritage-slate-700">
                        {locale === 'fr' ? 'Argile:' : 'Clay:'}
                      </span>
                      <span className="ml-2 text-heritage-slate-600">35-45%</span>
                    </div>
                    <div>
                      <span className="font-medium text-heritage-slate-700">
                        {locale === 'fr' ? 'Mat. organique:' : 'Organic matter:'}
                      </span>
                      <span className="ml-2 text-heritage-slate-600">2.5-3.2%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Climate Tab */}
          {activeTab === 'climate' && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {climateData.map((data, index) => (
                <div key={index} className="bg-white rounded-lg shadow-lg p-6 text-center">
                  <div className="text-3xl mb-3">{data.icon}</div>
                  <h4 className="font-semibold text-heritage-slate-800 mb-2">{data.label}</h4>
                  <p className="text-2xl font-bold text-heritage-rouge-600">{data.value}</p>
                </div>
              ))}
            </div>
          )}

          {/* Wine Expression Tab */}
          {activeTab === 'wine' && (
            <div className="bg-white rounded-lg shadow-xl p-8">
              <h3 className="font-serif text-2xl font-bold text-heritage-slate-900 mb-6 text-center">
                {text.wineExpression.title}
              </h3>
              <p className="text-heritage-slate-700 text-lg mb-8 text-center">
                {text.wineExpression.description}
              </p>

              <div className="grid md:grid-cols-2 gap-6">
                {text.wineExpression.elements.map((element, index) => (
                  <div key={index} className="border rounded-lg p-6 hover:shadow-lg transition-shadow duration-200">
                    <div className="flex items-start gap-3">
                      <div className="w-3 h-3 rounded-full bg-heritage-golden-500 mt-2 flex-shrink-0"></div>
                      <div>
                        <h4 className="font-semibold text-heritage-slate-800 mb-2">{element.source}</h4>
                        <p className="text-heritage-slate-700 mb-2">{element.expression}</p>
                        <p className="text-sm text-heritage-rouge-600 italic">{element.wines}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}