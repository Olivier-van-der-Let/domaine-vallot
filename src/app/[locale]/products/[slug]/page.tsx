import React from 'react'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import ProductDetail from '@/components/product/ProductDetail'
import { WineProduct } from '@/types'
import { getProducts } from '@/lib/supabase/server'

interface ProductDetailPageProps {
  params: Promise<{
    locale: string
    slug: string
  }>
}

// Helper function to generate slug for comparison
function generateSlug(name: string, vintage?: number): string {
  const slug = name
    .toLowerCase()
    .replace(/[àáâãäå]/g, 'a')
    .replace(/[èéêë]/g, 'e')
    .replace(/[ìíîï]/g, 'i')
    .replace(/[òóôõö]/g, 'o')
    .replace(/[ùúûü]/g, 'u')
    .replace(/[ÿý]/g, 'y')
    .replace(/[ñ]/g, 'n')
    .replace(/[ç]/g, 'c')
    .replace(/[«»"']/g, '') // Remove quotes and guillemets
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens

  return vintage ? `${slug}-${vintage}` : slug
}

// Helper function to fix Supabase image URLs
function fixSupabaseImageUrl(url: string): string {
  if (url.includes('supabase.co/storage/v1/object/public/wines/')) {
    // Fix missing /Public/ in the URL path
    return url.replace('/object/public/wines/', '/object/public/Public/wines/')
  }
  return url
}

// Helper function to get wine-specific fallback images
function getWineFallbackImage(wineName: string): string {
  const name = wineName.toLowerCase()

  if (name.includes('magnaneraie')) {
    return '/images/wine-magnaneraie.svg'
  } else if (name.includes('rosé') || name.includes('rose')) {
    return '/images/wine-bottle-rose.svg'
  } else if (name.includes('blanc') || name.includes('white')) {
    return '/images/wine-bottle-white.svg'
  } else if (name.includes('rouge') || name.includes('red')) {
    return '/images/wine-bottle-red.svg'
  } else {
    return '/images/default-wine.svg'
  }
}

async function getProduct(slug: string): Promise<WineProduct | null> {
  try {
    // Get products directly from database instead of making HTTP calls
    const products = await getProducts({ limit: 100 })

    // Find product by multiple slug matching strategies
    const product = products.find(p => {
      // Try exact slug match first
      if (p.slug_en === slug || p.slug_fr === slug || p.slug === slug) return true

      // Try generated slug match
      const generatedSlug = generateSlug(p.name, p.vintage)
      if (generatedSlug === slug) return true

      // Try name-based slug match without vintage
      const nameSlug = generateSlug(p.name)
      if (nameSlug === slug) return true

      return false
    })

    if (!product) {
      return null
    }

    // Check if product is active
    if (product.is_active === false) {
      return null
    }

    // Format product data to match WineProduct interface
    const formattedProduct: WineProduct = {
      id: product.id,
      name: product.name,
      slug: product.slug_en || product.slug || generateSlug(product.name, product.vintage),
      sku: product.sku || '',
      description: product.description_en || product.description_fr || 'Fine wine from Domaine Vallot',
      price_eur: product.price_eur || 0,
      vintage: product.vintage || new Date().getFullYear(),
      varietal: product.varietal || 'Red Wine',
      producer: 'Domaine Vallot',
      region: product.region || 'France',
      alcohol_content: product.alcohol_content || 13.5,
      stock_quantity: product.stock_quantity || 0,
      images: product.product_images && product.product_images.length > 0
        ? product.product_images.map((img: any, index: number) => ({
            id: (index + 1).toString(),
            url: fixSupabaseImageUrl(img.url),
            altText: img.alt_text_en || img.alt_text_fr || product.name,
            width: 400,
            height: 600,
            isPrimary: img.is_primary || index === 0
          }))
        : [{
            id: '1',
            url: getWineFallbackImage(product.name),
            altText: product.name,
            width: 400,
            height: 600,
            isPrimary: true
          }],
      organic_certified: product.organic_certified || false,
      biodynamic_certified: product.biodynamic_certified || false,
      featured: product.featured || false,
      is_active: product.is_active !== false,
      created_at: product.created_at || new Date().toISOString(),
      updated_at: product.updated_at || new Date().toISOString()
    }

    return formattedProduct
  } catch (error) {
    console.error('Error fetching product:', error)
    return null
  }
}

async function getRelatedProducts(productId: string, varietal?: string): Promise<WineProduct[]> {
  try {
    // Get products directly from database instead of making HTTP calls
    const products = await getProducts({ limit: 20 })

    // Filter and format related products
    let relatedProducts = products
      .filter(p => p.id !== productId && p.is_active !== false)
      .map(product => ({
        id: product.id,
        name: product.name,
        slug: product.slug_en || product.slug || generateSlug(product.name, product.vintage),
        sku: product.sku || '',
        description: product.description_en || product.description_fr || 'Fine wine from Domaine Vallot',
        price_eur: product.price_eur || 0,
        vintage: product.vintage || new Date().getFullYear(),
        varietal: product.varietal || 'Red Wine',
        producer: 'Domaine Vallot',
        region: product.region || 'France',
        alcohol_content: product.alcohol_content || 13.5,
        stock_quantity: product.stock_quantity || 0,
        images: product.product_images && product.product_images.length > 0
          ? product.product_images.map((img: any, index: number) => ({
              id: (index + 1).toString(),
              url: fixSupabaseImageUrl(img.url),
              altText: img.alt_text_en || img.alt_text_fr || product.name,
              width: 400,
              height: 600,
              isPrimary: img.is_primary || index === 0
            }))
          : [{
              id: '1',
              url: getWineFallbackImage(product.name),
              altText: product.name,
              width: 400,
              height: 600,
              isPrimary: true
            }],
        organic_certified: product.organic_certified || false,
        biodynamic_certified: product.biodynamic_certified || false,
        featured: product.featured || false,
        is_active: product.is_active !== false,
        created_at: product.created_at || new Date().toISOString(),
        updated_at: product.updated_at || new Date().toISOString()
      } as WineProduct))

    // If varietal is specified, prioritize products with the same varietal
    if (varietal) {
      const sameVarietal = relatedProducts.filter(p => p.varietal === varietal)
      const otherProducts = relatedProducts.filter(p => p.varietal !== varietal)
      relatedProducts = [...sameVarietal, ...otherProducts]
    }

    return relatedProducts.slice(0, 4)
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
          <a
            href={`/${locale}`}
            className="hover:text-gray-700 transition-colors duration-200 flex items-center leading-none"
          >
            {locale === 'fr' ? 'Accueil' : 'Home'}
          </a>
          <span className="text-gray-400 select-none flex items-center leading-none" aria-hidden="true">/</span>
          <a
            href={`/${locale}/products`}
            className="hover:text-gray-700 transition-colors duration-200 flex items-center leading-none"
          >
            {locale === 'fr' ? 'Produits' : 'Products'}
          </a>
          <span className="text-gray-400 select-none flex items-center leading-none" aria-hidden="true">/</span>
          <span className="text-gray-900 flex items-center leading-none truncate">
            {product.name}
          </span>
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
  // During build time, we can't access cookies so return empty to allow dynamic generation
  // This means pages will be generated on-demand rather than at build time
  return []
}