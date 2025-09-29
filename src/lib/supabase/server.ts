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

// Create read-only server client for Server Components (cannot modify cookies)
export const createServerSupabaseClient = async () => {
  // Check if we're in a build context where cookies are not available
  try {
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
            // Don't set cookies in Server Components - this prevents the error
            // Cookie modifications should only happen in Route Handlers or Server Actions
          },
          remove(name, options) {
            // Don't remove cookies in Server Components - this prevents the error
          },
        },
      }
    )
  } catch (error) {
    // During build time or when cookies are not available, create a client without cookies
    return createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get() { return undefined },
          set() {},
          remove() {},
        },
      }
    )
  }
}

// Create a completely anonymous client for public data queries (no auth)
export const createAnonymousSupabaseClient = () => {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get() { return undefined },
        set() {},
        remove() {},
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
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error) {
      console.error('Error getting server user:', error)
      return null
    }

    return user
  } catch (error) {
    // During build time, return null for user
    return null
  }
}

export const getServerSession = async () => {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { session }, error } = await supabase.auth.getSession()

    if (error) {
      console.error('Error getting server session:', error)
      return null
    }

    return session
  } catch (error) {
    // During build time, return null for session
    return null
  }
}

// Admin authentication helper
export const getServerAdminUser = async () => {
  try {
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
  } catch (error) {
    // During build time, throw error for admin access
    throw new Error('Admin access required')
  }
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

// Database query helper for public data (no authentication required)
export const safeAnonymousQuery = async <T>(
  queryFn: (client: ReturnType<typeof createAnonymousSupabaseClient>) => Promise<{ data: T; error: any }>
): Promise<T> => {
  const supabase = createAnonymousSupabaseClient()
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

// Product queries - using anonymous client for public data
export const getProducts = async (options?: {
  limit?: number
  offset?: number
  category?: string
  inStock?: boolean
  featured?: boolean
}) => {
  return safeAnonymousQuery(async (supabase) => {
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
  return safeAnonymousQuery(async (supabase) => {
    return supabase
      .from('wine_products')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .single()
  })
}

export const getProductBySlug = async (slug: string) => {
  return safeAnonymousQuery(async (supabase) => {
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
        wine_products (
          *,
          product_images!inner (url, alt_text_en, is_primary, display_order)
        )
      `)
      .eq('customer_id', userId)
      .eq('wine_products.product_images.is_primary', true)
  })
}

export const addToCart = async (userId: string, productId: string, quantity: number) => {
  return safeQuery(async (supabase) => {
    // Check if item already exists in cart
    const { data: existingItem } = await supabase
      .from('cart_items')
      .select('*')
      .eq('customer_id', userId)
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
          customer_id: userId,
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
      .eq('customer_id', userId)
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
      .eq('customer_id', userId)
  })
}

// Order queries
export const createOrder = async (orderData: {
  customer_id: string
  shipping_address: any
  billing_address?: any
  items: Array<{
    product_id: string
    quantity: number
    unit_price: number
    product_snapshot: any
  }>
  subtotal: number
  vat_amount: number
  vat_rate: number // VAT rate as decimal (e.g., 0.20 for 20%)
  shipping_cost: number
  total_amount: number
  payment_method?: string
  shipping_method: string // Required shipping method for database
  status?: string
}) => {
  return safeQuery(async (supabase) => {
    // Start transaction by creating order first
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        customer_id: orderData.customer_id,
        shipping_address: orderData.shipping_address,
        billing_address: orderData.billing_address || orderData.shipping_address,
        subtotal_eur: orderData.subtotal,
        vat_amount_eur: orderData.vat_amount,
        shipping_cost_eur: orderData.shipping_cost,
        total_eur: orderData.total_amount,
        payment_method: orderData.payment_method || 'mollie',
        shipping_method: orderData.shipping_method, // Add required shipping_method field
        status: orderData.status || 'pending',
        vat_rate: orderData.vat_rate * 100 // Convert decimal rate (0.20) to percentage (20.00) for DB storage
      })
      .select()
      .single()

    if (orderError) throw orderError

    // Insert order items with product snapshots
    const orderItems = orderData.items.map(item => {
      const lineTotal = item.quantity * item.unit_price
      const vatAmount = Math.round((lineTotal * orderData.vat_rate) * 100) / 100 // Round to 2 decimal places for euros
      return {
        order_id: order.id,
        product_id: item.product_id,
        product_snapshot: item.product_snapshot, // Include immutable product snapshot
        quantity: item.quantity,
        unit_price_eur: item.unit_price,
        vat_rate: orderData.vat_rate * 100, // Convert decimal to percentage for DB storage
        vat_amount_eur: vatAmount,
        line_total_eur: lineTotal + vatAmount, // Include VAT in line total
      }
    })

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems)

    if (itemsError) throw itemsError

    return { data: order, error: null }
  })
}

export const updateOrder = async (orderId: string, updates: {
  sendcloud_order_id?: string
  sendcloud_integration_id?: number
  sendcloud_parcel_id?: number
  sendcloud_tracking_number?: string
  sendcloud_tracking_url?: string
  sendcloud_status?: string
  sendcloud_carrier?: string
  sendcloud_label_url?: string
  status?: string
}) => {
  return safeQuery(async (supabase) => {
    const { data: order, error } = await supabase
      .from('orders')
      .update(updates)
      .eq('id', orderId)
      .select()
      .single()

    if (error) throw error
    return { data: order, error: null }
  })
}

export const getOrderById = async (orderId: string, customerId?: string) => {
  return safeQuery(async (supabase) => {
    let query = supabase
      .from('orders')
      .select(`
        *,
        customers (
          email,
          first_name,
          last_name
        ),
        order_items (
          *,
          wine_products (*)
        )
      `)
      .eq('id', orderId)

    if (customerId) {
      query = query.eq('customer_id', customerId)
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

// VAT rate queries - public data
export const getVatRateByCountry = async (countryCode: string) => {
  return safeAnonymousQuery(async (supabase) => {
    return supabase
      .from('vat_rates')
      .select('*')
      .eq('country_code', countryCode.toUpperCase())
      .eq('is_active', true)
      .single()
  })
}

// ==============================================================================
// ADMIN PRODUCT MANAGEMENT FUNCTIONS
// ==============================================================================

// Admin query helper - requires authentication
export const safeAdminQuery = async <T>(
  queryFn: (client: ServerSupabaseClient) => Promise<{ data: T; error: any }>,
  userId?: string
): Promise<T> => {
  // Verify admin access
  const adminUser = await getServerAdminUser()

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

// Get all products for admin (including inactive)
export const getAdminProducts = async (options?: {
  limit?: number
  offset?: number
  search?: string
  category?: string
  status?: 'active' | 'inactive' | 'all'
  featured?: boolean
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}) => {
  return safeAdminQuery(async (supabase) => {
    let query = supabase
      .from('wine_products')
      .select(`
        *,
        product_images(
          id,
          url,
          alt_text_en,
          alt_text_fr,
          is_primary,
          display_order,
          image_type
        )
      `)

    // Filter by status
    if (options?.status === 'active') {
      query = query.eq('is_active', true)
    } else if (options?.status === 'inactive') {
      query = query.eq('is_active', false)
    }
    // 'all' means no filter on is_active

    // Search functionality
    if (options?.search) {
      const searchTerm = options.search.toLowerCase()
      query = query.or(`
        name.ilike.%${searchTerm}%,
        description_en.ilike.%${searchTerm}%,
        description_fr.ilike.%${searchTerm}%,
        varietal.ilike.%${searchTerm}%,
        region.ilike.%${searchTerm}%,
        sku.ilike.%${searchTerm}%
      `)
    }

    if (options?.featured !== undefined) {
      query = query.eq('featured', options.featured)
    }

    // Sorting
    const sortBy = options?.sortBy || 'created_at'
    const sortOrder = options?.sortOrder === 'asc' ? { ascending: true } : { ascending: false }
    query = query.order(sortBy, sortOrder)

    if (options?.limit) {
      query = query.limit(options.limit)
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 20) - 1)
    }

    return query
  })
}

// Get single product for admin
export const getAdminProductById = async (id: string) => {
  return safeAdminQuery(async (supabase) => {
    return supabase
      .from('wine_products')
      .select(`
        *,
        product_images(
          id,
          url,
          alt_text_en,
          alt_text_fr,
          is_primary,
          display_order,
          image_type,
          width,
          height,
          file_size
        )
      `)
      .eq('id', id)
      .single()
  })
}

// Create new product
export const createAdminProduct = async (productData: any, userId: string) => {
  return safeAdminQuery(async (supabase) => {
    // Add audit fields
    const dataWithAudit = {
      ...productData,
      created_by: userId,
      updated_by: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    return supabase
      .from('wine_products')
      .insert(dataWithAudit)
      .select()
      .single()
  }, userId)
}

// Update existing product
export const updateAdminProduct = async (id: string, productData: any, userId: string) => {
  return safeAdminQuery(async (supabase) => {
    // Add audit fields
    const dataWithAudit = {
      ...productData,
      updated_by: userId,
      updated_at: new Date().toISOString()
    }

    return supabase
      .from('wine_products')
      .update(dataWithAudit)
      .eq('id', id)
      .select()
      .single()
  }, userId)
}

// Soft delete product (set is_active to false)
export const deleteAdminProduct = async (id: string, userId: string) => {
  return safeAdminQuery(async (supabase) => {
    // Check if product has pending orders
    const { data: pendingOrders } = await supabase
      .from('order_items')
      .select(`
        id,
        orders!inner(
          id,
          status
        )
      `)
      .eq('product_id', id)
      .in('orders.status', ['pending', 'confirmed', 'processing'])

    if (pendingOrders && pendingOrders.length > 0) {
      throw new Error('Cannot delete product with pending orders')
    }

    // Soft delete by setting is_active to false
    return supabase
      .from('wine_products')
      .update({
        is_active: false,
        updated_by: userId,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()
  }, userId)
}

// Hard delete product (actual deletion - use with caution)
export const hardDeleteAdminProduct = async (id: string, userId: string) => {
  return safeAdminQuery(async (supabase) => {
    // Check if product has any orders
    const { data: orders } = await supabase
      .from('order_items')
      .select('id')
      .eq('product_id', id)

    if (orders && orders.length > 0) {
      throw new Error('Cannot permanently delete product with order history')
    }

    // Delete associated images first
    await supabase
      .from('product_images')
      .delete()
      .eq('product_id', id)

    // Delete the product
    return supabase
      .from('wine_products')
      .delete()
      .eq('id', id)
  }, userId)
}

// Product image management functions
export const createProductImage = async (imageData: {
  product_id: string
  url: string
  alt_text_en?: string
  alt_text_fr?: string
  display_order?: number
  image_type?: string
  width?: number
  height?: number
  file_size?: number
  is_primary?: boolean
}, userId: string) => {
  return safeAdminQuery(async (supabase) => {
    // If this is set as primary, unset other primary images for this product
    if (imageData.is_primary) {
      await supabase
        .from('product_images')
        .update({ is_primary: false })
        .eq('product_id', imageData.product_id)
    }

    return supabase
      .from('product_images')
      .insert(imageData)
      .select()
      .single()
  }, userId)
}

export const updateProductImage = async (imageId: string, imageData: any, userId: string) => {
  return safeAdminQuery(async (supabase) => {
    // If this is set as primary, unset other primary images for this product
    if (imageData.is_primary) {
      // First get the product_id
      const { data: currentImage } = await supabase
        .from('product_images')
        .select('product_id')
        .eq('id', imageId)
        .single()

      if (currentImage) {
        await supabase
          .from('product_images')
          .update({ is_primary: false })
          .eq('product_id', currentImage.product_id)
          .neq('id', imageId)
      }
    }

    return supabase
      .from('product_images')
      .update(imageData)
      .eq('id', imageId)
      .select()
      .single()
  }, userId)
}

export const deleteProductImage = async (imageId: string, userId: string) => {
  return safeAdminQuery(async (supabase) => {
    return supabase
      .from('product_images')
      .delete()
      .eq('id', imageId)
  }, userId)
}

// Bulk operations
export const bulkUpdateProductStatus = async (productIds: string[], isActive: boolean, userId: string) => {
  return safeAdminQuery(async (supabase) => {
    return supabase
      .from('wine_products')
      .update({
        is_active: isActive,
        updated_by: userId,
        updated_at: new Date().toISOString()
      })
      .in('id', productIds)
      .select()
  }, userId)
}

export const bulkUpdateProductFeatured = async (productIds: string[], featured: boolean, userId: string) => {
  return safeAdminQuery(async (supabase) => {
    return supabase
      .from('wine_products')
      .update({
        featured: featured,
        updated_by: userId,
        updated_at: new Date().toISOString()
      })
      .in('id', productIds)
      .select()
  }, userId)
}

// Stock management
export const updateProductStock = async (id: string, stockQuantity: number, userId: string) => {
  return safeAdminQuery(async (supabase) => {
    return supabase
      .from('wine_products')
      .update({
        stock_quantity: stockQuantity,
        updated_by: userId,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()
  }, userId)
}

// Get products with low stock
export const getLowStockProducts = async (threshold: number = 10) => {
  return safeAdminQuery(async (supabase) => {
    return supabase
      .from('wine_products')
      .select('*')
      .eq('is_active', true)
      .lte('stock_quantity', threshold)
      .order('stock_quantity', { ascending: true })
  })
}

// Duplicate product
export const duplicateProduct = async (id: string, userId: string) => {
  return safeAdminQuery(async (supabase) => {
    // Get the original product
    const { data: originalProduct } = await supabase
      .from('wine_products')
      .select('*')
      .eq('id', id)
      .single()

    if (!originalProduct) {
      throw new Error('Product not found')
    }

    // Create new product data (remove id and update key fields)
    const {
      id: _,
      created_at: __,
      updated_at: ___,
      created_by: ____,
      updated_by: _____,
      sku,
      slug_en,
      slug_fr,
      ...productData
    } = originalProduct

    const newProductData = {
      ...productData,
      name: `${originalProduct.name} (Copy)`,
      sku: `${sku}-COPY-${Date.now()}`,
      slug_en: `${slug_en}-copy-${Date.now()}`,
      slug_fr: `${slug_fr}-copy-${Date.now()}`,
      is_active: false, // Start as inactive
      featured: false, // Remove featured status
      created_by: userId,
      updated_by: userId
    }

    // Create the new product
    const { data: newProduct } = await supabase
      .from('wine_products')
      .insert(newProductData)
      .select()
      .single()

    // Copy images if they exist
    const { data: originalImages } = await supabase
      .from('product_images')
      .select('*')
      .eq('product_id', id)

    if (originalImages && originalImages.length > 0) {
      const newImages = originalImages.map(img => ({
        ...img,
        id: undefined,
        product_id: newProduct.id,
        created_at: undefined
      }))

      await supabase
        .from('product_images')
        .insert(newImages)
    }

    return { data: newProduct, error: null }
  }, userId)
}