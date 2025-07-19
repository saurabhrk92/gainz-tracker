import { test, expect } from '@playwright/test';

test.describe('Gainz Tracker App', () => {
  test('home page loads and displays correctly', async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:3000');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Take a screenshot of the home page
    await page.screenshot({ path: 'tests/screenshots/home-page.png', fullPage: true });
    
    // Check for basic elements
    await expect(page.locator('h1')).toContainText('Gainz Tracker');
    
    // Check if navigation is present
    await expect(page.locator('nav')).toBeVisible();
    
    // Check for console errors
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // Wait a bit for any JavaScript to execute
    await page.waitForTimeout(2000);
    
    // Log any console errors for debugging
    if (consoleErrors.length > 0) {
      console.log('Console errors found:', consoleErrors);
    }
  });

  test('navigation works correctly', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    
    // Test Templates page
    await page.click('a[href="/templates"]');
    await page.waitForURL('**/templates');
    await expect(page.url()).toContain('/templates');
    await page.screenshot({ path: 'tests/screenshots/templates-page.png', fullPage: true });
    
    // Test Exercises page
    await page.click('a[href="/exercises"]');
    await page.waitForURL('**/exercises');
    await expect(page.url()).toContain('/exercises');
    await page.screenshot({ path: 'tests/screenshots/exercises-page.png', fullPage: true });
    
    // Test Progress page
    await page.click('a[href="/progress"]');
    await page.waitForURL('**/progress');
    await expect(page.url()).toContain('/progress');
    await page.screenshot({ path: 'tests/screenshots/progress-page.png', fullPage: true });
    
    // Test History page
    await page.click('a[href="/history"]');
    await page.waitForURL('**/history');
    await expect(page.url()).toContain('/history');
    await page.screenshot({ path: 'tests/screenshots/history-page.png', fullPage: true });
    
    // Go back to home
    await page.click('a[href="/"]');
    await page.waitForURL('http://localhost:3000/');
    await expect(page.url()).toBe('http://localhost:3000/');
  });

  test('exercise modal functionality works', async ({ page }) => {
    await page.goto('http://localhost:3001/exercises');
    await page.waitForLoadState('networkidle');
    
    // Check for console errors
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // Take screenshot before clicking
    await page.screenshot({ path: 'tests/screenshots/exercises-before-modal.png', fullPage: true });
    
    // Click the add exercise button
    await page.click('button:has-text("Add New Exercise")');
    
    // Wait a bit to see if modal appears
    await page.waitForTimeout(1000);
    
    // Take screenshot after clicking
    await page.screenshot({ path: 'tests/screenshots/exercises-after-click.png', fullPage: true });
    
    // Log any console errors
    if (consoleErrors.length > 0) {
      console.log('Console errors found:', consoleErrors);
    }
    
    // Check if modal appears
    const modalVisible = await page.locator('text=Create New Exercise').isVisible();
    console.log('Modal visible:', modalVisible);
    
    if (modalVisible) {
      // Fill in the form
      await page.fill('input[placeholder="e.g., Bench Press"]', 'Test Exercise');
      
      // Select a muscle group (click on chest)
      await page.click('text=Chest');
      
      // Submit the form
      await page.click('text=Create Exercise');
      
      // Wait for modal to close
      await page.waitForSelector('text=Create New Exercise', { state: 'hidden' });
      
      // Take screenshot of exercises page with new exercise
      await page.screenshot({ path: 'tests/screenshots/exercises-with-modal.png', fullPage: true });
    }
  });
});