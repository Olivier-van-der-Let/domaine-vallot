import { NextRequest, NextResponse } from 'next/server'
import { getProducts } from '@/lib/supabase/server'

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

  if (name.includes('magnaneraie') || name.includes('magnaneraje')) {
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    // Try to get real products from Supabase first
    let products
    try {
      products = await getProducts({ limit: 100 })
    } catch (error) {
      console.log('Supabase connection failed, using mock data for development')
      // Fallback to mock data if Supabase fails
      products = [
      {
        id: '1',
        name: 'Vallot Rouge 2020',
        slug: 'vallot-rouge-2020',
        sku: 'VR-2020-001',
        description: 'A premium red wine with notes of dark fruit and oak.',
        price: 2500, // 25.00 EUR in cents
        vintage: 2020,
        category: 'red_wine',
        grape_variety: 'Cabernet Sauvignon',
        producer: 'Domaine Vallot',
        region: 'Bordeaux',
        stock_quantity: 50,
        is_organic: true,
        status: 'active',
        image_url: '/images/wine-bottle-red.svg',
        created_at: new Date().toISOString()
      },
      {
        id: '2',
        name: 'Vallot Blanc 2021',
        slug: 'vallot-blanc-2021',
        sku: 'VB-2021-001',
        description: 'A crisp white wine with citrus and mineral notes.',
        price: 2200, // 22.00 EUR in cents
        vintage: 2021,
        category: 'white_wine',
        grape_variety: 'Sauvignon Blanc',
        producer: 'Domaine Vallot',
        region: 'Loire Valley',
        stock_quantity: 30,
        is_organic: true,
        status: 'active',
        image_url: '/images/wine-bottle-white.svg',
        created_at: new Date().toISOString()
      },
      {
        id: '3',
        name: 'Vallot Rosé 2022',
        slug: 'vallot-rose-2022',
        sku: 'VR-2022-001',
        description: 'A delicate rosé with strawberry and floral aromas.',
        price: 1800, // 18.00 EUR in cents
        vintage: 2022,
        category: 'rose_wine',
        grape_variety: 'Grenache',
        producer: 'Domaine Vallot',
        region: 'Provence',
        stock_quantity: 25,
        is_organic: true,
        status: 'active',
        image_url: '/images/wine-bottle-rose.svg',
        created_at: new Date().toISOString()
      },
      {
        id: '4',
        name: 'La Magnaneraje',
        slug: 'la-magnaneraje-2023',
        sku: 'LM-2023-001',
        description: 'Côtes du Rhône - A classic red wine with earthy undertones.',
        price: 0, // Free/No price set
        vintage: 2023,
        category: 'red_wine',
        grape_variety: 'Syrah',
        producer: 'Domaine Vallot',
        region: 'Côtes du Rhône',
        stock_quantity: 15,
        is_organic: true,
        status: 'active',
        image_url: '/images/wine-bottle-red.svg',
        created_at: new Date().toISOString()
      },
      {
        id: '5',
        name: 'Le Coriançon rosé',
        slug: 'le-coriancon-rose-2024',
        sku: 'LCR-2024-001',
        description: 'Côtes du Rhône - Fresh rosé with vibrant fruit flavors.',
        price: 0, // Free/No price set
        vintage: 2024,
        category: 'rose_wine',
        grape_variety: 'Grenache',
        producer: 'Domaine Vallot',
        region: 'Côtes du Rhône',
        stock_quantity: 20,
        is_organic: true,
        status: 'active',
        image_url: '/images/wine-bottle-rose.svg',
        created_at: new Date().toISOString()
      },
      {
        id: '6',
        name: 'Le Coriançon rouge',
        slug: 'le-coriancon-rouge-2023',
        sku: 'LCRO-2023-001',
        description: 'Côtes du Rhône - Bold red wine with complex tannins.',
        price: 0, // Free/No price set
        vintage: 2023,
        category: 'red_wine',
        grape_variety: 'Mourvèdre',
        producer: 'Domaine Vallot',
        region: 'Côtes du Rhône',
        stock_quantity: 12,
        is_organic: true,
        status: 'active',
        image_url: '/images/wine-bottle-red.svg',
        created_at: new Date().toISOString()
      },
      {
        id: '7',
        name: 'Le Haut des Côtes blanc',
        slug: 'le-haut-des-cotes-blanc',
        sku: 'LHDC-2023-001',
        description: 'Premium white wine with mineral complexity.',
        price: 0, // Free/No price set
        vintage: 2023,
        category: 'white_wine',
        grape_variety: 'Viognier',
        producer: 'Domaine Vallot',
        region: 'Côtes du Rhône',
        stock_quantity: 8,
        is_organic: true,
        status: 'active',
        image_url: '/images/wine-bottle-white.svg',
        created_at: new Date().toISOString()
      }
      ]
    }

    // Find product by multiple slug matching strategies
    let product = products.find(p => {
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
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Check if product is active (for real Supabase data)
    if (product.is_active === false || product.status === 'inactive') {
      return NextResponse.json(
        { error: 'Product not available' },
        { status: 404 }
      )
    }

    // Format product data for API response with proper structure
    const formattedProduct = {
      id: product.id,
      name: product.name,
      slug: product.slug_en || product.slug || generateSlug(product.name, product.vintage),
      sku: product.sku,

      // Description with locale preference
      description: product.description_en || product.description_fr || product.description || 'Fine wine from Domaine Vallot',

      // Price handling for both mock and real data
      price: product.price_eur ? Math.round(product.price_eur * 100) : (product.price / 100), // Convert to cents
      price_eur: product.price_eur || (product.price / 100),
      price_display: product.price_eur ? product.price_eur.toFixed(2) : (product.price / 100).toFixed(2),

      vintage: product.vintage,
      category: determineCategoryFromData(product),
      varietal: product.varietal || product.grape_variety,
      producer: product.producer || 'Domaine Vallot',
      region: product.region,
      alcohol_content: product.alcohol_content || 13.5,
      stock_quantity: product.stock_quantity,
      is_organic: product.organic_certified || product.is_organic || false,
      is_biodynamic: product.biodynamic_certified || false,
      status: product.status || (product.is_active ? 'active' : 'inactive'),
      created_at: product.created_at,

      // Image handling with proper fallback
      images: product.product_images && product.product_images.length > 0
        ? product.product_images.map((img, index) => ({
            id: (index + 1).toString(),
            url: fixSupabaseImageUrl(img.url),
            altText: img.alt_text_en || img.alt_text_fr || product.name,
            width: 400,
            height: 600,
            isPrimary: img.is_primary || index === 0
          }))
        : [{
            id: '1',
            url: product.image_url ? fixSupabaseImageUrl(product.image_url) : getWineFallbackImage(product.name),
            altText: product.name,
            width: 400,
            height: 600,
            isPrimary: true
          }],

      // Stock status
      in_stock: product.stock_quantity > 0,
      stock_status: getStockStatus(product.stock_quantity),

      // Wine details
      alcohol_content_display: `${product.alcohol_content || 13.5}% ABV`,
      volume_display: `${product.volume_ml || 750}ml`,
      serving_temperature: getServingTemperature(product.varietal),

      // Format vintage for display
      vintage_display: product.vintage ? product.vintage.toString() : 'NV (Non-Vintage)',

      // Rich tasting notes from Supabase data
      tasting_notes: {
        appearance: extractAppearanceFromDescription(product.description_en || product.description_fr),
        nose: extractNoseFromDescription(product.description_en || product.description_fr),
        palate: extractPalateFromDescription(product.description_en || product.description_fr),
        food_pairing: product.tasting_notes_en || product.tasting_notes_fr || product.food_pairing_en || product.food_pairing_fr || 'Pairs beautifully with traditional French cuisine'
      },

      // Technical details
      technical_details: {
        alcohol_content: product.alcohol_content || 13.5,
        volume: product.volume_ml || 750,
        serving_temperature_range: getServingTemperatureRange(product.varietal),
        aging_potential: getAgingPotential(product.varietal, product.vintage),
        sulfites: 'Contains sulfites'
      },

      // Age restriction information
      age_restriction: {
        minimum_age: 18,
        verification_required: true,
        message: 'You must be 18 or older to purchase wine'
      },

      // Shipping information
      shipping_info: {
        wine_specific: true,
        requires_signature: (product.price_eur || 0) >= 50, // €50+ requires signature
        temperature_controlled: determineCategoryFromData(product) === 'red_wine',
        fragile: true
      }
    }

    return NextResponse.json({
      data: formattedProduct
    })

  } catch (error) {
    console.error('Error fetching product by slug:', error)

    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    )
  }
}

