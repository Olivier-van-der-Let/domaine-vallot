import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'
import { Database } from '@/types/database.types'

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
  const { data: adminRecord } = await supabase
    .from('admin_users')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!adminRecord) {
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
}) => {
  return safeQuery(async (supabase) => {
    let query = supabase
      .from('wine_products')
      .select(`
        *,
        product_images!inner(
          url,
          alt_text_en,
          alt_text_fr,
          is_primary
        )
      `)
      .eq('is_active', true)
      .eq('product_images.is_primary', true)

    if (options?.category) {
      query = query.eq('category', options.category)
    }

    if (options?.inStock) {
      query = query.gt('stock_quantity', 0)
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