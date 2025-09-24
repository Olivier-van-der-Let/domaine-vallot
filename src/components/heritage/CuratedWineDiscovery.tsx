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
  slug: string
}

export default function CuratedWineDiscovery({ locale, products }: CuratedWineDiscoveryProps) {
  const [selectedWine, setSelectedWine] = useState<number | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'story'>('story')

  // Show the first 3 featured products passed from the server
  // Since getFeaturedProducts already filters for featured wines, just use them
  const featuredProducts = products.slice(0, 3)

  // Transform real product data into wine stories
  const wineStories: WineStory[] = featuredProducts.map((product) => {
    const isClaudeWine = product.name?.includes('Claude')
    const isFrancoisWine = product.name?.includes('François')
    const isHautDesCotesWine = product.name?.includes('Haut des Côtes')

    const storyData = locale === 'fr' ? {
      terroir: isClaudeWine
        ? 'Coteaux de Vinsobres'
        : isFrancoisWine
        ? 'Terroir traditionnel de Vinsobres'
        : 'Hauts coteaux calcaires',
      plot: isClaudeWine
        ? 'Vieilles vignes de 67 ans'
        : isFrancoisWine
        ? 'Parcelles familiales en coteaux'
        : 'Parcelles "Le Haut des Côtes"',
      story: isClaudeWine
        ? 'Issu de vieilles vignes de 67 ans cultivées en coteaux, ce vin bénéficie d\'un élevage de 6 à 8 mois en barriques qui lui confère sa complexité et son caractère exceptionnel.'
        : isFrancoisWine
        ? 'Robe sombre et grenat profond, ce vin charnu et structuré exprime parfaitement la tradition familiale. Sans élevage en barrique, il révèle la pureté du fruit et l\'authenticité du terroir.'
        : 'Une couleur rouge foncé avec un bouquet intense aux notes de vanille et de sous-bois. Élevé 10 à 12 mois en barriques, ce vin révèle des tanins fins et soyeux d\'une rare élégance.',
      notes: isClaudeWine
        ? ['Fruits rouges mûrs', 'Épices', 'Boisé fin']
        : isFrancoisWine
        ? ['Fruits rouges mûrs', 'Épices douces', 'Terroir']
        : ['Vanille', 'Sous-bois', 'Fruits rouges'],
      characteristics: {
        body: isClaudeWine ? 'Complexe' : isFrancoisWine ? 'Charnu' : 'Élégant',
        tannins: isClaudeWine ? 'Structurés' : isFrancoisWine ? 'Équilibrés' : 'Fins et soyeux',
        acidity: isClaudeWine ? 'Équilibrée' : isFrancoisWine ? 'Harmonieuse' : 'Fraîche',
        aging: isClaudeWine ? '10 ans' : isFrancoisWine ? '5-8 ans' : '10 ans'
      }
    } : {
      terroir: isClaudeWine
        ? 'Vinsobres hillsides'
        : isFrancoisWine
        ? 'Traditional Vinsobres terroir'
        : 'High limestone hillsides',
      plot: isClaudeWine
        ? '67-year-old vines'
        : isFrancoisWine
        ? 'Family hillside plots'
        : '"Le Haut des Côtes" plots',
      story: isClaudeWine
        ? 'From 67-year-old vines grown on hillsides, this wine benefits from 6 to 8 months of barrel aging that gives it complexity and exceptional character.'
        : isFrancoisWine
        ? 'Dark garnet robe, this full-bodied and structured wine perfectly expresses family tradition. Without barrel aging, it reveals fruit purity and terroir authenticity.'
        : 'Deep red color with an intense bouquet of vanilla and forest floor notes. Aged 10 to 12 months in barrels, this wine reveals fine and silky tannins of rare elegance.',
      notes: isClaudeWine
        ? ['Ripe red fruits', 'Spices', 'Fine oak']
        : isFrancoisWine
        ? ['Ripe red fruits', 'Sweet spices', 'Terroir']
        : ['Vanilla', 'Forest floor', 'Red fruits'],
      characteristics: {
        body: isClaudeWine ? 'Complex' : isFrancoisWine ? 'Full-bodied' : 'Elegant',
        tannins: isClaudeWine ? 'Structured' : isFrancoisWine ? 'Balanced' : 'Fine and silky',
        acidity: isClaudeWine ? 'Balanced' : isFrancoisWine ? 'Harmonious' : 'Fresh',
        aging: isClaudeWine ? '10 years' : isFrancoisWine ? '5-8 years' : '10 years'
      }
    }

    return {
      id: product.id || `wine-${product.name}`,
      name: product.name || 'Domaine Vallot Wine',
      terroir: storyData.terroir,
      plot: storyData.plot,
      story: storyData.story,
      notes: storyData.notes,
      characteristics: storyData.characteristics,
      price: product.price_eur || product.price || 15,
      vintage: product.vintage || 2023,
      image: product.product_images?.[0]?.url || product.image_url || product.image || '/images/wine-bottle-red.svg',
      slug: product.slug || product.slug_en || `${product.name?.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${product.vintage}` || 'wine'
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
                    <Link
                      href={`/${locale}/products/${wine.slug}`}
                      className="inline-flex items-center px-6 py-3 bg-heritage-rouge-700 text-white font-semibold rounded-md hover:bg-heritage-rouge-800 focus:ring-2 focus:ring-heritage-rouge-500 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                      {text.cta.discover}
                      <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </Link>
                    <Link
                      href={`/${locale}/products/${wine.slug}`}
                      className="inline-flex items-center px-6 py-3 border-2 border-heritage-slate-300 text-heritage-slate-700 font-semibold rounded-md hover:bg-heritage-slate-50 focus:ring-2 focus:ring-heritage-slate-300 transition-all duration-200"
                    >
                      {text.cta.technicalSheet}
                    </Link>
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

                  <Link
                    href={`/${locale}/products/${wine.slug}`}
                    className="w-full px-4 py-2 bg-heritage-rouge-700 text-white font-semibold rounded-md hover:bg-heritage-rouge-800 transition-colors duration-200 text-center block"
                  >
                    {text.cta.discover}
                  </Link>
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