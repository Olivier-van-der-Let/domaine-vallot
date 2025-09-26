import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerSupabaseClient } from '@/lib/supabase/server'
import { requireAdminAuth, requirePermission } from '@/lib/admin/auth'
import {
  generateSlug,
  generateSKU,
  sanitizeProductData,
  validateWineProduct,
  processImageUrl
} from '@/lib/admin/utils'
import { wineProductSchema, validateSchema } from '@/lib/validators/schemas'
import { rateLimiters, addSecurityHeaders, InputSanitizer, RequestValidator } from '@/lib/admin/security'
import type { Database } from '@/types/database.types'

type WineProduct = Database['public']['Tables']['wine_products']['Insert']
type ProductImage = Database['public']['Tables']['product_images']['Insert']

/**
 * POST /api/admin/products - Create new wine product
 */
export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResponse = rateLimiters.adminApi(request);
    if (rateLimitResponse) {
      return addSecurityHeaders(rateLimitResponse);
    }

    // Validate request method and content type
    if (!RequestValidator.validateMethod(request, ['POST'])) {
      return addSecurityHeaders(NextResponse.json(
        { error: 'Method not allowed' },
        { status: 405 }
      ));
    }

    if (!RequestValidator.validateContentType(request, ['application/json'])) {
      return addSecurityHeaders(NextResponse.json(
        { error: 'Invalid content type' },
        { status: 400 }
      ));
    }

    // Validate request size (10MB limit)
    if (!(await RequestValidator.validateRequestSize(request, 10 * 1024 * 1024))) {
      return addSecurityHeaders(NextResponse.json(
        { error: 'Request too large' },
        { status: 413 }
      ));
    }

    // Require admin authentication
    const admin = await requireAdminAuth(request)
    requirePermission(admin, 'products.create')

    const supabase = createRouteHandlerSupabaseClient(request)
    const rawBody = await request.json()

    // Sanitize input data
    const body = InputSanitizer.sanitizeObject(rawBody)

    // Validate the request body
    const validation = validateSchema(wineProductSchema, body)
    if (!validation.success) {
      return addSecurityHeaders(NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.errors
        },
        { status: 400 }
      ))
    }

    const productData = validation.data!

    // Generate slugs if not provided
    if (!productData.slug_en) {
      productData.slug_en = generateSlug(productData.name, productData.vintage)
    }
    if (!productData.slug_fr) {
      productData.slug_fr = generateSlug(productData.name, productData.vintage)
    }

    // Generate SKU if not provided
    if (!body.sku) {
      productData.sku = generateSKU(productData.name, productData.vintage, productData.varietal)
    }

    // Validate business rules
    const businessErrors = validateWineProduct(productData)
    if (businessErrors.length > 0) {
      return addSecurityHeaders(NextResponse.json(
        {
          error: 'Business validation failed',
          details: { general: businessErrors }
        },
        { status: 400 }
      ))
    }

    // Check for duplicate SKU
    const { data: existingSku, error: skuError } = await supabase
      .from('wine_products')
      .select('id')
      .eq('sku', productData.sku)
      .single()

    if (existingSku) {
      return addSecurityHeaders(NextResponse.json(
        {
          error: 'Validation failed',
          details: { sku: ['SKU already exists'] }
        },
        { status: 400 }
      ))
    }

    // Check for duplicate slug_en
    const { data: existingSlugEn, error: slugEnError } = await supabase
      .from('wine_products')
      .select('id')
      .eq('slug_en', productData.slug_en)
      .single()

    if (existingSlugEn) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: { slug_en: ['English slug already exists'] }
        },
        { status: 400 }
      )
    }

    // Check for duplicate slug_fr
    const { data: existingSlugFr, error: slugFrError } = await supabase
      .from('wine_products')
      .select('id')
      .eq('slug_fr', productData.slug_fr)
      .single()

    if (existingSlugFr) {
      return addSecurityHeaders(NextResponse.json(
        {
          error: 'Validation failed',
          details: { slug_fr: ['French slug already exists'] }
        },
        { status: 400 }
      ))
    }

    // Sanitize data for database insertion
    const sanitizedData = sanitizeProductData({
      ...productData,
      created_by: admin.id,
      updated_by: admin.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })

    // Insert the wine product
    const { data: newProduct, error: insertError } = await supabase
      .from('wine_products')
      .insert(sanitizedData as WineProduct)
      .select()
      .single()

    if (insertError) {
      console.error('Error creating wine product:', insertError)
      return addSecurityHeaders(NextResponse.json(
        { error: 'Failed to create wine product' },
        { status: 500 }
      ))
    }

    // Handle image uploads if provided
    if (body.images && Array.isArray(body.images) && body.images.length > 0) {
      const imageInserts: ProductImage[] = []

      for (let i = 0; i < body.images.length; i++) {
        const image = body.images[i]
        const processedUrl = processImageUrl(image.url)

        if (processedUrl) {
          imageInserts.push({
            product_id: newProduct.id,
            url: processedUrl,
            alt_text_en: image.alt_text_en || newProduct.name,
            alt_text_fr: image.alt_text_fr || newProduct.name,
            display_order: image.display_order || i,
            image_type: image.image_type || 'bottle',
            width: image.width || null,
            height: image.height || null,
            file_size: image.file_size || null,
            is_primary: i === 0 || image.is_primary || false,
            created_at: new Date().toISOString()
          })
        }
      }

      if (imageInserts.length > 0) {
        const { error: imageError } = await supabase
          .from('product_images')
          .insert(imageInserts)

        if (imageError) {
          console.error('Error inserting product images:', imageError)
          // Don't fail the entire request for image errors, just log them
        }
      }
    }

    // Fetch the complete product with images for response
    const { data: completeProduct, error: fetchError } = await supabase
      .from('wine_products')
      .select(`
        *,
        product_images(*)
      `)
      .eq('id', newProduct.id)
      .single()

    if (fetchError) {
      console.error('Error fetching complete product:', fetchError)
      // Return the basic product if we can't fetch with images
      return addSecurityHeaders(NextResponse.json({
        message: 'Wine product created successfully',
        product: newProduct
      }, { status: 201 }))
    }

    return addSecurityHeaders(NextResponse.json({
      message: 'Wine product created successfully',
      product: completeProduct
    }, { status: 201 }))

  } catch (error) {
    console.error('Admin products POST error:', error)

    if (error instanceof Error) {
      if (error.message === 'Authentication required') {
        return addSecurityHeaders(NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        ))
      }

      if (error.message === 'Admin access required' || error.message.startsWith('Permission denied')) {
        return addSecurityHeaders(NextResponse.json(
          { error: 'Admin access required' },
          { status: 403 }
        ))
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/admin/products - List all products with admin filters
 */
export async function GET(request: NextRequest) {
  try {
    // Require admin authentication
    const admin = await requireAdminAuth(request)
    requirePermission(admin, 'products.read')

    const supabase = createRouteHandlerSupabaseClient(request)
    const { searchParams } = new URL(request.url)

    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '25'), 100)
    const search = searchParams.get('search')
    const status = searchParams.get('status')
    const featured = searchParams.get('featured')
    const inStock = searchParams.get('inStock')
    const sortBy = searchParams.get('sortBy') || 'created_at'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    // Build the query
    let query = supabase
      .from('wine_products')
      .select(`
        *,
        product_images(
          id,
          url,
          alt_text_en,
          alt_text_fr,
          display_order,
          image_type,
          is_primary
        )
      `, { count: 'exact' })

    // Apply filters
    if (search) {
      const searchTerm = `%${search.toLowerCase()}%`
      query = query.or(
        `name.ilike.${searchTerm},` +
        `sku.ilike.${searchTerm},` +
        `varietal.ilike.${searchTerm},` +
        `region.ilike.${searchTerm},` +
        `description_en.ilike.${searchTerm},` +
        `description_fr.ilike.${searchTerm}`
      )
    }

    if (status === 'active') {
      query = query.eq('is_active', true)
    } else if (status === 'inactive') {
      query = query.eq('is_active', false)
    }

    if (featured === 'true') {
      query = query.eq('featured', true)
    }

    if (inStock === 'true') {
      query = query.gt('stock_quantity', 0)
    } else if (inStock === 'false') {
      query = query.eq('stock_quantity', 0)
    }

    // Apply sorting
    const validSortColumns = ['name', 'sku', 'vintage', 'price_eur', 'stock_quantity', 'created_at', 'updated_at']
    const validSortColumn = validSortColumns.includes(sortBy) ? sortBy : 'created_at'
    query = query.order(validSortColumn, { ascending: sortOrder === 'asc' })

    // Apply pagination
    const offset = (page - 1) * limit
    query = query.range(offset, offset + limit - 1)

    const { data: products, error, count } = await query

    if (error) {
      console.error('Error fetching admin products:', error)
      return NextResponse.json(
        { error: 'Failed to fetch products' },
        { status: 500 }
      )
    }

    // Calculate pagination info
    const totalPages = Math.ceil((count || 0) / limit)

    return NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages,
        hasNext: page < totalPages,
        hasPrevious: page > 1
      },
      filters: {
        search,
        status,
        featured,
        inStock,
        sortBy: validSortColumn,
        sortOrder
      }
    })

  } catch (error) {
    console.error('Admin products GET error:', error)

    if (error instanceof Error) {
      if (error.message === 'Authentication required') {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        )
      }

      if (error.message === 'Admin access required' || error.message.startsWith('Permission denied')) {
        return NextResponse.json(
          { error: 'Admin access required' },
          { status: 403 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/products - Delete multiple products
 */
export async function DELETE(request: NextRequest) {
  try {
    // Require admin authentication
    const admin = await requireAdminAuth(request)
    requirePermission(admin, 'products.delete')

    const supabase = createRouteHandlerSupabaseClient(request)
    const body = await request.json()

    if (!body.productIds || !Array.isArray(body.productIds) || body.productIds.length === 0) {
      return NextResponse.json(
        { error: 'Product IDs array is required' },
        { status: 400 }
      )
    }

    // Validate all product IDs are UUIDs
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    const invalidIds = body.productIds.filter((id: string) => !uuidRegex.test(id))
    if (invalidIds.length > 0) {
      return NextResponse.json(
        { error: 'Invalid product ID format', invalidIds },
        { status: 400 }
      )
    }

    // Check if any products have pending orders
    const { data: pendingOrders, error: ordersError } = await supabase
      .from('order_items')
      .select('product_id, orders!inner(status)')
      .in('product_id', body.productIds)
      .in('orders.status', ['pending', 'confirmed', 'processing'])

    if (ordersError) {
      console.error('Error checking pending orders:', ordersError)
    }

    if (pendingOrders && pendingOrders.length > 0) {
      const productsWithOrders = [...new Set(pendingOrders.map(order => order.product_id))]
      return NextResponse.json(
        {
          error: 'Cannot delete products with pending orders',
          productsWithOrders
        },
        { status: 409 }
      )
    }

    // Remove products from carts
    const { error: cartRemovalError } = await supabase
      .from('cart_items')
      .delete()
      .in('product_id', body.productIds)

    if (cartRemovalError) {
      console.error('Error removing products from carts:', cartRemovalError)
    }

    // Perform soft delete by setting is_active to false
    const { data: deletedProducts, error: deleteError } = await supabase
      .from('wine_products')
      .update({
        is_active: false,
        updated_by: admin.id,
        updated_at: new Date().toISOString()
      })
      .in('id', body.productIds)
      .select('id, name, sku')

    if (deleteError) {
      console.error('Error soft-deleting products:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete products' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: `Successfully deleted ${deletedProducts.length} products`,
      deletedProducts
    })

  } catch (error) {
    console.error('Admin products DELETE error:', error)

    if (error instanceof Error) {
      if (error.message === 'Authentication required') {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        )
      }

      if (error.message === 'Admin access required' || error.message.startsWith('Permission denied')) {
        return NextResponse.json(
          { error: 'Admin access required' },
          { status: 403 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}