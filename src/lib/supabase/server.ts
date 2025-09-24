import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'
import { Database } from '@/types/database.types'

// Helper function to fix Supabase image URLs
export function fixSupabaseImageUrl(url: string): string {
  if (url.includes('supabase.co/storage/v1/object/public/wines/')) {
    // Fix missing /Public/ in the URL path
    return url.replace('/object/public/wines/', '/object/public/Public/wines/')
  }
  return url
}

// Helper function to get wine-specific fallback images
export function getWineFallbackImage(wineName: string): string {
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
    .replace(/[«»\"']/g, '') // Remove quotes and guillemets
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
}

// Create server client for Server Components
export const createServerSupabaseClient = async () => {
  const cookieStore = await cookies()
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value
        },
        set(name, value, options) {
          cookieStore.set(name, value, options)
        },
        remove(name, options) {
          cookieStore.delete(name)
        },
      },
    }
  )
}

// Create client for API Route Handlers
export const createRouteHandlerSupabaseClient = (request?: NextRequest) => {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return request?.cookies.get(name)?.value
        },
        set(name, value, options) {
          // For route handlers, we need to set cookies differently
          // This will be handled by the response
        },
        remove(name, options) {
          // For route handlers, we need to remove cookies differently
          // This will be handled by the response
        },
      },
    }
  )
}

// Export createClient alias for backward compatibility
export const createClient = createServerSupabaseClient

// Type helpers for server-side usage
export type ServerSupabaseClient = ReturnType<typeof createServerClient>
export type RouteHandlerSupabaseClient = ReturnType<typeof createRouteHandlerSupabaseClient>

// Authentication helpers for server-side
export const getServerUser = async () => {
  const supabase = await createServerSupabaseClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error) {
    console.error('Error getting server user:', error)
    return null
  }

  return user
}

export const getServerSession = async () => {
  const supabase = await createServerSupabaseClient()
  const { data: { session }, error } = await supabase.auth.getSession()

  if (error) {
    console.error('Error getting server session:', error)
    return null
  }

  return session
}

// Admin authentication helper
export const getServerAdminUser = async () => {
  const user = await getServerUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  // Check if user has admin role in user metadata or in a separate admin table
  const supabase = await createServerSupabaseClient()

  // Option 1: Check user metadata
  if (user.user_metadata?.role === 'admin') {
    return user
  }

  // Option 2: Check admin table (if exists)
  try {
    const { data: adminRecord, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.warn('Admin table check failed:', error)
      throw new Error('Admin access required')
    }

    if (!adminRecord) {
      throw new Error('Admin access required')
    }
  } catch (error) {
    console.warn('Admin table not found or accessible, falling back to metadata check')
    throw new Error('Admin access required')
  }

  return user
}

// Database query helpers with error handling
export const safeQuery = async <T>(
  queryFn: (client: ServerSupabaseClient) => Promise<{ data: T; error: any }>
): Promise<T> => {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await queryFn(supabase)

  if (error) {
    console.error('Database query error:', error)

    if (error.code === 'PGRST116') {
      throw new Error('Resource not found')
    }

    if (error.code === '42501') {
      throw new Error('Access denied')
    }

    throw new Error(error.message || 'Database query failed')
  }

  return data
}

// Product queries
export const getProducts = async (options?: {
  limit?: number
  offset?: number
  category?: string
  inStock?: boolean
  featured?: boolean
}) => {
  return safeQuery(async (supabase) => {
    let query = supabase
      .from('wine_products')
      .select(`
        *,
        product_images(
          url,
          alt_text_en,
          alt_text_fr,
          is_primary,
          display_order
        )
      `)
      .eq('is_active', true)

    if (options?.category) {
      query = query.eq('category', options.category)
    }

    if (options?.inStock) {
      query = query.gt('stock_quantity', 0)
    }

    if (options?.featured) {
      query = query.eq('featured', true)
    }

    if (options?.limit) {
      query = query.limit(options.limit)
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
    }

    return query.order('created_at', { ascending: false })
  })
}

