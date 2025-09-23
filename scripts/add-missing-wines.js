const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function generateSku(name, vintage) {
  const cleanName = name.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  return `DV-${cleanName.substring(0, 8)}-${vintage}`;
}

function generateSlug(name, vintage) {
  return name.toLowerCase()
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .replace(/\s+/g, '-') + `-${vintage}`;
}

// Missing wines that have uploaded images
const missingWines = [
  {
    name: "Le Coriançon blanc",
    vintage: 2024,
    price: 8.5,
    description: "Avec une jolie robe brillante, un nez aromatique aux notes de fleurs blanches, et une bouche bien équilibrée, ce Côtes du Rhône Blanc sera consommé à l'apéritif ou encore avec des coquillages ou du poisson grillé. Belle persistance aromatique.",
    tastingNotes: "Qu'il soit à l'apéritif, accompagné de fruits de mer ou de fromage de chèvre, ce vin blanc saura vous enchanter !",
    imageUrl: "https://vmtudbupajnjyauvqnej.supabase.co/storage/v1/object/public/wines/cotes_du_rhone_blanc-1-265x370.png",
    grapeVarieties: ["Clairette", "Grenache"],
    appellation: "Côtes du Rhône"
  },
  {
    name: "Vinsobres Cuvée « Claude »",
    vintage: 2018,
    price: 14.5,
    description: "Elevage de 6 à 8 mois d'élevage en barriques. Vieilles vignes de 67 ans en coteaux. Cette cuvée s'apprécie avec des viandes rouges, des champignons tels que les morilles, des fromages déjà affinés. Temps de garde: 10 ans.",
    tastingNotes: "Cette cuvée s'apprécie avec des viandes rouges, des champignons tels que les morilles, des fromages déjà affinés.",
    imageUrl: "https://vmtudbupajnjyauvqnej.supabase.co/storage/v1/object/public/wines/claude75-1-265x370.png",
    grapeVarieties: ["Grenache", "Syrah"],
    appellation: "Vinsobres"
  }
];

async function addMissingWines() {
  console.log('Adding missing wines with uploaded images...');

  for (const wine of missingWines) {
    const normalizedWine = {
      sku: generateSku(wine.name, wine.vintage),
      name: wine.name,
      vintage: wine.vintage,
      varietal: wine.grapeVarieties.join(', '),
      region: wine.appellation,
      volume_ml: 750,
      price_eur: wine.price,
      cost_eur: wine.price * 0.6,
      stock_quantity: 24,
      weight_grams: 1200,
      description_fr: wine.description,
      description_en: wine.description,
      tasting_notes_fr: wine.tastingNotes,
      tasting_notes_en: wine.tastingNotes,
      food_pairing_fr: wine.tastingNotes.includes('viandes') ? wine.tastingNotes : '',
      food_pairing_en: wine.tastingNotes.includes('viandes') ? wine.tastingNotes : '',
      organic_certified: false,
      biodynamic_certified: true,
      vegan_friendly: false,
      is_active: true,
      featured: wine.name.includes('Claude'),
      slug_en: generateSlug(wine.name, wine.vintage),
      slug_fr: generateSlug(wine.name, wine.vintage),
      seo_title_en: `${wine.name} ${wine.vintage} - Domaine Vallot`,
      seo_title_fr: `${wine.name} ${wine.vintage} - Domaine Vallot`,
      seo_description_en: wine.description.substring(0, 160),
      seo_description_fr: wine.description.substring(0, 160)
    };

    console.log(`Adding wine: ${wine.name} ${wine.vintage}`);

    const { data, error } = await supabase
      .from('wine_products')
      .insert(normalizedWine)
      .select();

    if (error) {
      console.error(`Error inserting ${wine.name}:`, error);
      continue;
    }

    console.log(`✓ Added: ${wine.name}`);

    // Add product image
    if (data && data[0]) {
      const imageData = {
        product_id: data[0].id,
        url: wine.imageUrl,
        alt_text_en: `${wine.name} ${wine.vintage} bottle`,
        alt_text_fr: `Bouteille ${wine.name} ${wine.vintage}`,
        display_order: 1,
        image_type: 'bottle',
        is_primary: true
      };

      const { error: imageError } = await supabase
        .from('product_images')
        .insert(imageData);

      if (imageError) {
        console.error(`Error inserting image for ${wine.name}:`, imageError);
      } else {
        console.log(`✓ Added image for: ${wine.name}`);
      }
    }
  }

  console.log('Missing wines addition completed!');
}

addMissingWines().catch(console.error);