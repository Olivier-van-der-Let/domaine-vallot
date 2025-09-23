import { createClient } from '@/lib/supabase/server';

export interface MetaProduct {
  id: string;
  title: string;
  description: string;
  availability: 'in stock' | 'out of stock' | 'preorder' | 'discontinued';
  condition: 'new' | 'refurbished' | 'used';
  price: {
    amount: number;
    currency: string;
  };
  brand: string;
  category: string;
  images: Array<{
    url: string;
    alt_text?: string;
  }>;
  url: string;
  google_product_category?: string;
  additional_image_urls?: string[];
  age_group?: 'adult' | 'kids' | 'toddler' | 'infant' | 'newborn';
  gender?: 'male' | 'female' | 'unisex';
  size?: string;
  color?: string;
  material?: string;
  pattern?: string;
  item_group_id?: string;
  custom_labels?: {
    custom_label_0?: string;
    custom_label_1?: string;
    custom_label_2?: string;
    custom_label_3?: string;
    custom_label_4?: string;
  };
}

export interface MetaCatalogSyncOptions {
  access_token: string;
  catalog_id: string;
  batch_size?: number;
  include_out_of_stock?: boolean;
}

export class MetaCatalogSync {
  private access_token: string;
  private catalog_id: string;
  private batch_size: number;
  private include_out_of_stock: boolean;
  private base_url = 'https://graph.facebook.com/v18.0';

  constructor(options: MetaCatalogSyncOptions) {
    this.access_token = options.access_token;
    this.catalog_id = options.catalog_id;
    this.batch_size = options.batch_size || 100;
    this.include_out_of_stock = options.include_out_of_stock || false;
  }

  async syncProducts(): Promise<{ success: boolean; synced: number; errors: string[] }> {
    try {
      const products = await this.getProductsFromDatabase();
      const metaProducts = await this.transformProducts(products);

      if (!this.include_out_of_stock) {
        metaProducts.filter(p => p.availability === 'in stock');
      }

      const result = await this.uploadProductsToMeta(metaProducts);
      return result;
    } catch (error) {
      console.error('Meta catalog sync failed:', error);
      return { success: false, synced: 0, errors: [String(error)] };
    }
  }

  async syncSingleProduct(productId: string): Promise<{ success: boolean; errors: string[] }> {
    try {
      const product = await this.getProductFromDatabase(productId);
      if (!product) {
        return { success: false, errors: ['Product not found'] };
      }

      const metaProduct = await this.transformProduct(product);
      await this.uploadSingleProductToMeta(metaProduct);

      return { success: true, errors: [] };
    } catch (error) {
      console.error('Single product sync failed:', error);
      return { success: false, errors: [String(error)] };
    }
  }