// Get featured products for homepage
export const getFeaturedProducts = async (limit: number = 6) => {
  try {
    const products = await getProducts({
      featured: true,
      limit,
      inStock: true
    })

    // Transform the data to match the expected format
    return products.map(product => ({
      ...product,
      // Map key fields to expected names for backward compatibility
      description: product.description_en || product.description_fr || 'Fine wine from Domaine Vallot',
      grape_variety: product.varietal,
      producer: 'Domaine Vallot',
      alcohol_content: product.alcohol_content || 13.5,

      // Price handling
      price_display: product.price_eur ? product.price_eur.toString() : '0.00',
      price: product.price_eur ? Math.round(parseFloat(product.price_eur.toString()) * 100) : 0,

      // Stock status
      in_stock: product.stock_quantity > 0,

      // Image handling with proper fallback and URL fix
      image_url: product.product_images?.[0]?.url
        ? fixSupabaseImageUrl(product.product_images[0].url)
        : getWineFallbackImage(product.name),
      image: product.product_images?.[0]?.url
        ? fixSupabaseImageUrl(product.product_images[0].url)
        : getWineFallbackImage(product.name),

      // Additional fields for UI
      is_organic: product.organic_certified || false,
      is_biodynamic: product.biodynamic_certified || false,
      is_featured: product.featured || false,

      // Ensure proper slug generation
      slug: product.slug_en || product.slug_fr || generateSlug(`${product.name}-${product.vintage}`)
    }))
  } catch (error) {
    console.error('Error fetching featured products from database:', error)
    // Return fallback mock data if database fails
    return getFallbackProducts()
  }
}


// Fallback mock data for development
function getFallbackProducts() {
  return [
    {
      id: '1',
      name: 'Vinsobres rouge « François »',
      slug: 'vinsobres-rouge-francois-2022',
      description: 'A premium red wine with notes of dark fruit and traditional terroir expression.',
      price_eur: 12.00,
      price: 1200,
      vintage: 2022,
      grape_variety: 'Syrah blend',
      producer: 'Domaine Vallot',
      region: 'Vinsobres',
      stock_quantity: 50,
      is_organic: true,
      is_biodynamic: true,
      featured: true,
      image_url: '/images/wine-bottle-red.svg',
      image: '/images/wine-bottle-red.svg',
      created_at: new Date().toISOString()
    },
    {
      id: '2',
      name: 'Vinsobres Cuvée « Claude »',
      slug: 'vinsobres-cuvee-claude-2018',
      description: 'From 67-year-old vines, this wine benefits from barrel aging for exceptional complexity.',
      price_eur: 14.50,
      price: 1450,
      vintage: 2018,
      grape_variety: 'Old vine Syrah',
      producer: 'Domaine Vallot',
      region: 'Vinsobres',
      stock_quantity: 30,
      is_organic: true,
      is_biodynamic: true,
      featured: true,
      image_url: '/images/wine-bottle-red.svg',
      image: '/images/wine-bottle-red.svg',
      created_at: new Date().toISOString()
    },
    {
      id: '3',
      name: 'Vinsobres Le Haut des Côtes',
      slug: 'vinsobres-le-haut-des-cotes-2018',
      description: 'Deep red color with intense bouquet of vanilla and forest floor notes.',
      price_eur: 16.50,
      price: 1650,
      vintage: 2018,
      grape_variety: 'Syrah, Grenache',
      producer: 'Domaine Vallot',
      region: 'Vinsobres',
      stock_quantity: 25,
      is_organic: true,
      is_biodynamic: true,
      featured: true,
      image_url: '/images/wine-bottle-red.svg',
      image: '/images/wine-bottle-red.svg',
      created_at: new Date().toISOString()
    }
  ]
}

