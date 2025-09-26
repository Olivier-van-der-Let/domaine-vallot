# Admin Products API Documentation

This documentation covers the comprehensive admin product API endpoints for the Domaine Vallot wine e-commerce platform.

## Overview

The admin products API provides full CRUD operations for managing wine products, including:
- Creating new wine products with multilingual content
- Updating existing products and their images
- Deleting products (soft delete)
- Managing product images via Supabase Storage
- Advanced filtering and search capabilities

## Authentication

All endpoints require admin authentication. The API checks for:
1. Valid Supabase user session
2. Admin role in user metadata or admin_users table
3. Specific permissions for each operation

### Required Permissions
- `products.read` - View products
- `products.create` - Create new products
- `products.update` - Update existing products
- `products.delete` - Delete products

## Endpoints

### 1. Create Product
**POST** `/api/admin/products`

Creates a new wine product with full multilingual support.

#### Request Body
```json
{
  "sku": "DV-SYR-2022",
  "name": "Vinsobres Rouge François",
  "vintage": 2022,
  "varietal": "Syrah blend",
  "region": "Vinsobres",
  "alcohol_content": 14.5,
  "volume_ml": 750,
  "price_eur": 25.50,
  "cost_eur": 12.00,
  "stock_quantity": 100,
  "weight_grams": 1200,
  "description_en": "A premium red wine with notes of dark fruit and traditional terroir expression.",
  "description_fr": "Un vin rouge premium avec des notes de fruits noirs et d'expression traditionnelle du terroir.",
  "tasting_notes_en": "Deep ruby color with aromas of blackberry, pepper, and herbs.",
  "tasting_notes_fr": "Couleur rubis profond avec des arômes de mûre, poivre et herbes.",
  "food_pairing_en": "Perfect with grilled meats, aged cheeses, and hearty stews.",
  "food_pairing_fr": "Parfait avec les viandes grillées, fromages affinés et ragoûts copieux.",
  "organic_certified": true,
  "biodynamic_certified": true,
  "featured": true,
  "slug_en": "vinsobres-rouge-francois-2022",
  "slug_fr": "vinsobres-rouge-francois-2022",
  "images": [
    {
      "url": "https://example.com/image1.jpg",
      "alt_text_en": "Vinsobres Rouge François bottle",
      "alt_text_fr": "Bouteille Vinsobres Rouge François",
      "image_type": "bottle",
      "is_primary": true
    }
  ]
}
```

#### Response
```json
{
  "message": "Wine product created successfully",
  "product": {
    "id": "uuid",
    "sku": "DV-SYR-2022",
    "name": "Vinsobres Rouge François",
    // ... all product fields
    "product_images": [
      {
        "id": "uuid",
        "url": "https://storage.url/image1.jpg",
        "alt_text_en": "Vinsobres Rouge François bottle",
        "is_primary": true
      }
    ]
  }
}
```

#### Features
- Auto-generates SKU if not provided
- Auto-generates SEO-friendly slugs
- Validates multilingual content
- Handles image uploads and associations
- Checks for duplicate SKUs and slugs
- Validates business rules (cost vs price, etc.)

### 2. Update Product
**PUT** `/api/admin/products/[id]`

Updates an existing wine product. All fields are optional (partial update).

#### Request Body
```json
{
  "price_eur": 28.00,
  "stock_quantity": 75,
  "description_en": "Updated description",
  "featured": false,
  "images": [
    {
      "url": "https://example.com/new-image.jpg",
      "alt_text_en": "Updated bottle image",
      "is_primary": true
    }
  ]
}
```

#### Response
```json
{
  "message": "Wine product updated successfully",
  "product": {
    // Updated product with all fields and images
  }
}
```

#### Features
- Partial updates (only provided fields are updated)
- Regenerates slugs if name/vintage changes
- Validates uniqueness constraints
- Replaces all images if images array provided
- Maintains referential integrity

### 3. Get Product
**GET** `/api/admin/products/[id]`

Retrieves a single product with all details including images and certifications.

#### Response
```json
{
  "product": {
    "id": "uuid",
    "sku": "DV-SYR-2022",
    // ... all product fields
    "product_images": [...],
    "product_certifications": [...]
  }
}
```

### 4. List Products
**GET** `/api/admin/products`

Lists all products with advanced filtering and pagination.

#### Query Parameters
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (max: 100, default: 25)
- `search` (string): Search in name, SKU, varietal, region, descriptions
- `status` (string): 'active' | 'inactive'
- `featured` (boolean): Filter featured products
- `inStock` (boolean): Filter by stock availability
- `sortBy` (string): 'name' | 'sku' | 'vintage' | 'price_eur' | 'stock_quantity' | 'created_at' | 'updated_at'
- `sortOrder` (string): 'asc' | 'desc'

