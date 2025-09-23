-- Migration: Create orders and order_items tables
-- Created: 2025-09-16

-- Create orders table
CREATE TABLE orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_number VARCHAR(20) UNIQUE NOT NULL,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'
    )),
    currency VARCHAR(3) DEFAULT 'EUR' NOT NULL CHECK (currency = 'EUR'),
    subtotal_eur DECIMAL(10,2) NOT NULL CHECK (subtotal_eur >= 0),
    vat_rate DECIMAL(5,2) NOT NULL CHECK (vat_rate >= 0 AND vat_rate <= 30),
    vat_amount_eur DECIMAL(10,2) NOT NULL CHECK (vat_amount_eur >= 0),
    shipping_cost_eur DECIMAL(8,2) DEFAULT 0.00 CHECK (shipping_cost_eur >= 0),
    total_eur DECIMAL(10,2) NOT NULL CHECK (total_eur >= 0),
    payment_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (payment_status IN (
        'pending', 'paid', 'failed', 'refunded', 'partially_refunded'
    )),
    payment_method VARCHAR(50),
    mollie_payment_id VARCHAR(100),
    shipping_address JSONB NOT NULL,
    billing_address JSONB NOT NULL,
    shipping_method VARCHAR(100) NOT NULL,
    tracking_number VARCHAR(100),
    estimated_delivery DATE,
    shipped_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    fulfillment_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create order_items table
CREATE TABLE order_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES wine_products(id) ON DELETE RESTRICT,
    product_snapshot JSONB NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price_eur DECIMAL(8,2) NOT NULL CHECK (unit_price_eur >= 0),
    vat_rate DECIMAL(5,2) NOT NULL CHECK (vat_rate >= 0 AND vat_rate <= 30),
    vat_amount_eur DECIMAL(8,2) NOT NULL CHECK (vat_amount_eur >= 0),
    line_total_eur DECIMAL(10,2) NOT NULL CHECK (line_total_eur >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for orders
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);
CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_orders_mollie_payment_id ON orders(mollie_payment_id) WHERE mollie_payment_id IS NOT NULL;
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_orders_customer_created_at ON orders(customer_id, created_at DESC);

-- Create indexes for order_items
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);

-- Create trigger for orders updated_at
CREATE TRIGGER trigger_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to generate order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
    date_part TEXT;
    random_part TEXT;
    order_number TEXT;
    counter INTEGER := 0;
BEGIN
    -- Generate date part (YYYYMMDD)
    date_part := TO_CHAR(CURRENT_DATE, 'YYYYMMDD');

    -- Try to generate unique order number
    LOOP
        -- Generate random 4-digit number
        random_part := LPAD(FLOOR(RANDOM() * 9999 + 1)::TEXT, 4, '0');
        order_number := 'DV-' || date_part || '-' || random_part;

        -- Check if it exists
        IF NOT EXISTS(SELECT 1 FROM orders WHERE order_number = order_number) THEN
            RETURN order_number;
        END IF;

        counter := counter + 1;
        IF counter > 100 THEN
            RAISE EXCEPTION 'Unable to generate unique order number after 100 attempts';
        END IF;
    END LOOP;
END;
$$ language 'plpgsql';

-- Create function to set order number if not provided
CREATE OR REPLACE FUNCTION set_order_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
        NEW.order_number := generate_order_number();
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for order number generation
CREATE TRIGGER trigger_set_order_number
    BEFORE INSERT ON orders
    FOR EACH ROW EXECUTE FUNCTION set_order_number();

-- Create function to validate order totals
CREATE OR REPLACE FUNCTION validate_order_totals()
RETURNS TRIGGER AS $$
BEGIN
    -- Validate that total = subtotal + VAT + shipping
    IF ABS(NEW.total_eur - (NEW.subtotal_eur + NEW.vat_amount_eur + NEW.shipping_cost_eur)) > 0.01 THEN
        RAISE EXCEPTION 'Order total mismatch. Total: %, Expected: % (subtotal: % + VAT: % + shipping: %)',
            NEW.total_eur,
            NEW.subtotal_eur + NEW.vat_amount_eur + NEW.shipping_cost_eur,
            NEW.subtotal_eur,
            NEW.vat_amount_eur,
            NEW.shipping_cost_eur;
    END IF;

    -- Validate that VAT amount matches rate
    IF ABS(NEW.vat_amount_eur - (NEW.subtotal_eur * NEW.vat_rate / 100)) > 0.01 THEN
        RAISE EXCEPTION 'VAT amount mismatch. VAT Amount: %, Expected: % (subtotal: % * rate: %)',
            NEW.vat_amount_eur,
            NEW.subtotal_eur * NEW.vat_rate / 100,
            NEW.subtotal_eur,
            NEW.vat_rate;
    END IF;

    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for order total validation
CREATE TRIGGER trigger_validate_order_totals
    BEFORE INSERT OR UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION validate_order_totals();

