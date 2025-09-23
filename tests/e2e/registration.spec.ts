import { test, expect } from '@playwright/test';

test.describe('User Registration with Age Verification', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to homepage
    await page.goto('/en');
  });

  test('should complete user registration with valid age verification', async ({ page }) => {
    // Navigate to registration page
    await page.click('[data-testid="account-menu"]');
    await page.click('[data-testid="register-link"]');
    await expect(page).toHaveURL(/.*\/register/);

    // Step 1: Age verification modal should appear
    await expect(page.locator('[data-testid="age-verification-modal"]')).toBeVisible();
    await expect(page.locator('[data-testid="age-verification-title"]')).toHaveText(/age.*verification/i);

    // Fill valid age (over 18)
    await page.selectOption('[data-testid="birth-day"]', '15');
    await page.selectOption('[data-testid="birth-month"]', '6');
    await page.selectOption('[data-testid="birth-year"]', '1990');

    await page.click('[data-testid="verify-age-button"]');

    // Age verification should pass and modal should close
    await expect(page.locator('[data-testid="age-verification-modal"]')).not.toBeVisible();

    // Step 2: Registration form should now be accessible
    await expect(page.locator('[data-testid="registration-form"]')).toBeVisible();

    // Fill registration form
    await page.fill('[data-testid="register-email"]', 'newuser@example.com');
    await page.fill('[data-testid="register-password"]', 'SecurePassword123!');
    await page.fill('[data-testid="register-confirm-password"]', 'SecurePassword123!');
    await page.fill('[data-testid="register-firstname"]', 'Marie');
    await page.fill('[data-testid="register-lastname"]', 'Martin');

    // Accept terms and conditions
    await page.check('[data-testid="terms-checkbox"]');
    await page.check('[data-testid="privacy-checkbox"]');
    await page.check('[data-testid="marketing-checkbox"]'); // Optional

    // Submit registration
    await page.click('[data-testid="register-submit-button"]');

    // Should redirect to welcome/dashboard page or show success message
    await expect(page.locator('[data-testid="registration-success"]')).toBeVisible();
    await expect(page.locator('[data-testid="welcome-message"]')).toHaveText(/welcome.*marie/i);

    // Verify user is logged in
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
    await expect(page.locator('[data-testid="logout-link"]')).toBeVisible();
  });

  test('should reject registration for users under 18', async ({ page }) => {
    await page.click('[data-testid="account-menu"]');
    await page.click('[data-testid="register-link"]');

    // Fill age under 18
    await page.selectOption('[data-testid="birth-day"]', '1');
    await page.selectOption('[data-testid="birth-month"]', '1');
    await page.selectOption('[data-testid="birth-year"]', '2010'); // Under 18

    await page.click('[data-testid="verify-age-button"]');

    // Should show age restriction error
    await expect(page.locator('[data-testid="age-verification-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="age-verification-error"]')).toHaveText(/must.*18.*older/i);

    // Registration form should remain hidden
    await expect(page.locator('[data-testid="registration-form"]')).not.toBeVisible();

    // User should be redirected away or shown alternative content
    await expect(page.locator('[data-testid="age-restricted-content"]')).toBeVisible();
  });

  test('should handle edge case - exactly 18 years old', async ({ page }) => {
    await page.click('[data-testid="account-menu"]');
    await page.click('[data-testid="register-link"]');

    // Calculate date for exactly 18 years ago
    const today = new Date();
    const eighteenYearsAgo = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());

    await page.selectOption('[data-testid="birth-day"]', eighteenYearsAgo.getDate().toString());
    await page.selectOption('[data-testid="birth-month"]', (eighteenYearsAgo.getMonth() + 1).toString());
    await page.selectOption('[data-testid="birth-year"]', eighteenYearsAgo.getFullYear().toString());

    await page.click('[data-testid="verify-age-button"]');

    // Should pass age verification (exactly 18 is valid)
    await expect(page.locator('[data-testid="age-verification-modal"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="registration-form"]')).toBeVisible();
  });

  test('should validate email format and password strength', async ({ page }) => {
    await page.click('[data-testid="account-menu"]');
    await page.click('[data-testid="register-link"]');

    // Pass age verification first
    await page.selectOption('[data-testid="birth-day"]', '15');
    await page.selectOption('[data-testid="birth-month"]', '6');
    await page.selectOption('[data-testid="birth-year"]', '1990');
    await page.click('[data-testid="verify-age-button"]');

    // Test invalid email format
    await page.fill('[data-testid="register-email"]', 'invalid-email');
    await page.fill('[data-testid="register-password"]', 'weak');
    await page.click('[data-testid="register-submit-button"]');

    // Should show validation errors
    await expect(page.locator('[data-testid="email-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="email-error"]')).toHaveText(/valid.*email/i);
    await expect(page.locator('[data-testid="password-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="password-error"]')).toHaveText(/password.*requirements/i);

    // Fix email and password
    await page.fill('[data-testid="register-email"]', 'valid@example.com');
    await page.fill('[data-testid="register-password"]', 'StrongPassword123!');
    await page.fill('[data-testid="register-confirm-password"]', 'DifferentPassword123!');

    await page.click('[data-testid="register-submit-button"]');

    // Should show password mismatch error
    await expect(page.locator('[data-testid="password-confirm-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="password-confirm-error"]')).toHaveText(/passwords.*match/i);
  });

  test('should handle duplicate email registration', async ({ page }) => {
    // Mock API response for duplicate email
    await page.route('**/api/auth/register', async route => {
      const body = await route.request().postDataJSON();
      if (body.email === 'existing@example.com') {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'Email already exists',
            code: 'EMAIL_ALREADY_EXISTS'
          })
        });
      } else {
        await route.continue();
      }
    });

    await page.click('[data-testid="account-menu"]');
    await page.click('[data-testid="register-link"]');

    // Pass age verification
    await page.selectOption('[data-testid="birth-day"]', '15');
    await page.selectOption('[data-testid="birth-month"]', '6');
    await page.selectOption('[data-testid="birth-year"]', '1990');
    await page.click('[data-testid="verify-age-button"]');

    // Fill form with existing email
    await page.fill('[data-testid="register-email"]', 'existing@example.com');
    await page.fill('[data-testid="register-password"]', 'ValidPassword123!');
    await page.fill('[data-testid="register-confirm-password"]', 'ValidPassword123!');
    await page.fill('[data-testid="register-firstname"]', 'Test');
    await page.fill('[data-testid="register-lastname"]', 'User');
    await page.check('[data-testid="terms-checkbox"]');
    await page.check('[data-testid="privacy-checkbox"]');

    await page.click('[data-testid="register-submit-button"]');

    // Should show duplicate email error
    await expect(page.locator('[data-testid="registration-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="registration-error"]')).toHaveText(/email.*already.*exists/i);

    // Should offer link to login
    await expect(page.locator('[data-testid="login-instead-link"]')).toBeVisible();
  });

  test('should persist age verification across page refreshes', async ({ page }) => {
    await page.click('[data-testid="account-menu"]');
    await page.click('[data-testid="register-link"]');

    // Complete age verification
    await page.selectOption('[data-testid="birth-day"]', '15');
    await page.selectOption('[data-testid="birth-month"]', '6');
    await page.selectOption('[data-testid="birth-year"]', '1990');
    await page.click('[data-testid="verify-age-button"]');

    // Verify registration form is visible
    await expect(page.locator('[data-testid="registration-form"]')).toBeVisible();

    // Refresh the page
    await page.reload();

    // Age verification should be remembered (stored in session/cookie)
    // User should not see age verification modal again
    await expect(page.locator('[data-testid="age-verification-modal"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="registration-form"]')).toBeVisible();
  });

  test('should handle registration with different locales', async ({ page }) => {
    // Test French registration
    await page.goto('/fr');
    await page.click('[data-testid="account-menu"]');
    await page.click('[data-testid="register-link"]');

    // Age verification should be in French
    await expect(page.locator('[data-testid="age-verification-title"]')).toHaveText(/vérification.*âge/i);

    // Pass age verification
    await page.selectOption('[data-testid="birth-day"]', '15');
    await page.selectOption('[data-testid="birth-month"]', '6');
    await page.selectOption('[data-testid="birth-year"]', '1990');
    await page.click('[data-testid="verify-age-button"]');

    // Registration form should be in French
    await expect(page.locator('[data-testid="register-email-label"]')).toHaveText(/adresse.*email/i);
    await expect(page.locator('[data-testid="register-password-label"]')).toHaveText(/mot.*passe/i);
  });
});