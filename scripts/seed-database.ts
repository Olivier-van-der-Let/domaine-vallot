import { createClient } from '@supabase/supabase-js';
import { Database } from '../src/types/database.types';

// Sample data for seeding
const sampleProducts = [
  {
    name: 'Château Vallot Rouge 2020',
    slug: 'chateau-vallot-rouge-2020',
    description: 'Un rouge puissant et élégant, élevé 18 mois en fûts de chêne français. Notes de fruits noirs, épices douces et tanins soyeux.',
    price_cents: 2850,
    product_type: 'wine' as const,
    vintage: 2020,
    alcohol_content: 14.5,
    volume_ml: 750,
    region: 'Bordeaux',
    grape_varieties: ['Merlot', 'Cabernet Sauvignon', 'Cabernet Franc'],
    tasting_notes: 'Robe rubis profonde. Au nez, arômes de cassis, mûre et notes toastées. En bouche, tanins structurés avec une belle longueur.',
    food_pairing: 'Viandes rouges grillées, gibier, fromages affinés',
    serving_temperature: '16-18°C',
    aging_potential: '8-12 ans',
    production_method: 'Agriculture biologique, vinification traditionnelle',
    terroir_description: 'Sols argilo-calcaires sur coteaux exposés sud',
    harvest_date: '2020-09-15',
    bottling_date: '2022-06-01',
    stock_quantity: 150,
    weight_grams: 1200,
    is_active: true,
    is_featured: true,
    certifications: ['bio', 'vegan'],
    image_url: '/images/products/chateau-vallot-rouge-2020.jpg'
  },
  {
    name: 'Vallot Blanc Sec 2022',
    slug: 'vallot-blanc-sec-2022',
    description: 'Blanc sec minéral et frais, expression pure de notre terroir calcaire. Fermentation en cuves inox pour préserver la fraîcheur.',
    price_cents: 2200,
    product_type: 'wine' as const,
    vintage: 2022,
    alcohol_content: 12.5,
    volume_ml: 750,
    region: 'Bordeaux',
    grape_varieties: ['Sauvignon Blanc', 'Sémillon'],
    tasting_notes: 'Robe jaune pâle aux reflets verts. Nez frais d\'agrumes et fleurs blanches. Bouche vive avec une belle acidité.',
    food_pairing: 'Fruits de mer, poissons grillés, fromages de chèvre',
    serving_temperature: '8-10°C',
    aging_potential: '3-5 ans',
    production_method: 'Agriculture biologique, fermentation contrôlée',
    terroir_description: 'Sols calcaires avec sous-sol de graves',
    harvest_date: '2022-09-05',
    bottling_date: '2023-02-15',
    stock_quantity: 200,
    weight_grams: 1200,
    is_active: true,
    is_featured: true,
    certifications: ['bio'],
    image_url: '/images/products/vallot-blanc-sec-2022.jpg'
  },
  {
    name: 'Cuvée Prestige 2018',
    slug: 'cuvee-prestige-2018',
    description: 'Notre cuvée haut de gamme, issue de nos plus vieilles vignes. Élevage de 24 mois en barriques neuves. Production limitée.',
    price_cents: 4500,
    product_type: 'wine' as const,
    vintage: 2018,
    alcohol_content: 15.0,
    volume_ml: 750,
    region: 'Bordeaux',
    grape_varieties: ['Merlot', 'Cabernet Sauvignon'],
    tasting_notes: 'Robe grenat intense. Bouquet complexe de fruits confits, épices nobles et notes vanillées. Bouche ample et veloutée.',
    food_pairing: 'Magret de canard, agneau aux herbes, chocolat noir',
    serving_temperature: '17-19°C',
    aging_potential: '15-20 ans',
    production_method: 'Sélection parcellaire, élevage en barriques neuves',
    terroir_description: 'Vignes de 50 ans sur coteaux argilo-calcaires',
    harvest_date: '2018-09-25',
    bottling_date: '2020-09-01',
    stock_quantity: 75,
    weight_grams: 1200,
    is_active: true,
    is_featured: true,
    certifications: ['bio'],
    image_url: '/images/products/cuvee-prestige-2018.jpg'
  },
  {
    name: 'Rosé de Vallot 2023',
    slug: 'rose-de-vallot-2023',
    description: 'Rosé élégant aux notes de fruits rouges et d\'agrumes. Pressurage direct pour conserver la fraîcheur et la finesse.',
    price_cents: 1850,
    product_type: 'wine' as const,
    vintage: 2023,
    alcohol_content: 12.0,
    volume_ml: 750,
    region: 'Bordeaux',
    grape_varieties: ['Merlot', 'Cabernet Franc'],
    tasting_notes: 'Robe rose saumonée. Nez délicat de fraise et pamplemousse. Bouche fraîche et équilibrée.',
    food_pairing: 'Salade estivale, grillades, cuisine méditerranéenne',
    serving_temperature: '6-8°C',
    aging_potential: '2-3 ans',
    production_method: 'Pressurage direct, fermentation à basse température',
    terroir_description: 'Sols graveleux bien drainés',
    harvest_date: '2023-08-28',
    bottling_date: '2023-12-01',
    stock_quantity: 180,
    weight_grams: 1200,
    is_active: true,
    is_featured: false,
    certifications: ['bio'],
    image_url: '/images/products/rose-de-vallot-2023.jpg'
  },
  {
    name: 'Vallot Effervescent Brut',
    slug: 'vallot-effervescent-brut',
    description: 'Méthode traditionnelle, bulles fines et persistantes. Assemblage harmonieux pour un effervescent de caractère.',
    price_cents: 3200,
    product_type: 'wine' as const,
    vintage: 2021,
    alcohol_content: 12.5,
    volume_ml: 750,
    region: 'Bordeaux',
    grape_varieties: ['Sauvignon Blanc', 'Cabernet Franc'],
    tasting_notes: 'Mousse fine et crémeuse. Nez de brioche et fruits blancs. Bouche élégante avec une belle longueur.',
    food_pairing: 'Apéritif, huîtres, desserts aux fruits',
    serving_temperature: '6-8°C',
    aging_potential: '5-7 ans',
    production_method: 'Méthode traditionnelle, 18 mois sur lies',
    terroir_description: 'Sélection de parcelles calcaires',
    harvest_date: '2021-09-01',
    bottling_date: '2023-03-15',
    stock_quantity: 120,
    weight_grams: 1200,
    is_active: true,
    is_featured: false,
    certifications: ['bio'],
    image_url: '/images/products/vallot-effervescent-brut.jpg'
  },
  {
    name: 'Moelleux des Coteaux 2020',
    slug: 'moelleux-des-coteaux-2020',
    description: 'Vin moelleux d\'exception issu de raisins surmûris. Équilibre parfait entre sucrosité et acidité.',
    price_cents: 3800,
    product_type: 'wine' as const,
    vintage: 2020,
    alcohol_content: 13.0,
    volume_ml: 500,
    region: 'Bordeaux',
    grape_varieties: ['Sémillon', 'Sauvignon Blanc'],
    tasting_notes: 'Robe dorée brillante. Arômes de miel, fruits confits et épices douces. Bouche ronde et généreuse.',
    food_pairing: 'Foie gras, desserts aux fruits, fromages bleus',
    serving_temperature: '8-10°C',
    aging_potential: '10-15 ans',
    production_method: 'Vendanges tardives, élevage en barriques',
    terroir_description: 'Coteaux ensoleillés, sols argilo-calcaires',
    harvest_date: '2020-10-15',
    bottling_date: '2021-12-01',
    stock_quantity: 60,
    weight_grams: 1000,
    is_active: true,
    is_featured: false,
    certifications: ['bio'],
    image_url: '/images/products/moelleux-des-coteaux-2020.jpg'
  }
];

