-- Migration: Create cart_items table
-- Created: 2025-09-16

-- Create cart_items table
CREATE TABLE cart_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES wine_products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL CHECK (quantity > 0 AND quantity <= 12),
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Ensure unique product per customer in cart
    UNIQUE(customer_id, product_id)
);

-- Create indexes for cart_items
CREATE INDEX idx_cart_items_customer_id ON cart_items(customer_id);
CREATE INDEX idx_cart_items_product_id ON cart_items(product_id);
CREATE INDEX idx_cart_items_added_at ON cart_items(added_at);

-- Create trigger for cart_items updated_at
CREATE TRIGGER trigger_cart_items_updated_at
    BEFORE UPDATE ON cart_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to validate cart item constraints
CREATE OR REPLACE FUNCTION validate_cart_item()
RETURNS TRIGGER AS $$
DECLARE
    product_record RECORD;
BEGIN
    -- Get product information
    SELECT is_active, stock_quantity, reserved_quantity
    INTO product_record
    FROM wine_products
    WHERE id = NEW.product_id;

    -- Check if product is active
    IF NOT product_record.is_active THEN
        RAISE EXCEPTION 'Cannot add inactive product to cart: %', NEW.product_id;
    END IF;

    -- Check if enough stock is available
    IF NEW.quantity > (product_record.stock_quantity - product_record.reserved_quantity) THEN
        RAISE EXCEPTION 'Insufficient stock. Available: %, Requested: %',
            (product_record.stock_quantity - product_record.reserved_quantity),
            NEW.quantity;
    END IF;

    -- Check if customer is age verified for wine purchases
    IF NOT EXISTS (
        SELECT 1 FROM customers
        WHERE id = NEW.customer_id AND age_verified = TRUE
    ) THEN
        RAISE EXCEPTION 'Customer must complete age verification before adding wine products to cart';
    END IF;

    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for cart item validation
CREATE TRIGGER trigger_validate_cart_item
    BEFORE INSERT OR UPDATE ON cart_items
    FOR EACH ROW EXECUTE FUNCTION validate_cart_item();

-- Create function to clean up old cart items (30+ days)
CREATE OR REPLACE FUNCTION cleanup_old_cart_items()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM cart_items
    WHERE updated_at < NOW() - INTERVAL '30 days';

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ language 'plpgsql';

