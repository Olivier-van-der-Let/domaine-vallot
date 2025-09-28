-- Migration: Fix ambiguous column reference in generate_order_number function
-- Created: 2025-09-28
-- Fixes PostgreSQL error 42702: column reference "order_number" is ambiguous

-- Drop and recreate the function with proper column qualification
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

        -- Check if it exists (qualify column to avoid ambiguity)
        -- FIXED: orders.order_number distinguishes table column from variable
        IF NOT EXISTS(SELECT 1 FROM orders WHERE orders.order_number = order_number) THEN
            RETURN order_number;
        END IF;

        counter := counter + 1;
        IF counter > 100 THEN
            RAISE EXCEPTION 'Unable to generate unique order number after 100 attempts';
        END IF;
    END LOOP;
END;
$$ language 'plpgsql';