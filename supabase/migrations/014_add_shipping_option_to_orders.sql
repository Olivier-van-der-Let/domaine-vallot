-- Migration: Add shipping_option JSONB column to orders table
-- This allows storing detailed shipping option selection (code, name, carrier, etc.)
-- while maintaining the existing shipping_method VARCHAR for backward compatibility

-- Add shipping_option column as JSONB to store structured shipping selection data
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS shipping_option JSONB;

COMMENT ON COLUMN public.orders.shipping_option IS 'Structured shipping option data including code, name, carrier, price, and delivery details';

-- Create index for shipping option queries
CREATE INDEX IF NOT EXISTS idx_orders_shipping_option_code
ON public.orders USING GIN ((shipping_option -> 'code'));

COMMENT ON INDEX idx_orders_shipping_option_code IS 'Index for querying orders by shipping option code';

-- Update existing orders to have a basic shipping_option based on shipping_method
-- This ensures backward compatibility for orders created before this migration
UPDATE public.orders
SET shipping_option = jsonb_build_object(
  'code', CASE
    WHEN shipping_method ILIKE '%express%' THEN 'express'
    WHEN shipping_method ILIKE '%standard%' THEN 'standard'
    ELSE 'standard'
  END,
  'name', shipping_method
)
WHERE shipping_option IS NULL;

-- Make shipping_option required for new orders (NOT NULL constraint)
-- We do this after backfilling existing records
ALTER TABLE public.orders
ALTER COLUMN shipping_option SET NOT NULL;