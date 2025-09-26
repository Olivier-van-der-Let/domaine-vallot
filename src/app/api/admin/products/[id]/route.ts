import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerSupabaseClient } from '@/lib/supabase/server'
import { requireAdminAuth, requirePermission } from '@/lib/admin/auth'
import {
  generateSlug,
  sanitizeProductData,
  validateWineProduct,
  processImageUrl
} from '@/lib/admin/utils'
import { updateWineProductSchema, validateSchema } from '@/lib/validators/schemas'
import type { Database } from '@/types/database.types'

type WineProduct = Database['public']['Tables']['wine_products']['Update']
type ProductImage = Database['public']['Tables']['product_images']['Insert']

interface RouteParams {
  params: {
    id: string
  }
}

/**
 * GET /api/admin/products/[id] - Get single product with all details
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Require admin authentication
    const admin = await requireAdminAuth(request)
    requirePermission(admin, 'products.read')

    const supabase = createRouteHandlerSupabaseClient(request)

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(params.id)) {
      return NextResponse.json(
        { error: 'Invalid product ID format' },
        { status: 400 }
      )
    }

    // Fetch product with all related data
    const { data: product, error } = await supabase
      .from('wine_products')
      .select(`
        *,
        product_images(*),
        product_certifications(*)
      `)
      .eq('id', params.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Product not found' },
          { status: 404 }
        )
      }

      console.error('Error fetching product:', error)
      return NextResponse.json(
        { error: 'Failed to fetch product' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      product
    })

  } catch (error) {
    console.error('Admin product GET error:', error)

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
 * PUT /api/admin/products/[id] - Update existing wine product
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    // Require admin authentication
    const admin = await requireAdminAuth(request)
    requirePermission(admin, 'products.update')

    const supabase = createRouteHandlerSupabaseClient(request)

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(params.id)) {
      return NextResponse.json(
        { error: 'Invalid product ID format' },
        { status: 400 }
      )
    }

    const body = await request.json()

    // Validate the request body
    const validation = validateSchema(updateWineProductSchema, { ...body, id: params.id })
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.errors
        },
        { status: 400 }
      )
    }

    const updateData = validation.data!

    // Remove id from update data
    const { id, ...productData } = updateData

    // Check if product exists
    const { data: existingProduct, error: fetchError } = await supabase
      .from('wine_products')
      .select('*')
      .eq('id', params.id)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Product not found' },
          { status: 404 }
        )
      }

      console.error('Error fetching existing product:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch product' },
        { status: 500 }
      )
    }

    // Generate slugs if name or vintage changed
    if (productData.name || productData.vintage) {
      const newName = productData.name || existingProduct.name
      const newVintage = productData.vintage || existingProduct.vintage

      if (!productData.slug_en) {
        productData.slug_en = generateSlug(newName, newVintage)
      }
      if (!productData.slug_fr) {
        productData.slug_fr = generateSlug(newName, newVintage)
      }
    }

    // Validate business rules if we have enough data
    const mergedData = { ...existingProduct, ...productData }
    const businessErrors = validateWineProduct(mergedData)
    if (businessErrors.length > 0) {
      return NextResponse.json(
        {
          error: 'Business validation failed',
          details: { general: businessErrors }
        },
        { status: 400 }
      )
    }

    // Check for duplicate SKU (if SKU is being changed)
    if (productData.sku && productData.sku !== existingProduct.sku) {
      const { data: existingSku, error: skuError } = await supabase
        .from('wine_products')
        .select('id')
        .eq('sku', productData.sku)
        .neq('id', params.id)
        .single()

      if (existingSku) {
        return NextResponse.json(
          {
            error: 'Validation failed',
            details: { sku: ['SKU already exists'] }
          },
          { status: 400 }
        )
      }
    }

    // Check for duplicate slug_en (if slug_en is being changed)
    if (productData.slug_en && productData.slug_en !== existingProduct.slug_en) {
      const { data: existingSlugEn, error: slugEnError } = await supabase
        .from('wine_products')
        .select('id')
        .eq('slug_en', productData.slug_en)
        .neq('id', params.id)
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
    }

    // Check for duplicate slug_fr (if slug_fr is being changed)
    if (productData.slug_fr && productData.slug_fr !== existingProduct.slug_fr) {
      const { data: existingSlugFr, error: slugFrError } = await supabase
        .from('wine_products')
        .select('id')
        .eq('slug_fr', productData.slug_fr)
        .neq('id', params.id)
        .single()

      if (existingSlugFr) {
        return NextResponse.json(
          {
            error: 'Validation failed',
            details: { slug_fr: ['French slug already exists'] }
          },
          { status: 400 }
        )
      }
    }

    // Sanitize data for database update
    const sanitizedData = sanitizeProductData({
      ...productData,
      updated_by: admin.id,
      updated_at: new Date().toISOString()
    })

    // Update the wine product
    const { data: updatedProduct, error: updateError } = await supabase
      .from('wine_products')
      .update(sanitizedData as WineProduct)
      .eq('id', params.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating wine product:', updateError)
      return NextResponse.json(
        { error: 'Failed to update wine product' },
        { status: 500 }
      )
    }

    // Handle image updates if provided
    if (body.images && Array.isArray(body.images)) {
      // First, remove all existing images for this product
      const { error: deleteImagesError } = await supabase
        .from('product_images')
        .delete()
        .eq('product_id', params.id)

      if (deleteImagesError) {
        console.error('Error deleting existing images:', deleteImagesError)
        // Continue with the process even if image deletion fails
      }

      // Then insert new images
      if (body.images.length > 0) {
        const imageInserts: ProductImage[] = []

        for (let i = 0; i < body.images.length; i++) {
          const image = body.images[i]
          const processedUrl = processImageUrl(image.url)

          if (processedUrl) {
            imageInserts.push({
              product_id: params.id,
              url: processedUrl,
              alt_text_en: image.alt_text_en || updatedProduct.name,
              alt_text_fr: image.alt_text_fr || updatedProduct.name,
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
            console.error('Error inserting updated product images:', imageError)
            // Don't fail the entire request for image errors, just log them
          }
        }
      }
    }

    // Fetch the complete updated product with images for response
    const { data: completeProduct, error: fetchCompleteError } = await supabase
      .from('wine_products')
      .select(`
        *,
        product_images(*)
      `)
      .eq('id', params.id)
      .single()

    if (fetchCompleteError) {
      console.error('Error fetching complete updated product:', fetchCompleteError)
      // Return the basic product if we can't fetch with images
      return NextResponse.json({
        message: 'Wine product updated successfully',
        product: updatedProduct
      })
    }

    return NextResponse.json({
      message: 'Wine product updated successfully',
      product: completeProduct
    })

  } catch (error) {
    console.error('Admin product PUT error:', error)

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
 * PATCH /api/admin/products/[id] - Partially update wine product
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    // Require admin authentication
    const admin = await requireAdminAuth(request)
    requirePermission(admin, 'products.update')

    const supabase = createRouteHandlerSupabaseClient(request)

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(params.id)) {
      return NextResponse.json(
        { error: 'Invalid product ID format' },
        { status: 400 }
      )
    }

    const body = await request.json()

    // Check if product exists
    const { data: existingProduct, error: fetchError } = await supabase
      .from('wine_products')
      .select('*')
      .eq('id', params.id)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Product not found' },
          { status: 404 }
        )
      }

      console.error('Error fetching existing product:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch product' },
        { status: 500 }
      )
    }

    // Sanitize the partial update data
    const updateData = {
      ...body,
      updated_by: admin.id,
      updated_at: new Date().toISOString()
    }

    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key]
      }
    })

    // Update the wine product
    const { data: updatedProduct, error: updateError } = await supabase
      .from('wine_products')
      .update(updateData as WineProduct)
      .eq('id', params.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating wine product:', updateError)
      return NextResponse.json(
        { error: 'Failed to update wine product' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Wine product updated successfully',
      product: updatedProduct
    })

  } catch (error) {
    console.error('Admin product PATCH error:', error)

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
 * DELETE /api/admin/products/[id] - Delete wine product (soft delete)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // Require admin authentication
    const admin = await requireAdminAuth(request)
    requirePermission(admin, 'products.delete')

    const supabase = createRouteHandlerSupabaseClient(request)

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(params.id)) {
      return NextResponse.json(
        { error: 'Invalid product ID format' },
        { status: 400 }
      )
    }

    // Check if product exists
    const { data: existingProduct, error: fetchError } = await supabase
      .from('wine_products')
      .select('id, name, sku, is_active')
      .eq('id', params.id)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Product not found' },
          { status: 404 }
        )
      }

      console.error('Error fetching product for deletion:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch product' },
        { status: 500 }
      )
    }

    // Check if product has any pending orders
    const { data: pendingOrders, error: ordersError } = await supabase
      .from('order_items')
      .select('id')
      .eq('product_id', params.id)
      .in('orders.status', ['pending', 'confirmed', 'processing'])
      .limit(1)

    if (ordersError) {
      console.error('Error checking pending orders:', ordersError)
      // Continue with deletion even if we can't check orders
    }

    if (pendingOrders && pendingOrders.length > 0) {
      return NextResponse.json(
        {
          error: 'Cannot delete product with pending orders',
          details: { general: ['Product has pending orders and cannot be deleted'] }
        },
        { status: 409 }
      )
    }

    // Check for cart items with this product
    const { data: cartItems, error: cartError } = await supabase
      .from('cart_items')
      .select('id')
      .eq('product_id', params.id)
      .limit(1)

    if (cartError) {
      console.error('Error checking cart items:', cartError)
    }

    if (cartItems && cartItems.length > 0) {
      // Remove from carts before deletion
      const { error: removeCartError } = await supabase
        .from('cart_items')
        .delete()
        .eq('product_id', params.id)

      if (removeCartError) {
        console.error('Error removing product from carts:', removeCartError)
        return NextResponse.json(
          { error: 'Failed to remove product from carts' },
          { status: 500 }
        )
      }
    }

    // Perform soft delete by setting is_active to false
    const { data: deletedProduct, error: deleteError } = await supabase
      .from('wine_products')
      .update({
        is_active: false,
        updated_by: admin.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select('id, name, sku')
      .single()

    if (deleteError) {
      console.error('Error soft-deleting product:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete product' },
        { status: 500 }
      )
    }

    // Also soft-delete associated images by setting a flag (if your schema supports it)
    // For now, we'll just leave the images as they are

    return NextResponse.json({
      message: 'Wine product deleted successfully',
      product: deletedProduct
    })

  } catch (error) {
    console.error('Admin product DELETE error:', error)

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