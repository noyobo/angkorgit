import { expect, test } from '@rstest/playwright';

// Smoke tests for critical user paths
// Other functionality migrated to unit tests for speed and stability

const CI_TIMEOUT = 15_000;

test('opens repository and displays commit graph', async ({ page }) => {
  await page.goto('http://localhost:1420/');
  await expect(page.getByText('Recent repositories')).toBeVisible({ timeout: CI_TIMEOUT });
  
  await page.getByText('angkorgit', { exact: true }).first().click();
  
  // Verify repository loaded with all core UI elements
  await expect(page.getByPlaceholder('Search commits…')).toBeVisible({ timeout: CI_TIMEOUT });
  await expect(page.getByText('main', { exact: true }).first()).toBeVisible({ timeout: CI_TIMEOUT });
  await expect(page.getByText('Working copy')).toBeVisible({ timeout: CI_TIMEOUT });
  await expect(page.getByText(/200\+ commits/)).toBeVisible({ timeout: CI_TIMEOUT });
});

test('selects commit and shows file details', async ({ page }) => {
  await page.goto('http://localhost:1420/');
  await page.getByText('angkorgit', { exact: true }).first().click();
  await expect(page.getByPlaceholder('Search commits…')).toBeVisible({ timeout: CI_TIMEOUT });
  
  await page.getByRole('row').first().click();
  
  await expect(page.getByRole('complementary', { name: 'Inspector' })).toBeVisible({ timeout: CI_TIMEOUT });
  await expect(page.getByLabel('4 modified')).toBeVisible({ timeout: CI_TIMEOUT });
});

test('resolves conflict by picking side', async ({ page }) => {
  await page.goto('http://localhost:1420/');
  await page.getByText('angkorgit', { exact: true }).first().click();
  await expect(page.getByPlaceholder('Search commits…')).toBeVisible({ timeout: CI_TIMEOUT });
  
  await page.waitForTimeout(500);
  await page.getByRole('button', { name: /drawGraph\.ts/ }).first().click();
  await expect(page.getByText('0 of 1 resolved')).toBeVisible({ timeout: CI_TIMEOUT });
  
  await page.getByLabel('Take all lines from side A').click();
  await expect(page.getByText('1 of 1 resolved')).toBeVisible({ timeout: CI_TIMEOUT });
  await expect(page.getByRole('button', { name: 'Mark resolved' })).toBeEnabled();
});
