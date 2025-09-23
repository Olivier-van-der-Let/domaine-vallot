# Phase 1: Data Model Design

## Entity Definitions

### 1. Wine Product
**Purpose**: Represents individual wines available for purchase

**Fields**:
- `id` (UUID, Primary Key): Unique product identifier
- `sku` (String, Unique): Stock keeping unit for inventory management
- `name` (String, Required): Wine name (multilingual)
- `vintage` (Integer): Year of wine production
- `varietal` (String, Required): Grape variety (e.g., "Chardonnay", "Pinot Noir")
- `region` (String): Wine region/appellation
- `alcohol_content` (Decimal): Alcohol percentage (required for EU labeling)
- `volume_ml` (Integer): Bottle size in milliliters (default: 750)
- `price_eur` (Decimal): Base price in euros (excluding VAT)
- `cost_eur` (Decimal): Cost price for margin calculation
- `stock_quantity` (Integer): Available inventory count
- `reserved_quantity` (Integer): Items in pending orders
- `reorder_level` (Integer): Stock level triggering reorder alert
- `weight_grams` (Integer): Product weight for shipping calculation
- `description_en` (Text): English product description
- `description_fr` (Text): French product description
- `tasting_notes_en` (Text): English tasting notes
- `tasting_notes_fr` (Text): French tasting notes
- `food_pairing_en` (Text): English food pairing suggestions
- `food_pairing_fr` (Text): French food pairing suggestions
- `production_notes_en` (Text): English production/winemaking notes
- `production_notes_fr` (Text): French production/winemaking notes
- `allergens` (String[]): Allergen information (sulfites, etc.)
- `organic_certified` (Boolean): Organic certification status
- `biodynamic_certified` (Boolean): Biodynamic certification status
- `vegan_friendly` (Boolean): Vegan-friendly indicator
- `google_product_category` (String): Google Shopping category ID
- `meta_product_category` (String): Meta catalog category
- `is_active` (Boolean): Product visibility status
- `featured` (Boolean): Featured product flag
- `sort_order` (Integer): Display order priority
- `seo_title_en` (String): English SEO title
- `seo_title_fr` (String): French SEO title
- `seo_description_en` (String): English meta description
- `seo_description_fr` (String): French meta description
- `slug_en` (String, Unique): English URL slug
- `slug_fr` (String, Unique): French URL slug
- `created_at` (Timestamp): Record creation timestamp
- `updated_at` (Timestamp): Last modification timestamp
- `created_by` (UUID): User who created the record
- `updated_by` (UUID): User who last updated the record

**Relationships**:
- Has many ProductImages (1:N)
- Has many ProductCertifications (1:N)
- Has many OrderItems (1:N)
- Has many CartItems (1:N)

**Validation Rules**:
- `name` must be 1-200 characters
- `vintage` must be between 1800 and current year + 1
- `alcohol_content` must be between 0 and 20
- `price_eur` must be positive
- `stock_quantity` must be non-negative
- `weight_grams` must be positive
- `slug_en` and `slug_fr` must be URL-safe

**State Transitions**:
- Draft → Active (when all required fields completed)
- Active → Inactive (when discontinued)
- Active → Out of Stock (when stock_quantity = 0)

### 2. Product Images
**Purpose**: Stores multiple images for each wine product

**Fields**:
- `id` (UUID, Primary Key): Unique image identifier
- `product_id` (UUID, Foreign Key): Reference to wine product
- `url` (String, Required): Supabase Storage URL
- `alt_text_en` (String): English alt text for accessibility
- `alt_text_fr` (String): French alt text for accessibility
- `display_order` (Integer): Image ordering (1 = primary)
- `image_type` (Enum): 'bottle', 'label', 'vineyard', 'winemaker'
- `width` (Integer): Image width in pixels
- `height` (Integer): Image height in pixels
- `file_size` (Integer): File size in bytes
- `is_primary` (Boolean): Primary product image flag
- `created_at` (Timestamp): Upload timestamp

**Relationships**:
- Belongs to WineProduct (N:1)

**Validation Rules**:
- Only one primary image per product
- `display_order` must be positive
- `url` must be valid Supabase Storage URL
- Supported formats: JPG, PNG, WEBP

### 3. Customer
**Purpose**: Represents website visitors and registered customers

**Fields**:
- `id` (UUID, Primary Key): Unique customer identifier (matches auth.users)
- `email` (String, Unique): Customer email address
- `first_name` (String): Customer first name
- `last_name` (String): Customer last name
- `phone` (String): Contact phone number
- `birth_date` (Date): Birth date for age verification
- `preferred_language` (Enum): 'en' or 'fr'
- `marketing_consent` (Boolean): Marketing email consent
- `newsletter_consent` (Boolean): Newsletter subscription consent
- `age_verified` (Boolean): Age verification status
- `age_verified_at` (Timestamp): Age verification timestamp
- `age_verification_method` (Enum): 'id_document', 'third_party', 'manual'
- `is_business` (Boolean): B2B customer flag
- `vat_number` (String): EU VAT number for B2B customers
- `vat_validated` (Boolean): VIES validation status
- `vat_validated_at` (Timestamp): VAT validation timestamp
- `company_name` (String): Business name for B2B customers
- `default_shipping_address_id` (UUID): Default shipping address
- `default_billing_address_id` (UUID): Default billing address
- `total_orders` (Integer): Total order count
- `total_spent_eur` (Decimal): Lifetime customer value
- `last_login_at` (Timestamp): Last login timestamp
- `created_at` (Timestamp): Account creation timestamp
- `updated_at` (Timestamp): Last profile update

