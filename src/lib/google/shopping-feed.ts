import { createClient } from '@/lib/supabase/server';

export interface GoogleShoppingProduct {
  id: string;
  title: string;
  description: string;
  link: string;
  image_link: string;
  additional_image_links?: string[];
  availability: 'in stock' | 'out of stock' | 'preorder' | 'backorder';
  price: string;
  brand: string;
  condition: 'new' | 'refurbished' | 'used';
  google_product_category: string;
  product_type: string;
  gtin?: string;
  mpn?: string;
  age_group?: 'adult' | 'kids' | 'toddler' | 'infant' | 'newborn';
  gender?: 'male' | 'female' | 'unisex';
  size?: string;
  color?: string;
  material?: string;
  pattern?: string;
  item_group_id?: string;
  shipping?: Array<{
    country: string;
    service: string;
    price: string;
  }>;
  tax?: Array<{
    country: string;
    region?: string;
    rate: string;
    tax_ship: boolean;
  }>;
  custom_label_0?: string;
  custom_label_1?: string;
  custom_label_2?: string;
  custom_label_3?: string;
  custom_label_4?: string;
}

export interface GoogleShoppingFeedOptions {
  include_out_of_stock?: boolean;
  base_url?: string;
  currency?: string;
  country?: string;
  language?: string;
}

export class GoogleShoppingFeed {
  private include_out_of_stock: boolean;
  private base_url: string;
  private currency: string;
  private country: string;
  private language: string;

  constructor(options: GoogleShoppingFeedOptions = {}) {
    this.include_out_of_stock = options.include_out_of_stock || false;
    this.base_url = options.base_url || process.env.NEXT_PUBLIC_SITE_URL || 'https://domainevallot.com';
    this.currency = options.currency || 'EUR';
    this.country = options.country || 'FR';
    this.language = options.language || 'fr';
  }

  async generateXMLFeed(): Promise<string> {
    const products = await this.getProductsFromDatabase();
    const googleProducts = await this.transformProducts(products);

    return this.buildXMLFeed(googleProducts);
  }

  async generateJSONFeed(): Promise<GoogleShoppingProduct[]> {
    const products = await this.getProductsFromDatabase();
    return await this.transformProducts(products);
  }