-- Create function to get cart summary for a customer
CREATE OR REPLACE FUNCTION get_cart_summary(p_customer_id UUID)
RETURNS TABLE(
    item_count INTEGER,
    total_quantity INTEGER,
    subtotal_eur DECIMAL(10,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(ci.id)::INTEGER as item_count,
        COALESCE(SUM(ci.quantity), 0)::INTEGER as total_quantity,
        COALESCE(SUM(ci.quantity * wp.price_eur), 0)::DECIMAL(10,2) as subtotal_eur
    FROM cart_items ci
    JOIN wine_products wp ON ci.product_id = wp.id
    WHERE ci.customer_id = p_customer_id
    AND wp.is_active = TRUE;
END;
$$ language 'plpgsql';

-- Create function to transfer cart to order
CREATE OR REPLACE FUNCTION transfer_cart_to_order(
    p_customer_id UUID,
    p_order_id UUID
)
RETURNS INTEGER AS $$
DECLARE
    cart_item RECORD;
    items_transferred INTEGER := 0;
BEGIN
    -- Process each cart item
    FOR cart_item IN
        SELECT ci.product_id, ci.quantity, wp.price_eur, wp.name
        FROM cart_items ci
        JOIN wine_products wp ON ci.product_id = wp.id
        WHERE ci.customer_id = p_customer_id
        AND wp.is_active = TRUE
        ORDER BY ci.added_at
    LOOP
        -- Create order item (simplified - VAT calculation would be done elsewhere)
        INSERT INTO order_items (
            order_id,
            product_id,
            quantity,
            unit_price_eur,
            vat_rate,
            vat_amount_eur,
            line_total_eur,
            product_snapshot
        ) VALUES (
            p_order_id,
            cart_item.product_id,
            cart_item.quantity,
            cart_item.price_eur,
            0, -- VAT rate would be calculated based on customer location
            0, -- VAT amount would be calculated
            cart_item.quantity * cart_item.price_eur,
            jsonb_build_object('name', cart_item.name, 'price_eur', cart_item.price_eur)
        );

        items_transferred := items_transferred + 1;
    END LOOP;

    -- Clear the cart
    DELETE FROM cart_items WHERE customer_id = p_customer_id;

    RETURN items_transferred;
END;
$$ language 'plpgsql';

-- Create function to update cart item quantity or insert if not exists
CREATE OR REPLACE FUNCTION upsert_cart_item(
    p_customer_id UUID,
    p_product_id UUID,
    p_quantity INTEGER
)
RETURNS cart_items AS $$
DECLARE
    result cart_items;
BEGIN
    -- Try to update existing cart item
    UPDATE cart_items
    SET
        quantity = p_quantity,
        updated_at = NOW()
    WHERE customer_id = p_customer_id
    AND product_id = p_product_id
    RETURNING * INTO result;

    -- If no rows were updated, insert new cart item
    IF NOT FOUND THEN
        INSERT INTO cart_items (customer_id, product_id, quantity)
        VALUES (p_customer_id, p_product_id, p_quantity)
        RETURNING * INTO result;
    END IF;

    RETURN result;
END;
$$ language 'plpgsql';

-- Create view for cart items with product details
CREATE VIEW cart_items_with_products AS
SELECT
    ci.id,
    ci.customer_id,
    ci.product_id,
    ci.quantity,
    ci.added_at,
    ci.updated_at,
    wp.name,
    wp.vintage,
    wp.varietal,
    wp.price_eur,
    wp.stock_quantity,
    wp.reserved_quantity,
    wp.is_active,
    wp.slug_en,
    wp.slug_fr,
    (ci.quantity * wp.price_eur) as line_total_eur,
    CASE
        WHEN (wp.stock_quantity - wp.reserved_quantity) < ci.quantity THEN FALSE
        ELSE TRUE
    END as in_stock,
    -- Get primary product image
    (
        SELECT pi.url
        FROM product_images pi
        WHERE pi.product_id = wp.id
        AND pi.is_primary = TRUE
        LIMIT 1
    ) as primary_image_url
FROM cart_items ci
JOIN wine_products wp ON ci.product_id = wp.id;

-- Create function to validate cart before checkout
CREATE OR REPLACE FUNCTION validate_cart_for_checkout(p_customer_id UUID)
RETURNS TABLE(
    is_valid BOOLEAN,
    error_message TEXT,
    invalid_items JSONB
) AS $$
DECLARE
    invalid_items_array JSONB := '[]'::JSONB;
    item_record RECORD;
    has_errors BOOLEAN := FALSE;
    error_msg TEXT := '';
BEGIN
    -- Check if cart is empty
    IF NOT EXISTS(SELECT 1 FROM cart_items WHERE customer_id = p_customer_id) THEN
        RETURN QUERY SELECT FALSE, 'Cart is empty'::TEXT, '[]'::JSONB;
        RETURN;
    END IF;

    -- Check each cart item for issues
    FOR item_record IN
        SELECT ci.id, ci.product_id, ci.quantity, wp.name, wp.is_active,
               wp.stock_quantity, wp.reserved_quantity
        FROM cart_items ci
        JOIN wine_products wp ON ci.product_id = wp.id
        WHERE ci.customer_id = p_customer_id
    LOOP
        -- Check if product is still active
        IF NOT item_record.is_active THEN
            has_errors := TRUE;
            invalid_items_array := invalid_items_array || jsonb_build_object(
                'id', item_record.id,
                'product_id', item_record.product_id,
                'name', item_record.name,
                'error', 'Product is no longer available'
            );
        END IF;

        -- Check stock availability
        IF item_record.quantity > (item_record.stock_quantity - item_record.reserved_quantity) THEN
            has_errors := TRUE;
            invalid_items_array := invalid_items_array || jsonb_build_object(
                'id', item_record.id,
                'product_id', item_record.product_id,
                'name', item_record.name,
                'error', 'Insufficient stock available',
                'available', (item_record.stock_quantity - item_record.reserved_quantity),
                'requested', item_record.quantity
            );
        END IF;
    END LOOP;

    -- Return results
    IF has_errors THEN
        error_msg := 'Cart contains invalid items';
    END IF;

    RETURN QUERY SELECT NOT has_errors, error_msg, invalid_items_array;
END;
$$ language 'plpgsql';