**Relationships**:
- Has many CustomerAddresses (1:N)
- Has many Orders (1:N)
- Has many CartItems (1:N)

**Validation Rules**:
- `email` must be valid email format
- `birth_date` must indicate age ≥ 18
- `vat_number` must be valid EU VAT format when provided
- `preferred_language` must be 'en' or 'fr'

### 4. Customer Address
**Purpose**: Stores customer shipping and billing addresses

**Fields**:
- `id` (UUID, Primary Key): Unique address identifier
- `customer_id` (UUID, Foreign Key): Reference to customer
- `type` (Enum): 'shipping', 'billing', 'both'
- `first_name` (String, Required): Recipient first name
- `last_name` (String, Required): Recipient last name
- `company` (String): Company name (optional)
- `address_line1` (String, Required): Street address
- `address_line2` (String): Apartment, suite, etc.
- `city` (String, Required): City name
- `state_province` (String): State or province
- `postal_code` (String, Required): Postal/ZIP code
- `country_code` (String, Required): ISO 3166-1 alpha-2 country code
- `phone` (String): Contact phone for delivery
- `delivery_instructions` (Text): Special delivery notes
- `is_default_shipping` (Boolean): Default shipping address flag
- `is_default_billing` (Boolean): Default billing address flag
- `created_at` (Timestamp): Address creation timestamp
- `updated_at` (Timestamp): Last address update

**Relationships**:
- Belongs to Customer (N:1)

**Validation Rules**:
- `country_code` must be valid EU member state
- `postal_code` format validation by country
- Only one default shipping/billing address per customer

### 5. Order
**Purpose**: Represents customer purchase transactions

**Fields**:
- `id` (UUID, Primary Key): Unique order identifier
- `order_number` (String, Unique): Human-readable order number
- `customer_id` (UUID, Foreign Key): Reference to customer
- `status` (Enum): 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'
- `currency` (String): Order currency (always 'EUR')
- `subtotal_eur` (Decimal): Items total excluding tax and shipping
- `vat_rate` (Decimal): Applied VAT rate percentage
- `vat_amount_eur` (Decimal): VAT amount
- `shipping_cost_eur` (Decimal): Shipping charges
- `total_eur` (Decimal): Final order total
- `payment_status` (Enum): 'pending', 'paid', 'failed', 'refunded', 'partially_refunded'
- `payment_method` (String): Payment method used
- `mollie_payment_id` (String): Mollie payment reference
- `shipping_address` (JSONB): Snapshot of shipping address
- `billing_address` (JSONB): Snapshot of billing address
- `shipping_method` (String): Selected shipping method
- `tracking_number` (String): Package tracking number
- `estimated_delivery` (Date): Estimated delivery date
- `shipped_at` (Timestamp): Shipment timestamp
- `delivered_at` (Timestamp): Delivery confirmation timestamp
- `notes` (Text): Customer or admin notes
- `fulfillment_notes` (Text): Internal fulfillment notes
- `created_at` (Timestamp): Order creation timestamp
- `updated_at` (Timestamp): Last status update

**Relationships**:
- Belongs to Customer (N:1)
- Has many OrderItems (1:N)

**Validation Rules**:
- `order_number` follows format: DV-YYYYMMDD-XXXX
- `total_eur` must equal subtotal + VAT + shipping
- `vat_amount_eur` must equal subtotal × vat_rate / 100
- Status transitions must follow business logic

**State Transitions**:
- pending → confirmed (payment successful)
- confirmed → processing (fulfillment started)
- processing → shipped (package sent)
- shipped → delivered (delivery confirmed)
- Any status → cancelled (before shipping)
- Any paid status → refunded (refund processed)

### 6. Order Item
**Purpose**: Individual items within an order

**Fields**:
- `id` (UUID, Primary Key): Unique item identifier
- `order_id` (UUID, Foreign Key): Reference to order
- `product_id` (UUID, Foreign Key): Reference to wine product
- `product_snapshot` (JSONB): Product details at time of order
- `quantity` (Integer, Required): Number of bottles ordered
- `unit_price_eur` (Decimal): Price per bottle excluding VAT
- `vat_rate` (Decimal): VAT rate applied to this item
- `vat_amount_eur` (Decimal): VAT amount for this item
- `line_total_eur` (Decimal): Total for this line item
- `created_at` (Timestamp): Item creation timestamp

