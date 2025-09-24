'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

interface WineProductImage {
  id: string
  url: string
  altText: string
  width?: number
  height?: number
  isPrimary: boolean
}

interface TastingNotes {
  appearance: string
  nose: string
  palate: string
  food_pairing: string
}

interface TechnicalDetails {
  alcohol_content: number
  volume: number
  serving_temperature_range: string
  aging_potential: string
  sulfites: string
}

interface WineProduct {
  id: string
  name: string
  sku: string
  price: number
  price_eur: number
  price_display: string
  description: string
  category: string
  vintage?: number
  vintage_display: string
  varietal: string
  producer?: string
  region?: string
  alcohol_content?: number
  alcohol_content_display?: string
  volume_display?: string
  serving_temperature?: string
  images: WineProductImage[]
  image_url?: string
  stock_quantity: number
  in_stock: boolean
  stock_status: string
  is_organic?: boolean
  is_biodynamic?: boolean
  tasting_notes: TastingNotes
  technical_details: TechnicalDetails
  age_restriction: {
    minimum_age: number
    verification_required: boolean
    message: string
  }
  shipping_info: {
    wine_specific: boolean
    requires_signature: boolean
    temperature_controlled: boolean
    fragile: boolean
  }
}

interface ProductDetailProps {
  product: WineProduct
  locale?: string
  relatedProducts?: WineProduct[]
  onAddToCart?: (productId: string, quantity: number) => Promise<void>
  isAddingToCart?: boolean
}