// Helper functions
function getStockStatus(stockQuantity: number): string {
  if (stockQuantity === 0) return 'out_of_stock'
  if (stockQuantity <= 5) return 'low_stock'
  if (stockQuantity <= 20) return 'limited_stock'
  return 'in_stock'
}

function determineCategoryFromData(product: any): string {
  if (product.category) return product.category

  const varietal = (product.varietal || '').toLowerCase()

  if (varietal.includes('blanc') || varietal.includes('viognier') ||
      varietal.includes('clairette') || varietal.includes('bourboulenc')) {
    return 'white_wine'
  }

  if (varietal.includes('rosé') || varietal.includes('rose') ||
      product.name.toLowerCase().includes('rosé')) {
    return 'rose_wine'
  }

  return 'red_wine'
}

function getServingTemperature(varietal: string): string {
  const v = (varietal || '').toLowerCase()

  if (v.includes('blanc') || v.includes('viognier') || v.includes('clairette')) {
    return 'Serve chilled at 8-10°C'
  }

  if (v.includes('rosé') || v.includes('rose')) {
    return 'Serve chilled at 10-12°C'
  }

  return 'Serve at cellar temperature 16-18°C'
}

function getServingTemperatureRange(varietal: string): string {
  const v = (varietal || '').toLowerCase()

  if (v.includes('blanc') || v.includes('viognier') || v.includes('clairette')) {
    return '8-10°C'
  }

  if (v.includes('rosé') || v.includes('rose')) {
    return '10-12°C'
  }

  return '16-18°C'
}