**Relationships**:
- Belongs to Order (N:1)
- References WineProduct (N:1)

**Validation Rules**:
- `quantity` must be positive
- `line_total_eur` must equal (unit_price × quantity) + vat_amount
- Product must be active at time of order creation

### 7. Cart Item
**Purpose**: Shopping cart items for logged-in customers

**Fields**:
- `id` (UUID, Primary Key): Unique cart item identifier
- `customer_id` (UUID, Foreign Key): Reference to customer
- `product_id` (UUID, Foreign Key): Reference to wine product
- `quantity` (Integer, Required): Number of bottles in cart
- `added_at` (Timestamp): Item addition timestamp
- `updated_at` (Timestamp): Last quantity update

**Relationships**:
- Belongs to Customer (N:1)
- References WineProduct (N:1)

**Validation Rules**:
- Unique constraint on (customer_id, product_id)
- `quantity` must be positive
- Product must be active and in stock

### 8. VAT Rate
**Purpose**: EU VAT rates by country and product type

**Fields**:
- `id` (UUID, Primary Key): Unique rate identifier
- `country_code` (String, Required): ISO 3166-1 alpha-2 country code
- `product_category` (String): Product category ('wine', 'digital', 'general')
- `standard_rate` (Decimal): Standard VAT rate percentage
- `reduced_rate` (Decimal): Reduced VAT rate if applicable
- `applies_to_wine` (Boolean): Wine-specific rate flag
- `effective_from` (Date): Rate effective date
- `effective_to` (Date): Rate expiry date (null for current)
- `created_at` (Timestamp): Record creation timestamp

**Validation Rules**:
- Unique constraint on (country_code, product_category, effective_from)
- Rates must be between 0 and 30
- `effective_to` must be after `effective_from`

### 9. Product Certification
**Purpose**: Organic and biodynamic certifications for products

**Fields**:
- `id` (UUID, Primary Key): Unique certification identifier
- `product_id` (UUID, Foreign Key): Reference to wine product
- `certification_type` (Enum): 'organic', 'biodynamic', 'vegan', 'sustainable'
- `certifying_body` (String): Organization that issued certification
- `certificate_number` (String): Certification reference number
- `issued_date` (Date): Certification issue date
- `expiry_date` (Date): Certification expiry date
- `certificate_url` (String): URL to certificate document
- `verified` (Boolean): Internal verification status
- `display_logo` (Boolean): Show certification logo on product
- `created_at` (Timestamp): Record creation timestamp

**Relationships**:
- Belongs to WineProduct (N:1)

**Validation Rules**:
- `expiry_date` must be after `issued_date`
- `certificate_url` must be valid URL format
- `certificate_number` must be unique per certifying body

### 10. Content Page
**Purpose**: Multilingual website content (about, heritage, practices)

**Fields**:
- `id` (UUID, Primary Key): Unique page identifier
- `slug_en` (String, Unique): English URL slug
- `slug_fr` (String, Unique): French URL slug
- `title_en` (String): English page title
- `title_fr` (String): French page title
- `content_en` (Text): English page content (Markdown)
- `content_fr` (Text): French page content (Markdown)
- `meta_title_en` (String): English SEO title
- `meta_title_fr` (String): French SEO title
- `meta_description_en` (String): English meta description
- `meta_description_fr` (String): French meta description
- `featured_image_url` (String): Hero image URL
- `page_type` (Enum): 'heritage', 'practices', 'about', 'legal', 'custom'
- `is_published` (Boolean): Publication status
- `sort_order` (Integer): Navigation order
- `created_at` (Timestamp): Page creation timestamp
- `updated_at` (Timestamp): Last content update
- `created_by` (UUID): Author user ID
- `updated_by` (UUID): Last editor user ID

**Validation Rules**:
- `slug_en` and `slug_fr` must be URL-safe
- Either English or French content required (can be partial translation)
- `sort_order` must be positive

## Database Schema Considerations

### Indexes
- `wine_products(slug_en)`, `wine_products(slug_fr)` - URL routing
- `wine_products(is_active, featured)` - Product filtering
- `orders(customer_id, created_at)` - Customer order history
- `orders(status, created_at)` - Admin order management
- `cart_items(customer_id)` - Cart retrieval
- `vat_rates(country_code, effective_from)` - VAT calculation

### Row Level Security (RLS)
- Customers can only access their own orders, addresses, and cart items
- Product data is publicly readable
- Admin tables require authenticated admin access
- Age verification data has restricted access

### Constraints
- Foreign key constraints on all relationships
- Check constraints on enum fields
- Unique constraints on business logic fields (SKUs, slugs)
- NOT NULL constraints on required fields

### Data Retention
- Order data: Retain for 10 years (EU tax compliance)
- Customer data: Follow GDPR retention policies
- Cart items: Auto-cleanup after 30 days of inactivity
- Log data: Retain for 2 years for security auditing