import { expect, test } from '@rstest/playwright';

const CI_TIMEOUT = 30000;

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

  // Step 4: Find file row - search for ipc.ts text
  const ipcElement = page.locator('text=ipc.ts');
  const ipcCount = await ipcElement.count();
  console.log('Total ipc.ts elements on page:', ipcCount);

  if (ipcCount === 0) {
    throw new Error('Could not find ipc.ts element on page');
  }

  const ipcFirst = ipcElement.first();
  const ipcVisible = await ipcFirst.isVisible();
  console.log('First ipc.ts visible:', ipcVisible);

  // The file row should be a parent of the text element
  // Try to find the clickable parent
  const fileRow = ipcFirst.locator('xpath=ancestor::div[@role="button"]').first();
  const fileRowFound = (await fileRow.count()) > 0;
  console.log('File row with role=button found:', fileRowFound);

  if (!fileRowFound) {
    // Fallback: just use the immediate parent
    const fallbackRow = ipcFirst.locator('..').locator('..').first();
    const fallbackClass = await fallbackRow.getAttribute('class');
    console.log('Using fallback row with class:', fallbackClass);
    await fallbackRow.scrollIntoViewIfNeeded();
    await page.screenshot({ path: '/tmp/debug-04-file-row-found.png', fullPage: true });

    // Step 5: Right-click
    await page.waitForTimeout(200);
    await fallbackRow.click({ button: 'right' });
    await page.waitForTimeout(300);
    await page.screenshot({ path: '/tmp/debug-05-after-right-click.png', fullPage: true });

    // Continue with fallback
    await page.waitForTimeout(500);
    await page.screenshot({ path: '/tmp/debug-06-after-wait.png', fullPage: true });
  } else {
    await fileRow.scrollIntoViewIfNeeded();
    await page.screenshot({ path: '/tmp/debug-04-file-row-found.png', fullPage: true });

    // Step 5: Right-click
    await page.waitForTimeout(200);
    await fileRow.click({ button: 'right' });
    await page.waitForTimeout(300);
    await page.screenshot({ path: '/tmp/debug-05-after-right-click.png', fullPage: true });

    await page.waitForTimeout(500);
    await page.screenshot({ path: '/tmp/debug-06-after-wait.png', fullPage: true });
  }

  // Step 6: Check for menu (screenshots already taken above)
  // (steps 5 and 6 are now integrated in the conditional above)

  // Step 7: Check DOM for menu elements
  const menuCount = await page.getByRole('menu').count();
  const menuitemCount = await page.getByRole('menuitem').count();
  const contextMenuContent = await page.locator('[role="menu"], [data-radix-menu-content]').count();

  // Take final screenshot
  await page.screenshot({ path: '/tmp/debug-07-final-with-counts.png', fullPage: true });

  // Fail with debug info if menu didn't appear
  if (menuCount === 0) {
    throw new Error(
      `Menu did not appear after right-click.\n` +
        `Menu count: ${menuCount}\n` +
        `Menuitem count: ${menuitemCount}\n` +
        `Context menu content elements: ${contextMenuContent}\n` +
        `Total buttons found: ${allButtons.length}\n` +
        `First few buttons: ${JSON.stringify(firstFewButtons, null, 2)}\n`,
    );
  }
});
