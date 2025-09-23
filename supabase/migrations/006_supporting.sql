-- Migration: Create supporting tables (VAT rates, certifications, content)
-- Created: 2025-09-16

-- Create vat_rates table
CREATE TABLE vat_rates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    country_code VARCHAR(2) NOT NULL CHECK (country_code ~ '^[A-Z]{2}$'),
    product_category VARCHAR(50) NOT NULL DEFAULT 'wine',
    standard_rate DECIMAL(5,2) NOT NULL CHECK (standard_rate >= 0 AND standard_rate <= 30),
    reduced_rate DECIMAL(5,2) CHECK (reduced_rate >= 0 AND reduced_rate <= 30),
    applies_to_wine BOOLEAN DEFAULT TRUE,
    effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
    effective_to DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Ensure no overlapping periods for same country/category
    CONSTRAINT chk_vat_effective_dates CHECK (effective_to IS NULL OR effective_to > effective_from),
    UNIQUE(country_code, product_category, effective_from)
);

-- Create product_certifications table
CREATE TABLE product_certifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES wine_products(id) ON DELETE CASCADE,
    certification_type VARCHAR(20) NOT NULL CHECK (certification_type IN ('organic', 'biodynamic', 'vegan', 'sustainable')),
    certifying_body VARCHAR(200) NOT NULL,
    certificate_number VARCHAR(100) NOT NULL,
    issued_date DATE NOT NULL,
    expiry_date DATE NOT NULL CHECK (expiry_date > issued_date),
    certificate_url TEXT,
    verified BOOLEAN DEFAULT FALSE,
    display_logo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Unique constraint on certificate number per certifying body
    UNIQUE(certifying_body, certificate_number)
);

