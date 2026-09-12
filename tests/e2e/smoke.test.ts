import { expect, test } from '@rstest/playwright';

// Smoke tests for critical user paths
// Other functionality migrated to unit tests for speed and stability

const CI_TIMEOUT = 30_000;

test('opens repository and displays commit graph', async ({ page }) => {
  console.log('[E2E] Starting test: opens repository and displays commit graph');
  
  // Capture browser console logs
  page.on('console', msg => console.log(`[Browser Console] ${msg.type()}: ${msg.text()}`));
  page.on('pageerror', err => console.error(`[Browser Error] ${err.message}`));
  
  console.log('[E2E] Navigating to http://localhost:1420/');
  await page.goto('http://localhost:1420/');
  
  console.log('[E2E] Waiting for "Recent repositories" text');
  await expect(page.getByText('Recent repositories')).toBeVisible({ timeout: CI_TIMEOUT });
  console.log('[E2E] "Recent repositories" is visible');
  
  console.log('[E2E] Clicking on "angkorgit" repository');
  await page.getByText('angkorgit', { exact: true }).first().click();
  
  console.log('[E2E] Waiting for search input placeholder');
  await expect(page.getByPlaceholder('Search commits…')).toBeVisible({ timeout: CI_TIMEOUT });
  console.log('[E2E] Search input is visible');
  
  console.log('[E2E] Checking for "main" branch');
  await expect(page.getByText('main', { exact: true }).first()).toBeVisible({ timeout: CI_TIMEOUT });
  console.log('[E2E] "main" branch is visible');
  
  console.log('[E2E] Checking for "Working copy" panel');
  await expect(page.getByText('Working copy')).toBeVisible({ timeout: CI_TIMEOUT });
  console.log('[E2E] "Working copy" panel is visible');
  
  console.log('[E2E] Checking for commit count');
  await expect(page.getByText(/200\+ commits/)).toBeVisible({ timeout: CI_TIMEOUT });
  console.log('[E2E] Commit count is visible');
  
  console.log('[E2E] Test completed successfully');
});

test('selects commit and shows file details', async ({ page }) => {
  console.log('[E2E] Starting test: selects commit and shows file details');
  
  // Capture browser console logs
  page.on('console', msg => console.log(`[Browser Console] ${msg.type()}: ${msg.text()}`));
  page.on('pageerror', err => console.error(`[Browser Error] ${err.message}`));
  
  console.log('[E2E] Navigating to http://localhost:1420/');
  await page.goto('http://localhost:1420/');
  
  console.log('[E2E] Clicking on "angkorgit" repository');
  await page.getByText('angkorgit', { exact: true }).first().click();
  
  console.log('[E2E] Waiting for search input placeholder');
  await expect(page.getByPlaceholder('Search commits…')).toBeVisible({ timeout: CI_TIMEOUT });
  console.log('[E2E] Search input is visible');
  
  console.log('[E2E] Clicking on first commit row');
  await page.getByRole('row').first().click();
  console.log('[E2E] First commit row clicked');
  
  console.log('[E2E] Waiting for Inspector panel');
  await expect(page.getByRole('complementary', { name: 'Inspector' })).toBeVisible({ timeout: CI_TIMEOUT });
  console.log('[E2E] Inspector panel is visible');
  
  console.log('[E2E] Waiting for "4 modified" label');
  await expect(page.getByLabel('4 modified')).toBeVisible({ timeout: CI_TIMEOUT });
  console.log('[E2E] "4 modified" label is visible');
  
  console.log('[E2E] Test completed successfully');
});

test('resolves conflict by picking side', async ({ page }) => {
  console.log('[E2E] Starting test: resolves conflict by picking side');
  
  // Capture browser console logs
  page.on('console', msg => console.log(`[Browser Console] ${msg.type()}: ${msg.text()}`));
  page.on('pageerror', err => console.error(`[Browser Error] ${err.message}`));
  
  console.log('[E2E] Navigating to http://localhost:1420/');
  await page.goto('http://localhost:1420/');
  
  console.log('[E2E] Clicking on "angkorgit" repository');
  await page.getByText('angkorgit', { exact: true }).first().click();
  
  console.log('[E2E] Waiting for search input placeholder');
  await expect(page.getByPlaceholder('Search commits…')).toBeVisible({ timeout: CI_TIMEOUT });
  console.log('[E2E] Search input is visible');
  
  console.log('[E2E] Waiting 500ms for UI to stabilize');
  await page.waitForTimeout(500);
  
  console.log('[E2E] Clicking on drawGraph.ts conflict file');
  await page.getByRole('button', { name: /drawGraph\.ts/ }).first().click();
  console.log('[E2E] Conflict file clicked');
  
  console.log('[E2E] Waiting for conflict resolver to show "0 of 1 resolved"');
  await expect(page.getByText('0 of 1 resolved')).toBeVisible({ timeout: CI_TIMEOUT });
  console.log('[E2E] Conflict resolver is visible');
  
  console.log('[E2E] Clicking "Take all lines from side A"');
  await page.getByLabel('Take all lines from side A').click();
  console.log('[E2E] Side A selected');
  
  console.log('[E2E] Waiting for "1 of 1 resolved"');
  await expect(page.getByText('1 of 1 resolved')).toBeVisible({ timeout: CI_TIMEOUT });
  console.log('[E2E] Conflict marked as resolved');
  
  console.log('[E2E] Checking if "Mark resolved" button is enabled');
  await expect(page.getByRole('button', { name: 'Mark resolved' })).toBeEnabled();
  console.log('[E2E] "Mark resolved" button is enabled');
  
  console.log('[E2E] Test completed successfully');
});
