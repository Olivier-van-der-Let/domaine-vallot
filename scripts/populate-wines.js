const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Scraped wine data from Domaine Vallot
const winesData = [
  {
    name: "Vinsobres L'Exception",
    vintage: 2019,
    price: 14400, // Price was in cents, converting to euros
    description: "Un vin de garde alliant fraîcheur et tanins fins, à apprécier dès maintenant. Garde: 20 ans.",
    tastingNotes: "Cette cuvée si particulière ravira vos papilles avec des viandes rouges, des marinades, omelette aux truffes ou des desserts au chocolat et fruits rouges.",
    imageUrl: "https://www.domainevallot.com/wp-content/uploads/2017/12/exception_vinsobres-600x600.png",
    grapeVarieties: ["Grenache", "Syrah"],
    appellation: "Vinsobres"
  },
  {
    name: "Vinsobres Le Haut des Côtes",
    vintage: 2018,
    price: 16.5,
    description: "Une couleur rouge foncé. Un bouquet intense avec des notes de vanille, une discrète senteur de sous-bois, et une saveur de fruits rouges. Le palais est charnu, les tanins encore présents bien que fondus. Un concentré de petits fruits rouges à maturité. Un vin à consommer dès à présent ou à garder. Temps de garde 10 ans.",
    tasting_notes: "Vin élevé 10 à 12 mois en barriques, aux tanins fins et soyeux. Se consomme avec des viandes rouges, grillades. Le vin par excellence pour accompagner une côte de boeuf! Fromages et desserts chocolatés s'associent également très bien.",
    image_url: "https://www.domainevallot.com/wp-content/uploads/2017/12/haut-de-cote-rouge-2016-1-600x600.png",
    grape_varieties: ["Grenache", "Mourvèdre", "Syrah"],
    appellation: "Vinsobres"
  },
  {
    name: "Le Haut des Côtes blanc",
    vintage: 2023,
    price: 15,
    description: "Vin blanc sec. Le viognier et le bâtonnage lors de l'élevage lui confèrent sa rondeur. Vin qui se patinera avec le temps. Temps de garde 10 ans.",
    tasting_notes: "Couleur jaune pâle, les agrumes ressortent au nez (note citronnée) avec des notes de miel. Une bouche équilibrée, pêche blanche, ample et riche, très belle persistance aromatique.",
    image_url: "https://www.domainevallot.com/wp-content/uploads/2017/12/haute-des-cotes-blanc-600x600.png",
    grape_varieties: ["Clairette", "Grenache", "Viognier"],
    appellation: "Côtes du Rhône"
  },
  {
    name: "Vinsobres Cuvée « Claude »",
    vintage: 2018,
    price: 14.5,
    description: "Elevage de 6 à 8 mois d'élevage en barriques. Vieilles vignes de 67 ans en coteaux. Cette cuvée s'apprécie avec des viandes rouges, des champignons tels que les morilles, des fromages déjà affinés. Temps de garde: 10 ans.",
    tastingNotes: "Cette cuvée s'apprécie avec des viandes rouges, des champignons tels que les morilles, des fromages déjà affinés.",
    imageUrl: "https://www.domainevallot.com/wp-content/uploads/2017/12/claude75-1-600x600.png",
    grapeVarieties: ["Grenache", "Syrah"],
    appellation: "Vinsobres"
  },
  {
    name: "La Magnaneraie",
    vintage: 2023,
    price: 11,
    description: "La Magnaneraie est un vin à la robe d'un rouge soutenu aux reflets violacés. Le nez est très aromatique avec des senteurs d'épices et de fruits noirs. En bouche, les tanins sont fondus. C'est un vin de bonne garde (5-6 ans).",
    tastingNotes: "Harmonizes perfectly with côte de bœuf, saucisson, olives, and cow's cheeses.",
    imageUrl: "https://www.domainevallot.com/wp-content/uploads/2017/12/la_magnaneraie-1-600x600.png",
    grapeVarieties: ["Grenache", "Syrah"],
    appellation: "Côtes du Rhône"
  },
  {
    name: "Le Coriançon rouge",
    vintage: 2023,
    price: 8.5,
    description: "Ce vin à la robe sombre possède un nez riche aux fruits mûrs macérés. Note de torréfaction en bouche, vin avec beaucoup de matière. Un vin plaisir pour une consommation courante.",
    tasting_notes: "Ce Côtes-du-Rhône souple, fruité et gouleyant s'apprécie quotidiennement, à l'apéritif et au moment des repas.",
    image_url: "https://www.domainevallot.com/wp-content/uploads/2017/12/cotes_du_rhone_rouge-600x600.png",
    grape_varieties: ["Bourboulenc", "Cinsault", "Clairette", "Grenache", "Mourvèdre", "Syrah"],
    appellation: "Côtes du Rhône"
  },
  {
    name: "Vinsobres rouge « François »",
    vintage: 2022,
    price: 12,
    description: "Robe sombre, soutenue, limpide, grenat profond. Nez assez puissant dominé par des arômes de fruits rouges bien mûrs. En bouche, très bel équilibre gustatif entre l'alcool, l'acidité, les tanins et le moelleux. Vin charnu, simple et structuré. Bonne persistance aromatique, vin qui peut être bu mais que le temps affinera. (Aucun élevage en barrique).",
    tastingNotes: "Pour un repas en famille ou entre amis, il accompagnera à merveille les viandes grillées, gratins et salades composées.",
    imageUrl: "https://www.domainevallot.com/wp-content/uploads/2017/12/francois-600x600.png",
    grapeVarieties: ["Grenache", "Mourvèdre", "Syrah"],
    appellation: "Vinsobres"
  },
  {
    name: "Le Coriançon rosé",
    vintage: 2024,
    price: 8.5, // Correcting price (51 seemed wrong)
    description: "Ce vin a une très jolie robe aux reflets pivoine. Un nez aromatique et des notes de fruits blancs en bouche. Un vin rosé tout en douceur et rondeur.",
    tastingNotes: "A consommer selon vos goûts ! Grillades, couscous, taboulés et pizzas se marieront à merveille.",
    imageUrl: "https://www.domainevallot.com/wp-content/uploads/2017/12/Cotes-du-Rhone-Rose-600x899.png",
    grapeVarieties: ["Cinsault", "Grenache"],
    appellation: "Côtes du Rhône"
  },
  {
    name: "Le Coriançon blanc",
    vintage: 2024,
    price: 8.5, // Correcting price (51 seemed wrong)
    description: "Avec une jolie robe brillante, un nez aromatique aux notes de fleurs blanches, et une bouche bien équilibrée, ce Côtes du Rhône Blanc sera consommé à l'apéritif ou encore avec des coquillages ou du poisson grillé. Belle persistance aromatique.",
    tastingNotes: "Qu'il soit à l'apéritif, accompagné de fruits de mer ou de fromage de chèvre, ce vin blanc saura vous enchanter !",
    imageUrl: "https://www.domainevallot.com/wp-content/uploads/2017/12/cotes_du_rhone_blanc-1-600x600.png",
    grapeVarieties: ["Clairette", "Grenache"],
    appellation: "Côtes du Rhône"
  }
];

