import { NextRequest, NextResponse } from 'next/server'
import { getProducts } from '@/lib/supabase/server'
import { productSearchSchema, validateSchema } from '@/lib/validators/schemas'

// Helper function to fix Supabase image URLs
function fixSupabaseImageUrl(url: string): string {
  if (url.includes('supabase.co/storage/v1/object/public/wines/')) {
    // Fix missing /Public/ in the URL path
    return url.replace('/object/public/wines/', '/object/public/Public/wines/')
  }
  return url
}

// Helper function to generate slug from product name
function generateSlug(name: string): string {
  return name
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
}

// Helper function to determine category from varietal
function getCategoryFromVarietal(varietal: string): string {
  if (!varietal) return 'red_wine'

  const lowerVarietal = varietal.toLowerCase()

  if (lowerVarietal.includes('blanc') || lowerVarietal.includes('viognier') ||
      lowerVarietal.includes('clairette') || lowerVarietal.includes('bourboulenc')) {
    return 'white_wine'
  }

  if (lowerVarietal.includes('rosé') || lowerVarietal.includes('rose') || lowerVarietal.includes('cinsault')) {
    return 'rose_wine'
  }

  return 'red_wine'
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Parse and validate search parameters
    const searchData = {
      query: searchParams.get('query') || undefined,
      category: searchParams.get('category') || undefined,
      minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
      maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
      vintage: searchParams.get('vintage') ? Number(searchParams.get('vintage')) : undefined,
      region: searchParams.get('region') || undefined,
      inStock: searchParams.get('inStock') === 'true',
      isOrganic: searchParams.get('isOrganic') === 'true',
      sortBy: searchParams.get('sortBy') || 'created_at',
      sortOrder: searchParams.get('sortOrder') || 'desc',
      limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : 20,
      offset: searchParams.get('offset') ? Number(searchParams.get('offset')) : 0
    }

    // Validate search parameters
    const validation = validateSchema(productSearchSchema, searchData)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid search parameters', details: validation.errors },
        { status: 400 }
      )
    }

    // Get products with filters
    const options = {
      limit: validation.data.limit,
      offset: validation.data.offset,
      category: validation.data.category,
      inStock: validation.data.inStock
    }

    let products
    try {
      products = await getProducts(options)
    } catch (error) {
      console.log('Supabase connection failed, using mock data for development')
      // Fallback mock data for development
      products = [
        {
          id: '1',
          name: 'Vallot Rouge 2020',
          slug: 'vallot-rouge-2020',
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

    // Apply additional filters that aren't handled in the database query
    let filteredProducts = products

    if (validation.data.query) {
      const query = validation.data.query.toLowerCase()
      filteredProducts = filteredProducts.filter(product =>
        product.name.toLowerCase().includes(query) ||
        product.description.toLowerCase().includes(query) ||
        product.producer?.toLowerCase().includes(query) ||
        product.region?.toLowerCase().includes(query) ||
        product.grape_variety?.toLowerCase().includes(query)
      )
    }

    if (validation.data.minPrice !== undefined) {
      filteredProducts = filteredProducts.filter(product => (product.price_eur || 0) >= validation.data.minPrice!)
    }

    if (validation.data.maxPrice !== undefined) {
      filteredProducts = filteredProducts.filter(product => (product.price_eur || 0) <= validation.data.maxPrice!)
    }

    if (validation.data.vintage !== undefined) {
      filteredProducts = filteredProducts.filter(product => product.vintage === validation.data.vintage)
    }

    if (validation.data.region) {
      filteredProducts = filteredProducts.filter(product =>
        product.region?.toLowerCase().includes(validation.data.region!.toLowerCase())
      )
    }

    if (validation.data.isOrganic) {
      filteredProducts = filteredProducts.filter(product => product.is_organic === true)
    }

    // Apply sorting
    const sortBy = validation.data.sortBy!
    const sortOrder = validation.data.sortOrder!

    filteredProducts.sort((a, b) => {
      let aValue: any
      let bValue: any

      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
          break
        case 'price':
          aValue = a.price_eur || 0
          bValue = b.price_eur || 0
          break
        case 'vintage':
          aValue = a.vintage || 0
          bValue = b.vintage || 0
          break
        case 'created_at':
          aValue = new Date(a.created_at).getTime()
          bValue = new Date(b.created_at).getTime()
          break
        case 'popularity':
          // For now, use stock quantity as a proxy for popularity
          aValue = a.stock_quantity
          bValue = b.stock_quantity
          break
        default:
          aValue = a.created_at
          bValue = b.created_at
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    // Convert and map real Supabase data to component-expected format
    const productsWithFormattedPrice = filteredProducts.map(product => ({
      ...product,
      // Map key fields to expected names
      description: product.description_en || product.description_fr || product.description || 'Fine wine from Domaine Vallot',
      grape_variety: product.varietal || product.grape_variety,
      producer: 'Domaine Vallot',
      category: getCategoryFromVarietal(product.varietal),
      alcohol_content: product.alcohol_content || 13.5,

      // Price handling
      price_display: product.price_eur ? product.price_eur.toFixed(2) : '0.00',
      price: product.price_eur ? Math.round(product.price_eur * 100) : 0, // Convert to cents for compatibility

      // Stock status
      in_stock: product.stock_quantity > 0,

      // Image handling with proper fallback
      image_url: product.product_images?.[0]?.url
        ? fixSupabaseImageUrl(product.product_images[0].url)
        : getWineFallbackImage(product.name),

      // Ensure proper slug generation
      slug: product.slug_en || product.slug || generateSlug(`${product.name}-${product.vintage}`),

      // Additional fields for UI
      is_organic: product.organic_certified || false,
      is_biodynamic: product.biodynamic_certified || false,
      is_featured: product.featured || false
    }))

    // Prepare response with pagination info
    const total = productsWithFormattedPrice.length
    const paginatedProducts = productsWithFormattedPrice.slice(
      validation.data.offset!,
      validation.data.offset! + validation.data.limit!
    )

    return NextResponse.json({
      data: paginatedProducts,
      pagination: {
        total,
        limit: validation.data.limit,
        offset: validation.data.offset,
        hasMore: validation.data.offset! + validation.data.limit! < total
      },
      filters: {
        categories: ['red_wine', 'white_wine', 'rose_wine', 'sparkling_wine', 'dessert_wine', 'fortified_wine'],
        priceRange: {
          min: Math.min(...products.map(p => p.price_eur || 0).filter(p => p > 0)),
          max: Math.max(...products.map(p => p.price_eur || 0))
        },
        vintages: [...new Set(products.map(p => p.vintage).filter(Boolean))].sort((a, b) => b! - a!),
        regions: [...new Set(products.map(p => p.region).filter(Boolean))].sort()
      }
    })

  } catch (error) {
    console.error('Error fetching products:', error)

    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    )
  }
}