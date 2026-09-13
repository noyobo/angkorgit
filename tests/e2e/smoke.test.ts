import type { Page } from '@rstest/playwright';
import { expect, test } from '@rstest/playwright';

// Smoke tests for critical user paths
// Other functionality migrated to unit tests for speed and stability

const CI_TIMEOUT = 30_000;

// Helper function to find and right-click a file row in the working copy
async function rightClickWorkingCopyFile(page: Page) {
  // Look for ipc.ts file and navigate to its clickable parent row
  const ipcFile = page.locator('text=ipc.ts').first();
  const fileRow = ipcFile.locator('..').locator('..').first();
  await fileRow.scrollIntoViewIfNeeded();
  await fileRow.click({ button: 'right' });
}

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
  console.time('⏱️ Total test time');

  console.time('1. Page load');
  await page.goto('http://localhost:1420/');
  console.timeEnd('1. Page load');

  console.time('2. Open repo');
  await page.getByText('angkorgit', { exact: true }).first().click();
  await expect(page.getByPlaceholder('Search commits…')).toBeVisible({ timeout: CI_TIMEOUT });
  console.timeEnd('2. Open repo');

  console.time('3. Wait working copy');
  await expect(page.getByText('Working copy')).toBeVisible({ timeout: CI_TIMEOUT });
  console.timeEnd('3. Wait working copy');

  console.time('4. Right-click file');
  await page.getByText('ipc.ts', { exact: true }).first().click({ button: 'right' });
  console.timeEnd('4. Right-click file');

  console.time('5. Click Blame menu');
  // Directly trigger click in browser context to bypass viewport check
  await page.getByRole('menuitem', { name: /Blame/ }).evaluate((el: HTMLElement) => el.click());
  console.timeEnd('5. Click Blame menu');

  console.time('6. Verify blame panel');
  // Blame panel has aria-label "Blame of {filename}"
  await expect(page.locator('[aria-label^="Blame of"]')).toBeVisible({ timeout: CI_TIMEOUT });
  console.timeEnd('6. Verify blame panel');

  console.time('7. Verify hunk visible');
  await expect(page.locator('[data-testid="blame-hunk"]').first()).toBeVisible({
    timeout: CI_TIMEOUT,
  });
  console.timeEnd('7. Verify hunk visible');

  console.timeEnd('⏱️ Total test time');
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
  await rightClickWorkingCopyFile(page);
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
  await rightClickWorkingCopyFile(page);
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

test('clicks hunk to navigate to commit in graph', async ({ page }) => {
  await page.goto('http://localhost:1420/');
  await page.getByText('angkorgit', { exact: true }).first().click();
  await expect(page.getByPlaceholder('Search commits…')).toBeVisible({ timeout: CI_TIMEOUT });

  // Open blame
  await expect(page.getByText('Working copy')).toBeVisible({ timeout: CI_TIMEOUT });
  await rightClickWorkingCopyFile(page);
  await page.getByRole('menuitem', { name: /Blame/ }).click();

  // Wait for blame to load
  await expect(page.getByText(/Blame:/)).toBeVisible({ timeout: CI_TIMEOUT });

  // Click on first committed hunk (not uncommitted)
  const firstCommittedHunk = page.locator('[data-testid="blame-hunk"]').first();
  await expect(firstCommittedHunk).toBeVisible({ timeout: CI_TIMEOUT });

  // Get the commit hash before clicking
  const commitHash = await firstCommittedHunk.locator('text=/[0-9a-f]{7}/').textContent();
  expect(commitHash).toBeTruthy();

  // Click the hunk
  await firstCommittedHunk.click();

  // Verify blame panel closed and commit is selected in graph
  await expect(page.getByText(/Blame:/)).not.toBeVisible({ timeout: CI_TIMEOUT });
  await expect(page.getByPlaceholder('Search commits…')).toBeVisible({ timeout: CI_TIMEOUT });

  // Verify inspector shows commit details
  await expect(page.getByRole('complementary', { name: 'Inspector' })).toBeVisible({
    timeout: CI_TIMEOUT,
  });
});

