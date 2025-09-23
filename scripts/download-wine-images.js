const { createClient } = require('@supabase/supabase-js');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function downloadImage(url, filename) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;

    protocol.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download image: ${response.statusCode}`));
        return;
      }

      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => {
        const buffer = Buffer.concat(chunks);
        resolve(buffer);
      });
    }).on('error', reject);
  });
}

async function downloadAndUploadImages() {
  console.log('Starting wine image download and upload...');

  // Get all products with their images
  const { data: products, error: productsError } = await supabase
    .from('wine_products')
    .select(`
      id,
      name,
      vintage,
      product_images!inner(url, id)
    `);

  if (productsError) {
    console.error('Error fetching products:', productsError);
    return;
  }

  console.log(`Found ${products.length} products with images`);

  for (const product of products) {
    for (const image of product.product_images) {
      try {
        console.log(`Downloading image for ${product.name} ${product.vintage}...`);

        // Download the image
        const imageBuffer = await downloadImage(image.url);

        // Generate filename
        const originalUrl = new URL(image.url);
        const originalFilename = path.basename(originalUrl.pathname);
        const extension = path.extname(originalFilename) || '.png';
        const filename = `${product.name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}-${product.vintage}${extension}`;

        console.log(`Uploading ${filename} to Supabase storage...`);

        // Upload to Supabase storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('wines')
          .upload(filename, imageBuffer, {
            contentType: extension === '.png' ? 'image/png' : 'image/jpeg',
            upsert: true
          });

        if (uploadError) {
          console.error(`Error uploading ${filename}:`, uploadError);
          continue;
        }

        // Get the public URL
        const { data: urlData } = supabase.storage
          .from('wines')
          .getPublicUrl(filename);

        console.log(`Successfully uploaded: ${filename}`);
        console.log(`Public URL: ${urlData.publicUrl}`);

        // Update the product_images table with the new URL
        const { error: updateError } = await supabase
          .from('product_images')
          .update({ url: urlData.publicUrl })
          .eq('id', image.id);

        if (updateError) {
          console.error(`Error updating image URL for ${filename}:`, updateError);
        } else {
          console.log(`Updated image URL for ${product.name}`);
        }

      } catch (error) {
        console.error(`Error processing image for ${product.name}:`, error);
      }
    }
  }

  console.log('Image download and upload completed!');
}

downloadAndUploadImages().catch(console.error);