function getAgingPotential(varietal: string, vintage?: number): string {
  const v = (varietal || '').toLowerCase()
  const currentYear = new Date().getFullYear()
  const age = vintage ? currentYear - vintage : 0

  if (v.includes('grenache') || v.includes('syrah') || v.includes('mourvèdre')) {
    return age > 5 ? 'Drink now or age 5-10 more years' : '10-15 years from vintage'
  }

  if (v.includes('viognier') || v.includes('clairette')) {
    return 'Best enjoyed within 3-5 years'
  }

  return 'Drink now or cellar for 5-10 years'
}

function extractAppearanceFromDescription(description: string): string {
  if (!description) return 'Beautiful color with attractive reflections'

  const lowerDesc = description.toLowerCase()

  if (lowerDesc.includes('robe')) {
    const match = description.match(/robe[^.]*\./i)
    if (match) return match[0]
  }

  if (lowerDesc.includes('couleur')) {
    const match = description.match(/couleur[^.]*\./i)
    if (match) return match[0]
  }

  return 'Beautiful color with attractive reflections'
}

function extractNoseFromDescription(description: string): string {
  if (!description) return 'Complex and inviting aromas'

  const lowerDesc = description.toLowerCase()

  if (lowerDesc.includes('nez')) {
    const match = description.match(/nez[^.]*\./i)
    if (match) return match[0]
  }

  if (lowerDesc.includes('bouquet')) {
    const match = description.match(/bouquet[^.]*\./i)
    if (match) return match[0]
  }

  return 'Complex and inviting aromas'
}

function extractPalateFromDescription(description: string): string {
  if (!description) return 'Well-balanced with excellent structure'

  const lowerDesc = description.toLowerCase()

  if (lowerDesc.includes('bouche')) {
    const match = description.match(/bouche[^.]*\./i)
    if (match) return match[0]
  }

  if (lowerDesc.includes('palais')) {
    const match = description.match(/palais[^.]*\./i)
    if (match) return match[0]
  }

  return 'Well-balanced with excellent structure'
}