const sampleCustomers = [
  {
    first_name: 'Pierre',
    last_name: 'Dubois',
    email: 'pierre.dubois@example.com',
    phone: '+33123456789',
    date_of_birth: '1985-03-15',
    is_verified: true,
    customer_type: 'consumer' as const,
    preferences: {
      newsletter: true,
      wine_types: ['rouge', 'blanc'],
      communication_language: 'fr'
    }
  },
  {
    first_name: 'Marie',
    last_name: 'Martin',
    email: 'marie.martin@example.com',
    phone: '+33987654321',
    date_of_birth: '1990-07-22',
    is_verified: true,
    customer_type: 'consumer' as const,
    preferences: {
      newsletter: true,
      wine_types: ['rosé', 'effervescent'],
      communication_language: 'fr'
    }
  },
  {
    first_name: 'John',
    last_name: 'Smith',
    email: 'john.smith@example.com',
    phone: '+447123456789',
    date_of_birth: '1978-11-08',
    is_verified: true,
    customer_type: 'consumer' as const,
    preferences: {
      newsletter: false,
      wine_types: ['rouge'],
      communication_language: 'en'
    }
  }
];

const sampleAddresses = [
  {
    customer_id: '', // Will be filled after customer creation
    address_line_1: '15 Rue de la Paix',
    address_line_2: '',
    city: 'Paris',
    postal_code: '75001',
    country_code: 'FR',
    address_type: 'billing' as const,
    is_default: true
  },
  {
    customer_id: '', // Will be filled after customer creation
    address_line_1: '42 Avenue des Champs',
    address_line_2: 'Appartement 3B',
    city: 'Lyon',
    postal_code: '69001',
    country_code: 'FR',
    address_type: 'shipping' as const,
    is_default: true
  }
];

