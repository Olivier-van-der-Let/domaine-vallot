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
      const itemTotal = item.quantity * item.wine_products.price
      subtotal += itemTotal
      totalItems += item.quantity

      return {
        id: item.id,
        product_id: item.product_id,
        quantity: item.quantity,
        added_at: item.created_at,
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
        subtotal_display: (itemTotal / 100).toFixed(2)
      }
    })

    // Check for out of stock items
    const outOfStockItems = formattedItems.filter(item => !item.product.in_stock)
    const unavailableItems = formattedItems.filter(item =>
      item.quantity > item.product.stock_quantity
    )

    return NextResponse.json({
      cart: {
        id: `cart-${user.id}`,
        user_id: user.id,
        items: formattedItems,
        summary: {
          total_items: totalItems,
          total_products: formattedItems.length,
          subtotal,
          subtotal_display: (subtotal / 100).toFixed(2),
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
      const itemTotal = item.quantity * item.wine_products.price
      subtotal += itemTotal
      totalItems += item.quantity

      return {
        id: item.id,
        product_id: item.product_id,
        quantity: item.quantity,
        added_at: item.created_at,
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
          in_stock: item.wine_products.stock_quantity > 0
        },
        subtotal: itemTotal,
        subtotal_display: (itemTotal / 100).toFixed(2)
      }
    })

    return NextResponse.json({
      message: 'Item added to cart successfully',
      added_item: {
        id: cartItem.id,
        product_id: cartItem.product_id,
        quantity: cartItem.quantity
      },
      cart: {
        id: `cart-${user.id}`,
        user_id: user.id,
        items: formattedItems,
        summary: {
          total_items: totalItems,
          total_products: formattedItems.length,
          subtotal,
          subtotal_display: (subtotal / 100).toFixed(2),
          currency: 'EUR'
        }
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