function generateSku(name, vintage) {
  const cleanName = name.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  return `DV-${cleanName.substring(0, 8)}-${vintage}`;
}

function generateSlug(name, vintage) {
  return name.toLowerCase()
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .replace(/\s+/g, '-') + `-${vintage}`;
}

function determineWineColor(name, description) {
  const nameAndDesc = (name + ' ' + description).toLowerCase();
  if (nameAndDesc.includes('blanc') || nameAndDesc.includes('white')) return 'white';
  if (nameAndDesc.includes('rosé') || nameAndDesc.includes('rose')) return 'rosé';
  return 'red';
}

async function populateWines() {
  console.log('Starting wine population...');

  for (const wine of winesData) {
    // Normalize field names (handle inconsistent field naming from scraping)
    const description = wine.description || wine.tastingNotes || '';
    const tastingNotes = wine.tasting_notes || wine.tastingNotes || '';
    const imageUrl = wine.image_url || wine.imageUrl || '';
    const grapeVarieties = wine.grape_varieties || wine.grapeVarieties || [];

    const wineColor = determineWineColor(wine.name, description);

    const normalizedWine = {
      sku: generateSku(wine.name, wine.vintage),
      name: wine.name,
      vintage: wine.vintage,
      varietal: grapeVarieties.join(', '),
      region: wine.appellation || 'Vinsobres',
      volume_ml: 750,
      price_eur: wine.price,
      cost_eur: wine.price * 0.6, // Estimated cost at 60% of price
      stock_quantity: 24, // Starting with 24 bottles each
      weight_grams: 1200, // Standard wine bottle weight
      description_fr: description,
      description_en: description, // Using French as base, would need translation
      tasting_notes_fr: tastingNotes,
      tasting_notes_en: tastingNotes,
      food_pairing_fr: tastingNotes.includes('viandes') ? tastingNotes : '',
      food_pairing_en: tastingNotes.includes('viandes') ? tastingNotes : '',
      organic_certified: false,
      biodynamic_certified: true, // Domaine Vallot is biodynamic
      vegan_friendly: false,
      is_active: true,
      featured: wine.name.includes('Exception') || wine.name.includes('Claude'),
      slug_en: generateSlug(wine.name, wine.vintage),
      slug_fr: generateSlug(wine.name, wine.vintage),
      seo_title_en: `${wine.name} ${wine.vintage} - Domaine Vallot`,
      seo_title_fr: `${wine.name} ${wine.vintage} - Domaine Vallot`,
      seo_description_en: description.substring(0, 160),
      seo_description_fr: description.substring(0, 160)
    };

    console.log(`Inserting wine: ${wine.name} ${wine.vintage}`);

    const { data, error } = await supabase
      .from('wine_products')
      .insert(normalizedWine)
      .select();

    if (error) {
      console.error(`Error inserting ${wine.name}:`, error);
      continue;
    }

    console.log(`Successfully inserted: ${wine.name}`);

    // Insert product image
    if (imageUrl && data && data[0]) {
      const imageData = {
        product_id: data[0].id,
        url: imageUrl,
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
        console.log(`Successfully inserted image for: ${wine.name}`);
      }
    }
  }

  console.log('Wine population completed!');
}

populateWines().catch(console.error);