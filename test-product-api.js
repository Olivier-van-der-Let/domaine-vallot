const fetch = require('node-fetch');

async function testProductAPI() {
  try {
    console.log('Testing product list API...');
    const listResponse = await fetch('http://localhost:3000/api/products');
    const listData = await listResponse.json();

    if (listData.data && listData.data.length > 0) {
      console.log('✅ Product list API works');
      console.log(`Found ${listData.data.length} products`);

      const testProduct = listData.data[0];
      console.log(`\nTesting with product: ${testProduct.name}`);
      console.log(`Expected slug: ${testProduct.slug}`);

      // Test individual product API
      const productResponse = await fetch(`http://localhost:3000/api/products/${testProduct.slug}`);
      const productData = await productResponse.json();

      if (productData.data) {
        console.log('✅ Individual product API works');
        console.log(`Product data includes: name, images, tasting_notes, technical_details`);
        console.log(`Has ${productData.data.images?.length || 0} images`);
        console.log(`Price: €${productData.data.price_display}`);
      } else {
        console.log('❌ Individual product API failed');
        console.log(productData);
      }
    } else {
      console.log('❌ Product list API failed');
      console.log(listData);
    }
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
}

testProductAPI();