  async validateFeed(): Promise<{ valid: boolean; errors: string[]; warnings: string[] }> {
    const products = await this.generateJSONFeed();
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const product of products) {
      // Required fields validation
      if (!product.id) errors.push(`Product missing ID: ${product.title}`);
      if (!product.title) errors.push(`Product missing title: ${product.id}`);
      if (!product.description) errors.push(`Product missing description: ${product.id}`);
      if (!product.link) errors.push(`Product missing link: ${product.id}`);
      if (!product.image_link) errors.push(`Product missing image_link: ${product.id}`);
      if (!product.availability) errors.push(`Product missing availability: ${product.id}`);
      if (!product.price) errors.push(`Product missing price: ${product.id}`);
      if (!product.brand) errors.push(`Product missing brand: ${product.id}`);
      if (!product.condition) errors.push(`Product missing condition: ${product.id}`);

      // Warnings for recommended fields
      if (!product.google_product_category) warnings.push(`Product missing google_product_category: ${product.id}`);
      if (!product.product_type) warnings.push(`Product missing product_type: ${product.id}`);
      if (!product.gtin && !product.mpn) warnings.push(`Product missing both GTIN and MPN: ${product.id}`);

      // Length validations
      if (product.title && product.title.length > 150) {
        warnings.push(`Product title too long (${product.title.length} chars): ${product.id}`);
      }
      if (product.description && product.description.length > 5000) {
        warnings.push(`Product description too long (${product.description.length} chars): ${product.id}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  private async getProductsFromDatabase() {
    const supabase = createClient();

    const { data: products, error } = await supabase
      .from('wine_products')
      .select(`
        id,
        name,
        description,
        price_euros,
        stock_quantity,
        vintage,
        region,
        grape_varieties,
        alcohol_content,
        volume_ml,
        producer,
        appellation,
        wine_type,
        serving_temperature,
        aging_potential,
        tasting_notes,
        food_pairings,
        certifications,
        slug,
        meta_description,
        image_url,
        gallery_images,
        is_active,
        gtin,
        mpn,
        created_at,
        updated_at
      `)
      .eq('is_active', true);

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return products || [];
  }

  private async transformProducts(products: any[]): Promise<GoogleShoppingProduct[]> {
    const transformedProducts: GoogleShoppingProduct[] = [];

    for (const product of products) {
      if (!this.include_out_of_stock && product.stock_quantity <= 0) {
        continue;
      }

      transformedProducts.push(await this.transformProduct(product));
    }

    return transformedProducts;
  }

  private async transformProduct(product: any): Promise<GoogleShoppingProduct> {
    const availability = this.mapAvailability(product.stock_quantity);
    const additionalImages = this.getAdditionalImages(product);

    return {
      id: product.id,
      title: this.truncateTitle(`${product.name} ${product.vintage} - ${product.producer}`),
      description: this.buildDescription(product),
      link: `${this.base_url}/products/${product.slug}`,
      image_link: product.image_url || `${this.base_url}/images/placeholder-wine.jpg`,
      additional_image_links: additionalImages.length > 0 ? additionalImages : undefined,
      availability,
      price: `${product.price_euros.toFixed(2)} ${this.currency}`,
      brand: product.producer || 'Domaine Vallot',
      condition: 'new',
      google_product_category: 'Food, Beverages & Tobacco > Beverages > Alcoholic Beverages > Wine',
      product_type: this.buildProductType(product),
      gtin: product.gtin || undefined,
      mpn: product.mpn || product.id,
      age_group: 'adult',
      shipping: this.getShippingInfo(),
      tax: this.getTaxInfo(),
      custom_label_0: product.region || undefined,
      custom_label_1: product.appellation || undefined,
      custom_label_2: product.grape_varieties?.join(', ') || undefined,
      custom_label_3: product.wine_type || undefined,
      custom_label_4: `${product.vintage}` || undefined,
    };
  }

  private mapAvailability(stockQuantity: number): 'in stock' | 'out of stock' | 'preorder' | 'backorder' {
    if (stockQuantity > 0) return 'in stock';
    return 'out of stock';
  }

  private getAdditionalImages(product: any): string[] {
    if (!product.gallery_images || !Array.isArray(product.gallery_images)) {
      return [];
    }

    // Google Shopping allows up to 10 additional images
    return product.gallery_images.slice(0, 10);
  }

  private truncateTitle(title: string): string {
    // Google Shopping title limit is 150 characters
    if (title.length <= 150) return title;
    return title.substring(0, 147) + '...';
  }

  private buildDescription(product: any): string {
    const parts: string[] = [];

    if (product.description) {
      parts.push(product.description);
    }

    if (product.tasting_notes) {
      parts.push(`Tasting Notes: ${product.tasting_notes}`);
    }

    if (product.grape_varieties && product.grape_varieties.length > 0) {
      parts.push(`Grape Varieties: ${product.grape_varieties.join(', ')}`);
    }

    if (product.alcohol_content) {
      parts.push(`Alcohol Content: ${product.alcohol_content}%`);
    }

    if (product.volume_ml) {
      parts.push(`Volume: ${product.volume_ml}ml`);
    }

    if (product.serving_temperature) {
      parts.push(`Serving Temperature: ${product.serving_temperature}`);
    }

    if (product.food_pairings && product.food_pairings.length > 0) {
      parts.push(`Food Pairings: ${product.food_pairings.join(', ')}`);
    }

    if (product.aging_potential) {
      parts.push(`Aging Potential: ${product.aging_potential}`);
    }

    if (product.certifications && product.certifications.length > 0) {
      parts.push(`Certifications: ${product.certifications.join(', ')}`);
    }

    let description = parts.join('\n\n');

    // Google Shopping description limit is 5000 characters
    if (description.length > 5000) {
      description = description.substring(0, 4997) + '...';
    }

    return description;
  }

  private buildProductType(product: any): string {
    const parts: string[] = ['Wine'];

    if (product.wine_type) {
      parts.push(this.capitalize(product.wine_type));
    }

    if (product.region) {
      parts.push(product.region);
    }

    if (product.appellation) {
      parts.push(product.appellation);
    }

    return parts.join(' > ');
  }

  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  private getShippingInfo(): Array<{ country: string; service: string; price: string }> {
    // Default shipping information for France and EU
    return [
      {
        country: 'FR',
        service: 'Standard',
        price: '9.90 EUR',
      },
      {
        country: 'FR',
        service: 'Express',
        price: '14.90 EUR',
      },
    ];
  }

  private getTaxInfo(): Array<{ country: string; region?: string; rate: string; tax_ship: boolean }> {
    // French VAT rates for wine
    return [
      {
        country: 'FR',
        rate: '20',
        tax_ship: true,
      },
    ];
  }

  private buildXMLFeed(products: GoogleShoppingProduct[]): string {
    const xmlHeader = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Domaine Vallot - Wine Products</title>
    <link>${this.base_url}</link>
    <description>Premium wines from Domaine Vallot</description>
    <language>${this.language}</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <generator>Domaine Vallot Feed Generator</generator>`;

    const xmlItems = products.map(product => this.buildXMLItem(product)).join('\n');

    const xmlFooter = `
  </channel>
</rss>`;

    return xmlHeader + '\n' + xmlItems + xmlFooter;
  }

  private buildXMLItem(product: GoogleShoppingProduct): string {
    const escapeXML = (str: string) => {
      return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
    };

    let item = `    <item>
      <g:id>${escapeXML(product.id)}</g:id>
      <g:title>${escapeXML(product.title)}</g:title>
      <g:description>${escapeXML(product.description)}</g:description>
      <g:link>${escapeXML(product.link)}</g:link>
      <g:image_link>${escapeXML(product.image_link)}</g:image_link>
      <g:availability>${escapeXML(product.availability)}</g:availability>
      <g:price>${escapeXML(product.price)}</g:price>
      <g:brand>${escapeXML(product.brand)}</g:brand>
      <g:condition>${escapeXML(product.condition)}</g:condition>
      <g:google_product_category>${escapeXML(product.google_product_category)}</g:google_product_category>
      <g:product_type>${escapeXML(product.product_type)}</g:product_type>`;

    if (product.additional_image_links) {
      product.additional_image_links.forEach(imageUrl => {
        item += `\n      <g:additional_image_link>${escapeXML(imageUrl)}</g:additional_image_link>`;
      });
    }

    if (product.gtin) {
      item += `\n      <g:gtin>${escapeXML(product.gtin)}</g:gtin>`;
    }

    if (product.mpn) {
      item += `\n      <g:mpn>${escapeXML(product.mpn)}</g:mpn>`;
    }

    if (product.age_group) {
      item += `\n      <g:age_group>${escapeXML(product.age_group)}</g:age_group>`;
    }

    // Add shipping information
    if (product.shipping) {
      product.shipping.forEach(shipping => {
        item += `\n      <g:shipping>
        <g:country>${escapeXML(shipping.country)}</g:country>
        <g:service>${escapeXML(shipping.service)}</g:service>
        <g:price>${escapeXML(shipping.price)}</g:price>
      </g:shipping>`;
      });
    }

    // Add tax information
    if (product.tax) {
      product.tax.forEach(tax => {
        item += `\n      <g:tax>
        <g:country>${escapeXML(tax.country)}</g:country>
        <g:rate>${escapeXML(tax.rate)}</g:rate>
        <g:tax_ship>${tax.tax_ship}</g:tax_ship>
      </g:tax>`;
      });
    }

    // Add custom labels
    if (product.custom_label_0) {
      item += `\n      <g:custom_label_0>${escapeXML(product.custom_label_0)}</g:custom_label_0>`;
    }
    if (product.custom_label_1) {
      item += `\n      <g:custom_label_1>${escapeXML(product.custom_label_1)}</g:custom_label_1>`;
    }
    if (product.custom_label_2) {
      item += `\n      <g:custom_label_2>${escapeXML(product.custom_label_2)}</g:custom_label_2>`;
    }
    if (product.custom_label_3) {
      item += `\n      <g:custom_label_3>${escapeXML(product.custom_label_3)}</g:custom_label_3>`;
    }
    if (product.custom_label_4) {
      item += `\n      <g:custom_label_4>${escapeXML(product.custom_label_4)}</g:custom_label_4>`;
    }

    item += '\n    </item>';

    return item;
  }

  async saveFeedToFile(filename: string): Promise<void> {
    const feed = await this.generateXMLFeed();
    const fs = await import('fs/promises');
    await fs.writeFile(filename, feed, 'utf-8');
  }
}

export const createGoogleShoppingFeed = (options?: GoogleShoppingFeedOptions) => {
  return new GoogleShoppingFeed(options);
};