import type { Database } from '@/types/database.types'

/**
 * Generate SEO-friendly slug from product name and vintage
 * @param name Product name
 * @param vintage Product vintage
 * @returns SEO-friendly slug
 */
export function generateSlug(name: string, vintage?: number): string {
  let slug = name
    .toLowerCase()
    .trim()
    // Replace French accented characters
    .replace(/[àáâãäå]/g, 'a')
    .replace(/[èéêë]/g, 'e')
    .replace(/[ìíîï]/g, 'i')
    .replace(/[òóôõö]/g, 'o')
    .replace(/[ùúûü]/g, 'u')
    .replace(/[ÿý]/g, 'y')
    .replace(/[ñ]/g, 'n')
    .replace(/[ç]/g, 'c')
    // Remove quotes and special characters
    .replace(/[«»"']/g, '')
    .replace(/[^\w\s-]/g, '')
    // Replace spaces and underscores with hyphens
    .replace(/[\s_-]+/g, '-')
    // Remove leading/trailing hyphens
    .replace(/^-+|-+$/g, '')

  // Add vintage if provided
  if (vintage) {
    slug += `-${vintage}`
  }

  return slug
}

/**
 * Generate unique SKU for wine product
 * @param name Product name
 * @param vintage Product vintage
 * @param varietal Product varietal
 * @returns Unique SKU
 */
export function generateSKU(name: string, vintage: number, varietal: string): string {
  // Extract initials from name
  const nameInitials = name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .substring(0, 3)

  // Extract varietal code
  const varietalCode = varietal
    .replace(/[^a-zA-Z]/g, '')
    .toUpperCase()
    .substring(0, 3)

  // Combine with vintage
  return `${nameInitials}${varietalCode}${vintage}`
}

/**
 * Validate and process image URLs for Supabase storage
 * @param url Image URL
 * @returns Processed URL or null if invalid
 */
export function processImageUrl(url: string): string | null {
  if (!url || typeof url !== 'string') {
    return null
  }

  // If it's already a Supabase URL, ensure it's properly formatted
  if (url.includes('supabase.co/storage/v1/object/public/')) {
    // Fix missing /Public/ in the URL path if needed
    if (url.includes('/object/public/wines/') && !url.includes('/object/public/Public/wines/')) {
      return url.replace('/object/public/wines/', '/object/public/Public/wines/')
    }
    return url
  }

  // If it's a relative URL, assume it's correct
  if (url.startsWith('/')) {
    return url
  }

  // If it's an absolute URL, validate it
  try {
    new URL(url)
    return url
  } catch {
    return null
  }
}

/**
 * Calculate category from varietal
 * @param varietal Wine varietal
 * @returns Wine category
 */
export function getCategoryFromVarietal(varietal: string): 'red_wine' | 'white_wine' | 'rose_wine' | 'sparkling_wine' {
  if (!varietal) return 'red_wine'

  const lowerVarietal = varietal.toLowerCase()

  // White wine varietals
  if (lowerVarietal.includes('blanc') ||
      lowerVarietal.includes('viognier') ||
      lowerVarietal.includes('clairette') ||
      lowerVarietal.includes('bourboulenc') ||
      lowerVarietal.includes('chardonnay') ||
      lowerVarietal.includes('sauvignon') ||
      lowerVarietal.includes('riesling') ||
      lowerVarietal.includes('pinot grigio') ||
      lowerVarietal.includes('pinot gris')) {
    return 'white_wine'
  }

  // Rosé wine varietals
  if (lowerVarietal.includes('rosé') ||
      lowerVarietal.includes('rose') ||
      lowerVarietal.includes('cinsault rosé')) {
    return 'rose_wine'
  }

  // Sparkling wine indicators
  if (lowerVarietal.includes('champagne') ||
      lowerVarietal.includes('crémant') ||
      lowerVarietal.includes('pétillant') ||
      lowerVarietal.includes('bulles')) {
    return 'sparkling_wine'
  }

  // Default to red wine
  return 'red_wine'
}

/**
 * Validate wine product data for completeness
 * @param product Wine product data
 * @returns Array of validation errors
 */
export function validateWineProduct(product: any): string[] {
  const errors: string[] = []

  // Check required multilingual fields
  if (!product.description_en || product.description_en.trim().length < 10) {
    errors.push('English description must be at least 10 characters')
  }

  if (!product.description_fr || product.description_fr.trim().length < 10) {
    errors.push('French description must be at least 10 characters')
  }

  // Check slug uniqueness requirements
  if (!product.slug_en || !/^[a-z0-9-]+$/.test(product.slug_en)) {
    errors.push('English slug must contain only lowercase letters, numbers, and hyphens')
  }

  if (!product.slug_fr || !/^[a-z0-9-]+$/.test(product.slug_fr)) {
    errors.push('French slug must contain only lowercase letters, numbers, and hyphens')
  }

  // Check price logic
  if (product.cost_eur && product.price_eur && product.cost_eur > product.price_eur) {
    errors.push('Cost cannot be higher than selling price')
  }

  // Check stock logic
  if (product.reserved_quantity > product.stock_quantity) {
    errors.push('Reserved quantity cannot exceed stock quantity')
  }

  // Check vintage logic
  const currentYear = new Date().getFullYear()
  if (product.vintage > currentYear + 1) {
    errors.push(`Vintage cannot be more than one year in the future (${currentYear + 1})`)
  }

  return errors
}

/**
 * Sanitize product data for database insertion
 * @param product Raw product data
 * @returns Sanitized product data
 */
export function sanitizeProductData(product: any): any {
  return {
    ...product,
    // Ensure numeric fields are properly typed
    vintage: Number(product.vintage),
    alcohol_content: Number(product.alcohol_content),
    volume_ml: Number(product.volume_ml),
    price_eur: Number(product.price_eur),
    cost_eur: product.cost_eur ? Number(product.cost_eur) : null,
    stock_quantity: Number(product.stock_quantity),
    reserved_quantity: Number(product.reserved_quantity || 0),
    reorder_level: product.reorder_level ? Number(product.reorder_level) : null,
    weight_grams: Number(product.weight_grams),
    sort_order: Number(product.sort_order || 0),

    // Ensure boolean fields are properly typed
    organic_certified: Boolean(product.organic_certified),
    biodynamic_certified: Boolean(product.biodynamic_certified),
    vegan_friendly: Boolean(product.vegan_friendly),
    is_active: Boolean(product.is_active),
    featured: Boolean(product.featured),

    // Trim string fields
    sku: product.sku?.trim(),
    name: product.name?.trim(),
    varietal: product.varietal?.trim(),
    region: product.region?.trim(),
    description_en: product.description_en?.trim(),
    description_fr: product.description_fr?.trim(),
    tasting_notes_en: product.tasting_notes_en?.trim() || null,
    tasting_notes_fr: product.tasting_notes_fr?.trim() || null,
    food_pairing_en: product.food_pairing_en?.trim() || null,
    food_pairing_fr: product.food_pairing_fr?.trim() || null,
    production_notes_en: product.production_notes_en?.trim() || null,
    production_notes_fr: product.production_notes_fr?.trim() || null,
    seo_title_en: product.seo_title_en?.trim() || null,
    seo_title_fr: product.seo_title_fr?.trim() || null,
    seo_description_en: product.seo_description_en?.trim() || null,
    seo_description_fr: product.seo_description_fr?.trim() || null,
    slug_en: product.slug_en?.trim(),
    slug_fr: product.slug_fr?.trim(),

    // Process arrays
    allergens: Array.isArray(product.allergens) ? product.allergens : null,

    // Set timestamps
    updated_at: new Date().toISOString()
  }
}