#### Response
```json
{
  "products": [...],
  "pagination": {
    "page": 1,
    "limit": 25,
    "total": 150,
    "totalPages": 6,
    "hasNext": true,
    "hasPrevious": false
  },
  "filters": {
    "search": "syrah",
    "status": "active",
    "sortBy": "created_at",
    "sortOrder": "desc"
  }
}
```

### 5. Delete Product
**DELETE** `/api/admin/products/[id]`

Soft deletes a product by setting `is_active` to false.

#### Response
```json
{
  "message": "Wine product deleted successfully",
  "product": {
    "id": "uuid",
    "name": "Product Name",
    "sku": "PRODUCT-SKU"
  }
}
```

#### Features
- Soft delete (preserves data)
- Checks for pending orders (blocks deletion)
- Removes product from all carts
- Maintains order history integrity

### 6. Upload Images
**POST** `/api/admin/products/images`

Uploads product images to Supabase Storage.

#### Request (Form Data)
```
images: File[] (multiple image files)
productId: string (optional, to auto-associate with product)
```

#### Response
```json
{
  "message": "Successfully uploaded 3 image(s)",
  "images": [
    {
      "fileName": "bottle1.jpg",
      "url": "https://storage.url/wines/unique-filename.jpg",
      "size": 245760,
      "type": "image/jpeg"
    }
  ]
}
```

#### Features
- Validates file types (JPEG, PNG, WebP)
- Enforces 5MB file size limit
- Generates unique filenames
- Auto-associates with product if ID provided
- Supports bulk uploads

### 7. Delete Images
**DELETE** `/api/admin/products/images`

Deletes images from both Supabase Storage and database.

#### Request Body
```json
{
  "imageIds": ["uuid1", "uuid2"],
  "imagePaths": ["wines/file1.jpg", "wines/file2.jpg"]
}
```

#### Response
```json
{
  "message": "Successfully deleted 2 image(s)",
  "deletedImages": [
    { "id": "uuid1", "path": "wines/file1.jpg" },
    { "id": "uuid2", "path": "wines/file2.jpg" }
  ]
}
```

## Database Schema

### wine_products Table
The main product table includes:
- Basic info: SKU, name, vintage, varietal, region
- Pricing: price_eur, cost_eur
- Inventory: stock_quantity, reserved_quantity, reorder_level
- Physical: alcohol_content, volume_ml, weight_grams
- Content: Multilingual descriptions, tasting notes, food pairings
- SEO: Multilingual titles, descriptions, slugs
- Flags: organic_certified, biodynamic_certified, vegan_friendly, featured
- Metadata: created_at, updated_at, created_by, updated_by

### product_images Table
Related images with:
- product_id (foreign key)
- url, alt_text_en, alt_text_fr
- display_order, image_type, is_primary
- width, height, file_size

## Error Handling

All endpoints return consistent error responses:

```json
{
  "error": "Error message",
  "details": {
    "field": ["Specific validation error"],
    "general": ["Business rule error"]
  }
}
```

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Validation error
- `401` - Authentication required
- `403` - Admin access required
- `404` - Product not found
- `409` - Conflict (e.g., pending orders)
- `500` - Internal server error

## Validation Rules

### Business Rules
- Cost cannot exceed selling price
- Reserved quantity cannot exceed stock quantity
- Vintage cannot be too far in the future
- SKU must be unique
- Slugs must be unique per language
- Products with pending orders cannot be deleted

### Data Validation
- All numeric fields validated for range and type
- Multilingual content required in both languages
- Image URLs validated and processed
- Slug format enforced (lowercase, alphanumeric, hyphens only)

## Security Features

- JWT-based authentication
- Role-based access control
- Permission-based operation checks
- Input sanitization and validation
- SQL injection prevention via Supabase
- File upload security (type/size validation)

## Usage Examples

### Create a Complete Product
```javascript
const response = await fetch('/api/admin/products', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token
  },
  body: JSON.stringify({
    sku: 'DV-VIN-2022',
    name: 'Vinsobres Excellence',
    vintage: 2022,
    varietal: 'Syrah, Grenache',
    region: 'Vinsobres AOC',
    alcohol_content: 14.5,
    price_eur: 32.50,
    stock_quantity: 50,
    description_en: 'Premium Vinsobres wine...',
    description_fr: 'Vin de Vinsobres premium...',
    organic_certified: true,
    featured: true
  })
});
```

### Update Stock Quantity
```javascript
const response = await fetch(`/api/admin/products/${productId}`, {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token
  },
  body: JSON.stringify({
    stock_quantity: 25
  })
});
```

### Search Products
```javascript
const response = await fetch('/api/admin/products?' + new URLSearchParams({
  search: 'syrah',
  status: 'active',
  featured: 'true',
  sortBy: 'price_eur',
  sortOrder: 'desc',
  page: '1',
  limit: '20'
}));
```

This API provides a complete solution for managing wine products in the Domaine Vallot e-commerce platform with proper validation, security, and multilingual support.