import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerSupabaseClient } from '@/lib/supabase/server'
import { requireAdminAuth, requirePermission } from '@/lib/admin/auth'
import type { Database } from '@/types/database.types'

type WineProduct = Database['public']['Tables']['wine_products']['Update']

/**
 * PATCH /api/admin/products/bulk - Bulk update products
 */
export async function PATCH(request: NextRequest) {
  try {
    // Require admin authentication
    const admin = await requireAdminAuth(request)
    requirePermission(admin, 'products.update')

    const supabase = createRouteHandlerSupabaseClient(request)
    const body = await request.json()

    if (!body.productIds || !Array.isArray(body.productIds) || body.productIds.length === 0) {
      return NextResponse.json(
        { error: 'Product IDs array is required' },
        { status: 400 }
      )
    }

    if (!body.updateData || typeof body.updateData !== 'object') {
      return NextResponse.json(
        { error: 'Update data is required' },
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

    // Limit the number of products that can be updated at once
    if (body.productIds.length > 100) {
      return NextResponse.json(
        { error: 'Too many products. Maximum 100 products can be updated at once.' },
        { status: 400 }
      )
    }

    // Prepare update data
    const updateData = {
      ...body.updateData,
      updated_by: admin.id,
      updated_at: new Date().toISOString()
    }

    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key]
      }
    })

    // Validate allowed fields for bulk update
    const allowedFields = [
      'is_active', 'featured', 'stock_quantity', 'price_euros',
      'low_stock_threshold', 'updated_by', 'updated_at'
    ]
    const invalidFields = Object.keys(updateData).filter(field => !allowedFields.includes(field))
    if (invalidFields.length > 0) {
      return NextResponse.json(
        { error: 'Invalid fields for bulk update', invalidFields, allowedFields },
        { status: 400 }
      )
    }

    // Check if all products exist
    const { data: existingProducts, error: fetchError } = await supabase
      .from('wine_products')
      .select('id, name, sku')
      .in('id', body.productIds)

    if (fetchError) {
      console.error('Error fetching existing products:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch products' },
        { status: 500 }
      )
    }

    if (existingProducts.length !== body.productIds.length) {
      const foundIds = existingProducts.map(p => p.id)
      const missingIds = body.productIds.filter((id: string) => !foundIds.includes(id))
      return NextResponse.json(
        { error: 'Some products not found', missingIds },
        { status: 404 }
      )
    }

    // Perform bulk update
    const { data: updatedProducts, error: updateError } = await supabase
      .from('wine_products')
      .update(updateData as WineProduct)
      .in('id', body.productIds)
      .select('id, name, sku, is_active, featured, stock_quantity, price_euros, updated_at')

    if (updateError) {
      console.error('Error bulk updating products:', updateError)
      return NextResponse.json(
        { error: 'Failed to update products' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: `Successfully updated ${updatedProducts.length} products`,
      updatedProducts,
      updateData: body.updateData
    })

  } catch (error) {
    console.error('Admin products bulk PATCH error:', error)

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
 * DELETE /api/admin/products/bulk - Bulk delete products
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

    // Limit the number of products that can be deleted at once
    if (body.productIds.length > 50) {
      return NextResponse.json(
        { error: 'Too many products. Maximum 50 products can be deleted at once.' },
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
      console.error('Error bulk soft-deleting products:', deleteError)
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
    console.error('Admin products bulk DELETE error:', error)

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