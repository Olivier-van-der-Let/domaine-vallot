import React from 'react'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import ProductDetail from '@/components/product/ProductDetail'
import { WineProduct } from '@/types'

interface ProductDetailPageProps {
  params: Promise<{
    locale: string
    slug: string
  }>
}

async function getProduct(slug: string): Promise<WineProduct | null> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001'}/api/products/${slug}`, {
      next: { revalidate: 3600 }
    })

    if (!response.ok) {
      if (response.status === 404) {
        return null
      }
      throw new Error('Failed to fetch product')
    }

    const result = await response.json()
    return result.data || null
  } catch (error) {
    console.error('Error fetching product:', error)
    return null
  }
}

async function getRelatedProducts(productId: string, varietal?: string): Promise<WineProduct[]> {
  try {
    const queryParams = new URLSearchParams()
    queryParams.append('limit', '4')
    if (varietal) {
      queryParams.append('varietal', varietal)
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001'}/api/products?${queryParams.toString()}`, {
      next: { revalidate: 3600 }
    })

    if (!response.ok) {
      throw new Error('Failed to fetch related products')
    }

    const result = await response.json()
    const products = result.data || []

    // Filter out the current product and return up to 4 related products
    return products.filter((p: WineProduct) => p.id !== productId).slice(0, 4)
  } catch (error) {
    console.error('Error fetching related products:', error)
    return []
  }
}

export async function generateMetadata({
  params
}: ProductDetailPageProps): Promise<Metadata> {
  const { locale, slug } = await params
  const product = await getProduct(slug)

  if (!product) {
    return {
      title: 'Product Not Found',
      description: 'The requested product could not be found.'
    }
  }

  const title = `${product.name} ${product.vintage ? product.vintage : ''} | Domaine Vallot`
  const description = product.description || `${product.name} - Premium biodynamic wine from Domaine Vallot`

  return {
    title,
    description,
    keywords: `${product.varietal}, ${product.vintage}, wine, biodynamic, Domaine Vallot, ${product.region || 'France'}`,
    openGraph: {
      title,
      description,
      type: 'website', // Changed from 'product' to 'website' to fix OpenGraph error
      url: `https://domainevallot.com/${locale}/products/${slug}`,
      images: product.images?.length > 0 ? [
        {
          url: product.images[0].url,
          width: product.images[0].width || 800,
          height: product.images[0].height || 1200,
          alt: product.images[0].altText || product.name
        }
      ] : [],
    },
    alternates: {
      canonical: `https://domainevallot.com/${locale}/products/${slug}`,
      languages: {
        'en': `https://domainevallot.com/en/products/${slug}`,
        'fr': `https://domainevallot.com/fr/products/${slug}`,
      },
    },
  }
}

export default async function ProductDetailPage({
  params
}: ProductDetailPageProps) {
  const { locale, slug } = await params
  const product = await getProduct(slug)

  if (!product) {
    notFound()
  }

  const relatedProducts = await getRelatedProducts(product.id, product.varietal)

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-8">
          <a href={`/${locale}`} className="hover:text-gray-700">
            {locale === 'fr' ? 'Accueil' : 'Home'}
          </a>
          <span>/</span>
          <a href={`/${locale}/products`} className="hover:text-gray-700">
            {locale === 'fr' ? 'Produits' : 'Products'}
          </a>
          <span>/</span>
          <span className="text-gray-900">{product.name}</span>
        </nav>

        <ProductDetail
          product={product}
          locale={locale}
          relatedProducts={relatedProducts}
        />
      </div>
    </div>
  )
}

// Generate static params for build-time optimization
export async function generateStaticParams() {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001'}/api/products?limit=100`)

    if (!response.ok) {
      return []
    }

    const result = await response.json()
    const products = result.data || []

    return products.map((product: WineProduct) => ({
      slug: product.slug || product.id
    }))
  } catch (error) {
    console.error('Error generating static params:', error)
    return []
  }
}