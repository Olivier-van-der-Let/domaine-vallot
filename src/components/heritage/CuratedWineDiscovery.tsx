'use client'

import { useState } from 'react'
import Link from 'next/link'

interface CuratedWineDiscoveryProps {
  locale: string
  products: any[]
}

interface WineStory {
  id: string
  name: string
  terroir: string
  plot: string
  story: string
  notes: string[]
  characteristics: {
    body: string
    tannins: string
    acidity: string
    aging: string
  }
  price: number
  vintage: string
  image: string
}

export default function CuratedWineDiscovery({ locale, products }: CuratedWineDiscoveryProps) {
  const [selectedWine, setSelectedWine] = useState<number | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'story'>('story')

  // Transform product data into wine stories
  const wineStories: WineStory[] = products.slice(0, 6).map((product, index) => {
    const storyData = locale === 'fr' ? {
      terroir: ['Coteaux calcaires', 'Terrasses argileuses', 'Plateaux ventés', 'Versants sud', 'Sols profonds', 'Pentes douces'][index] || 'Terroir unique',
      plot: [`Parcelle "Les Oliviers"`, `Parcelle "La Crau"`, `Parcelle "Mont Ventoux"`, `Parcelle "Les Garrigues"`, `Parcelle "Le Plateau"`, `Parcelle "Les Restanques"`][index] || 'Parcelle sélectionnée',
      story: [
        'Issu de nos coteaux calcaires les plus exposés, ce vin capture l\'essence du terroir méditerranéen.',
        'Cultivé sur des terrasses ancestrales, ce vin exprime la profondeur de nos sols argileux.',
        'Élevé sur nos plateaux battus par le mistral, ce vin révèle une concentration exceptionnelle.',
        'Né de nos versants orientés sud, ce vin bénéficie d\'un ensoleillement optimal.',
        'Provenant de nos sols les plus profonds, ce vin développe une complexité remarquable.',
        'Issu de nos pentes douces, ce vin allie finesse et caractère authentique.'
      ][index] || 'Une expression unique de notre terroir exceptionnel.',
      notes: [
        ['Fruits rouges', 'Garrigue', 'Minéralité'],
        ['Épices douces', 'Cuir', 'Terre humide'],
        ['Fruits noirs', 'Lavande', 'Pierre chaude'],
        ['Cerise', 'Thym', 'Calcaire'],
        ['Mûre', 'Olive', 'Fumé'],
        ['Framboise', 'Romarin', 'Silex']
      ][index] || ['Arômes complexes', 'Terroir', 'Élégance'],
      characteristics: {
        body: ['Élégant', 'Puissant', 'Concentré', 'Harmonieux', 'Complexe', 'Raffiné'][index] || 'Équilibré',
        tannins: ['Soyeux', 'Structurés', 'Fermes', 'Fondus', 'Nobles', 'Fins'][index] || 'Équilibrés',
        acidity: ['Vive', 'Équilibrée', 'Fraîche', 'Harmonieuse', 'Intégrée', 'Élégante'][index] || 'Parfaite',
        aging: ['3-5 ans', '5-8 ans', '8-12 ans', '3-6 ans', '10-15 ans', '4-7 ans'][index] || '5-10 ans'
      }
    } : {
      terroir: ['Limestone hillsides', 'Clay terraces', 'Windy plateaus', 'South-facing slopes', 'Deep soils', 'Gentle slopes'][index] || 'Unique terroir',
      plot: [`"Les Oliviers" Plot`, `"La Crau" Plot`, `"Mont Ventoux" Plot`, `"Les Garrigues" Plot`, `"Le Plateau" Plot`, `"Les Restanques" Plot`][index] || 'Selected plot',
      story: [
        'From our most exposed limestone hillsides, this wine captures the essence of Mediterranean terroir.',
        'Cultivated on ancestral terraces, this wine expresses the depth of our clay soils.',
        'Raised on our plateaus beaten by the mistral, this wine reveals exceptional concentration.',
        'Born from our south-facing slopes, this wine benefits from optimal sun exposure.',
        'From our deepest soils, this wine develops remarkable complexity.',
        'From our gentle slopes, this wine combines finesse with authentic character.'
      ][index] || 'A unique expression of our exceptional terroir.',
      notes: [
        ['Red fruits', 'Garrigue', 'Minerality'],
        ['Sweet spices', 'Leather', 'Damp earth'],
        ['Dark fruits', 'Lavender', 'Warm stone'],
        ['Cherry', 'Thyme', 'Limestone'],
        ['Blackberry', 'Olive', 'Smoke'],
        ['Raspberry', 'Rosemary', 'Flint']
      ][index] || ['Complex aromas', 'Terroir', 'Elegance'],
      characteristics: {
        body: ['Elegant', 'Powerful', 'Concentrated', 'Harmonious', 'Complex', 'Refined'][index] || 'Balanced',
        tannins: ['Silky', 'Structured', 'Firm', 'Integrated', 'Noble', 'Fine'][index] || 'Balanced',
        acidity: ['Lively', 'Balanced', 'Fresh', 'Harmonious', 'Integrated', 'Elegant'][index] || 'Perfect',
        aging: ['3-5 years', '5-8 years', '8-12 years', '3-6 years', '10-15 years', '4-7 years'][index] || '5-10 years'
      }
    }

    return {
      id: product.id || `wine-${index}`,
      name: product.name || `Wine ${index + 1}`,
      terroir: storyData.terroir,
      plot: storyData.plot,
      story: storyData.story,
      notes: storyData.notes,
      characteristics: storyData.characteristics,
      price: product.price || 15,
      vintage: product.vintage || '2023',
      image: product.image || `https://vmtudbupajnjyauvqnej.supabase.co/storage/v1/object/public/Public/decorative/wine-bottle-${index + 1}.jpg`
    }
  })

  const content = {
    fr: {
      overline: 'Découverte Guidée',
      title: 'Vins d\'Expression Terroir',
      subtitle: 'Chaque Bouteille Raconte une Histoire',
      description: 'Nos vins ne sont pas de simples produits, mais l\'expression vivante de parcelles uniques. Chacun porte en lui l\'âme d\'un terroir, le savoir-faire de générations et l\'empreinte d\'un millésime.',
      viewModes: {
        story: 'Vue Histoire',
        grid: 'Vue Classique'
      },
      details: {
        terroir: 'Terroir',
        plot: 'Parcelle',
        notes: 'Notes de dégustation',
        characteristics: 'Caractéristiques',
        body: 'Corps',
        tannins: 'Tanins',
        acidity: 'Acidité',
        aging: 'Potentiel de garde'
      },
      cta: {
        discover: 'Découvrir',
        viewAll: 'Voir Tous nos Vins',
        technicalSheet: 'Fiche Technique'
      }
    },
    en: {
      overline: 'Guided Discovery',
      title: 'Terroir Expression Wines',
      subtitle: 'Every Bottle Tells a Story',
      description: 'Our wines are not simple products, but the living expression of unique plots. Each carries the soul of a terroir, the expertise of generations and the imprint of a vintage.',
      viewModes: {
        story: 'Story View',
        grid: 'Classic View'
      },
      details: {
        terroir: 'Terroir',
        plot: 'Plot',
        notes: 'Tasting notes',
        characteristics: 'Characteristics',
        body: 'Body',
        tannins: 'Tannins',
        acidity: 'Acidity',
        aging: 'Aging potential'
      },
      cta: {
        discover: 'Discover',
        viewAll: 'View All Our Wines',
        technicalSheet: 'Technical Sheet'
      }
    }
  }

  const text = content[locale as keyof typeof content] || content.en

  return (
    <section className="py-16 lg:py-24 bg-heritage-limestone-100">
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
          <p className="text-heritage-slate-700 text-lg leading-relaxed max-w-3xl mx-auto mb-8">
            {text.description}
          </p>

          {/* View Mode Toggle */}
          <div className="flex justify-center">
            <div className="bg-white rounded-lg p-1 shadow-lg">
              <button
                onClick={() => setViewMode('story')}
                className={`px-4 py-2 rounded-md font-medium transition-all duration-200 ${
                  viewMode === 'story'
                    ? 'bg-heritage-rouge-600 text-white'
                    : 'text-heritage-slate-700 hover:text-heritage-rouge-600'
                }`}
              >
                {text.viewModes.story}
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`px-4 py-2 rounded-md font-medium transition-all duration-200 ${
                  viewMode === 'grid'
                    ? 'bg-heritage-rouge-600 text-white'
                    : 'text-heritage-slate-700 hover:text-heritage-rouge-600'
                }`}
              >
                {text.viewModes.grid}
              </button>
            </div>
          </div>
        </div>

        {/* Wine Discovery Content */}
        {viewMode === 'story' ? (
          /* Story-Driven View */
          <div className="space-y-8">
            {wineStories.map((wine, index) => (
              <div
                key={wine.id}
                className={`grid lg:grid-cols-2 gap-8 lg:gap-12 items-center transition-all duration-300 ${
                  index % 2 === 1 ? 'lg:grid-flow-col-dense' : ''
                }`}
              >
                {/* Wine Image */}
                <div className={`${index % 2 === 1 ? 'lg:col-start-2' : ''}`}>
                  <div className="relative group">
                    <div className="aspect-[3/4] bg-white rounded-lg shadow-xl overflow-hidden">
                      <img
                        src={wine.image}
                        alt={wine.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>

                    {/* Price Badge */}
                    <div className="absolute top-4 right-4 bg-heritage-golden-500 text-white px-3 py-1 rounded-full font-semibold text-sm">
                      €{wine.price}
                    </div>
                  </div>
                </div>

                {/* Wine Story */}
                <div className={`space-y-6 ${index % 2 === 1 ? 'lg:col-start-1' : ''}`}>
                  <div>
                    <h3 className="font-serif text-2xl md:text-3xl font-bold text-heritage-slate-900 mb-2">
                      {wine.name}
                    </h3>
                    <p className="text-heritage-rouge-600 font-medium">
                      {wine.terroir} • {wine.plot}
                    </p>
                  </div>

                  <p className="text-heritage-slate-700 text-lg leading-relaxed">
                    {wine.story}
                  </p>

                  {/* Tasting Notes */}
                  <div>
                    <h4 className="font-semibold text-heritage-slate-800 mb-3">
                      {text.details.notes}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {wine.notes.map((note, noteIndex) => (
                        <span
                          key={noteIndex}
                          className="px-3 py-1 bg-heritage-limestone-200 text-heritage-slate-700 rounded-full text-sm"
                        >
                          {note}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Characteristics */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-heritage-slate-700">{text.details.body}:</span>
                      <span className="ml-2 text-heritage-slate-600">{wine.characteristics.body}</span>
                    </div>
                    <div>
                      <span className="font-medium text-heritage-slate-700">{text.details.tannins}:</span>
                      <span className="ml-2 text-heritage-slate-600">{wine.characteristics.tannins}</span>
                    </div>
                    <div>
                      <span className="font-medium text-heritage-slate-700">{text.details.acidity}:</span>
                      <span className="ml-2 text-heritage-slate-600">{wine.characteristics.acidity}</span>
                    </div>
                    <div>
                      <span className="font-medium text-heritage-slate-700">{text.details.aging}:</span>
                      <span className="ml-2 text-heritage-slate-600">{wine.characteristics.aging}</span>
                    </div>
                  </div>

                  {/* CTA Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button className="inline-flex items-center px-6 py-3 bg-heritage-rouge-700 text-white font-semibold rounded-md hover:bg-heritage-rouge-800 focus:ring-2 focus:ring-heritage-rouge-500 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                      {text.cta.discover}
                      <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </button>
                    <button className="inline-flex items-center px-6 py-3 border-2 border-heritage-slate-300 text-heritage-slate-700 font-semibold rounded-md hover:bg-heritage-slate-50 focus:ring-2 focus:ring-heritage-slate-300 transition-all duration-200">
                      {text.cta.technicalSheet}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Classic Grid View */
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {wineStories.map((wine, index) => (
              <div key={wine.id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="aspect-[3/4] relative">
                  <img
                    src={wine.image}
                    alt={wine.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-4 right-4 bg-heritage-golden-500 text-white px-3 py-1 rounded-full font-semibold text-sm">
                    €{wine.price}
                  </div>
                </div>

                <div className="p-6">
                  <h3 className="font-serif text-xl font-bold text-heritage-slate-900 mb-2">
                    {wine.name}
                  </h3>
                  <p className="text-heritage-rouge-600 text-sm mb-3">
                    {wine.terroir}
                  </p>
                  <p className="text-heritage-slate-600 text-sm mb-4 line-clamp-3">
                    {wine.story}
                  </p>

                  <div className="flex flex-wrap gap-1 mb-4">
                    {wine.notes.slice(0, 2).map((note, noteIndex) => (
                      <span
                        key={noteIndex}
                        className="px-2 py-1 bg-heritage-limestone-200 text-heritage-slate-600 rounded text-xs"
                      >
                        {note}
                      </span>
                    ))}
                  </div>

                  <button className="w-full px-4 py-2 bg-heritage-rouge-700 text-white font-semibold rounded-md hover:bg-heritage-rouge-800 transition-colors duration-200">
                    {text.cta.discover}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* View All CTA */}
        <div className="text-center mt-12">
          <Link
            href={`/${locale}/products`}
            className="inline-flex items-center px-8 py-4 bg-heritage-golden-500 text-heritage-slate-900 font-semibold rounded-md hover:bg-heritage-golden-600 focus:ring-2 focus:ring-heritage-golden-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            {text.cta.viewAll}
            <svg className="ml-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  )
}