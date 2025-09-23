-- Migration: Create customers table
-- Created: 2025-09-16

-- Create customers table (extends auth.users)
CREATE TABLE customers (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    birth_date DATE,
    preferred_language VARCHAR(2) DEFAULT 'en' CHECK (preferred_language IN ('en', 'fr')),
    marketing_consent BOOLEAN DEFAULT FALSE,
    newsletter_consent BOOLEAN DEFAULT FALSE,
    age_verified BOOLEAN DEFAULT FALSE,
    age_verified_at TIMESTAMP WITH TIME ZONE,
    age_verification_method VARCHAR(20) CHECK (age_verification_method IN ('id_document', 'third_party', 'manual')),
    is_business BOOLEAN DEFAULT FALSE,
    vat_number VARCHAR(20),
    vat_validated BOOLEAN DEFAULT FALSE,
    vat_validated_at TIMESTAMP WITH TIME ZONE,
    company_name VARCHAR(200),
    default_shipping_address_id UUID,
    default_billing_address_id UUID,
    total_orders INTEGER DEFAULT 0 CHECK (total_orders >= 0),
    total_spent_eur DECIMAL(12,2) DEFAULT 0.00 CHECK (total_spent_eur >= 0),
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for customers
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_age_verified ON customers(age_verified);
CREATE INDEX idx_customers_is_business ON customers(is_business);
CREATE INDEX idx_customers_vat_number ON customers(vat_number) WHERE vat_number IS NOT NULL;
CREATE INDEX idx_customers_created_at ON customers(created_at);
CREATE INDEX idx_customers_total_spent ON customers(total_spent_eur DESC);

-- Create trigger for customers updated_at
CREATE TRIGGER trigger_customers_updated_at
    BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to validate age (must be 18+)
CREATE OR REPLACE FUNCTION validate_customer_age()
RETURNS TRIGGER AS $$
BEGIN
    -- Check age if birth_date is provided
    IF NEW.birth_date IS NOT NULL THEN
        IF DATE_PART('year', AGE(NEW.birth_date)) < 18 THEN
            RAISE EXCEPTION 'Customer must be at least 18 years old. Age: %',
                DATE_PART('year', AGE(NEW.birth_date));
        END IF;
    END IF;

    -- If age is verified, ensure birth_date is provided
    IF NEW.age_verified = TRUE AND NEW.birth_date IS NULL THEN
        RAISE EXCEPTION 'Birth date required for age verification';
    END IF;

    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for age validation
CREATE TRIGGER trigger_validate_customer_age
    BEFORE INSERT OR UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION validate_customer_age();

-- Create function to validate VAT number format (basic EU format check)
CREATE OR REPLACE FUNCTION validate_vat_number()
RETURNS TRIGGER AS $$
BEGIN
    -- If VAT number is provided, do basic format validation
    IF NEW.vat_number IS NOT NULL THEN
        -- Must start with 2 letters followed by numbers/letters
        IF NOT NEW.vat_number ~ '^[A-Z]{2}[A-Z0-9]+$' THEN
            RAISE EXCEPTION 'Invalid VAT number format. Must start with 2-letter country code followed by alphanumeric characters: %',
                NEW.vat_number;
        END IF;

        -- If VAT number is provided, customer should be marked as business
        IF NEW.is_business = FALSE THEN
            NEW.is_business = TRUE;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for VAT validation
CREATE TRIGGER trigger_validate_vat_number
    BEFORE INSERT OR UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION validate_vat_number();

-- Create function to automatically create customer profile on auth signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO customers (id, email, preferred_language, created_at)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'preferred_language', 'en'),
        NEW.created_at
    );
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for new user signup
CREATE TRIGGER trigger_handle_new_user
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Create function to update last_login_at on auth
CREATE OR REPLACE FUNCTION update_customer_last_login()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE customers
    SET last_login_at = NOW()
    WHERE id = NEW.id;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for last login update
CREATE TRIGGER trigger_update_customer_last_login
    AFTER UPDATE ON auth.users
    FOR EACH ROW
    WHEN (OLD.last_sign_in_at IS DISTINCT FROM NEW.last_sign_in_at)
    EXECUTE FUNCTION update_customer_last_login();