export const getProductById = async (id: string) => {
  return safeQuery(async (supabase) => {
    return supabase
      .from('wine_products')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .single()
  })
}

export const getProductBySlug = async (slug: string) => {
  return safeQuery(async (supabase) => {
    return supabase
      .from('wine_products')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single()
  })
}

// Cart queries
export const getCartItems = async (userId: string) => {
  return safeQuery(async (supabase) => {
    return supabase
      .from('cart_items')
      .select(`
        *,
        wine_products (*)
      `)
      .eq('user_id', userId)
  })
}

export const addToCart = async (userId: string, productId: string, quantity: number) => {
  return safeQuery(async (supabase) => {
    // Check if item already exists in cart
    const { data: existingItem } = await supabase
      .from('cart_items')
      .select('*')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .single()

    if (existingItem) {
      // Update quantity
      return supabase
        .from('cart_items')
        .update({ quantity: existingItem.quantity + quantity })
        .eq('id', existingItem.id)
        .select()
        .single()
    } else {
      // Insert new item
      return supabase
        .from('cart_items')
        .insert({
          user_id: userId,
          product_id: productId,
          quantity,
        })
        .select()
        .single()
    }
  })
}

export const updateCartItem = async (userId: string, itemId: string, quantity: number) => {
  return safeQuery(async (supabase) => {
    return supabase
      .from('cart_items')
      .update({ quantity })
      .eq('id', itemId)
      .eq('user_id', userId)
      .select()
      .single()
  })
}

export const removeFromCart = async (userId: string, itemId: string) => {
  return safeQuery(async (supabase) => {
    return supabase
      .from('cart_items')
      .delete()
      .eq('id', itemId)
      .eq('user_id', userId)
  })
}

// Order queries
export const createOrder = async (orderData: {
  user_id: string
  customer_email: string
  customer_first_name: string
  customer_last_name: string
  shipping_address: any
  billing_address?: any
  items: Array<{
    product_id: string
    quantity: number
    unit_price: number
  }>
  subtotal: number
  vat_amount: number
  shipping_cost: number
  total_amount: number
  payment_method?: string
  status?: string
}) => {
  return safeQuery(async (supabase) => {
    // Start transaction by creating order first
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: orderData.user_id,
        customer_email: orderData.customer_email,
        customer_first_name: orderData.customer_first_name,
        customer_last_name: orderData.customer_last_name,
        shipping_address: orderData.shipping_address,
        billing_address: orderData.billing_address || orderData.shipping_address,
        subtotal: orderData.subtotal,
        vat_amount: orderData.vat_amount,
        shipping_cost: orderData.shipping_cost,
        total_amount: orderData.total_amount,
        payment_method: orderData.payment_method || 'mollie',
        status: orderData.status || 'pending',
      })
      .select()
      .single()

    if (orderError) throw orderError

    // Insert order items
    const orderItems = orderData.items.map(item => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.quantity * item.unit_price,
    }))

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems)

    if (itemsError) throw itemsError

    return { data: order, error: null }
  })
}

export const getOrderById = async (orderId: string, userId?: string) => {
  return safeQuery(async (supabase) => {
    let query = supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          wine_products (*)
        )
      `)
      .eq('id', orderId)

    if (userId) {
      query = query.eq('user_id', userId)
    }

    return query.single()
  })
}

// Customer queries
export const createOrUpdateCustomer = async (userData: {
  user_id: string
  email: string
  first_name: string
  last_name: string
  birth_date?: string
  phone?: string
}) => {
  return safeQuery(async (supabase) => {
    return supabase
      .from('customers')
      .upsert(userData, { onConflict: 'user_id' })
      .select()
      .single()
  })
}

// VAT rate queries
export const getVatRateByCountry = async (countryCode: string) => {
  return safeQuery(async (supabase) => {
    return supabase
      .from('vat_rates')
      .select('*')
      .eq('country_code', countryCode.toUpperCase())
      .eq('is_active', true)
      .single()
  })
}