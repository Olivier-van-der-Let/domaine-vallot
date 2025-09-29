import { test, expect } from '@playwright/test'

test.describe('Login Flow Integration', () => {
  test('should clear loading state and redirect after successful login', async ({ page }) => {
    // Navigate to login page
    await page.goto('/en/login')

    // Verify initial state
    await expect(page.getByRole('button', { name: /sign in/i })).toBeEnabled()
    await expect(page.getByText('Signing in...')).not.toBeVisible()

    // Fill credentials
    await page.getByPlaceholder('your@email.com').fill('oliviervanderlet@gmail.com')
    await page.getByPlaceholder('••••••••').fill('5ikt7WzF!')

    // Submit login form
    await page.getByRole('button', { name: /sign in/i }).click()

    // Button should show loading state initially
    await expect(page.getByRole('button', { name: /sign in/i })).toBeDisabled()

    // Wait for auth to complete and redirect
    await page.waitForURL('/en', { timeout: 10000 })

    // Verify user is authenticated
    await expect(page.getByText(/Hello, oliviervanderlet/)).toBeVisible()

    // Verify loading states are cleared
    await expect(page.getByText('Signing in...')).not.toBeVisible()
  })

  test('should handle login errors gracefully', async ({ page }) => {
    await page.goto('/en/login')

    // Fill invalid credentials
    await page.getByPlaceholder('your@email.com').fill('invalid@example.com')
    await page.getByPlaceholder('••••••••').fill('wrongpassword')

    // Submit form
    await page.getByRole('button', { name: /sign in/i }).click()

    // Should show error message
    await expect(page.getByText(/invalid email or password/i)).toBeVisible()

    // Button should be enabled again
    await expect(page.getByRole('button', { name: /sign in/i })).toBeEnabled()

    // Should not show loading state
    await expect(page.getByText('Signing in...')).not.toBeVisible()
  })
})