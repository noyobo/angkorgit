import { expect, test } from '@rstest/playwright';

// Smoke tests for critical user paths
// Other functionality migrated to unit tests for speed and stability

const CI_TIMEOUT = 30_000;

test('opens repository and displays commit graph', async ({ page }) => {
  await page.goto('http://localhost:1420/');
  await expect(page.getByText('Recent repositories')).toBeVisible({ timeout: CI_TIMEOUT });

  await page.getByText('angkorgit', { exact: true }).first().click();

  // Verify repository loaded with all core UI elements
  await expect(page.getByPlaceholder('Search commits…')).toBeVisible({ timeout: CI_TIMEOUT });
  await expect(page.getByText('main', { exact: true }).first()).toBeVisible({
    timeout: CI_TIMEOUT,
  });
  await expect(page.getByText('Working copy')).toBeVisible({ timeout: CI_TIMEOUT });
  await expect(page.getByText(/200\+ commits/)).toBeVisible({ timeout: CI_TIMEOUT });
});

test('selects commit and shows file details', async ({ page }) => {
  await page.goto('http://localhost:1420/');
  await page.getByText('angkorgit', { exact: true }).first().click();
  await expect(page.getByPlaceholder('Search commits…')).toBeVisible({ timeout: CI_TIMEOUT });

  await page.getByRole('row').first().click();

  await expect(page.getByRole('complementary', { name: 'Inspector' })).toBeVisible({
    timeout: CI_TIMEOUT,
  });
  await expect(page.getByLabel('4 modified')).toBeVisible({ timeout: CI_TIMEOUT });
});

test('resolves conflict by picking side', async ({ page }) => {
  await page.goto('http://localhost:1420/');
  await page.getByText('angkorgit', { exact: true }).first().click();
  await expect(page.getByPlaceholder('Search commits…')).toBeVisible({ timeout: CI_TIMEOUT });

  await page.waitForTimeout(500);
  await page
    .getByRole('button', { name: /drawGraph\.ts/ })
    .first()
    .click();
  await expect(page.getByText('0 of 1 resolved')).toBeVisible({ timeout: CI_TIMEOUT });

  await page.getByLabel('Take all lines from side A').click();
  await expect(page.getByText('1 of 1 resolved')).toBeVisible({ timeout: CI_TIMEOUT });
  await expect(page.getByRole('button', { name: 'Mark resolved' })).toBeEnabled();
});

test('opens blame view from working copy file menu', async ({ page }) => {
  await page.goto('http://localhost:1420/');
  await page.getByText('angkorgit', { exact: true }).first().click();
  await expect(page.getByPlaceholder('Search commits…')).toBeVisible({ timeout: CI_TIMEOUT });

  // Wait for working copy to load
  await expect(page.getByText('Working copy')).toBeVisible({ timeout: CI_TIMEOUT });

  // Find a changed file and right-click
  const fileRow = page.getByRole('button', { name: /\.tsx?/ }).first();
  await fileRow.click({ button: 'right' });

  // Click "Blame" menu item
  await page.getByRole('menuitem', { name: /Blame/ }).click();

  // Verify blame panel opened
  await expect(page.getByText(/Blame:/)).toBeVisible({ timeout: CI_TIMEOUT });
  
  // Should show hunks with author info
  await expect(page.locator('[data-testid="blame-hunk"]').first()).toBeVisible({
    timeout: CI_TIMEOUT,
  });
});

test('opens blame at specific commit from commit details', async ({ page }) => {
  await page.goto('http://localhost:1420/');
  await page.getByText('angkorgit', { exact: true }).first().click();
  await expect(page.getByPlaceholder('Search commits…')).toBeVisible({ timeout: CI_TIMEOUT });

  // Select a commit
  await page.getByRole('row').nth(1).click();
  await expect(page.getByRole('complementary', { name: 'Inspector' })).toBeVisible({
    timeout: CI_TIMEOUT,
  });

  // Find a file in commit details and right-click
  const fileInCommit = page.getByRole('button', { name: /\.tsx?/ }).first();
  await fileInCommit.click({ button: 'right' });

  // Click "Blame at this commit" menu item
  await page.getByRole('menuitem', { name: /Blame at this commit/ }).click();

  // Verify blame panel opened
  await expect(page.getByText(/Blame:/)).toBeVisible({ timeout: CI_TIMEOUT });
  
  // Should show hunks
  await expect(page.locator('[data-testid="blame-hunk"]').first()).toBeVisible({
    timeout: CI_TIMEOUT,
  });
});

test('closes blame view with Escape key', async ({ page }) => {
  await page.goto('http://localhost:1420/');
  await page.getByText('angkorgit', { exact: true }).first().click();
  await expect(page.getByPlaceholder('Search commits…')).toBeVisible({ timeout: CI_TIMEOUT });

  // Open blame from working copy
  await expect(page.getByText('Working copy')).toBeVisible({ timeout: CI_TIMEOUT });
  const fileRow = page.getByRole('button', { name: /\.tsx?/ }).first();
  await fileRow.click({ button: 'right' });
  await page.getByRole('menuitem', { name: /Blame/ }).click();

  // Verify blame panel opened
  await expect(page.getByText(/Blame:/)).toBeVisible({ timeout: CI_TIMEOUT });

  // Press Escape to close
  await page.keyboard.press('Escape');

  // Verify blame panel closed and commit graph visible again
  await expect(page.getByText(/Blame:/)).not.toBeVisible({ timeout: CI_TIMEOUT });
  await expect(page.getByPlaceholder('Search commits…')).toBeVisible({ timeout: CI_TIMEOUT });
});

test('displays blame hunks with author and commit info', async ({ page }) => {
  await page.goto('http://localhost:1420/');
  await page.getByText('angkorgit', { exact: true }).first().click();
  await expect(page.getByPlaceholder('Search commits…')).toBeVisible({ timeout: CI_TIMEOUT });

  // Open blame
  await expect(page.getByText('Working copy')).toBeVisible({ timeout: CI_TIMEOUT });
  const fileRow = page.getByRole('button', { name: /\.tsx?/ }).first();
  await fileRow.click({ button: 'right' });
  await page.getByRole('menuitem', { name: /Blame/ }).click();

  // Wait for blame to load
  await expect(page.getByText(/Blame:/)).toBeVisible({ timeout: CI_TIMEOUT });

  // Verify hunk displays required info
  const firstHunk = page.locator('[data-testid="blame-hunk"]').first();
  await expect(firstHunk).toBeVisible({ timeout: CI_TIMEOUT });
  
  // Should show commit hash (7 chars, hex)
  await expect(firstHunk.locator('text=/[0-9a-f]{7}/')).toBeVisible({
    timeout: CI_TIMEOUT,
  });
  
  // Should show author name
  await expect(firstHunk.locator('[data-testid="author-name"]')).toBeVisible({
    timeout: CI_TIMEOUT,
  });
  
  // Should have non-empty author text
  const authorText = await firstHunk.locator('[data-testid="author-name"]').textContent();
  expect(authorText).toBeTruthy();
  expect(authorText?.length).toBeGreaterThan(0);
});
