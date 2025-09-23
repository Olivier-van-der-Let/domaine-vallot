-- Migration: Create customer_addresses table
-- Created: 2025-09-16

-- Create customer_addresses table
CREATE TABLE customer_addresses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    type VARCHAR(10) NOT NULL CHECK (type IN ('shipping', 'billing', 'both')),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    company VARCHAR(200),
    address_line1 VARCHAR(200) NOT NULL,
    address_line2 VARCHAR(200),
    city VARCHAR(100) NOT NULL,
    state_province VARCHAR(100),
    postal_code VARCHAR(20) NOT NULL,
    country_code VARCHAR(2) NOT NULL CHECK (country_code ~ '^[A-Z]{2}$'),
    phone VARCHAR(20),
    delivery_instructions TEXT,
    is_default_shipping BOOLEAN DEFAULT FALSE,
    is_default_billing BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for customer_addresses
CREATE INDEX idx_customer_addresses_customer_id ON customer_addresses(customer_id);
CREATE INDEX idx_customer_addresses_type ON customer_addresses(type);
CREATE INDEX idx_customer_addresses_country ON customer_addresses(country_code);
CREATE INDEX idx_customer_addresses_default_shipping ON customer_addresses(customer_id, is_default_shipping) WHERE is_default_shipping = TRUE;
CREATE INDEX idx_customer_addresses_default_billing ON customer_addresses(customer_id, is_default_billing) WHERE is_default_billing = TRUE;

-- Create trigger for customer_addresses updated_at
CREATE TRIGGER trigger_customer_addresses_updated_at
    BEFORE UPDATE ON customer_addresses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to validate EU country codes
CREATE OR REPLACE FUNCTION validate_eu_country()
RETURNS TRIGGER AS $$
DECLARE
    eu_countries TEXT[] := ARRAY[
        'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
        'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
        'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE'
    ];
BEGIN
    -- Validate that country is in EU
    IF NOT (NEW.country_code = ANY(eu_countries)) THEN
        RAISE EXCEPTION 'Only EU countries are supported for shipping. Country code: %', NEW.country_code;
    END IF;

    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for EU country validation
CREATE TRIGGER trigger_validate_eu_country
    BEFORE INSERT OR UPDATE ON customer_addresses
    FOR EACH ROW EXECUTE FUNCTION validate_eu_country();

-- Create function to ensure only one default address per type per customer
CREATE OR REPLACE FUNCTION enforce_single_default_address()
RETURNS TRIGGER AS $$
BEGIN
    -- If setting as default shipping, unset other default shipping addresses
    IF NEW.is_default_shipping = TRUE THEN
        UPDATE customer_addresses
        SET is_default_shipping = FALSE
        WHERE customer_id = NEW.customer_id
        AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::UUID)
        AND is_default_shipping = TRUE;
    END IF;

    -- If setting as default billing, unset other default billing addresses
    IF NEW.is_default_billing = TRUE THEN
        UPDATE customer_addresses
        SET is_default_billing = FALSE
        WHERE customer_id = NEW.customer_id
        AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::UUID)
        AND is_default_billing = TRUE;
    END IF;

    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for single default address enforcement
CREATE TRIGGER trigger_enforce_single_default_address
    BEFORE INSERT OR UPDATE ON customer_addresses
    FOR EACH ROW EXECUTE FUNCTION enforce_single_default_address();

-- Create function to update customer default address references
CREATE OR REPLACE FUNCTION update_customer_default_addresses()
RETURNS TRIGGER AS $$
BEGIN
    -- Update customer's default_shipping_address_id
    IF NEW.is_default_shipping = TRUE THEN
        UPDATE customers
        SET default_shipping_address_id = NEW.id
        WHERE id = NEW.customer_id;
    END IF;

    -- Update customer's default_billing_address_id
    IF NEW.is_default_billing = TRUE THEN
        UPDATE customers
        SET default_billing_address_id = NEW.id
        WHERE id = NEW.customer_id;
    END IF;

    -- If this address is being deleted and was default, clear the reference
    IF TG_OP = 'DELETE' THEN
        IF OLD.is_default_shipping = TRUE THEN
            UPDATE customers
            SET default_shipping_address_id = NULL
            WHERE id = OLD.customer_id;
        END IF;

        IF OLD.is_default_billing = TRUE THEN
            UPDATE customers
            SET default_billing_address_id = NULL
            WHERE id = OLD.customer_id;
        END IF;

        RETURN OLD;
    END IF;

    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updating customer default address references
CREATE TRIGGER trigger_update_customer_default_addresses_insert_update
    AFTER INSERT OR UPDATE ON customer_addresses
    FOR EACH ROW EXECUTE FUNCTION update_customer_default_addresses();

CREATE TRIGGER trigger_update_customer_default_addresses_delete
    AFTER DELETE ON customer_addresses
    FOR EACH ROW EXECUTE FUNCTION update_customer_default_addresses();

-- Add foreign key constraints to customers table for default addresses
ALTER TABLE customers
ADD CONSTRAINT fk_customers_default_shipping_address
FOREIGN KEY (default_shipping_address_id) REFERENCES customer_addresses(id) ON DELETE SET NULL;

ALTER TABLE customers
ADD CONSTRAINT fk_customers_default_billing_address
FOREIGN KEY (default_billing_address_id) REFERENCES customer_addresses(id) ON DELETE SET NULL;

-- Create function to validate postal codes by country (basic validation)
CREATE OR REPLACE FUNCTION validate_postal_code()
RETURNS TRIGGER AS $$
BEGIN
    -- Basic postal code validation for major EU countries
    CASE NEW.country_code
        WHEN 'FR' THEN
            IF NEW.postal_code !~ '^\d{5}$' THEN
                RAISE EXCEPTION 'Invalid French postal code format: %', NEW.postal_code;
            END IF;
        WHEN 'DE' THEN
            IF NEW.postal_code !~ '^\d{5}$' THEN
                RAISE EXCEPTION 'Invalid German postal code format: %', NEW.postal_code;
            END IF;
        WHEN 'ES' THEN
            IF NEW.postal_code !~ '^\d{5}$' THEN
                RAISE EXCEPTION 'Invalid Spanish postal code format: %', NEW.postal_code;
            END IF;
        WHEN 'IT' THEN
            IF NEW.postal_code !~ '^\d{5}$' THEN
                RAISE EXCEPTION 'Invalid Italian postal code format: %', NEW.postal_code;
            END IF;
        WHEN 'NL' THEN
            IF NEW.postal_code !~ '^\d{4}[A-Z]{2}$' THEN
                RAISE EXCEPTION 'Invalid Dutch postal code format: %', NEW.postal_code;
            END IF;
        WHEN 'BE' THEN
            IF NEW.postal_code !~ '^\d{4}$' THEN
                RAISE EXCEPTION 'Invalid Belgian postal code format: %', NEW.postal_code;
            END IF;
        -- Add more countries as needed
        ELSE
            -- For other EU countries, just ensure it's not empty and reasonable length
            IF LENGTH(NEW.postal_code) < 3 OR LENGTH(NEW.postal_code) > 10 THEN
                RAISE EXCEPTION 'Invalid postal code length for country %: %', NEW.country_code, NEW.postal_code;
            END IF;
    END CASE;

    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for postal code validation
CREATE TRIGGER trigger_validate_postal_code
    BEFORE INSERT OR UPDATE ON customer_addresses
    FOR EACH ROW EXECUTE FUNCTION validate_postal_code();