import { test, expect, devices } from '@playwright/test';

test.describe('Mobile Responsive Behavior', () => {
  // Test on different mobile devices
  const mobileDevices = [
    { name: 'iPhone 12', device: devices['iPhone 12'] },
    { name: 'Pixel 5', device: devices['Pixel 5'] },
    { name: 'Samsung Galaxy S21', device: devices['Galaxy S III'] }
  ];

  mobileDevices.forEach(({ name, device }) => {
    test.describe(`${name} Device Tests`, () => {
      test.use({ ...device });

      test('should display mobile-optimized navigation', async ({ page }) => {
        await page.goto('/en');

        // Mobile navigation should be different from desktop
        await expect(page.locator('[data-testid="mobile-nav-trigger"]')).toBeVisible();
        await expect(page.locator('[data-testid="desktop-nav"]')).not.toBeVisible();

        // Test mobile menu toggle
        await page.click('[data-testid="mobile-nav-trigger"]');
        await expect(page.locator('[data-testid="mobile-nav-menu"]')).toBeVisible();

        // Menu should contain all navigation items
        await expect(page.locator('[data-testid="mobile-nav-products"]')).toBeVisible();
        await expect(page.locator('[data-testid="mobile-nav-cart"]')).toBeVisible();
        await expect(page.locator('[data-testid="mobile-nav-account"]')).toBeVisible();

        // Close menu
        await page.click('[data-testid="mobile-nav-close"]');
        await expect(page.locator('[data-testid="mobile-nav-menu"]')).not.toBeVisible();
      });

      test('should display products in mobile grid layout', async ({ page }) => {
        await page.goto('/en/products');
        await page.waitForSelector('[data-testid="product-grid"]');

        // Products should be in single or double column on mobile
        const productGrid = page.locator('[data-testid="product-grid"]');
        const gridCols = await productGrid.evaluate(el => {
          const styles = window.getComputedStyle(el);
          return styles.getPropertyValue('grid-template-columns');
        });

        // Should not be more than 2 columns on mobile
        const columnCount = gridCols.split(' ').length;
        expect(columnCount).toBeLessThanOrEqual(2);

        // Product cards should be touch-friendly
        const firstProduct = page.locator('[data-testid="product-card"]').first();
        const cardSize = await firstProduct.boundingBox();
        expect(cardSize?.height).toBeGreaterThan(100); // Minimum touch target
      });

      test('should handle mobile cart interactions', async ({ page }) => {
        await page.goto('/en/products');
        await page.waitForSelector('[data-testid="product-grid"]');

        // Add product to cart
        await page.locator('[data-testid="product-card"]').first().click();
        await page.click('[data-testid="add-to-cart-button"]');

        // Mobile cart icon should show item count
        await expect(page.locator('[data-testid="cart-badge"]')).toBeVisible();
        await expect(page.locator('[data-testid="cart-badge"]')).toHaveText('1');

        // Access cart through mobile navigation
        await page.click('[data-testid="mobile-nav-trigger"]');
        await page.click('[data-testid="mobile-nav-cart"]');

        // Cart should display in mobile-friendly format
        await expect(page.locator('[data-testid="cart-item-mobile"]')).toBeVisible();

        // Quantity controls should be touch-friendly
        const quantityControl = page.locator('[data-testid="quantity-controls"]');
        const controlSize = await quantityControl.boundingBox();
        expect(controlSize?.height).toBeGreaterThan(44); // iOS recommended minimum
      });

      test('should optimize checkout form for mobile', async ({ page }) => {
        // Add product first
        await page.goto('/en/products');
        await page.waitForSelector('[data-testid="product-grid"]');
        await page.locator('[data-testid="product-card"]').first().click();
        await page.click('[data-testid="add-to-cart-button"]');

        // Go to checkout
        await page.click('[data-testid="mobile-nav-trigger"]');
        await page.click('[data-testid="mobile-nav-cart"]');
        await page.click('[data-testid="checkout-button"]');

        // Age verification should be mobile-optimized
        const ageModal = page.locator('[data-testid="age-verification"]');
        await expect(ageModal).toBeVisible();

        // Dropdowns should be large enough for touch
        const dayDropdown = page.locator('[data-testid="birth-day"]');
        const dropdownSize = await dayDropdown.boundingBox();
        expect(dropdownSize?.height).toBeGreaterThan(44);

        await page.selectOption('[data-testid="birth-day"]', '15');
        await page.selectOption('[data-testid="birth-month"]', '6');
        await page.selectOption('[data-testid="birth-year"]', '1990');
        await page.click('[data-testid="verify-age-button"]');

        // Form fields should stack vertically on mobile
        const emailField = page.locator('[data-testid="customer-email"]');
        const firstnameField = page.locator('[data-testid="customer-firstname"]');

        const emailPos = await emailField.boundingBox();
        const firstnamePos = await firstnameField.boundingBox();

        // Fields should be stacked (firstname below email)
        expect(firstnamePos?.y).toBeGreaterThan(emailPos?.y || 0);

        // Input fields should span full width
        expect(emailPos?.width).toBeGreaterThan(250);
      });

      test('should handle mobile payment flow', async ({ page }) => {
        // Set up cart and checkout
        await page.goto('/en/products');
        await page.waitForSelector('[data-testid="product-grid"]');
        await page.locator('[data-testid="product-card"]').first().click();
        await page.click('[data-testid="add-to-cart-button"]');
        await page.click('[data-testid="mobile-nav-trigger"]');
        await page.click('[data-testid="mobile-nav-cart"]');
        await page.click('[data-testid="checkout-button"]');

        // Complete age verification
        await page.selectOption('[data-testid="birth-day"]', '15');
        await page.selectOption('[data-testid="birth-month"]', '6');
        await page.selectOption('[data-testid="birth-year"]', '1990');
        await page.click('[data-testid="verify-age-button"]');

        // Fill minimal required fields
        await page.fill('[data-testid="customer-email"]', 'mobile@test.com');
        await page.fill('[data-testid="customer-firstname"]', 'Mobile');
        await page.fill('[data-testid="customer-lastname"]', 'User');

        // Payment button should be prominent and touch-friendly
        const paymentButton = page.locator('[data-testid="proceed-to-payment-button"]');
        await expect(paymentButton).toBeVisible();

        const buttonSize = await paymentButton.boundingBox();
        expect(buttonSize?.height).toBeGreaterThan(48); // Good touch target
        expect(buttonSize?.width).toBeGreaterThan(200); // Prominent width
      });
    });
  });

  test.describe('Cross-Device Responsive Tests', () => {
    test('should adapt to different screen orientations', async ({ page, browser }) => {
      // Test portrait mode
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/en');

      // Mobile nav should be visible in portrait
      await expect(page.locator('[data-testid="mobile-nav-trigger"]')).toBeVisible();

      // Test landscape mode (wider but still mobile height)
      await page.setViewportSize({ width: 667, height: 375 });

      // Should still use mobile layout due to height constraint
      await expect(page.locator('[data-testid="mobile-nav-trigger"]')).toBeVisible();

      // Test tablet landscape (should show desktop nav)
      await page.setViewportSize({ width: 1024, height: 768 });
      await expect(page.locator('[data-testid="desktop-nav"]')).toBeVisible();
      await expect(page.locator('[data-testid="mobile-nav-trigger"]')).not.toBeVisible();
    });

    test('should handle touch vs mouse interactions', async ({ page }) => {
      // Mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/en/products');
      await page.waitForSelector('[data-testid="product-grid"]');

      // Touch interactions should work
      await page.tap('[data-testid="product-card"]');
      await expect(page).toHaveURL(/.*\/products\/.*/);

      // Hover effects should not interfere with touch
      // (This would be tested through CSS inspection in real scenarios)
      const productCard = page.locator('[data-testid="product-card"]').first();
      await expect(productCard).toBeVisible();
    });

    test('should maintain performance on mobile devices', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      // Simulate slower network (mobile 3G)
      const client = await page.context().newCDPSession(page);
      await client.send('Network.emulateNetworkConditions', {
        offline: false,
        downloadThroughput: 1.5 * 1024 * 1024 / 8, // 1.5 Mbps
        uploadThroughput: 750 * 1024 / 8, // 750 kbps
        latency: 40 // 40ms
      });

      const startTime = Date.now();
      await page.goto('/en');
      const loadTime = Date.now() - startTime;

      // Page should load reasonably fast even on slow connection
      expect(loadTime).toBeLessThan(5000); // 5 seconds max

      // Essential content should be visible
      await expect(page.locator('[data-testid="main-heading"]')).toBeVisible();
    });

    test('should handle mobile-specific gestures', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/en/products');
      await page.waitForSelector('[data-testid="product-grid"]');

      // Test swipe navigation if implemented
      const productGrid = page.locator('[data-testid="product-grid"]');

      // Swipe down to scroll
      await productGrid.hover();
      await page.mouse.down();
      await page.mouse.move(0, -100);
      await page.mouse.up();

      // Should scroll products or trigger refresh
      await page.waitForTimeout(1000);

      // Test pinch-to-zoom prevention (if implemented)
      // This would require more sophisticated gesture simulation
    });

    test('should optimize images for mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/en/products');
      await page.waitForSelector('[data-testid="product-grid"]');

      // Product images should use appropriate sizes for mobile
      const productImages = page.locator('[data-testid="product-image"]');
      const firstImage = productImages.first();

      // Check if responsive images are being used
      const srcset = await firstImage.getAttribute('srcset');
      const sizes = await firstImage.getAttribute('sizes');

      // Should have responsive image attributes
      expect(srcset || sizes).toBeTruthy();

      // Image should not be oversized for mobile
      const imageSize = await firstImage.boundingBox();
      expect(imageSize?.width).toBeLessThanOrEqual(375);
    });

    test('should provide mobile-friendly error states', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      // Test network error
      await page.route('**/api/products', route => route.abort());
      await page.goto('/en/products');

      // Error message should be mobile-optimized
      const errorMessage = page.locator('[data-testid="error-message"]');
      await expect(errorMessage).toBeVisible();

      // Error should not overflow mobile screen
      const errorSize = await errorMessage.boundingBox();
      expect(errorSize?.width).toBeLessThanOrEqual(375);

      // Retry button should be touch-friendly
      const retryButton = page.locator('[data-testid="retry-button"]');
      if (await retryButton.isVisible()) {
        const buttonSize = await retryButton.boundingBox();
        expect(buttonSize?.height).toBeGreaterThan(44);
      }
    });

    test('should handle mobile accessibility features', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/en');

      // Test focus management for mobile keyboard navigation
      await page.keyboard.press('Tab');
      const focusedElement = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'));
      expect(focusedElement).toBeTruthy();

      // Test skip links for mobile screen readers
      const skipLink = page.locator('[data-testid="skip-to-content"]');
      if (await skipLink.isVisible()) {
        await expect(skipLink).toBeVisible();
      }

      // Test high contrast mode compatibility
      await page.emulateMedia({ colorScheme: 'dark' });
      await page.waitForTimeout(500);

      // Elements should still be visible in dark mode
      await expect(page.locator('[data-testid="main-heading"]')).toBeVisible();
    });

    test('should maintain cart state across mobile app-like navigation', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      // Add product to cart
      await page.goto('/en/products');
      await page.waitForSelector('[data-testid="product-grid"]');
      await page.locator('[data-testid="product-card"]').first().click();
      await page.click('[data-testid="add-to-cart-button"]');

      // Navigate away and back (simulating app-like behavior)
      await page.goBack(); // Back to products
      await page.goBack(); // Back to home
      await page.goForward(); // Forward to products
      await page.goForward(); // Forward to product detail

      // Cart state should be preserved
      await page.click('[data-testid="mobile-nav-trigger"]');
      await page.click('[data-testid="mobile-nav-cart"]');
      await expect(page.locator('[data-testid="cart-item"]')).toBeVisible();
    });
  });
});