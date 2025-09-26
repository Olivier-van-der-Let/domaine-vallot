// Test script for admin products API validation
const { wineProductSchema, updateWineProductSchema, validateSchema } = require('./src/lib/validators/schemas.ts');

// Test data for creating a wine product
const createProductData = {
  sku: 'DV-SYR-2022',
  name: 'Vinsobres Rouge François',
  vintage: 2022,
  varietal: 'Syrah blend',
  region: 'Vinsobres',
  alcohol_content: 14.5,
  volume_ml: 750,
  price_eur: 25.50,
  cost_eur: 12.00,
  stock_quantity: 100,
  weight_grams: 1200,
  description_en: 'A premium red wine with notes of dark fruit and traditional terroir expression.',
  description_fr: 'Un vin rouge premium avec des notes de fruits noirs et d\'expression traditionnelle du terroir.',
  tasting_notes_en: 'Deep ruby color with aromas of blackberry, pepper, and herbs.',
  tasting_notes_fr: 'Couleur rubis profond avec des arômes de mûre, poivre et herbes.',
  organic_certified: true,
  biodynamic_certified: true,
  featured: true,
  slug_en: 'vinsobres-rouge-francois-2022',
  slug_fr: 'vinsobres-rouge-francois-2022'
};

// Test validation
console.log('Testing wine product validation...');

try {
  const validation = validateSchema(wineProductSchema, createProductData);
  if (validation.success) {
    console.log('✅ Validation passed');
    console.log('Validated data:', validation.data);
  } else {
    console.log('❌ Validation failed');
    console.log('Errors:', validation.errors);
  }
} catch (error) {
  console.log('❌ Validation error:', error.message);
}

// Test invalid data
console.log('\nTesting invalid data...');
const invalidData = {
  sku: 'invalid-sku-lowercase',
  name: 'A', // too short
  vintage: 1700, // too old
  varietal: '',
  price_eur: -10, // negative
  description_en: 'short', // too short
  description_fr: 'court' // too short
};

try {
  const validation = validateSchema(wineProductSchema, invalidData);
  if (validation.success) {
    console.log('❌ Should have failed validation');
  } else {
    console.log('✅ Validation correctly failed');
    console.log('Errors:', validation.errors);
  }
} catch (error) {
  console.log('Error during validation:', error.message);
}

console.log('\nAPI endpoint validation schemas are ready! ✅');