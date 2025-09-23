import { Metadata } from 'next';
import { Product } from '@/types';

interface SEOConfig {
  title: string;
  description: string;
  keywords?: string[];
  canonical?: string;
  openGraph?: {
    title?: string;
    description?: string;
    images?: Array<{
      url: string;
      width?: number;
      height?: number;
      alt?: string;
    }>;
  };
  twitter?: {
    title?: string;
    description?: string;
    images?: string[];
  };
}

const siteConfig = {
  name: 'Domaine Vallot',
  description: 'Premium French wines from Domaine Vallot. Discover our exceptional collection of handcrafted wines with direct-to-consumer shipping across the EU.',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://domaine-vallot.com',
  ogImage: '/images/og-default.jpg',
  creator: 'Domaine Vallot',
  twitterCreator: '@domainevallot',
  keywords: [
    'french wine',
    'premium wine',
    'domaine vallot',
    'wine online',
    'boutique winery',
    'organic wine',
    'sustainable viticulture',
    'direct from producer'
  ]
};

export function generateMetadata(config: SEOConfig): Metadata {
  const title = config.title ? `${config.title} | ${siteConfig.name}` : siteConfig.name;
  const description = config.description || siteConfig.description;
  const canonical = config.canonical ? `${siteConfig.url}${config.canonical}` : undefined;

  return {
    title,
    description,
    keywords: config.keywords?.join(', ') || siteConfig.keywords.join(', '),
    authors: [{ name: siteConfig.creator }],
    creator: siteConfig.creator,
    publisher: siteConfig.creator,
    alternates: {
      canonical,
      languages: {
        'fr': '/fr',
        'en': '/en'
      }
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    openGraph: {
      type: 'website',
      locale: 'fr_FR',
      alternateLocale: ['en_US'],
      url: canonical || siteConfig.url,
      title: config.openGraph?.title || title,
      description: config.openGraph?.description || description,
      siteName: siteConfig.name,
      images: config.openGraph?.images || [
        {
          url: `${siteConfig.url}${siteConfig.ogImage}`,
          width: 1200,
          height: 630,
          alt: siteConfig.name,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: config.twitter?.title || title,
      description: config.twitter?.description || description,
      creator: siteConfig.twitterCreator,
      images: config.twitter?.images || [`${siteConfig.url}${siteConfig.ogImage}`],
    },
    viewport: 'width=device-width, initial-scale=1',
    verification: {
      google: process.env.GOOGLE_VERIFICATION_ID,
      yandex: process.env.YANDEX_VERIFICATION_ID,
      yahoo: process.env.YAHOO_VERIFICATION_ID,
    },
  };
}

export function generateProductMetadata(product: Product, locale: string = 'fr'): Metadata {
  const isWine = product.product_type === 'wine';
  const productType = isWine ? 'wine' : 'product';

  const title = `${product.name} - ${product.vintage || ''} | ${siteConfig.name}`.trim();
  const description = `${product.description || ''} Premium ${productType} from Domaine Vallot. ${product.tasting_notes || ''} Available for direct purchase with EU shipping.`.trim();

  const keywords = [
    product.name,
    product.vintage?.toString(),
    product.region,
    productType,
    'domaine vallot',
    'french wine',
    'premium wine',
    'buy wine online'
  ].filter(Boolean);

  const images = product.image_url ? [{
    url: product.image_url,
    width: 800,
    height: 1000,
    alt: `${product.name} ${product.vintage || ''} - Domaine Vallot`
  }] : undefined;

  return generateMetadata({
    title: product.name,
    description,
    keywords,
    canonical: `/${locale}/products/${product.slug}`,
    openGraph: {
      title,
      description,
      images
    },
    twitter: {
      title,
      description,
      images: images?.map(img => img.url)
    }
  });
}

export function generateStructuredData(type: 'organization' | 'winery' | 'product' | 'breadcrumbs', data?: any) {
  const baseUrl = siteConfig.url;

  switch (type) {
    case 'organization':
      return {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: siteConfig.name,
        url: baseUrl,
        logo: `${baseUrl}/images/logo.png`,
        description: siteConfig.description,
        contactPoint: {
          '@type': 'ContactPoint',
          telephone: '+33-1-23-45-67-89',
          contactType: 'customer service',
          availableLanguage: ['French', 'English']
        },
        sameAs: [
          'https://www.facebook.com/domainevallot',
          'https://www.instagram.com/domainevallot',
          'https://twitter.com/domainevallot'
        ]
      };

    case 'winery':
      return {
        '@context': 'https://schema.org',
        '@type': 'Winery',
        name: siteConfig.name,
        url: baseUrl,
        description: siteConfig.description,
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'Bordeaux',
          addressRegion: 'Nouvelle-Aquitaine',
          addressCountry: 'FR'
        },
        geo: {
          '@type': 'GeoCoordinates',
          latitude: 44.8378,
          longitude: -0.5792
        },
        foundingDate: '1985',
        founder: {
          '@type': 'Person',
          name: 'Jean Vallot'
        }
      };

    case 'product':
      if (!data) return null;
      const product = data as Product;

      return {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.name,
        description: product.description,
        image: product.image_url,
        sku: product.sku,
        brand: {
          '@type': 'Brand',
          name: siteConfig.name
        },
        manufacturer: {
          '@type': 'Organization',
          name: siteConfig.name
        },
        offers: {
          '@type': 'Offer',
          url: `${baseUrl}/products/${product.slug}`,
          priceCurrency: 'EUR',
          price: (product.price_cents / 100).toFixed(2),
          availability: product.stock_quantity > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
          seller: {
            '@type': 'Organization',
            name: siteConfig.name
          }
        },
        ...(product.product_type === 'wine' && {
          '@type': 'Product',
          category: 'Wine',
          additionalProperty: [
            {
              '@type': 'PropertyValue',
              name: 'Vintage',
              value: product.vintage
            },
            {
              '@type': 'PropertyValue',
              name: 'Region',
              value: product.region
            },
            {
              '@type': 'PropertyValue',
              name: 'Alcohol Content',
              value: `${product.alcohol_content}%`
            }
          ]
        })
      };

    case 'breadcrumbs':
      if (!data || !Array.isArray(data)) return null;

      return {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: data.map((item, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: item.name,
          item: `${baseUrl}${item.url}`
        }))
      };

    default:
      return null;
  }
}

export const defaultMetadata = generateMetadata({
  title: '',
  description: siteConfig.description
});