-- Create content_pages table
CREATE TABLE content_pages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    slug_en VARCHAR(200) UNIQUE NOT NULL,
    slug_fr VARCHAR(200) UNIQUE NOT NULL,
    title_en VARCHAR(300),
    title_fr VARCHAR(300),
    content_en TEXT,
    content_fr TEXT,
    meta_title_en VARCHAR(300),
    meta_title_fr VARCHAR(300),
    meta_description_en VARCHAR(500),
    meta_description_fr VARCHAR(500),
    featured_image_url TEXT,
    page_type VARCHAR(20) DEFAULT 'custom' CHECK (page_type IN ('heritage', 'practices', 'about', 'legal', 'custom')),
    is_published BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0 CHECK (sort_order >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- Create indexes for vat_rates
CREATE INDEX idx_vat_rates_country_category ON vat_rates(country_code, product_category);
CREATE INDEX idx_vat_rates_effective_dates ON vat_rates(effective_from, effective_to);
CREATE INDEX idx_vat_rates_applies_to_wine ON vat_rates(applies_to_wine) WHERE applies_to_wine = TRUE;

-- Create indexes for product_certifications
CREATE INDEX idx_product_certifications_product_id ON product_certifications(product_id);
CREATE INDEX idx_product_certifications_type ON product_certifications(certification_type);
CREATE INDEX idx_product_certifications_expiry ON product_certifications(expiry_date);
CREATE INDEX idx_product_certifications_verified ON product_certifications(verified) WHERE verified = TRUE;

-- Create indexes for content_pages
CREATE INDEX idx_content_pages_slug_en ON content_pages(slug_en);
CREATE INDEX idx_content_pages_slug_fr ON content_pages(slug_fr);
CREATE INDEX idx_content_pages_published ON content_pages(is_published) WHERE is_published = TRUE;
CREATE INDEX idx_content_pages_type ON content_pages(page_type);
CREATE INDEX idx_content_pages_sort_order ON content_pages(sort_order);

-- Create trigger for content_pages updated_at
CREATE TRIGGER trigger_content_pages_updated_at
    BEFORE UPDATE ON content_pages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to get current VAT rate for country
CREATE OR REPLACE FUNCTION get_current_vat_rate(
    p_country_code VARCHAR(2),
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
    AND effective_from <= CURRENT_DATE
    AND (effective_to IS NULL OR effective_to >= CURRENT_DATE)
    ORDER BY effective_from DESC
    LIMIT 1;

    -- If no specific rate found, return 0 (reverse charge for B2B)
    RETURN COALESCE(vat_rate, 0);
END;
$$ language 'plpgsql';

-- Create function to calculate VAT amount
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
DECLARE
    current_vat_rate DECIMAL(5,2);
    is_reverse_charge BOOLEAN := FALSE;
BEGIN
    -- B2B with valid VAT number = reverse charge (0% VAT)
    IF p_is_business AND p_vat_number IS NOT NULL AND LENGTH(p_vat_number) > 4 THEN
        is_reverse_charge := TRUE;
        current_vat_rate := 0;
    ELSE
        current_vat_rate := get_current_vat_rate(p_country_code);
    END IF;

    RETURN QUERY SELECT
        p_net_amount,
        current_vat_rate,
        ROUND(p_net_amount * current_vat_rate / 100, 2),
        p_net_amount + ROUND(p_net_amount * current_vat_rate / 100, 2),
        is_reverse_charge;
END;
$$ language 'plpgsql';

-- Create function to validate certification expiry
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
$$ language 'plpgsql';

-- Create trigger for certification expiry check
CREATE TRIGGER trigger_check_certification_expiry
    BEFORE INSERT OR UPDATE ON product_certifications
    FOR EACH ROW EXECUTE FUNCTION check_certification_expiry();

-- Insert EU VAT rates (current rates as of 2024)
INSERT INTO vat_rates (country_code, product_category, standard_rate, applies_to_wine) VALUES
('AT', 'wine', 20.00, TRUE),  -- Austria
('BE', 'wine', 21.00, TRUE),  -- Belgium
('BG', 'wine', 20.00, TRUE),  -- Bulgaria
('HR', 'wine', 25.00, TRUE),  -- Croatia
('CY', 'wine', 19.00, TRUE),  -- Cyprus
('CZ', 'wine', 21.00, TRUE),  -- Czech Republic
('DK', 'wine', 25.00, TRUE),  -- Denmark
('EE', 'wine', 20.00, TRUE),  -- Estonia
('FI', 'wine', 24.00, TRUE),  -- Finland
('FR', 'wine', 20.00, TRUE),  -- France
('DE', 'wine', 19.00, TRUE),  -- Germany
('GR', 'wine', 24.00, TRUE),  -- Greece
('HU', 'wine', 27.00, TRUE),  -- Hungary
('IE', 'wine', 23.00, TRUE),  -- Ireland
('IT', 'wine', 22.00, TRUE),  -- Italy
('LV', 'wine', 21.00, TRUE),  -- Latvia
('LT', 'wine', 21.00, TRUE),  -- Lithuania
('LU', 'wine', 17.00, TRUE),  -- Luxembourg
('MT', 'wine', 18.00, TRUE),  -- Malta
('NL', 'wine', 21.00, TRUE),  -- Netherlands
('PL', 'wine', 23.00, TRUE),  -- Poland
('PT', 'wine', 23.00, TRUE),  -- Portugal
('RO', 'wine', 19.00, TRUE),  -- Romania
('SK', 'wine', 20.00, TRUE),  -- Slovakia
('SI', 'wine', 22.00, TRUE),  -- Slovenia
('ES', 'wine', 21.00, TRUE),  -- Spain
('SE', 'wine', 25.00, TRUE);  -- Sweden

-- Insert sample content pages
INSERT INTO content_pages (
    slug_en, slug_fr, title_en, title_fr, content_en, content_fr,
    meta_title_en, meta_title_fr, meta_description_en, meta_description_fr,
    page_type, is_published, sort_order
) VALUES
(
    'our-heritage',
    'notre-heritage',
    'Our Heritage',
    'Notre Héritage',
    '# Our Family Heritage

The Vallot family has been crafting exceptional wines in the heart of Burgundy for over four generations. Founded in 1923 by Henri Vallot, our domain has remained committed to traditional winemaking methods while embracing sustainable practices.

## Four Generations of Excellence

- **Henri Vallot (1923-1960)**: Founded the domain with just 5 hectares
- **Pierre Vallot (1960-1985)**: Expanded to 15 hectares and introduced organic practices
- **Marie-Claude Vallot (1985-2010)**: Achieved biodynamic certification
- **Thomas Vallot (2010-present)**: Leading the digital transformation while preserving tradition

Our vineyards span 20 hectares of prime Burgundy terroir, where we cultivate Chardonnay and Pinot Noir with respect for the land and dedication to quality.',

    '# Notre Héritage Familial

La famille Vallot élabore des vins d''exception au cœur de la Bourgogne depuis plus de quatre générations. Fondé en 1923 par Henri Vallot, notre domaine est resté fidèle aux méthodes traditionnelles de vinification tout en adoptant des pratiques durables.

## Quatre Générations d''Excellence

- **Henri Vallot (1923-1960)** : Fondation du domaine avec seulement 5 hectares
- **Pierre Vallot (1960-1985)** : Extension à 15 hectares et introduction des pratiques biologiques
- **Marie-Claude Vallot (1985-2010)** : Obtention de la certification biodynamique
- **Thomas Vallot (2010-présent)** : Leadership de la transformation numérique tout en préservant la tradition

Nos vignobles s''étendent sur 20 hectares de terroir bourguignon de premier plan, où nous cultivons le Chardonnay et le Pinot Noir dans le respect de la terre et avec un dévouement à la qualité.',

    'Our Heritage - Domaine Vallot Family Winery',
    'Notre Héritage - Domaine Vallot Vignoble Familial',
    'Discover the rich heritage of Domaine Vallot, four generations of exceptional winemaking in Burgundy since 1923.',
    'Découvrez le riche héritage du Domaine Vallot, quatre générations de vinification exceptionnelle en Bourgogne depuis 1923.',
    'heritage',
    TRUE,
    1
),
(
    'biodynamic-practices',
    'pratiques-biodynamiques',
    'Our Biodynamic Practices',
    'Nos Pratiques Biodynamiques',
    '# Biodynamic Viticulture at Domaine Vallot

Since 1985, we have embraced biodynamic viticulture, treating our vineyard as a living ecosystem. This holistic approach goes beyond organic farming to work in harmony with natural rhythms and cosmic cycles.

## Our Biodynamic Principles

### Soil Health
We maintain soil vitality through:
- Composting with our own preparations
- Cover crops between vine rows
- Minimal soil intervention

### Natural Preparations
We use biodynamic preparations including:
- Horn manure (500) for soil vitalization
- Horn silica (501) for plant strengthening
- Barrel compost for soil balance

### Lunar Calendar
All vineyard work follows the biodynamic calendar:
- Pruning on fruit days
- Harvesting at optimal lunar phases
- Bottling during favorable periods

Our commitment to biodynamic principles ensures wines that truly express our unique terroir.',

    '# Viticulture Biodynamique au Domaine Vallot

Depuis 1985, nous avons adopté la viticulture biodynamique, traitant notre vignoble comme un écosystème vivant. Cette approche holistique va au-delà de l''agriculture biologique pour travailler en harmonie avec les rythmes naturels et les cycles cosmiques.

## Nos Principes Biodynamiques

### Santé des Sols
Nous maintenons la vitalité des sols grâce à :
- Le compostage avec nos propres préparations
- Les cultures de couverture entre les rangs de vignes
- Une intervention minimale du sol

### Préparations Naturelles
Nous utilisons des préparations biodynamiques incluant :
- Bouse de corne (500) pour la vitalisation du sol
- Silice de corne (501) pour le renforcement des plantes
- Compost de bouse pour l''équilibre du sol

### Calendrier Lunaire
Tous les travaux du vignoble suivent le calendrier biodynamique :
- Taille aux jours fruits
- Récolte aux phases lunaires optimales
- Mise en bouteille pendant les périodes favorables

Notre engagement envers les principes biodynamiques garantit des vins qui expriment vraiment notre terroir unique.',

    'Biodynamic Practices - Sustainable Winemaking at Domaine Vallot',
    'Pratiques Biodynamiques - Vinification Durable au Domaine Vallot',
    'Learn about our biodynamic viticulture practices and sustainable winemaking methods at Domaine Vallot.',
    'Découvrez nos pratiques de viticulture biodynamique et nos méthodes de vinification durable au Domaine Vallot.',
    'practices',
    TRUE,
    2
);

-- Insert sample product certifications for existing wine products
INSERT INTO product_certifications (
    product_id, certification_type, certifying_body, certificate_number,
    issued_date, expiry_date, verified, display_logo
)
SELECT
    wp.id,
    'organic',
    'Ecocert France',
    'FR-BIO-' || LPAD((ROW_NUMBER() OVER())::TEXT, 6, '0'),
    '2023-01-01'::DATE,
    '2026-01-01'::DATE,
    TRUE,
    TRUE
FROM wine_products wp
WHERE wp.organic_certified = TRUE;

INSERT INTO product_certifications (
    product_id, certification_type, certifying_body, certificate_number,
    issued_date, expiry_date, verified, display_logo
)
SELECT
    wp.id,
    'biodynamic',
    'Demeter International',
    'DM-FR-' || LPAD((ROW_NUMBER() OVER())::TEXT, 6, '0'),
    '2023-01-01'::DATE,
    '2026-01-01'::DATE,
    TRUE,
    TRUE
FROM wine_products wp
WHERE wp.biodynamic_certified = TRUE;

-- Create view for products with their certifications
CREATE VIEW wine_products_with_certifications AS
SELECT
    wp.*,
    COALESCE(
        json_agg(
            json_build_object(
                'id', pc.id,
                'type', pc.certification_type,
                'certifying_body', pc.certifying_body,
                'certificate_number', pc.certificate_number,
                'issued_date', pc.issued_date,
                'expiry_date', pc.expiry_date,
                'verified', pc.verified,
                'display_logo', pc.display_logo
            )
            ORDER BY pc.certification_type
        ) FILTER (WHERE pc.id IS NOT NULL),
        '[]'::json
    ) as certifications
FROM wine_products wp
LEFT JOIN product_certifications pc ON wp.id = pc.product_id
WHERE wp.is_active = TRUE
GROUP BY wp.id;