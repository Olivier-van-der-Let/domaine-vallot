import { test, expect } from '@playwright/test';

test.describe('Complete Purchase Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to homepage
    await page.goto('/en');
  });

  test('should complete full purchase flow from product selection to order confirmation', async ({ page }) => {
    // Step 1: Browse products and select a wine
    await page.click('[data-testid="products-link"]');
    await expect(page).toHaveURL(/.*\/products/);

    // Wait for products to load
    await page.waitForSelector('[data-testid="product-grid"]');

    // Select first product
    const firstProduct = page.locator('[data-testid="product-card"]').first();
    await firstProduct.click();

    // Verify product detail page
    await expect(page.locator('[data-testid="product-detail"]')).toBeVisible();
    await expect(page.locator('[data-testid="product-price"]')).toBeVisible();

    // Step 2: Add product to cart
    await page.click('[data-testid="add-to-cart-button"]');

    // Verify cart notification or update
    await expect(page.locator('[data-testid="cart-notification"]')).toBeVisible();

    // Step 3: Navigate to cart
    await page.click('[data-testid="cart-link"]');
    await expect(page).toHaveURL(/.*\/cart/);

    // Verify cart contains the product
    await expect(page.locator('[data-testid="cart-item"]')).toBeVisible();
    await expect(page.locator('[data-testid="cart-total"]')).toBeVisible();

    // Step 4: Proceed to checkout
    await page.click('[data-testid="checkout-button"]');
    await expect(page).toHaveURL(/.*\/checkout/);

    // Step 5: Age verification
    await expect(page.locator('[data-testid="age-verification"]')).toBeVisible();
    await page.selectOption('[data-testid="birth-day"]', '15');
    await page.selectOption('[data-testid="birth-month"]', '6');
    await page.selectOption('[data-testid="birth-year"]', '1990');
    await page.click('[data-testid="verify-age-button"]');

    // Step 6: Fill shipping information
    await page.fill('[data-testid="customer-email"]', 'test@example.com');
    await page.fill('[data-testid="customer-firstname"]', 'Jean');
    await page.fill('[data-testid="customer-lastname"]', 'Dupont');
    await page.fill('[data-testid="shipping-address"]', '123 Rue de la Paix');
    await page.fill('[data-testid="shipping-city"]', 'Paris');
    await page.fill('[data-testid="shipping-postal-code"]', '75001');
    await page.selectOption('[data-testid="shipping-country"]', 'FR');

    // Step 7: Select shipping method
    await page.click('[data-testid="shipping-method-standard"]');

    // Step 8: Verify VAT calculation
    await expect(page.locator('[data-testid="vat-amount"]')).toBeVisible();
    await expect(page.locator('[data-testid="order-total"]')).toBeVisible();

    // Step 9: Accept terms and conditions
    await page.check('[data-testid="terms-checkbox"]');
    await page.check('[data-testid="privacy-checkbox"]');

    // Step 10: Proceed to payment
    await page.click('[data-testid="proceed-to-payment-button"]');

    // Mock Mollie payment (in real test, this would redirect to Mollie)
    // For this test, we'll assume the payment succeeds and redirects back
    await page.route('**/api/orders', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'test-order-123',
          status: 'pending',
          payment_url: '/en/orders/test-order-123?payment=success'
        })
      });
    });

    // Mock successful payment return
    await page.route('**/api/webhooks/mollie', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'paid' })
      });
    });

    // Step 11: Verify order confirmation
    await expect(page).toHaveURL(/.*\/orders\/.*/, { timeout: 10000 });
    await expect(page.locator('[data-testid="order-confirmation"]')).toBeVisible();
    await expect(page.locator('[data-testid="order-number"]')).toBeVisible();
    await expect(page.locator('[data-testid="order-total-final"]')).toBeVisible();

    // Step 12: Verify order details
    await expect(page.locator('[data-testid="order-items"]')).toBeVisible();
    await expect(page.locator('[data-testid="shipping-details"]')).toBeVisible();
    await expect(page.locator('[data-testid="payment-status"]')).toHaveText(/paid|completed/i);
  });

  test('should handle cart abandonment and recovery', async ({ page }) => {
    // Add product to cart
    await page.goto('/en/products');
    await page.waitForSelector('[data-testid="product-grid"]');
    await page.locator('[data-testid="product-card"]').first().click();
    await page.click('[data-testid="add-to-cart-button"]');

    // Go to checkout but don't complete
    await page.click('[data-testid="cart-link"]');
    await page.click('[data-testid="checkout-button"]');

    // Fill partial information
    await page.fill('[data-testid="customer-email"]', 'abandon@example.com');

    // Navigate away (simulate abandonment)
    await page.goto('/en');

    // Return to cart - should still have items
    await page.click('[data-testid="cart-link"]');
    await expect(page.locator('[data-testid="cart-item"]')).toBeVisible();
  });

  test('should handle out of stock scenarios', async ({ page }) => {
    // Mock out of stock product
    await page.route('**/api/products/*', async route => {
      const url = route.request().url();
      if (url.includes('/api/products/')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'test-product',
            name: 'Test Wine',
            price: 2500,
            stock_quantity: 0,
            in_stock: false
          })
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/en/products/test-wine');

    // Verify out of stock message
    await expect(page.locator('[data-testid="out-of-stock-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="add-to-cart-button"]')).toBeDisabled();
  });

  test('should handle payment failures gracefully', async ({ page }) => {
    // Set up cart with product
    await page.goto('/en/products');
    await page.waitForSelector('[data-testid="product-grid"]');
    await page.locator('[data-testid="product-card"]').first().click();
    await page.click('[data-testid="add-to-cart-button"]');

    // Proceed through checkout
    await page.click('[data-testid="cart-link"]');
    await page.click('[data-testid="checkout-button"]');

    // Fill required fields quickly
    await page.fill('[data-testid="customer-email"]', 'fail@example.com');
    await page.fill('[data-testid="customer-firstname"]', 'Test');
    await page.fill('[data-testid="customer-lastname"]', 'User');

    // Mock payment failure
    await page.route('**/api/orders', async route => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Payment failed',
          code: 'PAYMENT_DECLINED'
        })
      });
    });

    await page.click('[data-testid="proceed-to-payment-button"]');

    // Verify error handling
    await expect(page.locator('[data-testid="payment-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="payment-error"]')).toHaveText(/payment.*failed/i);

    // Verify user can retry
    await expect(page.locator('[data-testid="retry-payment-button"]')).toBeVisible();
  });
});