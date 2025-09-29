-- Migration: Remove Sendcloud integration columns from orders table
-- Created: 2025-09-29
-- Description: Rollback the Sendcloud integration by removing all related columns and functions

-- Drop triggers first
DROP TRIGGER IF EXISTS trigger_handle_sendcloud_status_change ON orders;
DROP TRIGGER IF EXISTS trigger_update_sendcloud_timestamp ON orders;

-- Drop functions
DROP FUNCTION IF EXISTS handle_sendcloud_status_change();
DROP FUNCTION IF EXISTS update_sendcloud_timestamp();

-- Drop indexes
DROP INDEX IF EXISTS idx_orders_sendcloud_order_id;
DROP INDEX IF EXISTS idx_orders_sendcloud_parcel_id;
DROP INDEX IF EXISTS idx_orders_sendcloud_tracking_number;

-- Remove Sendcloud columns from orders table
ALTER TABLE orders DROP COLUMN IF EXISTS sendcloud_order_id;
ALTER TABLE orders DROP COLUMN IF EXISTS sendcloud_integration_id;
ALTER TABLE orders DROP COLUMN IF EXISTS sendcloud_parcel_id;
ALTER TABLE orders DROP COLUMN IF EXISTS sendcloud_tracking_number;
ALTER TABLE orders DROP COLUMN IF EXISTS sendcloud_tracking_url;
ALTER TABLE orders DROP COLUMN IF EXISTS sendcloud_status;
ALTER TABLE orders DROP COLUMN IF EXISTS sendcloud_carrier;
ALTER TABLE orders DROP COLUMN IF EXISTS sendcloud_label_url;

-- Add a comment to document the removal
COMMENT ON TABLE orders IS 'Orders table - Sendcloud integration removed 2025-09-29';

-- Optionally add a notes column for manual tracking if it doesn't exist
ALTER TABLE orders ADD COLUMN IF NOT EXISTS fulfillment_notes TEXT;
COMMENT ON COLUMN orders.fulfillment_notes IS 'Manual notes for order fulfillment and tracking';

-- Create a simple function to update order status manually
CREATE OR REPLACE FUNCTION update_order_shipping_status(
  order_id_param UUID,
  tracking_number_param VARCHAR(100) DEFAULT NULL,
  carrier_param VARCHAR(50) DEFAULT NULL,
  status_param VARCHAR(50) DEFAULT 'shipped',
  notes_param TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  UPDATE orders
  SET
    status = COALESCE(status_param, status),
    tracking_number = COALESCE(tracking_number_param, tracking_number),
    carrier = COALESCE(carrier_param, carrier),
    fulfillment_notes = COALESCE(notes_param, fulfillment_notes),
    shipped_at = CASE
      WHEN status_param = 'shipped' AND shipped_at IS NULL THEN NOW()
      ELSE shipped_at
    END,
    delivered_at = CASE
      WHEN status_param = 'delivered' AND delivered_at IS NULL THEN NOW()
      ELSE delivered_at
    END,
    updated_at = NOW()
  WHERE id = order_id_param;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_order_shipping_status IS 'Manual function to update order shipping status after Sendcloud removal';