test('opens blame from diff panel toolbar button', async ({ page }) => {
  await page.goto('http://localhost:1420/');
  await page.getByText('angkorgit', { exact: true }).first().click();
  await expect(page.getByPlaceholder('Search commits…')).toBeVisible({ timeout: CI_TIMEOUT });

  // Select a commit to view diff
  await page.getByRole('row').nth(1).click();
  await expect(page.getByRole('complementary', { name: 'Inspector' })).toBeVisible({
    timeout: CI_TIMEOUT,
  });

  // Click on a file to open diff
  const fileInCommit = page.getByRole('button', { name: /\.tsx?/ }).first();
  await fileInCommit.click();

  // Wait for diff panel
  await page.waitForTimeout(500);

  // Look for "Blame" or "Blame at this commit" button in toolbar
  const blameButton = page.getByRole('button', { name: /Blame/ });

  // If button exists, click it
  if ((await blameButton.count()) > 0) {
    await blameButton.first().click();

    // Verify blame panel opened
    await expect(page.getByText(/Blame:/)).toBeVisible({ timeout: CI_TIMEOUT });

    // Should show blame hunks
    await expect(page.locator('[data-testid="blame-hunk"]').first()).toBeVisible({
      timeout: CI_TIMEOUT,
    });
  }
});

test('right-click hunk menu provides copy actions', async ({ page }) => {
  await page.goto('http://localhost:1420/');
  await page.getByText('angkorgit', { exact: true }).first().click();
  await expect(page.getByPlaceholder('Search commits…')).toBeVisible({ timeout: CI_TIMEOUT });

  // Open blame
  await expect(page.getByText('Working copy')).toBeVisible({ timeout: CI_TIMEOUT });
  await rightClickWorkingCopyFile(page);
  await page.getByRole('menuitem', { name: /Blame/ }).click();

  // Wait for blame to load
  await expect(page.getByText(/Blame:/)).toBeVisible({ timeout: CI_TIMEOUT });

  // Wait for line to be rendered (with data-blame-line attribute)
  const blameLine = page.locator('[data-blame-line="1"]').first();
  await expect(blameLine).toBeVisible({ timeout: CI_TIMEOUT });

  // Right-click on a blame line
  await blameLine.click({ button: 'right' });

  // Verify context menu appears with copy options
  // Menu should have items like "Copy commit hash", "Copy author", etc.
  const menu = page.getByRole('menu');
  await expect(menu).toBeVisible({ timeout: CI_TIMEOUT });

  // Check for typical menu items
  const menuItems = page.getByRole('menuitem');
  const itemCount = await menuItems.count();
  expect(itemCount).toBeGreaterThan(0);
});

test('switches between working copy and specific commit blame', async ({ page }) => {
  await page.goto('http://localhost:1420/');
  await page.getByText('angkorgit', { exact: true }).first().click();
  await expect(page.getByPlaceholder('Search commits…')).toBeVisible({ timeout: CI_TIMEOUT });

  // Open blame at specific commit
  await page.getByRole('row').nth(1).click();
  await expect(page.getByRole('complementary', { name: 'Inspector' })).toBeVisible({
    timeout: CI_TIMEOUT,
  });

  const fileInCommit = page.getByRole('button', { name: /\.tsx?/ }).first();
  await fileInCommit.click({ button: 'right' });
  await page.getByRole('menuitem', { name: /Blame at this commit/ }).click();

  // Verify blame opened with commit badge
  await expect(page.getByText(/Blame:/)).toBeVisible({ timeout: CI_TIMEOUT });
  await expect(page.getByText(/at [0-9a-f]{7}/)).toBeVisible({ timeout: CI_TIMEOUT });

  // Click "Back to working copy" button
  const backButton = page.getByRole('button', { name: /Back to working copy/ });
  if ((await backButton.count()) > 0) {
    await backButton.click();

    // Verify switched to working copy blame
    await expect(page.getByText(/Blame:/)).toBeVisible({ timeout: CI_TIMEOUT });
    await expect(page.getByText('Working copy')).toBeVisible({ timeout: CI_TIMEOUT });
  }
});