const vatRates = [
  { country_code: 'FR', country_name: 'France', rate: 0.20, is_eu_member: true, is_active: true },
  { country_code: 'DE', country_name: 'Germany', rate: 0.19, is_eu_member: true, is_active: true },
  { country_code: 'ES', country_name: 'Spain', rate: 0.21, is_eu_member: true, is_active: true },
  { country_code: 'IT', country_name: 'Italy', rate: 0.22, is_eu_member: true, is_active: true },
  { country_code: 'NL', country_name: 'Netherlands', rate: 0.21, is_eu_member: true, is_active: true },
  { country_code: 'BE', country_name: 'Belgium', rate: 0.21, is_eu_member: true, is_active: true },
  { country_code: 'AT', country_name: 'Austria', rate: 0.20, is_eu_member: true, is_active: true },
  { country_code: 'PT', country_name: 'Portugal', rate: 0.23, is_eu_member: true, is_active: true },
  { country_code: 'LU', country_name: 'Luxembourg', rate: 0.17, is_eu_member: true, is_active: true },
  { country_code: 'DK', country_name: 'Denmark', rate: 0.25, is_eu_member: true, is_active: true },
  { country_code: 'SE', country_name: 'Sweden', rate: 0.25, is_eu_member: true, is_active: true },
  { country_code: 'FI', country_name: 'Finland', rate: 0.24, is_eu_member: true, is_active: true },
  { country_code: 'PL', country_name: 'Poland', rate: 0.23, is_eu_member: true, is_active: true },
  { country_code: 'CZ', country_name: 'Czech Republic', rate: 0.21, is_eu_member: true, is_active: true },
  { country_code: 'HU', country_name: 'Hungary', rate: 0.27, is_eu_member: true, is_active: true },
  { country_code: 'RO', country_name: 'Romania', rate: 0.19, is_eu_member: true, is_active: true },
  { country_code: 'BG', country_name: 'Bulgaria', rate: 0.20, is_eu_member: true, is_active: true },
  { country_code: 'HR', country_name: 'Croatia', rate: 0.25, is_eu_member: true, is_active: true },
  { country_code: 'SI', country_name: 'Slovenia', rate: 0.22, is_eu_member: true, is_active: true },
  { country_code: 'SK', country_name: 'Slovakia', rate: 0.20, is_eu_member: true, is_active: true },
  { country_code: 'EE', country_name: 'Estonia', rate: 0.20, is_eu_member: true, is_active: true },
  { country_code: 'LV', country_name: 'Latvia', rate: 0.21, is_eu_member: true, is_active: true },
  { country_code: 'LT', country_name: 'Lithuania', rate: 0.21, is_eu_member: true, is_active: true },
  { country_code: 'IE', country_name: 'Ireland', rate: 0.23, is_eu_member: true, is_active: true },
  { country_code: 'CY', country_name: 'Cyprus', rate: 0.19, is_eu_member: true, is_active: true },
  { country_code: 'MT', country_name: 'Malta', rate: 0.18, is_eu_member: true, is_active: true },
  { country_code: 'GR', country_name: 'Greece', rate: 0.24, is_eu_member: true, is_active: true }
];