-- Create function to validate order item totals
CREATE OR REPLACE FUNCTION validate_order_item_totals()
RETURNS TRIGGER AS $$
BEGIN
    -- Validate that line total = (unit price * quantity) + VAT
    IF ABS(NEW.line_total_eur - ((NEW.unit_price_eur * NEW.quantity) + NEW.vat_amount_eur)) > 0.01 THEN
        RAISE EXCEPTION 'Order item total mismatch. Line Total: %, Expected: %',
            NEW.line_total_eur,
            (NEW.unit_price_eur * NEW.quantity) + NEW.vat_amount_eur;
    END IF;

    -- Validate VAT amount
    IF ABS(NEW.vat_amount_eur - ((NEW.unit_price_eur * NEW.quantity) * NEW.vat_rate / 100)) > 0.01 THEN
        RAISE EXCEPTION 'Order item VAT mismatch. VAT: %, Expected: %',
            NEW.vat_amount_eur,
            (NEW.unit_price_eur * NEW.quantity) * NEW.vat_rate / 100;
    END IF;

    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for order item validation
CREATE TRIGGER trigger_validate_order_item_totals
    BEFORE INSERT OR UPDATE ON order_items
    FOR EACH ROW EXECUTE FUNCTION validate_order_item_totals();

-- Create function to update customer order statistics
CREATE OR REPLACE FUNCTION update_customer_order_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Update customer statistics when order is paid
    IF NEW.payment_status = 'paid' AND (OLD IS NULL OR OLD.payment_status != 'paid') THEN
        UPDATE customers
        SET
            total_orders = total_orders + 1,
            total_spent_eur = total_spent_eur + NEW.total_eur
        WHERE id = NEW.customer_id;
    END IF;

    -- Revert statistics if order is refunded
    IF NEW.payment_status IN ('refunded', 'cancelled') AND OLD.payment_status = 'paid' THEN
        UPDATE customers
        SET
            total_orders = GREATEST(total_orders - 1, 0),
            total_spent_eur = GREATEST(total_spent_eur - NEW.total_eur, 0)
        WHERE id = NEW.customer_id;
    END IF;

    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for customer statistics update
CREATE TRIGGER trigger_update_customer_order_stats
    AFTER INSERT OR UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_customer_order_stats();

-- Create function to manage product inventory
CREATE OR REPLACE FUNCTION manage_product_inventory()
RETURNS TRIGGER AS $$
DECLARE
    item RECORD;
BEGIN
    -- When order is confirmed, reserve inventory
    IF NEW.status = 'confirmed' AND (OLD IS NULL OR OLD.status != 'confirmed') THEN
        FOR item IN SELECT product_id, quantity FROM order_items WHERE order_id = NEW.id
        LOOP
            UPDATE wine_products
            SET reserved_quantity = reserved_quantity + item.quantity
            WHERE id = item.product_id;

            -- Check if we have enough stock
            IF NOT FOUND OR EXISTS(
                SELECT 1 FROM wine_products
                WHERE id = item.product_id
                AND reserved_quantity > stock_quantity
            ) THEN
                RAISE EXCEPTION 'Insufficient stock for product %', item.product_id;
            END IF;
        END LOOP;
    END IF;

    -- When order is shipped, reduce actual stock
    IF NEW.status = 'shipped' AND OLD.status = 'confirmed' THEN
        FOR item IN SELECT product_id, quantity FROM order_items WHERE order_id = NEW.id
        LOOP
            UPDATE wine_products
            SET
                stock_quantity = stock_quantity - item.quantity,
                reserved_quantity = reserved_quantity - item.quantity
            WHERE id = item.product_id;
        END LOOP;
    END IF;

    -- When order is cancelled, release reserved inventory
    IF NEW.status = 'cancelled' AND OLD.status IN ('confirmed', 'processing') THEN
        FOR item IN SELECT product_id, quantity FROM order_items WHERE order_id = NEW.id
        LOOP
            UPDATE wine_products
            SET reserved_quantity = GREATEST(reserved_quantity - item.quantity, 0)
            WHERE id = item.product_id;
        END LOOP;
    END IF;

    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for inventory management
CREATE TRIGGER trigger_manage_product_inventory
    AFTER INSERT OR UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION manage_product_inventory();

-- Create function to set timestamps for order status changes
CREATE OR REPLACE FUNCTION set_order_timestamps()
RETURNS TRIGGER AS $$
BEGIN
    -- Set shipped_at when status changes to shipped
    IF NEW.status = 'shipped' AND (OLD IS NULL OR OLD.status != 'shipped') THEN
        NEW.shipped_at = NOW();
    END IF;

    -- Set delivered_at when status changes to delivered
    IF NEW.status = 'delivered' AND (OLD IS NULL OR OLD.status != 'delivered') THEN
        NEW.delivered_at = NOW();
    END IF;

    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for order timestamps
CREATE TRIGGER trigger_set_order_timestamps
    BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION set_order_timestamps();