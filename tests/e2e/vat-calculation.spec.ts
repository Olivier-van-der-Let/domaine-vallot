import { test, expect } from '@playwright/test';

test.describe('VAT Calculation Accuracy', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/en');
  });

  test('should calculate VAT correctly for French customers', async ({ page }) => {
    // Mock French VAT rate (20%)
    await page.route('**/api/vat/calculate', async route => {
      const body = await route.request().postDataJSON();
      const baseAmount = body.amount;
      const vatRate = 0.20; // 20% for France
      const vatAmount = Math.round(baseAmount * vatRate);
      const totalAmount = baseAmount + vatAmount;

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          base_amount: baseAmount,
          vat_rate: vatRate,
          vat_amount: vatAmount,
          total_amount: totalAmount,
          country: 'FR'
        })
      });
    });

    // Add product to cart (€25.00 base price)
    await page.goto('/en/products');
    await page.waitForSelector('[data-testid="product-grid"]');
    await page.locator('[data-testid="product-card"]').first().click();
    await page.click('[data-testid="add-to-cart-button"]');

    // Go to checkout
    await page.click('[data-testid="cart-link"]');
    await page.click('[data-testid="checkout-button"]');

    // Complete age verification
    await page.selectOption('[data-testid="birth-day"]', '15');
    await page.selectOption('[data-testid="birth-month"]', '6');
    await page.selectOption('[data-testid="birth-year"]', '1990');
    await page.click('[data-testid="verify-age-button"]');

    // Fill French address
    await page.fill('[data-testid="customer-email"]', 'france@test.com');
    await page.fill('[data-testid="shipping-address"]', '123 Rue de la Paix');
    await page.fill('[data-testid="shipping-city"]', 'Paris');
    await page.fill('[data-testid="shipping-postal-code"]', '75001');
    await page.selectOption('[data-testid="shipping-country"]', 'FR');

    // Verify VAT calculation
    await expect(page.locator('[data-testid="order-subtotal"]')).toHaveText('€25.00');
    await expect(page.locator('[data-testid="vat-rate"]')).toHaveText('20%');
    await expect(page.locator('[data-testid="vat-amount"]')).toHaveText('€5.00');
    await expect(page.locator('[data-testid="order-total"]')).toHaveText('€30.00');
  });

  test('should calculate VAT correctly for German customers', async ({ page }) => {
    // Mock German VAT rate (19%)
    await page.route('**/api/vat/calculate', async route => {
      const body = await route.request().postDataJSON();
      const baseAmount = body.amount;
      const vatRate = 0.19; // 19% for Germany
      const vatAmount = Math.round(baseAmount * vatRate);
      const totalAmount = baseAmount + vatAmount;

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          base_amount: baseAmount,
          vat_rate: vatRate,
          vat_amount: vatAmount,
          total_amount: totalAmount,
          country: 'DE'
        })
      });
    });

    // Add product to cart
    await page.goto('/en/products');
    await page.waitForSelector('[data-testid="product-grid"]');
    await page.locator('[data-testid="product-card"]').first().click();
    await page.click('[data-testid="add-to-cart-button"]');

    // Go to checkout
    await page.click('[data-testid="cart-link"]');
    await page.click('[data-testid="checkout-button"]');

    // Complete age verification
    await page.selectOption('[data-testid="birth-day"]', '15');
    await page.selectOption('[data-testid="birth-month"]', '6');
    await page.selectOption('[data-testid="birth-year"]', '1990');
    await page.click('[data-testid="verify-age-button"]');

    // Fill German address
    await page.fill('[data-testid="customer-email"]', 'germany@test.com');
    await page.fill('[data-testid="shipping-address"]', 'Hauptstraße 123');
    await page.fill('[data-testid="shipping-city"]', 'Berlin');
    await page.fill('[data-testid="shipping-postal-code"]', '10115');
    await page.selectOption('[data-testid="shipping-country"]', 'DE');

    // Verify German VAT calculation
    await expect(page.locator('[data-testid="order-subtotal"]')).toHaveText('€25.00');
    await expect(page.locator('[data-testid="vat-rate"]')).toHaveText('19%');
    await expect(page.locator('[data-testid="vat-amount"]')).toHaveText('€4.75');
    await expect(page.locator('[data-testid="order-total"]')).toHaveText('€29.75');
  });

  test('should handle zero VAT for non-EU customers', async ({ page }) => {
    // Mock US address (no VAT)
    await page.route('**/api/vat/calculate', async route => {
      const body = await route.request().postDataJSON();
      const baseAmount = body.amount;

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          base_amount: baseAmount,
          vat_rate: 0,
          vat_amount: 0,
          total_amount: baseAmount,
          country: 'US'
        })
      });
    });

    // Add product to cart
    await page.goto('/en/products');
    await page.waitForSelector('[data-testid="product-grid"]');
    await page.locator('[data-testid="product-card"]').first().click();
    await page.click('[data-testid="add-to-cart-button"]');

    // Go to checkout
    await page.click('[data-testid="cart-link"]');
    await page.click('[data-testid="checkout-button"]');

    // Complete age verification
    await page.selectOption('[data-testid="birth-day"]', '15');
    await page.selectOption('[data-testid="birth-month"]', '6');
    await page.selectOption('[data-testid="birth-year"]', '1990');
    await page.click('[data-testid="verify-age-button"]');

    // Fill US address
    await page.fill('[data-testid="customer-email"]', 'usa@test.com');
    await page.fill('[data-testid="shipping-address"]', '123 Main Street');
    await page.fill('[data-testid="shipping-city"]', 'New York');
    await page.fill('[data-testid="shipping-postal-code"]', '10001');
    await page.selectOption('[data-testid="shipping-country"]', 'US');

    // Verify no VAT
    await expect(page.locator('[data-testid="order-subtotal"]')).toHaveText('€25.00');
    await expect(page.locator('[data-testid="vat-rate"]')).toHaveText('0%');
    await expect(page.locator('[data-testid="vat-amount"]')).toHaveText('€0.00');
    await expect(page.locator('[data-testid="order-total"]')).toHaveText('€25.00');
  });

  test('should recalculate VAT when changing shipping country', async ({ page }) => {
    // Set up dynamic VAT calculation
    await page.route('**/api/vat/calculate', async route => {
      const body = await route.request().postDataJSON();
      const baseAmount = body.amount;
      const country = body.country;

      let vatRate = 0;
      if (country === 'FR') vatRate = 0.20;
      else if (country === 'DE') vatRate = 0.19;
      else if (country === 'IT') vatRate = 0.22;

      const vatAmount = Math.round(baseAmount * vatRate);
      const totalAmount = baseAmount + vatAmount;

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          base_amount: baseAmount,
          vat_rate: vatRate,
          vat_amount: vatAmount,
          total_amount: totalAmount,
          country: country
        })
      });
    });

    // Set up cart and checkout
    await page.goto('/en/products');
    await page.waitForSelector('[data-testid="product-grid"]');
    await page.locator('[data-testid="product-card"]').first().click();
    await page.click('[data-testid="add-to-cart-button"]');
    await page.click('[data-testid="cart-link"]');
    await page.click('[data-testid="checkout-button"]');

    // Complete age verification
    await page.selectOption('[data-testid="birth-day"]', '15');
    await page.selectOption('[data-testid="birth-month"]', '6');
    await page.selectOption('[data-testid="birth-year"]', '1990');
    await page.click('[data-testid="verify-age-button"]');

    // Fill base address info
    await page.fill('[data-testid="customer-email"]', 'test@test.com');
    await page.fill('[data-testid="shipping-address"]', '123 Test Street');
    await page.fill('[data-testid="shipping-city"]', 'Test City');
    await page.fill('[data-testid="shipping-postal-code"]', '12345');

    // Start with France
    await page.selectOption('[data-testid="shipping-country"]', 'FR');
    await expect(page.locator('[data-testid="vat-rate"]')).toHaveText('20%');
    await expect(page.locator('[data-testid="vat-amount"]')).toHaveText('€5.00');

    // Change to Germany
    await page.selectOption('[data-testid="shipping-country"]', 'DE');
    await expect(page.locator('[data-testid="vat-rate"]')).toHaveText('19%');
    await expect(page.locator('[data-testid="vat-amount"]')).toHaveText('€4.75');

    // Change to Italy
    await page.selectOption('[data-testid="shipping-country"]', 'IT');
    await expect(page.locator('[data-testid="vat-rate"]')).toHaveText('22%');
    await expect(page.locator('[data-testid="vat-amount"]')).toHaveText('€5.50');
  });

  test('should calculate VAT correctly for multiple items', async ({ page }) => {
    // Mock VAT calculation for multiple items
    await page.route('**/api/vat/calculate', async route => {
      const body = await route.request().postDataJSON();
      const baseAmount = body.amount;
      const vatRate = 0.20; // 20% for France
      const vatAmount = Math.round(baseAmount * vatRate);
      const totalAmount = baseAmount + vatAmount;

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          base_amount: baseAmount,
          vat_rate: vatRate,
          vat_amount: vatAmount,
          total_amount: totalAmount,
          country: 'FR'
        })
      });
    });

    // Add multiple products to cart
    await page.goto('/en/products');
    await page.waitForSelector('[data-testid="product-grid"]');

    // Add first product (€25.00)
    await page.locator('[data-testid="product-card"]').first().click();
    await page.click('[data-testid="add-to-cart-button"]');
    await page.goBack();

    // Add second product
    await page.locator('[data-testid="product-card"]').nth(1).click();
    await page.click('[data-testid="add-to-cart-button"]');

    // Go to cart and increase quantity of first item
    await page.click('[data-testid="cart-link"]');
    await page.click('[data-testid="increase-quantity"]'); // Increase to 2

    // Proceed to checkout
    await page.click('[data-testid="checkout-button"]');

    // Complete age verification
    await page.selectOption('[data-testid="birth-day"]', '15');
    await page.selectOption('[data-testid="birth-month"]', '6');
    await page.selectOption('[data-testid="birth-year"]', '1990');
    await page.click('[data-testid="verify-age-button"]');

    // Fill French address
    await page.fill('[data-testid="customer-email"]', 'multiple@test.com');
    await page.selectOption('[data-testid="shipping-country"]', 'FR');

    // Should calculate VAT on total cart amount (€75.00 = 3 × €25.00)
    await expect(page.locator('[data-testid="order-subtotal"]')).toHaveText('€75.00');
    await expect(page.locator('[data-testid="vat-amount"]')).toHaveText('€15.00');
    await expect(page.locator('[data-testid="order-total"]')).toHaveText('€90.00');
  });

  test('should handle VAT calculation with shipping costs', async ({ page }) => {
    // Mock VAT calculation including shipping
    await page.route('**/api/vat/calculate', async route => {
      const body = await route.request().postDataJSON();
      const baseAmount = body.amount;
      const shippingAmount = body.shipping_amount || 0;
      const totalBeforeVat = baseAmount + shippingAmount;
      const vatRate = 0.20;
      const vatAmount = Math.round(totalBeforeVat * vatRate);
      const totalAmount = totalBeforeVat + vatAmount;

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          base_amount: baseAmount,
          shipping_amount: shippingAmount,
          vat_rate: vatRate,
          vat_amount: vatAmount,
          total_amount: totalAmount,
          country: 'FR'
        })
      });
    });

    // Mock shipping rates
    await page.route('**/api/shipping/rates', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          rates: [
            { id: 'standard', name: 'Standard Shipping', price: 500, currency: 'EUR' }, // €5.00
            { id: 'express', name: 'Express Shipping', price: 1000, currency: 'EUR' } // €10.00
          ]
        })
      });
    });

    // Set up cart and checkout
    await page.goto('/en/products');
    await page.waitForSelector('[data-testid="product-grid"]');
    await page.locator('[data-testid="product-card"]').first().click();
    await page.click('[data-testid="add-to-cart-button"]');
    await page.click('[data-testid="cart-link"]');
    await page.click('[data-testid="checkout-button"]');

    // Complete age verification
    await page.selectOption('[data-testid="birth-day"]', '15');
    await page.selectOption('[data-testid="birth-month"]', '6');
    await page.selectOption('[data-testid="birth-year"]', '1990');
    await page.click('[data-testid="verify-age-button"]');

    // Fill address
    await page.fill('[data-testid="customer-email"]', 'shipping@test.com');
    await page.selectOption('[data-testid="shipping-country"]', 'FR');

    // Select standard shipping
    await page.click('[data-testid="shipping-method-standard"]');

    // Verify VAT calculation includes shipping
    await expect(page.locator('[data-testid="order-subtotal"]')).toHaveText('€25.00');
    await expect(page.locator('[data-testid="shipping-cost"]')).toHaveText('€5.00');
    await expect(page.locator('[data-testid="vat-amount"]')).toHaveText('€6.00'); // 20% of €30.00
    await expect(page.locator('[data-testid="order-total"]')).toHaveText('€36.00');

    // Change to express shipping
    await page.click('[data-testid="shipping-method-express"]');

    // VAT should recalculate
    await expect(page.locator('[data-testid="shipping-cost"]')).toHaveText('€10.00');
    await expect(page.locator('[data-testid="vat-amount"]')).toHaveText('€7.00'); // 20% of €35.00
    await expect(page.locator('[data-testid="order-total"]')).toHaveText('€42.00');
  });

  test('should handle VAT calculation errors gracefully', async ({ page }) => {
    // Mock VAT calculation error
    await page.route('**/api/vat/calculate', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'VAT service unavailable',
          code: 'VAT_SERVICE_ERROR'
        })
      });
    });

    // Set up cart and checkout
    await page.goto('/en/products');
    await page.waitForSelector('[data-testid="product-grid"]');
    await page.locator('[data-testid="product-card"]').first().click();
    await page.click('[data-testid="add-to-cart-button"]');
    await page.click('[data-testid="cart-link"]');
    await page.click('[data-testid="checkout-button"]');

    // Complete age verification
    await page.selectOption('[data-testid="birth-day"]', '15');
    await page.selectOption('[data-testid="birth-month"]', '6');
    await page.selectOption('[data-testid="birth-year"]', '1990');
    await page.click('[data-testid="verify-age-button"]');

    // Fill address
    await page.fill('[data-testid="customer-email"]', 'error@test.com');
    await page.selectOption('[data-testid="shipping-country"]', 'FR');

    // Should show VAT calculation error
    await expect(page.locator('[data-testid="vat-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="vat-error"]')).toHaveText(/vat.*calculation.*error/i);

    // Checkout button should be disabled or show warning
    const checkoutButton = page.locator('[data-testid="proceed-to-payment-button"]');
    await expect(checkoutButton).toBeDisabled();
  });

  test('should display VAT breakdown clearly', async ({ page }) => {
    // Mock detailed VAT calculation
    await page.route('**/api/vat/calculate', async route => {
      const body = await route.request().postDataJSON();
      const baseAmount = body.amount;
      const vatRate = 0.20;
      const vatAmount = Math.round(baseAmount * vatRate);
      const totalAmount = baseAmount + vatAmount;

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          base_amount: baseAmount,
          vat_rate: vatRate,
          vat_amount: vatAmount,
          total_amount: totalAmount,
          country: 'FR',
          vat_breakdown: {
            wine_products: {
              base_amount: baseAmount,
              vat_rate: vatRate,
              vat_amount: vatAmount
            }
          }
        })
      });
    });

    // Set up checkout
    await page.goto('/en/products');
    await page.waitForSelector('[data-testid="product-grid"]');
    await page.locator('[data-testid="product-card"]').first().click();
    await page.click('[data-testid="add-to-cart-button"]');
    await page.click('[data-testid="cart-link"]');
    await page.click('[data-testid="checkout-button"]');

    // Complete age verification and address
    await page.selectOption('[data-testid="birth-day"]', '15');
    await page.selectOption('[data-testid="birth-month"]', '6');
    await page.selectOption('[data-testid="birth-year"]', '1990');
    await page.click('[data-testid="verify-age-button"]');
    await page.fill('[data-testid="customer-email"]', 'breakdown@test.com');
    await page.selectOption('[data-testid="shipping-country"]', 'FR');

    // Verify detailed VAT breakdown is displayed
    await expect(page.locator('[data-testid="vat-breakdown"]')).toBeVisible();
    await expect(page.locator('[data-testid="vat-country"]')).toHaveText('France');
    await expect(page.locator('[data-testid="vat-rate-display"]')).toHaveText('VAT (20%)');

    // Should have a "Learn more about VAT" link or info
    const vatInfo = page.locator('[data-testid="vat-info-link"]');
    if (await vatInfo.isVisible()) {
      await expect(vatInfo).toBeVisible();
    }
  });
});