export default async function seedDatabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables');
  }

  const supabase = createClient<Database>(supabaseUrl, supabaseKey);

  console.log('🌱 Starting database seeding...');

  try {
    // Clear existing data (be careful in production!)
    console.log('🧹 Clearing existing data...');
    await supabase.from('cart_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('order_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('orders').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('customer_addresses').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('customers').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('wine_products').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('vat_rates').delete().neq('country_code', 'XX');

    // Seed VAT rates
    console.log('💰 Seeding VAT rates...');
    const { error: vatError } = await supabase
      .from('vat_rates')
      .insert(vatRates);

    if (vatError) {
      console.error('Error seeding VAT rates:', vatError);
      throw vatError;
    }

    // Seed products
    console.log('🍷 Seeding wine products...');
    const { error: productsError } = await supabase
      .from('wine_products')
      .insert(sampleProducts);

    if (productsError) {
      console.error('Error seeding products:', productsError);
      throw productsError;
    }

    // Seed customers
    console.log('👥 Seeding customers...');
    const { data: customersData, error: customersError } = await supabase
      .from('customers')
      .insert(sampleCustomers)
      .select('id, email');

    if (customersError) {
      console.error('Error seeding customers:', customersError);
      throw customersError;
    }

    // Seed addresses
    if (customersData && customersData.length > 0) {
      console.log('🏠 Seeding customer addresses...');

      // Update sample addresses with customer IDs
      const addressesWithCustomerIds = sampleAddresses.map((address, index) => ({
        ...address,
        customer_id: customersData[index % customersData.length].id
      }));

      const { error: addressesError } = await supabase
        .from('customer_addresses')
        .insert(addressesWithCustomerIds);

      if (addressesError) {
        console.error('Error seeding addresses:', addressesError);
        throw addressesError;
      }
    }

    // Create sample orders
    console.log('📦 Creating sample orders...');

    if (customersData && customersData.length > 0) {
      const { data: productsData } = await supabase
        .from('wine_products')
        .select('id, price_cents')
        .limit(3);

      if (productsData && productsData.length > 0) {
        const sampleOrder = {
          customer_id: customersData[0].id,
          order_number: `DV-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}-0001`,
          status: 'completed' as const,
          subtotal_cents: productsData[0].price_cents * 2,
          shipping_cents: 995,
          vat_cents: Math.round((productsData[0].price_cents * 2 + 995) * 0.20),
          total_cents: Math.round((productsData[0].price_cents * 2 + 995) * 1.20),
          currency: 'EUR',
          payment_status: 'paid' as const,
          payment_method: 'credit_card',
          shipping_address: {
            address_line_1: '15 Rue de la Paix',
            city: 'Paris',
            postal_code: '75001',
            country_code: 'FR'
          },
          billing_address: {
            address_line_1: '15 Rue de la Paix',
            city: 'Paris',
            postal_code: '75001',
            country_code: 'FR'
          }
        };

        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .insert([sampleOrder])
          .select('id');

        if (orderError) {
          console.error('Error creating sample order:', orderError);
        } else if (orderData && orderData.length > 0) {
          // Add order items
          const orderItems = [
            {
              order_id: orderData[0].id,
              product_id: productsData[0].id,
              quantity: 2,
              unit_price_cents: productsData[0].price_cents,
              total_price_cents: productsData[0].price_cents * 2
            }
          ];

          const { error: orderItemsError } = await supabase
            .from('order_items')
            .insert(orderItems);

          if (orderItemsError) {
            console.error('Error creating order items:', orderItemsError);
          }
        }
      }
    }

    console.log('✅ Database seeding completed successfully!');
    console.log(`Created ${sampleProducts.length} products`);
    console.log(`Created ${sampleCustomers.length} customers`);
    console.log(`Created ${vatRates.length} VAT rates`);
    console.log('Created sample addresses and orders');

  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  }
}

// Run the seeding if this script is executed directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('🎉 Seeding completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Seeding failed:', error);
      process.exit(1);
    });
}