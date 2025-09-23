import { test, expect } from '@playwright/test';

test.describe('Admin Product Management', () => {
  test.beforeEach(async ({ page }) => {
    // Mock admin authentication
    await page.route('**/api/auth/admin', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: 'admin-123',
            email: 'admin@domainevallot.com',
            role: 'admin',
            permissions: ['products.create', 'products.edit', 'products.delete', 'products.view']
          },
          session: { access_token: 'admin-token' }
        })
      });
    });

    // Login as admin
    await page.goto('/en/admin/login');
    await page.fill('[data-testid="admin-email"]', 'admin@domainevallot.com');
    await page.fill('[data-testid="admin-password"]', 'admin123');
    await page.click('[data-testid="admin-login-button"]');

    // Should redirect to admin dashboard
    await expect(page).toHaveURL(/.*\/admin/);
  });

  test('should display admin product listing with all products', async ({ page }) => {
    // Mock products API for admin
    await page.route('**/api/admin/products', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          products: [
            {
              id: 'wine-001',
              name: 'Domaine Vallot Rouge 2020',
              sku: 'DV-R-2020',
              price: 2500, // €25.00
              stock_quantity: 50,
              status: 'active',
              category: 'red_wine',
              vintage: 2020,
              created_at: '2023-01-15T10:00:00Z'
            },
            {
              id: 'wine-002',
              name: 'Domaine Vallot Blanc 2021',
              sku: 'DV-B-2021',
              price: 2200, // €22.00
              stock_quantity: 0,
              status: 'out_of_stock',
              category: 'white_wine',
              vintage: 2021,
              created_at: '2023-02-20T10:00:00Z'
            }
          ],
          total: 2,
          page: 1,
          per_page: 20
        })
      });
    });

    // Navigate to products management
    await page.click('[data-testid="admin-nav-products"]');
    await expect(page).toHaveURL(/.*\/admin\/products/);

    // Verify product listing
    await expect(page.locator('[data-testid="admin-products-table"]')).toBeVisible();
    await expect(page.locator('[data-testid="product-row"]')).toHaveCount(2);

    // Verify first product details
    const firstRow = page.locator('[data-testid="product-row"]').first();
    await expect(firstRow.locator('[data-testid="product-name"]')).toHaveText('Domaine Vallot Rouge 2020');
    await expect(firstRow.locator('[data-testid="product-sku"]')).toHaveText('DV-R-2020');
    await expect(firstRow.locator('[data-testid="product-price"]')).toHaveText('€25.00');
    await expect(firstRow.locator('[data-testid="product-stock"]')).toHaveText('50');
    await expect(firstRow.locator('[data-testid="product-status"]')).toHaveText('Active');

    // Verify second product (out of stock)
    const secondRow = page.locator('[data-testid="product-row"]').nth(1);
    await expect(secondRow.locator('[data-testid="product-status"]')).toHaveText('Out of Stock');
    await expect(secondRow.locator('[data-testid="product-stock"]')).toHaveText('0');
  });

  test('should create new product successfully', async ({ page }) => {
    // Mock product creation
    await page.route('**/api/admin/products', async route => {
      if (route.request().method() === 'POST') {
        const body = await route.request().postDataJSON();
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'wine-003',
            ...body,
            created_at: new Date().toISOString()
          })
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/en/admin/products');

    // Click create new product button
    await page.click('[data-testid="create-product-button"]');
    await expect(page).toHaveURL(/.*\/admin\/products\/new/);

    // Fill product form
    await page.fill('[data-testid="product-name"]', 'Domaine Vallot Rosé 2022');
    await page.fill('[data-testid="product-sku"]', 'DV-RS-2022');
    await page.selectOption('[data-testid="product-category"]', 'rose_wine');
    await page.fill('[data-testid="product-vintage"]', '2022');
    await page.fill('[data-testid="product-price"]', '23.50');
    await page.fill('[data-testid="product-stock"]', '75');

    // Fill wine-specific details
    await page.selectOption('[data-testid="product-grape-variety"]', 'grenache');
    await page.fill('[data-testid="product-alcohol-content"]', '13.5');
    await page.selectOption('[data-testid="product-region"]', 'provence');

    // Fill description
    await page.fill('[data-testid="product-description"]', 'A delightful rosé wine with notes of strawberry and peach.');

    // Set product status
    await page.selectOption('[data-testid="product-status"]', 'active');

    // Upload product image (mock)
    await page.setInputFiles('[data-testid="product-image-upload"]', 'tests/fixtures/wine-bottle.jpg');

    // Submit form
    await page.click('[data-testid="save-product-button"]');

    // Should redirect to product list with success message
    await expect(page).toHaveURL(/.*\/admin\/products/);
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="success-message"]')).toHaveText(/product.*created.*successfully/i);
  });

  test('should edit existing product', async ({ page }) => {
    // Mock get product for editing
    await page.route('**/api/admin/products/wine-001', async route => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'wine-001',
            name: 'Domaine Vallot Rouge 2020',
            sku: 'DV-R-2020',
            price: 2500,
            stock_quantity: 50,
            status: 'active',
            category: 'red_wine',
            vintage: 2020,
            grape_variety: 'syrah',
            alcohol_content: 14.0,
            region: 'rhone_valley',
            description: 'A bold red wine with rich tannins.',
            image_url: '/images/wines/dv-rouge-2020.jpg'
          })
        });
      } else if (route.request().method() === 'PUT') {
        // Mock update
        const body = await route.request().postDataJSON();
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'wine-001',
            ...body,
            updated_at: new Date().toISOString()
          })
        });
      }
    });

    await page.goto('/en/admin/products');

    // Click edit button for first product
    await page.click('[data-testid="edit-product-wine-001"]');
    await expect(page).toHaveURL(/.*\/admin\/products\/wine-001\/edit/);

    // Verify form is pre-filled
    await expect(page.locator('[data-testid="product-name"]')).toHaveValue('Domaine Vallot Rouge 2020');
    await expect(page.locator('[data-testid="product-price"]')).toHaveValue('25.00');
    await expect(page.locator('[data-testid="product-stock"]')).toHaveValue('50');

    // Update price and stock
    await page.fill('[data-testid="product-price"]', '26.00');
    await page.fill('[data-testid="product-stock"]', '45');

    // Update description
    await page.fill('[data-testid="product-description"]', 'A bold red wine with rich tannins and notes of dark berry.');

    // Save changes
    await page.click('[data-testid="save-product-button"]');

    // Should redirect with success message
    await expect(page).toHaveURL(/.*\/admin\/products/);
    await expect(page.locator('[data-testid="success-message"]')).toHaveText(/product.*updated.*successfully/i);
  });

  test('should handle product deletion with confirmation', async ({ page }) => {
    // Mock delete product
    await page.route('**/api/admin/products/wine-002', async route => {
      if (route.request().method() === 'DELETE') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Product deleted successfully' })
        });
      }
    });

    await page.goto('/en/admin/products');

    // Click delete button
    await page.click('[data-testid="delete-product-wine-002"]');

    // Should show confirmation dialog
    await expect(page.locator('[data-testid="delete-confirmation-dialog"]')).toBeVisible();
    await expect(page.locator('[data-testid="delete-confirmation-text"]')).toHaveText(/are you sure.*delete.*blanc.*2021/i);

    // Confirm deletion
    await page.click('[data-testid="confirm-delete-button"]');

    // Should show success message
    await expect(page.locator('[data-testid="success-message"]')).toHaveText(/product.*deleted.*successfully/i);

    // Product should be removed from list
    await expect(page.locator('[data-testid="product-row"]')).toHaveCount(1);
  });

  test('should manage product inventory levels', async ({ page }) => {
    // Mock inventory update
    await page.route('**/api/admin/products/wine-001/inventory', async route => {
      const body = await route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'wine-001',
          stock_quantity: body.stock_quantity,
          updated_at: new Date().toISOString()
        })
      });
    });

    await page.goto('/en/admin/products');

    // Click inventory management for first product
    await page.click('[data-testid="manage-inventory-wine-001"]');

    // Should show inventory dialog
    await expect(page.locator('[data-testid="inventory-dialog"]')).toBeVisible();
    await expect(page.locator('[data-testid="current-stock"]')).toHaveText('50');

    // Add stock
    await page.fill('[data-testid="stock-adjustment"]', '25');
    await page.selectOption('[data-testid="adjustment-type"]', 'add');
    await page.fill('[data-testid="adjustment-reason"]', 'New shipment received');
    await page.click('[data-testid="apply-adjustment-button"]');

    // Should show updated stock
    await expect(page.locator('[data-testid="success-message"]')).toHaveText(/inventory.*updated.*successfully/i);
  });

  test('should filter and search products', async ({ page }) => {
    // Mock filtered products
    await page.route('**/api/admin/products?*', async route => {
      const url = new URL(route.request().url());
      const search = url.searchParams.get('search');
      const category = url.searchParams.get('category');
      const status = url.searchParams.get('status');

      let products = [
        {
          id: 'wine-001',
          name: 'Domaine Vallot Rouge 2020',
          category: 'red_wine',
          status: 'active'
        },
        {
          id: 'wine-002',
          name: 'Domaine Vallot Blanc 2021',
          category: 'white_wine',
          status: 'out_of_stock'
        }
      ];

      // Apply filters
      if (search) {
        products = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
      }
      if (category) {
        products = products.filter(p => p.category === category);
      }
      if (status) {
        products = products.filter(p => p.status === status);
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          products,
          total: products.length
        })
      });
    });

    await page.goto('/en/admin/products');

    // Test search functionality
    await page.fill('[data-testid="product-search"]', 'Rouge');
    await page.click('[data-testid="search-button"]');

    // Should show only red wine
    await expect(page.locator('[data-testid="product-row"]')).toHaveCount(1);
    await expect(page.locator('[data-testid="product-name"]')).toHaveText('Domaine Vallot Rouge 2020');

    // Test category filter
    await page.fill('[data-testid="product-search"]', '');
    await page.selectOption('[data-testid="category-filter"]', 'white_wine');
    await page.click('[data-testid="apply-filters-button"]');

    // Should show only white wine
    await expect(page.locator('[data-testid="product-row"]')).toHaveCount(1);
    await expect(page.locator('[data-testid="product-name"]')).toHaveText('Domaine Vallot Blanc 2021');

    // Test status filter
    await page.selectOption('[data-testid="category-filter"]', 'all');
    await page.selectOption('[data-testid="status-filter"]', 'out_of_stock');
    await page.click('[data-testid="apply-filters-button"]');

    // Should show only out of stock products
    await expect(page.locator('[data-testid="product-row"]')).toHaveCount(1);
    await expect(page.locator('[data-testid="product-status"]')).toHaveText('Out of Stock');
  });

  test('should handle bulk operations', async ({ page }) => {
    // Mock bulk update
    await page.route('**/api/admin/products/bulk', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'Bulk operation completed successfully',
          updated: 2
        })
      });
    });

    await page.goto('/en/admin/products');

    // Select multiple products
    await page.check('[data-testid="select-product-wine-001"]');
    await page.check('[data-testid="select-product-wine-002"]');

    // Bulk actions should become available
    await expect(page.locator('[data-testid="bulk-actions"]')).toBeVisible();

    // Test bulk status change
    await page.selectOption('[data-testid="bulk-action-select"]', 'update_status');
    await page.selectOption('[data-testid="bulk-status-value"]', 'active');
    await page.click('[data-testid="apply-bulk-action-button"]');

    // Should show confirmation
    await expect(page.locator('[data-testid="bulk-confirmation"]')).toBeVisible();
    await page.click('[data-testid="confirm-bulk-action"]');

    // Should show success message
    await expect(page.locator('[data-testid="success-message"]')).toHaveText(/bulk.*operation.*completed/i);
  });

  test('should validate product form inputs', async ({ page }) => {
    await page.goto('/en/admin/products/new');

    // Try to submit empty form
    await page.click('[data-testid="save-product-button"]');

    // Should show validation errors
    await expect(page.locator('[data-testid="name-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="sku-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="price-error"]')).toBeVisible();

    // Fill invalid data
    await page.fill('[data-testid="product-name"]', 'A'); // Too short
    await page.fill('[data-testid="product-price"]', '-5'); // Negative price
    await page.fill('[data-testid="product-stock"]', 'abc'); // Invalid number
    await page.fill('[data-testid="product-alcohol-content"]', '50'); // Too high

    await page.click('[data-testid="save-product-button"]');

    // Should show specific validation messages
    await expect(page.locator('[data-testid="name-error"]')).toHaveText(/name.*too.*short/i);
    await expect(page.locator('[data-testid="price-error"]')).toHaveText(/price.*positive/i);
    await expect(page.locator('[data-testid="stock-error"]')).toHaveText(/valid.*number/i);
    await expect(page.locator('[data-testid="alcohol-error"]')).toHaveText(/alcohol.*content.*realistic/i);
  });

  test('should handle product image management', async ({ page }) => {
    // Mock image upload
    await page.route('**/api/admin/products/wine-001/images', async route => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            image_url: '/images/wines/wine-001-new.jpg',
            message: 'Image uploaded successfully'
          })
        });
      }
    });

    await page.goto('/en/admin/products/wine-001/edit');

    // Current image should be displayed
    await expect(page.locator('[data-testid="current-product-image"]')).toBeVisible();

    // Upload new image
    await page.setInputFiles('[data-testid="product-image-upload"]', 'tests/fixtures/new-wine-bottle.jpg');
    await page.click('[data-testid="upload-image-button"]');

    // Should show upload success
    await expect(page.locator('[data-testid="upload-success"]')).toHaveText(/image.*uploaded.*successfully/i);

    // New image should be displayed
    await expect(page.locator('[data-testid="current-product-image"]')).toHaveAttribute('src', /new-wine-bottle/);
  });

  test('should require admin permissions', async ({ page }) => {
    // Mock unauthorized access
    await page.route('**/api/auth/admin', async route => {
      await route.fulfill({
        status: 403,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Insufficient permissions',
          code: 'ADMIN_ACCESS_DENIED'
        })
      });
    });

    // Try to access admin without proper auth
    await page.goto('/en/admin/products');

    // Should redirect to admin login
    await expect(page).toHaveURL(/.*\/admin\/login/);
    await expect(page.locator('[data-testid="admin-login-required"]')).toHaveText(/admin.*access.*required/i);
  });
});