-- Migration: Fix function volatility for index compatibility
-- Created: 2025-09-20
-- Fixes the immutable function error for index predicates

-- Drop and recreate functions with proper volatility markers

-- Drop trigger first, then function (to handle dependencies)
DROP TRIGGER IF EXISTS trigger_check_certification_expiry ON product_certifications;

-- Drop existing functions first
DROP FUNCTION IF EXISTS get_current_vat_rate(VARCHAR(2), VARCHAR(50));
DROP FUNCTION IF EXISTS calculate_vat(DECIMAL(10,2), VARCHAR(2), BOOLEAN, VARCHAR(20));
DROP FUNCTION IF EXISTS check_certification_expiry();

-- Create function to get VAT rate at specific date (STABLE - deterministic for same inputs)
CREATE OR REPLACE FUNCTION get_vat_rate_at_date(
    p_country_code VARCHAR(2),
    p_date DATE,
    p_product_category VARCHAR(50) DEFAULT 'wine'
)
RETURNS DECIMAL(5,2) AS $$
DECLARE
    vat_rate DECIMAL(5,2);
BEGIN
    SELECT standard_rate
    INTO vat_rate
    FROM vat_rates
    WHERE country_code = UPPER(p_country_code)
    AND product_category = p_product_category
    AND applies_to_wine = TRUE
    AND effective_from <= p_date
    AND (effective_to IS NULL OR effective_to >= p_date)
    ORDER BY effective_from DESC
    LIMIT 1;

    -- If no specific rate found, return 0 (reverse charge for B2B)
    RETURN COALESCE(vat_rate, 0);
END;
$$ language 'plpgsql' STABLE;

-- Create convenience function for current date (VOLATILE - uses CURRENT_DATE)
CREATE OR REPLACE FUNCTION get_current_vat_rate(
    p_country_code VARCHAR(2),
    p_product_category VARCHAR(50) DEFAULT 'wine'
)
RETURNS DECIMAL(5,2) AS $$
BEGIN
    RETURN get_vat_rate_at_date(p_country_code, CURRENT_DATE, p_product_category);
END;
$$ language 'plpgsql' VOLATILE;

-- Create function to calculate VAT amount at specific date (STABLE)
CREATE OR REPLACE FUNCTION calculate_vat_at_date(
    p_net_amount DECIMAL(10,2),
    p_country_code VARCHAR(2),
    p_date DATE,
    p_is_business BOOLEAN DEFAULT FALSE,
    p_vat_number VARCHAR(20) DEFAULT NULL
)
RETURNS TABLE(
    net_amount DECIMAL(10,2),
    vat_rate DECIMAL(5,2),
    vat_amount DECIMAL(10,2),
    gross_amount DECIMAL(10,2),
    reverse_charge BOOLEAN
) AS $$
DECLARE
    current_vat_rate DECIMAL(5,2);
    is_reverse_charge BOOLEAN := FALSE;
BEGIN
    -- B2B with valid VAT number = reverse charge (0% VAT)
    IF p_is_business AND p_vat_number IS NOT NULL AND LENGTH(p_vat_number) > 4 THEN
        is_reverse_charge := TRUE;
        current_vat_rate := 0;
    ELSE
        current_vat_rate := get_vat_rate_at_date(p_country_code, p_date);
    END IF;

    RETURN QUERY SELECT
        p_net_amount,
        current_vat_rate,
        ROUND(p_net_amount * current_vat_rate / 100, 2),
        p_net_amount + ROUND(p_net_amount * current_vat_rate / 100, 2),
        is_reverse_charge;
END;
$$ language 'plpgsql' STABLE;

-- Create convenience function for current date calculation (VOLATILE)
CREATE OR REPLACE FUNCTION calculate_vat(
    p_net_amount DECIMAL(10,2),
    p_country_code VARCHAR(2),
    p_is_business BOOLEAN DEFAULT FALSE,
    p_vat_number VARCHAR(20) DEFAULT NULL
)
RETURNS TABLE(
    net_amount DECIMAL(10,2),
    vat_rate DECIMAL(5,2),
    vat_amount DECIMAL(10,2),
    gross_amount DECIMAL(10,2),
    reverse_charge BOOLEAN
) AS $$
BEGIN
    RETURN QUERY SELECT * FROM calculate_vat_at_date(p_net_amount, p_country_code, CURRENT_DATE, p_is_business, p_vat_number);
END;
$$ language 'plpgsql' VOLATILE;

-- Create function to validate certification expiry (VOLATILE - uses CURRENT_DATE)
CREATE OR REPLACE FUNCTION check_certification_expiry()
RETURNS TRIGGER AS $$
BEGIN
    -- Warning if certification expires within 30 days
    IF NEW.expiry_date <= CURRENT_DATE + INTERVAL '30 days' THEN
        RAISE WARNING 'Certification % for product % expires soon: %',
            NEW.certification_type, NEW.product_id, NEW.expiry_date;
    END IF;

    -- Error if trying to insert expired certification
    IF NEW.expiry_date <= CURRENT_DATE THEN
        RAISE EXCEPTION 'Cannot add expired certification. Expiry date: %', NEW.expiry_date;
    END IF;

    RETURN NEW;
END;
$$ language 'plpgsql' VOLATILE;

-- Recreate the trigger that was dropped with the function
CREATE TRIGGER trigger_check_certification_expiry
    BEFORE INSERT OR UPDATE ON product_certifications
    FOR EACH ROW EXECUTE FUNCTION check_certification_expiry();

-- Add comments for documentation
COMMENT ON FUNCTION get_vat_rate_at_date(VARCHAR(2), DATE, VARCHAR(50)) IS 'Get VAT rate for country at specific date - STABLE for index compatibility';
COMMENT ON FUNCTION get_current_vat_rate(VARCHAR(2), VARCHAR(50)) IS 'Get current VAT rate for country - VOLATILE due to CURRENT_DATE';
COMMENT ON FUNCTION calculate_vat_at_date(DECIMAL(10,2), VARCHAR(2), DATE, BOOLEAN, VARCHAR(20)) IS 'Calculate VAT at specific date - STABLE for index compatibility';
COMMENT ON FUNCTION calculate_vat(DECIMAL(10,2), VARCHAR(2), BOOLEAN, VARCHAR(20)) IS 'Calculate VAT for current date - VOLATILE due to CURRENT_DATE';
COMMENT ON FUNCTION check_certification_expiry() IS 'Validate certification expiry - VOLATILE due to CURRENT_DATE';