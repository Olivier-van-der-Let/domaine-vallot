import { NextRequest, NextResponse } from 'next/server'
import { getServerUser, getCartItems, addToCart } from '@/lib/supabase/server'
import { addToCartSchema, validateSchema } from '@/lib/validators/schemas'

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const user = await getServerUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get cart items for user
    const cartItems = await getCartItems(user.id)

    // Calculate cart totals
    let subtotal = 0
    let totalItems = 0

    const formattedItems = cartItems.map(item => {
      // Validate and log data integrity issues
      const priceEur = item.wine_products.price_eur
      if (priceEur == null) {
        console.warn('🛒 Product with null price found in cart:', {
          productId: item.wine_products.id,
          productName: item.wine_products.name,
          sku: item.wine_products.sku,
          priceEur: priceEur
        })
      }

      // Use null-safe price handling
      const safePriceEur = typeof priceEur === 'number' ? priceEur : 0
      const itemTotal = item.quantity * safePriceEur
      subtotal += itemTotal // Keep as euros
      totalItems += item.quantity

      return {
        id: item.id,
        productId: item.product_id,
        quantity: item.quantity,
        addedAt: item.added_at,
        product: {
          id: item.wine_products.id,
          name: item.wine_products.name,
          sku: item.wine_products.sku,
          priceEur: safePriceEur,
          price_display: safePriceEur.toFixed(2),
          image_url: '/images/default-wine.jpg', // TODO: Add actual image handling
          category: item.wine_products.varietal || 'Wine',
          vintage: item.wine_products.vintage,
          stock_quantity: item.wine_products.stock_quantity,
          in_stock: item.wine_products.stock_quantity > 0,
          alcohol_content: item.wine_products.alcohol_content,
          volume: item.wine_products.volume_ml || 750
        },
        subtotalEur: itemTotal
      }
    })

    // Check for out of stock items
    const outOfStockItems = formattedItems.filter(item => !item.product.in_stock)
    const unavailableItems = formattedItems.filter(item =>
      item.quantity > item.product.stock_quantity
    )

    return NextResponse.json({
      success: true,
      data: {
        items: formattedItems,
        summary: {
          itemCount: formattedItems.length,
          totalQuantity: totalItems,
          subtotalEur: subtotal
        }
      },
      cart: {
        id: `cart-${user.id}`,
        user_id: user.id,
        items: formattedItems,
        summary: {
          total_items: totalItems,
          total_products: formattedItems.length,
          subtotal,
          subtotal_display: subtotal.toFixed(2),
          currency: 'EUR'
        },
        issues: {
          out_of_stock_items: outOfStockItems.map(item => ({
            item_id: item.id,
            product_name: item.product.name,
            message: 'This item is currently out of stock'
          })),
          unavailable_quantities: unavailableItems.map(item => ({
            item_id: item.id,
            product_name: item.product.name,
            requested: item.quantity,
            available: item.product.stock_quantity,
            message: `Only ${item.product.stock_quantity} available`
          }))
        },
        restrictions: {
          age_verification_required: true,
          minimum_age: 18,
          shipping_restrictions: formattedItems.some(item =>
            ['US', 'CA', 'AU'].includes(item.product.category) // This would be based on shipping destination
          )
        }
      }
    })

  } catch (error) {
    console.error('Error fetching cart:', error)

    return NextResponse.json(
      { error: 'Failed to fetch cart' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const user = await getServerUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validation = validateSchema(addToCartSchema, body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.errors },
        { status: 400 }
      )
    }

    const { productId, quantity } = validation.data

    // Add item to cart
    const cartItem = await addToCart(user.id, productId, quantity)

    // Get updated cart items to return full cart state
    const updatedCartItems = await getCartItems(user.id)

    // Calculate new totals
    let subtotal = 0
    let totalItems = 0

    const formattedItems = updatedCartItems.map(item => {
      // Validate and log data integrity issues
      const priceEur = item.wine_products.price_eur
      if (priceEur == null) {
        console.warn('🛒 Product with null price found in cart after add:', {
          productId: item.wine_products.id,
          productName: item.wine_products.name,
          sku: item.wine_products.sku,
          priceEur: priceEur
        })
      }

      // Use null-safe price handling
      const safePriceEur = typeof priceEur === 'number' ? priceEur : 0
      const itemTotal = item.quantity * safePriceEur
      subtotal += itemTotal // Keep as euros
      totalItems += item.quantity

      return {
        id: item.id,
        productId: item.product_id,
        quantity: item.quantity,
        addedAt: item.added_at,
        product: {
          id: item.wine_products.id,
          name: item.wine_products.name,
          sku: item.wine_products.sku,
          priceEur: safePriceEur,
          price_display: safePriceEur.toFixed(2),
          image_url: '/images/default-wine.jpg', // TODO: Add actual image handling
          category: item.wine_products.varietal || 'Wine',
          vintage: item.wine_products.vintage,
          stock_quantity: item.wine_products.stock_quantity,
          in_stock: item.wine_products.stock_quantity > 0
        },
        subtotalEur: itemTotal
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Item added to cart successfully',
      data: {
        items: formattedItems,
        summary: {
          itemCount: formattedItems.length,
          totalQuantity: totalItems,
          subtotalEur: subtotal
        }
      },
      added_item: {
        id: cartItem.id,
        productId: cartItem.product_id,
        quantity: cartItem.quantity
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Error adding to cart:', error)

    // Handle specific error types
    if (error instanceof Error) {
      if (error.message === 'Resource not found') {
        return NextResponse.json(
          { error: 'Product not found' },
          { status: 404 }
        )
      }

      if (error.message.includes('stock')) {
        return NextResponse.json(
          { error: 'Insufficient stock available' },
          { status: 409 }
        )
      }

      if (error.message.includes('duplicate')) {
        return NextResponse.json(
          { error: 'Item already in cart. Use PUT to update quantity.' },
          { status: 409 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Failed to add item to cart' },
      { status: 500 }
    )
  }
}