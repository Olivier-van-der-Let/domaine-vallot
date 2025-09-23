import { test, expect } from '@playwright/test';

test.describe('Language Switching Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Start with English locale
    await page.goto('/en');
  });

  test('should switch from English to French and maintain page context', async ({ page }) => {
    // Verify we're on English homepage
    await expect(page).toHaveURL(/.*\/en/);
    await expect(page.locator('[data-testid="main-heading"]')).toHaveText(/welcome/i);

    // Click language switcher to French
    await page.click('[data-testid="language-switcher"]');
    await page.click('[data-testid="language-option-fr"]');

    // Should redirect to French version of the same page
    await expect(page).toHaveURL(/.*\/fr/);
    await expect(page.locator('[data-testid="main-heading"]')).toHaveText(/bienvenue/i);

    // Verify navigation elements are translated
    await expect(page.locator('[data-testid="nav-products"]')).toHaveText(/produits/i);
    await expect(page.locator('[data-testid="nav-cart"]')).toHaveText(/panier/i);
  });

  test('should switch from French to English and maintain page context', async ({ page }) => {
    // Start with French
    await page.goto('/fr');
    await expect(page.locator('[data-testid="main-heading"]')).toHaveText(/bienvenue/i);

    // Switch to English
    await page.click('[data-testid="language-switcher"]');
    await page.click('[data-testid="language-option-en"]');

    // Should redirect to English version
    await expect(page).toHaveURL(/.*\/en/);
    await expect(page.locator('[data-testid="main-heading"]')).toHaveText(/welcome/i);

    // Verify navigation is in English
    await expect(page.locator('[data-testid="nav-products"]')).toHaveText(/products/i);
    await expect(page.locator('[data-testid="nav-cart"]')).toHaveText(/cart/i);
  });

  test('should maintain cart contents when switching languages', async ({ page }) => {
    // Add product to cart in English
    await page.goto('/en/products');
    await page.waitForSelector('[data-testid="product-grid"]');

    const productName = await page.locator('[data-testid="product-card"]').first().locator('[data-testid="product-name"]').textContent();
    await page.locator('[data-testid="product-card"]').first().click();
    await page.click('[data-testid="add-to-cart-button"]');

    // Verify cart has item
    await page.click('[data-testid="cart-link"]');
    await expect(page.locator('[data-testid="cart-item"]')).toBeVisible();

    // Switch to French
    await page.click('[data-testid="language-switcher"]');
    await page.click('[data-testid="language-option-fr"]');

    // Cart should still contain the item
    await expect(page).toHaveURL(/.*\/fr\/cart/);
    await expect(page.locator('[data-testid="cart-item"]')).toBeVisible();

    // Page should be in French
    await expect(page.locator('[data-testid="cart-title"]')).toHaveText(/panier/i);
    await expect(page.locator('[data-testid="checkout-button"]')).toHaveText(/commander/i);
  });

  test('should preserve user session across language switches', async ({ page }) => {
    // Mock user login
    await page.route('**/api/auth/login', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: { id: '123', email: 'test@example.com', name: 'Test User' },
          session: { access_token: 'mock-token' }
        })
      });
    });

    // Login in English
    await page.goto('/en/login');
    await page.fill('[data-testid="login-email"]', 'test@example.com');
    await page.fill('[data-testid="login-password"]', 'password123');
    await page.click('[data-testid="login-button"]');

    // Verify logged in
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();

    // Switch to French
    await page.click('[data-testid="language-switcher"]');
    await page.click('[data-testid="language-option-fr"]');

    // User should still be logged in
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
    await expect(page.locator('[data-testid="logout-link"]')).toHaveText(/déconnexion/i);
  });

  test('should handle product detail page language switching', async ({ page }) => {
    // Navigate to product in English
    await page.goto('/en/products');
    await page.waitForSelector('[data-testid="product-grid"]');
    await page.locator('[data-testid="product-card"]').first().click();

    // Get product ID from URL
    const englishUrl = page.url();
    const productSlug = englishUrl.split('/').pop();

    // Verify English content
    await expect(page.locator('[data-testid="product-description-label"]')).toHaveText(/description/i);
    await expect(page.locator('[data-testid="add-to-cart-button"]')).toHaveText(/add.*cart/i);

    // Switch to French
    await page.click('[data-testid="language-switcher"]');
    await page.click('[data-testid="language-option-fr"]');

    // Should be on French version of same product
    await expect(page).toHaveURL(new RegExp(`.*\/fr\/products\/${productSlug}`));
    await expect(page.locator('[data-testid="product-description-label"]')).toHaveText(/description/i);
    await expect(page.locator('[data-testid="add-to-cart-button"]')).toHaveText(/ajouter.*panier/i);
  });

  test('should handle checkout flow in different languages', async ({ page }) => {
    // Add product and start checkout in English
    await page.goto('/en/products');
    await page.waitForSelector('[data-testid="product-grid"]');
    await page.locator('[data-testid="product-card"]').first().click();
    await page.click('[data-testid="add-to-cart-button"]');
    await page.click('[data-testid="cart-link"]');
    await page.click('[data-testid="checkout-button"]');

    // Verify English checkout
    await expect(page.locator('[data-testid="checkout-title"]')).toHaveText(/checkout/i);
    await expect(page.locator('[data-testid="customer-email-label"]')).toHaveText(/email/i);

    // Switch to French during checkout
    await page.click('[data-testid="language-switcher"]');
    await page.click('[data-testid="language-option-fr"]');

    // Should maintain checkout state but in French
    await expect(page).toHaveURL(/.*\/fr\/checkout/);
    await expect(page.locator('[data-testid="checkout-title"]')).toHaveText(/commande/i);
    await expect(page.locator('[data-testid="customer-email-label"]')).toHaveText(/email/i);
  });

  test('should update URL structure correctly for different locales', async ({ page }) => {
    // Test various page types in English
    const englishPages = [
      { path: '/en', expectedPattern: /.*\/en$/ },
      { path: '/en/products', expectedPattern: /.*\/en\/products$/ },
      { path: '/en/cart', expectedPattern: /.*\/en\/cart$/ },
      { path: '/en/checkout', expectedPattern: /.*\/en\/checkout$/ }
    ];

    for (const { path, expectedPattern } of englishPages) {
      await page.goto(path);
      await expect(page).toHaveURL(expectedPattern);

      // Switch to French
      await page.click('[data-testid="language-switcher"]');
      await page.click('[data-testid="language-option-fr"]');

      // Verify French URL structure
      const frenchPath = path.replace('/en', '/fr');
      await expect(page).toHaveURL(new RegExp(frenchPath.replace(/\//g, '\\/')));

      // Switch back to English
      await page.click('[data-testid="language-switcher"]');
      await page.click('[data-testid="language-option-en"]');
      await expect(page).toHaveURL(expectedPattern);
    }
  });

  test('should handle browser back/forward with language switches', async ({ page }) => {
    // Start on English homepage
    await page.goto('/en');
    await expect(page).toHaveURL(/.*\/en/);

    // Go to products page
    await page.click('[data-testid="nav-products"]');
    await expect(page).toHaveURL(/.*\/en\/products/);

    // Switch to French
    await page.click('[data-testid="language-switcher"]');
    await page.click('[data-testid="language-option-fr"]');
    await expect(page).toHaveURL(/.*\/fr\/products/);

    // Use browser back button
    await page.goBack();
    // Should go back to English products page (previous state)
    await expect(page).toHaveURL(/.*\/en\/products/);

    // Use browser forward button
    await page.goForward();
    // Should go forward to French products page
    await expect(page).toHaveURL(/.*\/fr\/products/);
  });

  test('should display correct currency and formatting by locale', async ({ page }) => {
    // View product in English (should show euros with English formatting)
    await page.goto('/en/products');
    await page.waitForSelector('[data-testid="product-grid"]');

    const firstPrice = await page.locator('[data-testid="product-card"]').first().locator('[data-testid="product-price"]').textContent();
    // English should show "€25.00" or "$25.00" format
    expect(firstPrice).toMatch(/[€$][\d,]+\.?\d*/);

    // Switch to French
    await page.click('[data-testid="language-switcher"]');
    await page.click('[data-testid="language-option-fr"]');

    // French should show "25,00 €" format
    const frenchPrice = await page.locator('[data-testid="product-card"]').first().locator('[data-testid="product-price"]').textContent();
    expect(frenchPrice).toMatch(/[\d,]+,?\d*\s*€/);
  });

  test('should persist language preference across browser sessions', async ({ page, context }) => {
    // Set language to French
    await page.goto('/en');
    await page.click('[data-testid="language-switcher"]');
    await page.click('[data-testid="language-option-fr"]');
    await expect(page).toHaveURL(/.*\/fr/);

    // Create new page (simulating new tab/session)
    const newPage = await context.newPage();

    // Navigate to root - should remember French preference
    await newPage.goto('/');
    await expect(newPage).toHaveURL(/.*\/fr/);

    // Or if root redirects based on preference
    await newPage.goto('/en');
    // Should potentially redirect to French or show French content
    // This depends on implementation - might store in localStorage/cookie
  });

  test('should handle missing translations gracefully', async ({ page }) => {
    // Mock a page with missing French translations
    await page.route('**/api/translations/**', async route => {
      const url = route.request().url();
      if (url.includes('/fr/')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            'common.welcome': 'Bienvenue',
            'common.products': 'Produits',
            // Missing some translations intentionally
          })
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/en');
    await page.click('[data-testid="language-switcher"]');
    await page.click('[data-testid="language-option-fr"]');

    // Available translations should work
    await expect(page.locator('[data-testid="nav-products"]')).toHaveText(/produits/i);

    // Missing translations should fall back to English or show key
    // This depends on implementation strategy
    const fallbackElements = page.locator('[data-translation-missing]');
    if (await fallbackElements.count() > 0) {
      // Verify fallback behavior is handled gracefully
      await expect(fallbackElements.first()).toBeVisible();
    }
  });
});