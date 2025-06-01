import { test, expect } from '@playwright/test';

test.describe('HelpSavta Application', () => {
  test('should load the homepage', async ({ page }) => {
    await page.goto('/');
    
    // Check if the page loads successfully
    await expect(page).toHaveTitle(/עזרה טכנית בהתנדבות/);
    
    // Check for main navigation or key elements
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should navigate to request help page', async ({ page }) => {
    await page.goto('/');
    
    // Look for a button or link to request help
    const requestHelpButton = page.locator('text=בקש עזרה').or(page.locator('text=Request Help'));
    if (await requestHelpButton.isVisible()) {
      await requestHelpButton.click();
      await expect(page.url()).toContain('/request');
    }
  });

  test('should have working backend health check', async ({ page }) => {
    // Test that the backend is running
    const response = await page.request.get('http://localhost:3001/health');
    expect(response.status()).toBe(200);
  });
});