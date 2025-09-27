-- Migration: Add Sendcloud integration columns to orders table
-- Created: 2025-09-27

-- Add Sendcloud-related columns to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS sendcloud_order_id VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS sendcloud_integration_id INTEGER;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS sendcloud_parcel_id INTEGER;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS sendcloud_tracking_number VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS sendcloud_tracking_url TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS sendcloud_status VARCHAR(50);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS sendcloud_carrier VARCHAR(50);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS sendcloud_label_url TEXT;

-- Create indexes for Sendcloud columns
CREATE INDEX IF NOT EXISTS idx_orders_sendcloud_order_id ON orders(sendcloud_order_id) WHERE sendcloud_order_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_sendcloud_parcel_id ON orders(sendcloud_parcel_id) WHERE sendcloud_parcel_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_sendcloud_tracking_number ON orders(sendcloud_tracking_number) WHERE sendcloud_tracking_number IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN orders.sendcloud_order_id IS 'Sendcloud order identifier for API integration';
COMMENT ON COLUMN orders.sendcloud_integration_id IS 'Sendcloud integration ID linking to Sendcloud account';
COMMENT ON COLUMN orders.sendcloud_parcel_id IS 'Sendcloud parcel ID for tracking shipments';
COMMENT ON COLUMN orders.sendcloud_tracking_number IS 'Carrier tracking number provided by Sendcloud';
COMMENT ON COLUMN orders.sendcloud_tracking_url IS 'Public tracking URL for customers';
COMMENT ON COLUMN orders.sendcloud_status IS 'Current Sendcloud shipment status';
COMMENT ON COLUMN orders.sendcloud_carrier IS 'Shipping carrier (DHL, DPD, etc.)';
COMMENT ON COLUMN orders.sendcloud_label_url IS 'URL to download shipping label PDF';

-- Update the updated_at timestamp when Sendcloud fields change
CREATE OR REPLACE FUNCTION update_sendcloud_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    -- Only update timestamp if Sendcloud-related fields changed
    IF (
        OLD.sendcloud_order_id IS DISTINCT FROM NEW.sendcloud_order_id OR
        OLD.sendcloud_parcel_id IS DISTINCT FROM NEW.sendcloud_parcel_id OR
        OLD.sendcloud_tracking_number IS DISTINCT FROM NEW.sendcloud_tracking_number OR
        OLD.sendcloud_status IS DISTINCT FROM NEW.sendcloud_status
    ) THEN
        NEW.updated_at = NOW();
    END IF;

    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for Sendcloud timestamp updates
CREATE TRIGGER trigger_update_sendcloud_timestamp
    BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_sendcloud_timestamp();

-- Create function to automatically set shipped_at when Sendcloud status indicates shipped
CREATE OR REPLACE FUNCTION handle_sendcloud_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Set shipped_at when Sendcloud status indicates the package has been shipped
    IF NEW.sendcloud_status IN ('announced', 'en_route_to_sorting_center', 'delivered_at_sorting_center', 'sorted', 'en_route')
       AND (OLD.sendcloud_status IS NULL OR OLD.sendcloud_status NOT IN ('announced', 'en_route_to_sorting_center', 'delivered_at_sorting_center', 'sorted', 'en_route'))
       AND NEW.shipped_at IS NULL THEN
        NEW.shipped_at = NOW();
        NEW.status = 'shipped';
    END IF;

    -- Set delivered_at when Sendcloud status indicates delivery
    IF NEW.sendcloud_status = 'delivered'
       AND (OLD.sendcloud_status IS NULL OR OLD.sendcloud_status != 'delivered')
       AND NEW.delivered_at IS NULL THEN
        NEW.delivered_at = NOW();
        NEW.status = 'delivered';
    END IF;

    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for Sendcloud status handling
CREATE TRIGGER trigger_handle_sendcloud_status_change
    BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION handle_sendcloud_status_change();