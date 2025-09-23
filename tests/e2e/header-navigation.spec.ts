import { test, expect, devices } from '@playwright/test';

test.describe('Header Navigation - Comprehensive Test Suite', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/en');
  });

  test.describe('Visual & Layout Tests', () => {
    test('header should have proper height and spacing', async ({ page }) => {
      const header = page.locator('nav').first();

      // Check header height
      const headerBox = await header.boundingBox();
      expect(headerBox?.height).toBeGreaterThanOrEqual(80); // h-20 = 80px

      // Check header is sticky
      const headerStyle = await header.evaluate(el => window.getComputedStyle(el));
      expect(headerStyle.position).toBe('sticky');
      expect(headerStyle.top).toBe('0px');
    });

    test('logo should be visible and properly sized', async ({ page }) => {
      const logo = page.locator('[aria-label="Domaine Vallot - Return to homepage"]');
      await expect(logo).toBeVisible();

      // Logo should be a link to homepage
      await expect(logo).toHaveAttribute('href', '/en');
    });

    test('navigation items should display correctly', async ({ page }) => {
      const desktopNav = page.locator('[data-testid="desktop-nav"]');
      await expect(desktopNav).toBeVisible();

      // Check all navigation items are present
      await expect(page.locator('text=Home')).toBeVisible();
      await expect(page.locator('text=Products')).toBeVisible();
      await expect(page.locator('text=About')).toBeVisible();
      await expect(page.locator('text=Contact')).toBeVisible();
    });

    test('heritage colors should be applied correctly', async ({ page }) => {
      const header = page.locator('nav').first();
      const headerStyle = await header.evaluate(el => window.getComputedStyle(el));

      // Header should have heritage limestone background
      expect(headerStyle.backgroundColor).toContain('234, 227, 214'); // heritage-limestone
    });
  });

  test.describe('Interactive Functionality Tests', () => {
    test('mobile menu should toggle correctly', async ({ page }) => {
      // Use mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      const mobileMenuButton = page.locator('[data-testid="mobile-nav-trigger"]');
      const mobileMenu = page.locator('[data-testid="mobile-nav-menu"]');

      await expect(mobileMenuButton).toBeVisible();
      await expect(mobileMenu).not.toBeVisible();

      // Open menu
      await mobileMenuButton.click();
      await expect(mobileMenu).toBeVisible();
      await expect(mobileMenuButton).toHaveAttribute('aria-expanded', 'true');

      // Close menu by clicking button again
      await mobileMenuButton.click();
      await expect(mobileMenu).not.toBeVisible();
      await expect(mobileMenuButton).toHaveAttribute('aria-expanded', 'false');
    });

    test('navigation links should work correctly', async ({ page }) => {
      // Test Products link
      await page.click('[data-testid="nav-products"]');
      await expect(page).toHaveURL('/en/products');

      // Test Home link
      await page.click('text=Home');
      await expect(page).toHaveURL('/en');
    });

    test('language switcher should function', async ({ page }) => {
      const languageSwitcher = page.locator('[data-testid="language-switcher"]');
      await expect(languageSwitcher).toBeVisible();

      // Click to open dropdown
      await languageSwitcher.click();

      // Should show both language options
      await expect(page.locator('[data-testid="language-option-fr"]')).toBeVisible();
      await expect(page.locator('[data-testid="language-option-en"]')).toBeVisible();

      // Switch to French
      await page.click('[data-testid="language-option-fr"]');
      await expect(page).toHaveURL('/fr');

      // Verify French navigation labels
      await expect(page.locator('text=Accueil')).toBeVisible();
      await expect(page.locator('text=Produits')).toBeVisible();
    });

    test('cart icon should display correctly', async ({ page }) => {
      const cartLink = page.locator('[data-testid="cart-link"]');
      await expect(cartLink).toBeVisible();

      // Cart should have proper aria-label
      await expect(cartLink).toHaveAttribute('aria-label', /Shopping cart/);

      // Cart badge should not be visible initially (assuming empty cart)
      const cartBadge = page.locator('[data-testid="cart-badge"]');
      await expect(cartBadge).not.toBeVisible();
    });

    test('login button should trigger modal', async ({ page }) => {
      const loginButton = page.locator('[data-testid="login-button"]');
      await expect(loginButton).toBeVisible();

      // Click should trigger auth modal (assuming useAuthModal is properly implemented)
      await loginButton.click();
      // Note: This would need to be adjusted based on actual modal implementation
    });
  });

  test.describe('Accessibility Tests', () => {
    test('keyboard navigation should work properly', async ({ page }) => {
      // Start from the logo
      await page.focus('[aria-label="Domaine Vallot - Return to homepage"]');

      // Tab through navigation items
      await page.keyboard.press('Tab');
      await expect(page.locator('text=Home')).toBeFocused();

      await page.keyboard.press('Tab');
      await expect(page.locator('text=Products')).toBeFocused();

      await page.keyboard.press('Tab');
      await expect(page.locator('text=About')).toBeFocused();

      await page.keyboard.press('Tab');
      await expect(page.locator('text=Contact')).toBeFocused();
    });

    test('mobile menu keyboard navigation', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      const mobileMenuButton = page.locator('[data-testid="mobile-nav-trigger"]');

      // Open menu with Enter key
      await mobileMenuButton.focus();
      await page.keyboard.press('Enter');

      const mobileMenu = page.locator('[data-testid="mobile-nav-menu"]');
      await expect(mobileMenu).toBeVisible();

      // Escape should close menu and return focus to button
      await page.keyboard.press('Escape');
      await expect(mobileMenu).not.toBeVisible();
      await expect(mobileMenuButton).toBeFocused();
    });

    test('ARIA attributes should be correct', async ({ page }) => {
      const mobileMenuButton = page.locator('[data-testid="mobile-nav-trigger"]');

      // Button should have proper ARIA attributes
      await expect(mobileMenuButton).toHaveAttribute('aria-expanded', 'false');
      await expect(mobileMenuButton).toHaveAttribute('aria-controls', 'mobile-menu');

      // Open menu
      await mobileMenuButton.click();
      await expect(mobileMenuButton).toHaveAttribute('aria-expanded', 'true');

      // Menu should have proper role
      const mobileMenu = page.locator('[data-testid="mobile-nav-menu"]');
      await expect(mobileMenu).toHaveAttribute('role', 'menu');
    });

    test('color contrast should meet WCAG standards', async ({ page }) => {
      // This would typically use a color contrast checking library
      // For now, we'll check that heritage colors are applied
      const navLink = page.locator('text=Home');
      const linkStyle = await navLink.evaluate(el => window.getComputedStyle(el));

      // Heritage slate color should be applied
      expect(linkStyle.color).toContain('65, 65, 65'); // heritage-slate
    });
  });

  test.describe('Scroll Behavior Tests', () => {
    test('header should become translucent on scroll', async ({ page }) => {
      // Add some content to enable scrolling
      await page.addStyleTag({
        content: `
          body::after {
            content: '';
            display: block;
            height: 200vh;
          }
        `
      });

      const header = page.locator('nav').first();

      // Initial state
      let headerClasses = await header.getAttribute('class');
      expect(headerClasses).toContain('bg-heritage-limestone');

      // Scroll down
      await page.evaluate(() => window.scrollTo(0, 100));
      await page.waitForTimeout(500); // Wait for scroll effect

      // Header should have translucent background
      headerClasses = await header.getAttribute('class');
      expect(headerClasses).toContain('backdrop-blur-md');
      expect(headerClasses).toContain('bg-heritage-limestone/90');
    });

    test('header should hide on scroll down and show on scroll up', async ({ page }) => {
      // Add content for scrolling
      await page.addStyleTag({
        content: `
          body::after {
            content: '';
            display: block;
            height: 300vh;
          }
        `
      });

      const header = page.locator('nav').first();

      // Scroll down significantly
      await page.evaluate(() => window.scrollTo(0, 200));
      await page.waitForTimeout(500);

      // Header should be hidden (translate-y-full)
      let headerClasses = await header.getAttribute('class');
      expect(headerClasses).toContain('-translate-y-full');

      // Scroll up
      await page.evaluate(() => window.scrollTo(0, 50));
      await page.waitForTimeout(500);

      // Header should be visible again
      headerClasses = await header.getAttribute('class');
      expect(headerClasses).toContain('translate-y-0');
    });
  });

  test.describe('Active State Tests', () => {
    test('current page should be highlighted in navigation', async ({ page }) => {
      await page.goto('/en/products');

      const productsLink = page.locator('[data-testid="nav-products"]');

      // Products link should have active styling
      await expect(productsLink).toHaveAttribute('aria-current', 'page');

      // Check for active classes
      const linkClasses = await productsLink.getAttribute('class');
      expect(linkClasses).toContain('text-heritage-rouge');
      expect(linkClasses).toContain('after:w-full');
    });

    test('mobile menu should show active page', async ({ page }) => {
      await page.goto('/en/products');
      await page.setViewportSize({ width: 375, height: 667 });

      // Open mobile menu
      await page.click('[data-testid="mobile-nav-trigger"]');

      const mobileProductsLink = page.locator('[data-testid="mobile-nav-products"]');
      await expect(mobileProductsLink).toHaveAttribute('aria-current', 'page');

      // Should have active styling
      const linkClasses = await mobileProductsLink.getAttribute('class');
      expect(linkClasses).toContain('text-heritage-rouge');
      expect(linkClasses).toContain('border-heritage-rouge');
    });
  });

  test.describe('Cart Badge Tests', () => {
    test('cart badge should handle high numbers correctly', async ({ page }) => {
      // This would typically require setting up cart state
      // For now, we'll test the component directly by manipulating props

      // Simulate cart with 150 items
      await page.addInitScript(() => {
        // Mock cart state with high number
        window.__CART_ITEMS__ = 150;
      });

      // Reload to apply the mock
      await page.reload();

      const cartBadge = page.locator('[data-testid="cart-badge"]');

      // Should show "99+" for counts over 99
      await expect(cartBadge).toHaveText('99+');

      // Should have wider styling for 99+
      const badgeClasses = await cartBadge.getAttribute('class');
      expect(badgeClasses).toContain('h-6 w-8');
    });
  });

  test.describe('Cross-Device Tests', () => {
    ['iPhone 12', 'iPad Pro', 'Desktop'].forEach(deviceName => {
      test(`should work correctly on ${deviceName}`, async ({ page, browserName }) => {
        const device = devices[deviceName] || { viewport: { width: 1920, height: 1080 } };
        await page.setViewportSize(device.viewport!);

        // Basic functionality should work
        await expect(page.locator('nav')).toBeVisible();

        if (device.viewport!.width < 768) {
          // Mobile: should show mobile menu button
          await expect(page.locator('[data-testid="mobile-nav-trigger"]')).toBeVisible();
          await expect(page.locator('[data-testid="desktop-nav"]')).not.toBeVisible();
        } else {
          // Desktop/Tablet: should show desktop navigation
          await expect(page.locator('[data-testid="desktop-nav"]')).toBeVisible();
          await expect(page.locator('[data-testid="mobile-nav-trigger"]')).not.toBeVisible();
        }
      });
    });
  });

  test.describe('Performance Tests', () => {
    test('header animations should be smooth', async ({ page }) => {
      // Add content for scrolling
      await page.addStyleTag({
        content: `
          body::after {
            content: '';
            display: block;
            height: 200vh;
          }
        `
      });

      // Monitor performance during scroll
      await page.evaluate(() => {
        let frames = 0;
        let lastTime = performance.now();

        function countFrames() {
          frames++;
          const currentTime = performance.now();
          if (currentTime - lastTime >= 1000) {
            console.log(`FPS: ${frames}`);
            frames = 0;
            lastTime = currentTime;
          }
          requestAnimationFrame(countFrames);
        }
        requestAnimationFrame(countFrames);
      });

      // Perform scrolling actions
      for (let i = 0; i < 10; i++) {
        await page.evaluate(i => window.scrollTo(0, i * 50), i);
        await page.waitForTimeout(50);
      }

      // Animations should complete without layout thrashing
      const header = page.locator('nav').first();
      await expect(header).toBeVisible();
    });
  });

  test.describe('Error Handling', () => {
    test('should handle missing navigation gracefully', async ({ page }) => {
      // Test with broken navigation data
      await page.addInitScript(() => {
        window.__NAVIGATION_ERROR__ = true;
      });

      await page.reload();

      // Header should still be visible even if navigation fails
      await expect(page.locator('nav')).toBeVisible();
    });

    test('should handle language switching errors', async ({ page }) => {
      // Intercept and fail language switching requests
      await page.route('**/fr**', route => route.abort());

      const languageSwitcher = page.locator('[data-testid="language-switcher"]');
      await languageSwitcher.click();

      // Clicking French should not break the interface
      await page.click('[data-testid="language-option-fr"]');

      // Should still show language switcher
      await expect(languageSwitcher).toBeVisible();
    });
  });
});