-- Create wine_products table with product images
-- Migration: 001_wine_products.sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE image_type AS ENUM ('bottle', 'label', 'vineyard', 'winemaker');

-- Create wine_products table
CREATE TABLE wine_products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sku VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    vintage INTEGER,
    varietal VARCHAR(100) NOT NULL,
    region VARCHAR(100),
    alcohol_content DECIMAL(4,2),
    volume_ml INTEGER DEFAULT 750,
    price_eur DECIMAL(10,2) NOT NULL,
    cost_eur DECIMAL(10,2),
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    reserved_quantity INTEGER NOT NULL DEFAULT 0,
    reorder_level INTEGER DEFAULT 10,
    weight_grams INTEGER NOT NULL,
    description_en TEXT,
    description_fr TEXT,
    tasting_notes_en TEXT,
    tasting_notes_fr TEXT,
    food_pairing_en TEXT,
    food_pairing_fr TEXT,
    production_notes_en TEXT,
    production_notes_fr TEXT,
    allergens TEXT[], -- Array of allergen strings
    organic_certified BOOLEAN DEFAULT FALSE,
    biodynamic_certified BOOLEAN DEFAULT FALSE,
    vegan_friendly BOOLEAN DEFAULT FALSE,
    google_product_category VARCHAR(100),
    meta_product_category VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    featured BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0,
    seo_title_en VARCHAR(255),
    seo_title_fr VARCHAR(255),
    seo_description_en TEXT,
    seo_description_fr TEXT,
    slug_en VARCHAR(255) NOT NULL UNIQUE,
    slug_fr VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID,
    updated_by UUID,

    -- Constraints
    CONSTRAINT wine_products_name_length CHECK (LENGTH(name) >= 1 AND LENGTH(name) <= 200),
    CONSTRAINT wine_products_vintage_range CHECK (vintage IS NULL OR (vintage >= 1800 AND vintage <= EXTRACT(YEAR FROM NOW()) + 1)),
    CONSTRAINT wine_products_alcohol_range CHECK (alcohol_content IS NULL OR (alcohol_content >= 0 AND alcohol_content <= 20)),
    CONSTRAINT wine_products_price_positive CHECK (price_eur > 0),
    CONSTRAINT wine_products_stock_nonnegative CHECK (stock_quantity >= 0),
    CONSTRAINT wine_products_reserved_nonnegative CHECK (reserved_quantity >= 0),
    CONSTRAINT wine_products_weight_positive CHECK (weight_grams > 0),
    CONSTRAINT wine_products_sort_order_nonnegative CHECK (sort_order >= 0)
);

-- Create product_images table
CREATE TABLE product_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES wine_products(id) ON DELETE CASCADE,
    url VARCHAR(500) NOT NULL,
    alt_text_en VARCHAR(255),
    alt_text_fr VARCHAR(255),
    display_order INTEGER NOT NULL DEFAULT 1,
    image_type image_type DEFAULT 'bottle',
    width INTEGER,
    height INTEGER,
    file_size INTEGER,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CONSTRAINT product_images_display_order_positive CHECK (display_order > 0),
    CONSTRAINT product_images_dimensions_positive CHECK (
        (width IS NULL OR width > 0) AND
        (height IS NULL OR height > 0)
    ),
    CONSTRAINT product_images_file_size_positive CHECK (file_size IS NULL OR file_size > 0)
);

-- Create indexes for wine_products
CREATE INDEX idx_wine_products_slug_en ON wine_products(slug_en);
CREATE INDEX idx_wine_products_slug_fr ON wine_products(slug_fr);
CREATE INDEX idx_wine_products_active_featured ON wine_products(is_active, featured);
CREATE INDEX idx_wine_products_sku ON wine_products(sku);
CREATE INDEX idx_wine_products_varietal ON wine_products(varietal);
CREATE INDEX idx_wine_products_vintage ON wine_products(vintage);
CREATE INDEX idx_wine_products_sort_order ON wine_products(sort_order);

-- Create indexes for product_images
CREATE INDEX idx_product_images_product_id ON product_images(product_id);
CREATE INDEX idx_product_images_display_order ON product_images(product_id, display_order);
CREATE INDEX idx_product_images_primary ON product_images(product_id, is_primary);

-- Create unique constraint for one primary image per product
CREATE UNIQUE INDEX idx_product_images_one_primary
ON product_images(product_id)
WHERE is_primary = TRUE;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_wine_products_updated_at
    BEFORE UPDATE ON wine_products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE wine_products IS 'Wine products available for purchase';
COMMENT ON TABLE product_images IS 'Images associated with wine products';
COMMENT ON COLUMN wine_products.sku IS 'Stock keeping unit for inventory management';
COMMENT ON COLUMN wine_products.reserved_quantity IS 'Items in pending orders not yet confirmed';
COMMENT ON COLUMN wine_products.alcohol_content IS 'Alcohol percentage required for EU labeling';
COMMENT ON COLUMN wine_products.allergens IS 'Array of allergen information (sulfites, etc.)';
COMMENT ON COLUMN product_images.display_order IS 'Image ordering where 1 = primary display image';