const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Mapping of wine names to their uploaded image filenames
const imageMapping = {
  "La Magnaneraie": "la_magnaneraie-1-265x370.png",
  "Le Coriançon rosé": "Cotes-du-Rhone-Rose-265x370.png",
  "Le Coriançon rouge": "cotes_du_rhone_rouge-265x370.png",
  "Le Coriançon blanc": "cotes_du_rhone_blanc-1-265x370.png", // Added this since you uploaded it
  "Le Haut des Côtes blanc": "haute-des-cotes-blanc-265x370.png",
  "Vinsobres L'Exception": "exception_vinsobres-265x370.png",
  "Vinsobres Le Haut des Côtes": "haut-de-cote-rouge-2016-1-265x370.png",
  "Vinsobres rouge « François »": "francois-265x370.png",
  "Vinsobres Cuvée « Claude »": "claude75-1-265x370.png" // Added this one too
};

async function updateWineImages() {
  console.log('Starting wine image URL updates...');

  // Get all wines with their current image records
  const { data: wines, error: winesError } = await supabase
    .from('wine_products')
    .select(`
      id,
      name,
      vintage,
      product_images(id, url)
    `);

  if (winesError) {
    console.error('Error fetching wines:', winesError);
    return;
  }

  console.log(`Found ${wines.length} wines to update`);

  for (const wine of wines) {
    const imageName = imageMapping[wine.name];

    if (!imageName) {
      console.log(`No image mapping found for: ${wine.name}`);
      continue;
    }

    // Get the public URL for the image from Supabase storage
    const { data: urlData } = supabase.storage
      .from('wines')
      .getPublicUrl(imageName);

    const newImageUrl = urlData.publicUrl;
    console.log(`Updating ${wine.name} to use: ${newImageUrl}`);

    // Update the existing product_images record
    if (wine.product_images && wine.product_images.length > 0) {
      const { error: updateError } = await supabase
        .from('product_images')
        .update({ url: newImageUrl })
        .eq('id', wine.product_images[0].id);

      if (updateError) {
        console.error(`Error updating image for ${wine.name}:`, updateError);
      } else {
        console.log(`✓ Updated image for ${wine.name}`);
      }
    } else {
      // Create new product_images record if none exists
      const { error: insertError } = await supabase
        .from('product_images')
        .insert({
          product_id: wine.id,
          url: newImageUrl,
          alt_text_en: `${wine.name} ${wine.vintage} bottle`,
          alt_text_fr: `Bouteille ${wine.name} ${wine.vintage}`,
          display_order: 1,
          image_type: 'bottle',
          is_primary: true
        });

      if (insertError) {
        console.error(`Error creating image for ${wine.name}:`, insertError);
      } else {
        console.log(`✓ Created image record for ${wine.name}`);
      }
    }
  }

  console.log('Wine image updates completed!');
}

updateWineImages().catch(console.error);