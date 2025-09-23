import { NextRequest, NextResponse } from 'next/server'
import { getServerUser, updateCartItem, removeFromCart, getCartItems } from '@/lib/supabase/server'
import { updateCartItemSchema, validateSchema } from '@/lib/validators/schemas'

export async function PUT(
  request: NextRequest,
  { params }: { params: { itemId: string } }
) {
  try {
    // Get authenticated user
    const user = await getServerUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { itemId } = params

    // Validate itemId format (UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(itemId)) {
      return NextResponse.json(
        { error: 'Invalid cart item ID format' },
        { status: 400 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validation = validateSchema(updateCartItemSchema, body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.errors },
        { status: 400 }
      )
    }

    const { quantity } = validation.data

    // If quantity is 0, remove the item instead
    if (quantity === 0) {
      await removeFromCart(user.id, itemId)

      // Get updated cart
      const updatedCartItems = await getCartItems(user.id)
      const cartSummary = calculateCartSummary(updatedCartItems)

      return NextResponse.json({
        message: 'Item removed from cart',
        cart: {
          id: `cart-${user.id}`,
          user_id: user.id,
          items: formatCartItems(updatedCartItems),
          summary: cartSummary
        }
      })
    }

    // Update cart item quantity
    const updatedItem = await updateCartItem(user.id, itemId, quantity)

    // Get updated cart items
    const updatedCartItems = await getCartItems(user.id)
    const cartSummary = calculateCartSummary(updatedCartItems)

    return NextResponse.json({
      message: 'Cart item updated successfully',
      updated_item: {
        id: updatedItem.id,
        product_id: updatedItem.product_id,
        quantity: updatedItem.quantity
      },
      cart: {
        id: `cart-${user.id}`,
        user_id: user.id,
        items: formatCartItems(updatedCartItems),
        summary: cartSummary
      }
    })

  } catch (error) {
    console.error('Error updating cart item:', error)

    // Handle specific error types
    if (error instanceof Error) {
      if (error.message === 'Resource not found') {
        return NextResponse.json(
          { error: 'Cart item not found' },
          { status: 404 }
        )
      }

      if (error.message.includes('stock')) {
        return NextResponse.json(
          { error: 'Insufficient stock available' },
          { status: 409 }
        )
      }

      if (error.message === 'Access denied') {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Failed to update cart item' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { itemId: string } }
) {
  try {
    // Get authenticated user
    const user = await getServerUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { itemId } = params

    // Validate itemId format (UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(itemId)) {
      return NextResponse.json(
        { error: 'Invalid cart item ID format' },
        { status: 400 }
      )
    }

    // Remove item from cart
    await removeFromCart(user.id, itemId)

    // Get updated cart items
    const updatedCartItems = await getCartItems(user.id)
    const cartSummary = calculateCartSummary(updatedCartItems)

    return NextResponse.json({
      message: 'Item removed from cart successfully',
      removed_item_id: itemId,
      cart: {
        id: `cart-${user.id}`,
        user_id: user.id,
        items: formatCartItems(updatedCartItems),
        summary: cartSummary
      }
    })

  } catch (error) {
    console.error('Error removing cart item:', error)

    // Handle specific error types
    if (error instanceof Error) {
      if (error.message === 'Resource not found') {
        return NextResponse.json(
          { error: 'Cart item not found' },
          { status: 404 }
        )
      }

      if (error.message === 'Access denied') {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Failed to remove cart item' },
      { status: 500 }
    )
  }
}

// Helper functions
function formatCartItems(cartItems: any[]) {
  return cartItems.map(item => {
    const itemTotal = item.quantity * item.wine_products.price

    return {
      id: item.id,
      product_id: item.product_id,
      quantity: item.quantity,
      added_at: item.created_at,
      updated_at: item.updated_at,
      product: {
        id: item.wine_products.id,
        name: item.wine_products.name,
        sku: item.wine_products.sku,
        price: item.wine_products.price,
        price_display: (item.wine_products.price / 100).toFixed(2),
        image_url: item.wine_products.image_url || '/images/default-wine.jpg',
        category: item.wine_products.category,
        vintage: item.wine_products.vintage,
        stock_quantity: item.wine_products.stock_quantity,
        in_stock: item.wine_products.stock_quantity > 0,
        alcohol_content: item.wine_products.alcohol_content,
        volume: item.wine_products.volume || 750
      },
      subtotal: itemTotal,
      subtotal_display: (itemTotal / 100).toFixed(2),

      // Item-specific warnings
      warnings: [
        ...(item.quantity > item.wine_products.stock_quantity ? [{
          type: 'insufficient_stock',
          message: `Only ${item.wine_products.stock_quantity} available`,
          available: item.wine_products.stock_quantity
        }] : []),
        ...(!item.wine_products.stock_quantity ? [{
          type: 'out_of_stock',
          message: 'This item is currently out of stock'
        }] : []),
        ...(!item.wine_products.is_active ? [{
          type: 'unavailable',
          message: 'This item is no longer available'
        }] : [])
      ]
    }
  })
}

function calculateCartSummary(cartItems: any[]) {
  let subtotal = 0
  let totalItems = 0
  let totalBottles = 0

  cartItems.forEach(item => {
    const itemTotal = item.quantity * item.wine_products.price
    subtotal += itemTotal
    totalItems += item.quantity
    totalBottles += item.quantity // Assuming each item is one bottle
  })

  // Calculate estimated shipping weight (bottles + packaging)
  const estimatedWeight = (totalBottles * 750) + Math.max(200, totalBottles * 50) // grams

  return {
    total_items: totalItems,
    total_bottles: totalBottles,
    total_products: cartItems.length,
    subtotal,
    subtotal_display: (subtotal / 100).toFixed(2),
    currency: 'EUR',
    estimated_weight: estimatedWeight,

    // Cart-level validations
    validations: {
      has_items: cartItems.length > 0,
      all_in_stock: cartItems.every(item =>
        item.wine_products.stock_quantity >= item.quantity
      ),
      all_available: cartItems.every(item =>
        item.wine_products.is_active
      ),
      minimum_order_met: subtotal >= 1000, // €10 minimum order
      maximum_bottles_limit: totalBottles <= 100 // 100 bottle limit for shipping
    },

    // Age verification required for wine
    age_verification_required: cartItems.length > 0,

    // Shipping eligibility
    shipping_eligible: cartItems.length > 0 && totalBottles <= 100
  }
}