export default function ProductDetail({
  product,
  locale = 'en',
  relatedProducts = [],
  onAddToCart,
  isAddingToCart = false
}: ProductDetailProps) {
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [activeSection, setActiveSection] = useState('story')

  const images = product.images || []

  const handleAddToCart = async () => {
    if (onAddToCart && product.in_stock) {
      await onAddToCart(product.id, quantity)
    }
  }

  const getStockStatusColor = (status: string) => {
    switch (status) {
      case 'in_stock': return 'text-green-600'
      case 'limited_stock': return 'text-orange-600'
      case 'low_stock': return 'text-red-600'
      case 'out_of_stock': return 'text-gray-500'
      default: return 'text-gray-600'
    }
  }

  const getStockStatusText = (status: string, quantity: number) => {
    switch (status) {
      case 'in_stock': return 'In Stock'
      case 'limited_stock': return `Limited Stock (${quantity} remaining)`
      case 'low_stock': return `Low Stock (${quantity} remaining)`
      case 'out_of_stock': return 'Out of Stock'
      default: return 'Stock Status Unknown'
    }
  }

  return (
    <div className="bg-heritage-limestone-50 min-h-screen">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-b from-heritage-limestone-100 to-heritage-limestone-50 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
            {/* Product Images */}
            <div className="space-y-6">
              {/* Main Image */}
              <div className="relative">
                <div className="aspect-[3/4] bg-white rounded-2xl shadow-xl overflow-hidden border border-heritage-limestone-200">
                  <Image
                    src={images[selectedImage]?.url || '/images/default-wine.svg'}
                    alt={images[selectedImage]?.altText || product.name}
                    width={600}
                    height={800}
                    className="w-full h-full object-cover"
                    priority
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.src = '/images/default-wine.svg'
                    }}
                  />
                </div>

                {/* Heritage Badge */}
                <div className="absolute top-4 left-4 bg-heritage-rouge-700 text-white px-4 py-2 rounded-full text-sm font-medium">
                  {locale === 'fr' ? 'Patrimoine Familial' : 'Family Heritage'}
                </div>
              </div>

              {/* Gallery Thumbnails */}
              {images.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {images.map((image, index) => (
                    <button
                      key={image.id || index}
                      onClick={() => setSelectedImage(index)}
                      className={`flex-shrink-0 w-20 h-24 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                        selectedImage === index
                          ? 'border-heritage-rouge-600 shadow-lg'
                          : 'border-heritage-limestone-300 hover:border-heritage-golden-400'
                      }`}
                    >
                      <Image
                        src={image.url}
                        alt={image.altText || `${product.name} view ${index + 1}`}
                        width={80}
                        height={96}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = '/images/default-wine.svg'
                        }}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Information - Heritage Style */}
            <div className="space-y-8">
              {/* Header - Family Legacy */}
              <div className="text-center lg:text-left">
                <div className="mb-3">
                  <span className="text-heritage-olive-600 font-serif text-lg tracking-wide">
                    {product.producer || 'Domaine Vallot'}
                  </span>
                </div>

                <h1 className="font-serif text-4xl lg:text-5xl text-heritage-slate-900 mb-4 leading-tight">
                  {product.name}
                </h1>

                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 text-heritage-olive-700 mb-6">
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path fillRule="evenodd" d="M10 2C5.58 2 2 5.58 2 10c0 4.42 3.58 8 8 8s8-3.58 8-8c0-4.42-3.58-8-8-8zm0 14a6 6 0 110-12 6 6 0 010 12z" clipRule="evenodd" />
                    </svg>
                    {product.vintage_display}
                  </span>
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    {product.region}
                  </span>
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                    </svg>
                    {product.varietal}
                  </span>
                </div>

                {/* Heritage Badges */}
                <div className="flex flex-wrap gap-3 justify-center lg:justify-start mb-8">
                  {product.is_biodynamic && (
                    <span className="inline-flex items-center gap-2 px-4 py-2 bg-heritage-olive-100 text-heritage-olive-800 rounded-full text-sm font-medium">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      {locale === 'fr' ? 'Biodynamique' : 'Biodynamic'}
                    </span>
                  )}
                  {product.is_organic && (
                    <span className="inline-flex items-center gap-2 px-4 py-2 bg-heritage-golden-100 text-heritage-golden-800 rounded-full text-sm font-medium">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l3-3z" clipRule="evenodd" />
                      </svg>
                      {locale === 'fr' ? 'Certifié Bio' : 'Organic Certified'}
                    </span>
                  )}
                </div>
              </div>

              {/* Price and Purchase Section */}
              <div className="bg-white rounded-2xl shadow-lg border border-heritage-limestone-200 p-8">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <div className="text-4xl font-bold text-heritage-slate-900 mb-1" data-testid="product-price">
                      €{product.price_display}
                    </div>
                    <div className="text-heritage-olive-600">
                      {locale === 'fr' ? 'par bouteille' : 'per bottle'} • {product.volume_display || '750ml'}
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                    getStockStatusStyle(product.stock_status)
                  }`}>
                    {getStockStatusText(product.stock_status, product.stock_quantity, locale)}
                  </div>
                </div>

                {/* Quantity and Add to Cart */}
                {product.in_stock && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <label className="text-heritage-slate-700 font-medium">
                        {locale === 'fr' ? 'Quantité' : 'Quantity'}
                      </label>
                      <div className="flex items-center border-2 border-heritage-limestone-300 rounded-lg">
                        <button
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          className="px-4 py-2 text-heritage-slate-600 hover:text-heritage-slate-900 hover:bg-heritage-limestone-100 transition-colors"
                          disabled={quantity <= 1}
                        >
                          −
                        </button>
                        <span className="px-4 py-2 border-l border-r border-heritage-limestone-300 min-w-[3rem] text-center font-medium">
                          {quantity}
                        </span>
                        <button
                          onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))}
                          className="px-4 py-2 text-heritage-slate-600 hover:text-heritage-slate-900 hover:bg-heritage-limestone-100 transition-colors"
                          disabled={quantity >= product.stock_quantity}
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={handleAddToCart}
                      disabled={isAddingToCart || !product.in_stock}
                      className="w-full bg-heritage-rouge-700 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-heritage-rouge-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg"
                      data-testid="add-to-cart-button"
                    >
                      {isAddingToCart
                        ? (locale === 'fr' ? 'Ajout en cours...' : 'Adding to Cart...')
                        : (locale === 'fr' ? 'Ajouter au Panier' : 'Add to Cart')
                      }
                    </button>
                  </div>
                )}

                {!product.in_stock && (
                  <button
                    disabled
                    className="w-full bg-heritage-slate-300 text-heritage-slate-500 px-8 py-4 rounded-lg font-semibold cursor-not-allowed"
                  >
                    {locale === 'fr' ? 'Rupture de Stock' : 'Out of Stock'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Storytelling Sections */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {[
            { id: 'story', label: locale === 'fr' ? 'Histoire' : 'Story' },
            { id: 'tasting', label: locale === 'fr' ? 'Dégustation' : 'Tasting Notes' },
            { id: 'terroir', label: locale === 'fr' ? 'Terroir' : 'Terroir' },
            { id: 'technical', label: locale === 'fr' ? 'Technique' : 'Technical' }
          ].map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`px-6 py-3 rounded-full font-medium transition-all duration-200 ${
                activeSection === section.id
                  ? 'bg-heritage-rouge-700 text-white shadow-lg'
                  : 'bg-white text-heritage-slate-700 hover:bg-heritage-limestone-100 border border-heritage-limestone-300'
              }`}
            >
              {section.label}
            </button>
          ))}
        </div>

        {/* Content Sections */}
        <div className="bg-white rounded-3xl shadow-xl border border-heritage-limestone-200 overflow-hidden">
          {/* Story Section */}
          {activeSection === 'story' && (
            <div className="p-8 lg:p-12">
              <div className="max-w-4xl mx-auto">
                <h2 className="font-serif text-3xl text-heritage-slate-900 mb-8 text-center">
                  {locale === 'fr' ? 'L\'Histoire de ce Vin' : 'The Story of This Wine'}
                </h2>

                <div className="prose prose-lg prose-heritage mx-auto">
                  <p className="text-heritage-slate-700 leading-relaxed text-lg mb-6">
                    {product.description}
                  </p>

                  <div className="grid md:grid-cols-2 gap-8 mt-8">
                    <div className="bg-heritage-limestone-50 rounded-xl p-6">
                      <h3 className="font-serif text-xl text-heritage-slate-900 mb-4">
                        {locale === 'fr' ? 'Terroir & Vignoble' : 'Terroir & Vineyard'}
                      </h3>
                      <p className="text-heritage-slate-700">
                        {locale === 'fr'
                          ? `Issu de notre terroir exceptionnel de ${product.region}, ce vin exprime toute la richesse de nos sols et le savoir-faire transmis de génération en génération.`
                          : `From our exceptional terroir in ${product.region}, this wine expresses the full richness of our soils and the knowledge passed down through generations.`
                        }
                      </p>
                    </div>

                    <div className="bg-heritage-olive-50 rounded-xl p-6">
                      <h3 className="font-serif text-xl text-heritage-slate-900 mb-4">
                        {locale === 'fr' ? 'Cépages & Millésime' : 'Varietals & Vintage'}
                      </h3>
                      <p className="text-heritage-slate-700">
                        {locale === 'fr'
                          ? `Assemblage de ${product.varietal}, millésime ${product.vintage_display}. Un équilibre parfait entre tradition et expression du terroir.`
                          : `Blend of ${product.varietal}, vintage ${product.vintage_display}. A perfect balance between tradition and terroir expression.`
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tasting Notes Section */}
          {activeSection === 'tasting' && (
            <div className="p-8 lg:p-12">
              <div className="max-w-4xl mx-auto">
                <h2 className="font-serif text-3xl text-heritage-slate-900 mb-8 text-center">
                  {locale === 'fr' ? 'Notes de Dégustation' : 'Tasting Notes'}
                </h2>

                <div className="grid md:grid-cols-3 gap-8">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-heritage-rouge-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-heritage-rouge-600" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path fillRule="evenodd" d="M10 2C5.58 2 2 5.58 2 10c0 4.42 3.58 8 8 8s8-3.58 8-8c0-4.42-3.58-8-8-8zm0 14a6 6 0 110-12 6 6 0 010 12z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <h3 className="font-serif text-xl text-heritage-slate-900 mb-3">
                      {locale === 'fr' ? 'Apparence' : 'Appearance'}
                    </h3>
                    <p className="text-heritage-slate-700">{product.tasting_notes.appearance}</p>
                  </div>

                  <div className="text-center">
                    <div className="w-16 h-16 bg-heritage-golden-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-heritage-golden-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <h3 className="font-serif text-xl text-heritage-slate-900 mb-3">
                      {locale === 'fr' ? 'Nez' : 'Nose'}
                    </h3>
                    <p className="text-heritage-slate-700">{product.tasting_notes.nose}</p>
                  </div>

                  <div className="text-center">
                    <div className="w-16 h-16 bg-heritage-olive-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-heritage-olive-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <h3 className="font-serif text-xl text-heritage-slate-900 mb-3">
                      {locale === 'fr' ? 'Bouche' : 'Palate'}
                    </h3>
                    <p className="text-heritage-slate-700">{product.tasting_notes.palate}</p>
                  </div>
                </div>

                <div className="mt-12 bg-heritage-limestone-50 rounded-xl p-8">
                  <h3 className="font-serif text-2xl text-heritage-slate-900 mb-4 text-center">
                    {locale === 'fr' ? 'Accords Mets & Vins' : 'Food Pairing'}
                  </h3>
                  <p className="text-heritage-slate-700 text-lg text-center leading-relaxed">
                    {product.tasting_notes.food_pairing}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Terroir Section */}
          {activeSection === 'terroir' && (
            <div className="p-8 lg:p-12">
              <div className="max-w-4xl mx-auto">
                <h2 className="font-serif text-3xl text-heritage-slate-900 mb-8 text-center">
                  {locale === 'fr' ? 'Notre Terroir' : 'Our Terroir'}
                </h2>

                <div className="space-y-8">
                  <div className="text-center">
                    <p className="text-heritage-slate-700 text-lg leading-relaxed mb-8">
                      {locale === 'fr'
                        ? "Sept générations de vignerons ont façonné ce terroir exceptionnel. Chaque parcelle raconte l'histoire de notre famille et de notre passion pour la viticulture biodynamique."
                        : "Seven generations of winemakers have shaped this exceptional terroir. Each plot tells the story of our family and our passion for biodynamic viticulture."
                      }
                    </p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="bg-heritage-rouge-50 rounded-xl p-6">
                      <h3 className="font-serif text-xl text-heritage-slate-900 mb-4">
                        {locale === 'fr' ? 'Sol & Climat' : 'Soil & Climate'}
                      </h3>
                      <ul className="space-y-2 text-heritage-slate-700">
                        <li>• {locale === 'fr' ? 'Sols argilo-calcaires' : 'Clay-limestone soils'}</li>
                        <li>• {locale === 'fr' ? 'Exposition sud-sud-est' : 'South-southeast exposure'}</li>
                        <li>• {locale === 'fr' ? 'Climat méditerranéen' : 'Mediterranean climate'}</li>
                        <li>• {locale === 'fr' ? 'Influence du Mistral' : 'Mistral wind influence'}</li>
                      </ul>
                    </div>

                    <div className="bg-heritage-olive-50 rounded-xl p-6">
                      <h3 className="font-serif text-xl text-heritage-slate-900 mb-4">
                        {locale === 'fr' ? 'Viticulture' : 'Viticulture'}
                      </h3>
                      <ul className="space-y-2 text-heritage-slate-700">
                        <li>• {locale === 'fr' ? 'Biodynamie certifiée' : 'Certified biodynamic'}</li>
                        <li>• {locale === 'fr' ? 'Vendanges manuelles' : 'Hand harvesting'}</li>
                        <li>• {locale === 'fr' ? 'Rendements maîtrisés' : 'Controlled yields'}</li>
                        <li>• {locale === 'fr' ? 'Respect du vivant' : 'Respect for life'}</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Technical Section */}
          {activeSection === 'technical' && (
            <div className="p-8 lg:p-12">
              <div className="max-w-4xl mx-auto">
                <h2 className="font-serif text-3xl text-heritage-slate-900 mb-8 text-center">
                  {locale === 'fr' ? 'Informations Techniques' : 'Technical Information'}
                </h2>

                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="bg-heritage-limestone-50 rounded-xl p-6">
                      <h3 className="font-serif text-xl text-heritage-slate-900 mb-4">
                        {locale === 'fr' ? 'Caractéristiques' : 'Characteristics'}
                      </h3>
                      <dl className="space-y-3">
                        <div className="flex justify-between">
                          <dt className="text-heritage-slate-600">{locale === 'fr' ? 'Degré d\'alcool' : 'Alcohol content'}:</dt>
                          <dd className="font-medium text-heritage-slate-900">{product.alcohol_content_display}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-heritage-slate-600">{locale === 'fr' ? 'Volume' : 'Volume'}:</dt>
                          <dd className="font-medium text-heritage-slate-900">{product.volume_display}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-heritage-slate-600">{locale === 'fr' ? 'Température de service' : 'Serving temperature'}:</dt>
                          <dd className="font-medium text-heritage-slate-900">{product.technical_details.serving_temperature_range}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-heritage-slate-600">{locale === 'fr' ? 'Potentiel de garde' : 'Aging potential'}:</dt>
                          <dd className="font-medium text-heritage-slate-900">{product.technical_details.aging_potential}</dd>
                        </div>
                      </dl>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="bg-heritage-golden-50 rounded-xl p-6">
                      <h3 className="font-serif text-xl text-heritage-slate-900 mb-4">
                        {locale === 'fr' ? 'Informations Produit' : 'Product Information'}
                      </h3>
                      <dl className="space-y-3">
                        <div className="flex justify-between">
                          <dt className="text-heritage-slate-600">{locale === 'fr' ? 'Référence' : 'SKU'}:</dt>
                          <dd className="font-medium text-heritage-slate-900 font-mono text-sm">{product.sku}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-heritage-slate-600">{locale === 'fr' ? 'Appellation' : 'Appellation'}:</dt>
                          <dd className="font-medium text-heritage-slate-900">{product.region}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-heritage-slate-600">{locale === 'fr' ? 'Cépages' : 'Varietals'}:</dt>
                          <dd className="font-medium text-heritage-slate-900">{product.varietal}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-heritage-slate-600">{locale === 'fr' ? 'Sulfites' : 'Contains'}:</dt>
                          <dd className="font-medium text-heritage-slate-900">{product.technical_details.sulfites}</dd>
                        </div>
                      </dl>
                    </div>
                  </div>
                </div>

                {/* Important Information */}
                <div className="mt-8 bg-heritage-rouge-50 border border-heritage-rouge-200 rounded-xl p-6">
                  <h4 className="font-semibold text-heritage-rouge-800 mb-3">
                    {locale === 'fr' ? 'Informations Importantes' : 'Important Information'}
                  </h4>
                  <ul className="text-heritage-rouge-700 space-y-2">
                    <li>• {product.age_restriction.message}</li>
                    {product.shipping_info.requires_signature && (
                      <li>• {locale === 'fr' ? 'Signature requise à la livraison' : 'Signature required upon delivery'}</li>
                    )}
                    {product.shipping_info.temperature_controlled && (
                      <li>• {locale === 'fr' ? 'Expédition température contrôlée recommandée' : 'Temperature-controlled shipping recommended'}</li>
                    )}
                    <li>• {locale === 'fr' ? 'Manipuler avec précaution - contenu fragile' : 'Handle with care - fragile contents'}</li>
                  </ul>
                </div>

                {/* Shipping Information */}
                <div className="mt-6 text-center">
                  <p className="text-heritage-slate-600 mb-2">
                    <span className="font-medium">{locale === 'fr' ? 'Livraison gratuite' : 'Free shipping'}</span> {locale === 'fr' ? 'dès 75€' : 'on orders over €75'}
                  </p>
                  <p className="text-heritage-slate-600">
                    <span className="font-medium">{locale === 'fr' ? 'Livraison estimée' : 'Estimated delivery'}:</span> {locale === 'fr' ? '3-5 jours ouvrés' : '3-5 business days'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-16">
            <h2 className="font-serif text-3xl text-heritage-slate-900 text-center mb-12">
              {locale === 'fr' ? 'Autres Vins de la Collection' : 'Other Wines from the Collection'}
            </h2>

            <div className="flex justify-center">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-4xl">
                {relatedProducts.slice(0, 3).map((relatedProduct) => {
                  // Get the primary image URL with comprehensive fallback logic
                  const getRelatedProductImageUrl = (product: WineProduct): string => {
                    // First, try to get the primary image from images array
                    if (product.images && product.images.length > 0) {
                      const primaryImage = product.images.find(img => img.isPrimary) || product.images[0]
                      if (primaryImage?.url) {
                        return primaryImage.url
                      }
                    }

                    // Fallback to image_url property
                    if (product.image_url) {
                      return product.image_url
                    }

                    // Use wine-specific fallback based on name and type
                    const name = product.name.toLowerCase()
                    if (name.includes('rosé') || name.includes('rose')) {
                      return '/images/wine-bottle-rose.svg'
                    } else if (name.includes('blanc') || name.includes('white')) {
                      return '/images/wine-bottle-white.svg'
                    } else {
                      return '/images/wine-bottle-red.svg'
                    }
                  }

                  const imageUrl = getRelatedProductImageUrl(relatedProduct)

                  return (
                    <Link
                      key={relatedProduct.id}
                      href={`/${locale}/products/${relatedProduct.slug || relatedProduct.id}`}
                      className="group bg-white rounded-xl shadow-lg border border-heritage-limestone-200 overflow-hidden hover:shadow-xl transition-all duration-300"
                    >
                      <div className="aspect-[3/4] bg-heritage-limestone-100 overflow-hidden">
                        <Image
                          src={imageUrl}
                          alt={relatedProduct.images?.[0]?.altText || relatedProduct.name}
                          width={300}
                          height={400}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            // Fallback based on wine type
                            const name = relatedProduct.name.toLowerCase()
                            if (name.includes('rosé') || name.includes('rose')) {
                              target.src = '/images/wine-bottle-rose.svg'
                            } else if (name.includes('blanc') || name.includes('white')) {
                              target.src = '/images/wine-bottle-white.svg'
                            } else {
                              target.src = '/images/wine-bottle-red.svg'
                            }
                          }}
                        />
                      </div>
                      <div className="p-6">
                        <h3 className="font-serif text-lg text-heritage-slate-900 mb-2 group-hover:text-heritage-rouge-700 transition-colors">
                          {relatedProduct.name}
                        </h3>
                        <p className="text-heritage-olive-600 text-sm mb-3">
                          {relatedProduct.vintage_display || relatedProduct.vintage} • {relatedProduct.region}
                        </p>
                        <div className="text-xl font-bold text-heritage-slate-900">
                          €{relatedProduct.price_display}
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  )
}

// Helper functions for styling and text
function getStockStatusStyle(status: string): string {
  switch (status) {
    case 'in_stock': return 'bg-heritage-olive-100 text-heritage-olive-800'
    case 'limited_stock': return 'bg-heritage-golden-100 text-heritage-golden-800'
    case 'low_stock': return 'bg-heritage-rouge-100 text-heritage-rouge-800'
    case 'out_of_stock': return 'bg-heritage-slate-100 text-heritage-slate-800'
    default: return 'bg-heritage-limestone-100 text-heritage-slate-800'
  }
}

function getStockStatusText(status: string, quantity: number, locale: string = 'en'): string {
  const isEn = locale === 'en'

  switch (status) {
    case 'in_stock': return isEn ? 'In Stock' : 'En Stock'
    case 'limited_stock': return isEn ? `Limited Stock (${quantity})` : `Stock Limité (${quantity})`
    case 'low_stock': return isEn ? `Low Stock (${quantity})` : `Peu de Stock (${quantity})`
    case 'out_of_stock': return isEn ? 'Out of Stock' : 'Rupture de Stock'
    default: return isEn ? 'Stock Status Unknown' : 'Statut Inconnu'
  }
}