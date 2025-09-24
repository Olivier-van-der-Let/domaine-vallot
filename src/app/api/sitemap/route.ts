import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://domaine-vallot.com';

    // Get all products
    const { data: products, error } = await supabase
      .from('wine_products')
      .select('slug, updated_at')
      .eq('is_active', true);

    if (error) {
      console.error('Error fetching products for sitemap:', error);
    }

    const staticPages = [
      '',
      '/products',
      '/about',
      '/contact',
      '/legal/privacy',
      '/legal/terms',
      '/legal/shipping',
      '/legal/returns'
    ];

    const locales = ['fr', 'en'];

    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">`;

    // Add static pages for each locale
    for (const locale of locales) {
      for (const page of staticPages) {
        const url = `${baseUrl}/${locale}${page}`;
        const alternateLocale = locale === 'fr' ? 'en' : 'fr';
        const alternateUrl = `${baseUrl}/${alternateLocale}${page}`;

        sitemap += `
  <url>
    <loc>${url}</loc>
    <changefreq>weekly</changefreq>
    <priority>${page === '' ? '1.0' : '0.8'}</priority>
    <xhtml:link rel="alternate" hreflang="${locale}" href="${url}" />
    <xhtml:link rel="alternate" hreflang="${alternateLocale}" href="${alternateUrl}" />
  </url>`;
      }
    }

    // Add product pages for each locale
    if (products) {
      for (const product of products) {
        for (const locale of locales) {
          const url = `${baseUrl}/${locale}/products/${product.slug}`;
          const alternateLocale = locale === 'fr' ? 'en' : 'fr';
          const alternateUrl = `${baseUrl}/${alternateLocale}/products/${product.slug}`;
          const lastmod = new Date(product.updated_at).toISOString().split('T')[0];

          sitemap += `
  <url>
    <loc>${url}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
    <xhtml:link rel="alternate" hreflang="${locale}" href="${url}" />
    <xhtml:link rel="alternate" hreflang="${alternateLocale}" href="${alternateUrl}" />
  </url>`;
        }
      }
    }

    sitemap += `
</urlset>`;

    return new NextResponse(sitemap, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600'
      },
    });

  } catch (error) {
    console.error('Error generating sitemap:', error);
    return NextResponse.json(
      { error: 'Failed to generate sitemap' },
      { status: 500 }
    );
  }
}