  async deleteProduct(productId: string): Promise<{ success: boolean; errors: string[] }> {
    try {
      const response = await fetch(
        `${this.base_url}/${this.catalog_id}/products/${productId}?access_token=${this.access_token}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        const error = await response.text();
        return { success: false, errors: [error] };
      }

      return { success: true, errors: [] };
    } catch (error) {
      console.error('Product deletion failed:', error);
      return { success: false, errors: [String(error)] };
    }
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
        created_at,
        updated_at
      `)
      .eq('is_active', true);

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return products || [];
  }

  private async getProductFromDatabase(productId: string) {
    const supabase = createClient();

    const { data: product, error } = await supabase
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
        is_active
      `)
      .eq('id', productId)
      .eq('is_active', true)
      .single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return product;
  }

  private async transformProducts(products: any[]): Promise<MetaProduct[]> {
    return Promise.all(products.map(product => this.transformProduct(product)));
  }

  private async transformProduct(product: any): Promise<MetaProduct> {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://domainevallot.com';

    return {
      id: product.id,
      title: `${product.name} ${product.vintage}`,
      description: product.description || product.meta_description || '',
      availability: product.stock_quantity > 0 ? 'in stock' : 'out of stock',
      condition: 'new',
      price: {
        amount: product.price_euros * 100, // Meta expects price in cents
        currency: 'EUR',
      },
      brand: product.producer || 'Domaine Vallot',
      category: this.mapWineTypeToCategory(product.wine_type),
      images: this.buildImageArray(product),
      url: `${baseUrl}/products/${product.slug}`,
      google_product_category: 'Food, Beverages & Tobacco > Beverages > Alcoholic Beverages > Wine',
      age_group: 'adult',
      custom_labels: {
        custom_label_0: product.region || '',
        custom_label_1: product.appellation || '',
        custom_label_2: product.grape_varieties?.join(', ') || '',
        custom_label_3: `${product.alcohol_content}% ABV` || '',
        custom_label_4: `${product.volume_ml}ml` || '',
      },
    };
  }

  private mapWineTypeToCategory(wineType: string): string {
    const mapping: Record<string, string> = {
      'red': 'Alcoholic Beverages > Wine > Red Wine',
      'white': 'Alcoholic Beverages > Wine > White Wine',
      'rosé': 'Alcoholic Beverages > Wine > Rosé Wine',
      'sparkling': 'Alcoholic Beverages > Wine > Sparkling Wine',
      'dessert': 'Alcoholic Beverages > Wine > Dessert Wine',
      'fortified': 'Alcoholic Beverages > Wine > Fortified Wine',
    };

    return mapping[wineType] || 'Alcoholic Beverages > Wine';
  }

  private buildImageArray(product: any): Array<{ url: string; alt_text?: string }> {
    const images: Array<{ url: string; alt_text?: string }> = [];

    if (product.image_url) {
      images.push({
        url: product.image_url,
        alt_text: `${product.name} ${product.vintage}`,
      });
    }

    if (product.gallery_images && Array.isArray(product.gallery_images)) {
      product.gallery_images.forEach((imageUrl: string, index: number) => {
        images.push({
          url: imageUrl,
          alt_text: `${product.name} ${product.vintage} - Image ${index + 2}`,
        });
      });
    }

    return images;
  }

  private async uploadProductsToMeta(products: MetaProduct[]): Promise<{ success: boolean; synced: number; errors: string[] }> {
    const errors: string[] = [];
    let synced = 0;

    // Process in batches
    for (let i = 0; i < products.length; i += this.batch_size) {
      const batch = products.slice(i, i + this.batch_size);

      try {
        const batchRequests = batch.map(product => ({
          method: 'POST',
          relative_url: `${this.catalog_id}/products`,
          body: this.buildProductPayload(product),
        }));

        const response = await fetch(
          `${this.base_url}?access_token=${this.access_token}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              batch: batchRequests,
            }),
          }
        );

        if (!response.ok) {
          const error = await response.text();
          errors.push(`Batch ${i / this.batch_size + 1} failed: ${error}`);
          continue;
        }

        const results = await response.json();

        for (const result of results) {
          if (result.code === 200) {
            synced++;
          } else {
            errors.push(`Product sync failed: ${JSON.stringify(result.body)}`);
          }
        }
      } catch (error) {
        errors.push(`Batch ${i / this.batch_size + 1} error: ${String(error)}`);
      }
    }

    return {
      success: errors.length === 0,
      synced,
      errors,
    };
  }

  private async uploadSingleProductToMeta(product: MetaProduct): Promise<void> {
    const response = await fetch(
      `${this.base_url}/${this.catalog_id}/products?access_token=${this.access_token}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(this.buildProductPayload(product)),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to upload product: ${error}`);
    }
  }

  private buildProductPayload(product: MetaProduct): any {
    return {
      id: product.id,
      title: product.title,
      description: product.description,
      availability: product.availability,
      condition: product.condition,
      price: `${product.price.amount} ${product.price.currency}`,
      brand: product.brand,
      category: product.category,
      image_url: product.images[0]?.url || '',
      url: product.url,
      google_product_category: product.google_product_category,
      additional_image_urls: product.images.slice(1).map(img => img.url),
      age_group: product.age_group,
      custom_label_0: product.custom_labels?.custom_label_0,
      custom_label_1: product.custom_labels?.custom_label_1,
      custom_label_2: product.custom_labels?.custom_label_2,
      custom_label_3: product.custom_labels?.custom_label_3,
      custom_label_4: product.custom_labels?.custom_label_4,
    };
  }

  async validateConnection(): Promise<{ valid: boolean; error?: string }> {
    try {
      const response = await fetch(
        `${this.base_url}/${this.catalog_id}?fields=id,name&access_token=${this.access_token}`
      );

      if (!response.ok) {
        const error = await response.text();
        return { valid: false, error };
      }

      return { valid: true };
    } catch (error) {
      return { valid: false, error: String(error) };
    }
  }
}

export const createMetaCatalogSync = (options: MetaCatalogSyncOptions) => {
  return new MetaCatalogSync(options);
};