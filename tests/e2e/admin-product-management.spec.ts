import { test, expect } from '@playwright/test';

test.describe('Admin Product Management', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication to simulate admin user
    await page.route('**/api/auth/**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: 'admin-123',
            email: 'admin@example.com',
            role: 'admin'
          }
        })
      });
    });

    // Mock admin check
    await page.route('**/api/admin/check', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          isAdmin: true
        })
      });
    });

    // Mock products API
    await page.route('**/api/admin/products', (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            products: [
              {
                id: 'test-product-1',
                name: 'Test Wine 2020',
                sku: 'TEST-001',
                varietal: 'Chardonnay',
                vintage: 2020,
                price_eur: 25.00,
                stock_quantity: 100,
                is_active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }
            ],
            pagination: {
              total: 1,
              page: 1,
              limit: 20,
              totalPages: 1
            }
          })
        });
      } else if (route.request().method() === 'POST') {
        route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            product: {
              id: 'new-product-123',
              name: 'New Test Wine',
              sku: 'NEW-TEST-001',
              varietal: 'Merlot',
              vintage: 2021,
              price_eur: 30.00,
              stock_quantity: 50,
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          })
        });
      }
    });

    // Mock individual product API
    await page.route('**/api/admin/products/*', (route) => {
      const url = route.request().url();
      const productId = url.split('/').pop();

      if (route.request().method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            product: {
              id: productId,
              name: 'Test Wine 2020',
              sku: 'TEST-001',
              varietal: 'Chardonnay',
              vintage: 2020,
              region: 'Burgundy',
              alcohol_content: 13.5,
              volume_ml: 750,
              price_eur: 25.00,
              cost_eur: 15.00,
              stock_quantity: 100,
              reserved_quantity: 0,
              reorder_level: 10,
              weight_grams: 1200,
              description_en: 'A fine Chardonnay wine',
              description_fr: 'Un excellent vin Chardonnay',
              is_active: true,
              featured: false,
              slug_en: 'test-wine-chardonnay-2020',
              slug_fr: 'vin-test-chardonnay-2020',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              product_images: []
            }
          })
        });
      } else if (route.request().method() === 'PUT') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            product: {
              id: productId,
              name: 'Updated Test Wine',
              sku: 'TEST-001',
              varietal: 'Chardonnay',
              vintage: 2020,
              price_eur: 28.00,
              stock_quantity: 95,
              is_active: true,
              updated_at: new Date().toISOString()
            }
          })
        });
      } else if (route.request().method() === 'DELETE') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'Product deleted successfully'
          })
        });
      }
    });

    // Login as admin
    await page.goto('/fr/login');
    await page.fill('[data-testid="email-input"]', 'oliviervanderlet@gmail.com');
    await page.fill('[data-testid="password-input"]', '5ikt7WzF!');
    await page.click('[data-testid="login-button"]');

    // Wait for redirect to admin panel
    await page.waitForURL('**/fr/admin');
  });

  test('should display admin products list', async ({ page }) => {
    await page.goto('/fr/admin/products');

    // Wait for products to load
    await page.waitForSelector('[data-testid="products-table"]');

    // Check that product appears in the list
    await expect(page.locator('text=Test Wine 2020')).toBeVisible();
    await expect(page.locator('text=TEST-001')).toBeVisible();
    await expect(page.locator('text=Chardonnay')).toBeVisible();
    await expect(page.locator('text=€25.00')).toBeVisible();
  });

  test('should filter products by search term', async ({ page }) => {
    await page.goto('/fr/admin/products');

    // Wait for products to load
    await page.waitForSelector('[data-testid="products-table"]');

    // Search for specific product
    await page.fill('[data-testid="search-input"]', 'Chardonnay');
    await page.click('[data-testid="search-button"]');

    // Should show filtered results
    await expect(page.locator('text=Test Wine 2020')).toBeVisible();
  });

  test('should filter products by stock status', async ({ page }) => {
    await page.goto('/fr/admin/products');

    // Wait for products to load
    await page.waitForSelector('[data-testid="products-table"]');

    // Filter by active products
    await page.selectOption('[data-testid="status-filter"]', 'active');

    // Should show only active products
    await expect(page.locator('[data-testid="product-row"]')).toHaveCount(1);
  });

  test('should navigate to create new product page', async ({ page }) => {
    await page.goto('/fr/admin/products');

    // Click "Add New Product" button
    await page.click('[data-testid="add-product-button"]');

    // Should navigate to new product page
    await page.waitForURL('**/fr/admin/products/new');
    await expect(page.locator('h1')).toContainText('Add New Wine Product');
  });

  test('should create a new product', async ({ page }) => {
    await page.goto('/fr/admin/products/new');

    // Wait for form to load
    await page.waitForSelector('[data-testid="product-form"]');

    // Fill required fields
    await page.fill('[data-testid="name-input"]', 'New Test Wine');
    await page.fill('[data-testid="varietal-input"]', 'Merlot');
    await page.fill('[data-testid="price-input"]', '30.00');
    await page.fill('[data-testid="stock-input"]', '50');
    await page.fill('[data-testid="volume-input"]', '750');
    await page.fill('[data-testid="weight-input"]', '1200');

    // Submit form
    await page.click('[data-testid="save-button"]');

    // Should show success message
    await expect(page.locator('text=Product Created!')).toBeVisible();

    // Should redirect to products list
    await page.waitForURL('**/fr/admin/products');
  });

  test('should validate required fields when creating product', async ({ page }) => {
    await page.goto('/fr/admin/products/new');

    // Wait for form to load
    await page.waitForSelector('[data-testid="product-form"]');

    // Try to submit without filling required fields
    await page.click('[data-testid="save-button"]');

    // Should show validation errors
    await expect(page.locator('text=Name is required')).toBeVisible();
    await expect(page.locator('text=Varietal is required')).toBeVisible();
    await expect(page.locator('text=Price is required')).toBeVisible();
  });

  test('should auto-generate SKU and slugs', async ({ page }) => {
    await page.goto('/fr/admin/products/new');

    // Wait for form to load
    await page.waitForSelector('[data-testid="product-form"]');

    // Fill name and vintage
    await page.fill('[data-testid="name-input"]', 'Château Margaux');
    await page.fill('[data-testid="vintage-input"]', '2015');

    // Wait for auto-generation
    await page.waitForTimeout(500);

    // Check that SKU was auto-generated
    const skuValue = await page.inputValue('[data-testid="sku-input"]');
    expect(skuValue).toBe('CHATEAU-MARGAUX-2015');

    // Check that slugs were auto-generated
    const slugEnValue = await page.inputValue('[data-testid="slug-en-input"]');
    const slugFrValue = await page.inputValue('[data-testid="slug-fr-input"]');
    expect(slugEnValue).toBe('chateau-margaux-2015');
    expect(slugFrValue).toBe('chateau-margaux-2015');
  });

  test('should edit existing product', async ({ page }) => {
    await page.goto('/fr/admin/products');

    // Wait for products to load
    await page.waitForSelector('[data-testid="products-table"]');

    // Click edit button for first product
    await page.click('[data-testid="edit-product-button"]');

    // Should navigate to edit page
    await page.waitForURL('**/fr/admin/products/*/edit');
    await expect(page.locator('h1')).toContainText('Edit: Test Wine 2020');

    // Form should be populated with existing data
    await expect(page.locator('[data-testid="name-input"]')).toHaveValue('Test Wine 2020');
    await expect(page.locator('[data-testid="sku-input"]')).toHaveValue('TEST-001');

    // Update product name
    await page.fill('[data-testid="name-input"]', 'Updated Test Wine');
    await page.fill('[data-testid="price-input"]', '28.00');

    // Submit changes
    await page.click('[data-testid="save-button"]');

    // Should show success message
    await expect(page.locator('text=Product Updated!')).toBeVisible();

    // Should redirect to products list
    await page.waitForURL('**/fr/admin/products');
  });

  test('should delete product with confirmation', async ({ page }) => {
    await page.goto('/fr/admin/products');

    // Wait for products to load
    await page.waitForSelector('[data-testid="products-table"]');

    // Click delete button
    await page.click('[data-testid="delete-product-button"]');

    // Should show confirmation dialog
    await expect(page.locator('text=Are you sure you want to delete this product?')).toBeVisible();

    // Confirm deletion
    await page.click('[data-testid="confirm-delete-button"]');

    // Should show success message
    await expect(page.locator('text=Product deleted successfully')).toBeVisible();

    // Product should be removed from list
    await expect(page.locator('text=Test Wine 2020')).not.toBeVisible();
  });

  test('should handle form validation errors', async ({ page }) => {
    await page.goto('/fr/admin/products/new');

    // Wait for form to load
    await page.waitForSelector('[data-testid="product-form"]');

    // Fill invalid data
    await page.fill('[data-testid="price-input"]', '-10');
    await page.fill('[data-testid="stock-input"]', '-5');
    await page.fill('[data-testid="weight-input"]', '0');

    // Try to submit
    await page.click('[data-testid="save-button"]');

    // Should show validation errors
    await expect(page.locator('text=Price must be greater than 0')).toBeVisible();
    await expect(page.locator('text=Stock quantity cannot be negative')).toBeVisible();
    await expect(page.locator('text=Weight must be greater than 0')).toBeVisible();
  });

  test('should navigate between form sections', async ({ page }) => {
    await page.goto('/fr/admin/products/new');

    // Wait for form to load
    await page.waitForSelector('[data-testid="product-form"]');

    // Basic Info section should be expanded by default
    await expect(page.locator('[data-testid="basic-info-section"]')).toBeVisible();

    // Click on Pricing section header
    await page.click('[data-testid="pricing-section-header"]');

    // Pricing section should be expanded
    await expect(page.locator('[data-testid="pricing-section"]')).toBeVisible();
    await expect(page.locator('[data-testid="price-input"]')).toBeVisible();

    // Click on SEO section header
    await page.click('[data-testid="seo-section-header"]');

    // SEO section should be expanded
    await expect(page.locator('[data-testid="seo-section"]')).toBeVisible();
    await expect(page.locator('[data-testid="seo-title-en-input"]')).toBeVisible();
  });

  test('should show loading states', async ({ page }) => {
    await page.goto('/fr/admin/products/new');

    // Wait for form to load
    await page.waitForSelector('[data-testid="product-form"]');

    // Fill minimum required fields
    await page.fill('[data-testid="name-input"]', 'Test Wine');
    await page.fill('[data-testid="varietal-input"]', 'Merlot');
    await page.fill('[data-testid="price-input"]', '25.00');
    await page.fill('[data-testid="stock-input"]', '100');
    await page.fill('[data-testid="volume-input"]', '750');
    await page.fill('[data-testid="weight-input"]', '1200');

    // Mock slow API response
    await page.route('**/api/admin/products', (route) => {
      setTimeout(() => {
        route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            product: { id: 'new-product' }
          })
        });
      }, 2000);
    });

    // Submit form
    await page.click('[data-testid="save-button"]');

    // Should show loading state
    await expect(page.locator('text=Creating...')).toBeVisible();
    await expect(page.locator('[data-testid="save-button"]')).toBeDisabled();
  });

  test('should cancel form and show confirmation for unsaved changes', async ({ page }) => {
    await page.goto('/fr/admin/products/new');

    // Wait for form to load
    await page.waitForSelector('[data-testid="product-form"]');

    // Make some changes
    await page.fill('[data-testid="name-input"]', 'Test Wine');
    await page.fill('[data-testid="varietal-input"]', 'Merlot');

    // Try to cancel
    await page.click('[data-testid="cancel-button"]');

    // Should show confirmation dialog
    await expect(page.locator('text=You have unsaved changes')).toBeVisible();

    // Cancel the cancellation
    await page.click('[data-testid="cancel-confirmation-no"]');

    // Should stay on form
    await expect(page.locator('[data-testid="product-form"]')).toBeVisible();

    // Try to cancel again and confirm
    await page.click('[data-testid="cancel-button"]');
    await page.click('[data-testid="cancel-confirmation-yes"]');

    // Should navigate back to products list
    await page.waitForURL('**/fr/admin/products');
  });
});