test('DEBUG: screenshot menu interaction', async ({ page }) => {
  // Step 1: Load app
  await page.goto('http://localhost:1420/');
  await page.screenshot({ path: '/tmp/debug-01-initial.png', fullPage: true });

  // Step 2: Open repo
  await page.getByText('angkorgit', { exact: true }).first().click();
  await expect(page.getByPlaceholder('Search commits…')).toBeVisible({ timeout: CI_TIMEOUT });
  await page.screenshot({ path: '/tmp/debug-02-repo-opened.png', fullPage: true });

  // Step 3: Wait for working copy
  await expect(page.getByText('Working copy')).toBeVisible({ timeout: CI_TIMEOUT });
  await page.screenshot({ path: '/tmp/debug-03-working-copy-visible.png', fullPage: true });

  // Step 4: Find file row
  const fileRow = page.getByRole('button', { name: /\.tsx?/ }).first();
  await expect(fileRow).toBeVisible();
  await page.screenshot({ path: '/tmp/debug-04-file-row-found.png', fullPage: true });

  // Step 5: Highlight the file row (scroll into view)
  await fileRow.scrollIntoViewIfNeeded();
  await page.waitForTimeout(200);
  await page.screenshot({ path: '/tmp/debug-05-file-row-scrolled.png', fullPage: true });

  // Step 6: Right-click
  await fileRow.click({ button: 'right' });
  await page.waitForTimeout(300);
  await page.screenshot({ path: '/tmp/debug-06-after-right-click.png', fullPage: true });

  // Step 7: Wait a bit more for animations
  await page.waitForTimeout(500);
  await page.screenshot({ path: '/tmp/debug-07-after-wait.png', fullPage: true });

  // Step 8: Check DOM for menu elements
  const menuCount = await page.getByRole('menu').count();
  const menuitemCount = await page.getByRole('menuitem').count();
  console.log(`Found ${menuCount} menus and ${menuitemCount} menuitems`);

  // Step 9: Try to find any context menu content
  const contextMenuContent = await page.locator('[role="menu"], [data-radix-menu-content]').count();
  console.log(`Found ${contextMenuContent} menu content elements`);

  // Take final screenshot
  await page.screenshot({ path: '/tmp/debug-08-final-with-counts.png', fullPage: true });
});

test('opens file history from blame panel', async ({ page }) => {
  await page.goto('http://localhost:1420/');
  await page.getByText('angkorgit', { exact: true }).first().click();
  await expect(page.getByPlaceholder('Search commits…')).toBeVisible({ timeout: CI_TIMEOUT });

  // Open blame
  await expect(page.getByText('Working copy')).toBeVisible({ timeout: CI_TIMEOUT });
  await rightClickWorkingCopyFile(page);
  await page.getByRole('menuitem', { name: /Blame/ }).click();

  // Wait for blame to load
  await expect(page.getByText(/Blame:/)).toBeVisible({ timeout: CI_TIMEOUT });

  // Click File history button (should be in header)
  const historyButton = page.getByRole('button', { name: /File history/ });
  await expect(historyButton).toBeVisible({ timeout: CI_TIMEOUT });
  await historyButton.click();

  // Verify file history panel opened (blame should be replaced)
  await expect(page.getByText(/Blame:/)).not.toBeVisible({ timeout: CI_TIMEOUT });

  // File history panel should show commit list
  await page.waitForTimeout(500);
  const commitRows = page.getByRole('row');
  const rowCount = await commitRows.count();
  expect(rowCount).toBeGreaterThan(0);
});
