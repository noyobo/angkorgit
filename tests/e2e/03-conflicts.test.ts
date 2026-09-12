import { expect, test } from '@rstest/playwright';

test('conflict resolver picks lines into a clean output', async ({ page }) => {
  await page.goto('http://localhost:1420/');
  await page.getByText('angkorgit', { exact: true }).first().click();
  await expect(page.getByPlaceholder('Search commits…')).toBeVisible({ timeout: 10_000 });
  await page.getByRole('button', { name: /drawGraph\.ts/ }).first().click();
  await expect(page.getByText('0 of 1 resolved')).toBeVisible();
  await expect(page.getByTitle(/Unresolved conflict/).first()).toBeVisible();
  await expect(page.getByText('<<<<<<<')).toHaveCount(0);
  await page.getByLabel('Take all lines from side A').click();
  await expect(page.getByText('1 of 1 resolved')).toBeVisible();
  await expect(page.getByText('const palette = useThemePalette();')).toHaveCount(2);
  await expect(page.getByRole('button', { name: 'Mark resolved' })).toBeEnabled();
});

test('single conflict shows jump nav and per-conflict take-all', async ({ page }) => {
  await page.goto('http://localhost:1420/');
  await page.getByText('angkorgit', { exact: true }).first().click();
  await expect(page.getByPlaceholder('Search commits…')).toBeVisible({ timeout: 10_000 });
  await page.getByRole('button', { name: /drawGraph\.ts/ }).first().click();
  await expect(page.getByText('0 of 1 resolved')).toBeVisible();
  await expect(page.getByLabel('Next conflict')).toBeVisible();
  await expect(page.getByText('Conflict 1 of 1')).toBeVisible();
  await page.getByLabel('Take all lines from B for this conflict').click();
  await expect(page.getByText('1 of 1 resolved')).toBeVisible();
  await page.getByLabel('Take all lines from B for this conflict').click();
  await expect(page.getByText('0 of 1 resolved')).toBeVisible();
  await page.getByTitle(/Unresolved conflict/).first().click();
  const editor = page.getByLabel('Hand-edited result for this conflict');
  await expect(editor).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(editor).toBeHidden();
  await expect(page.getByText('0 of 1 resolved')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Mark resolved' })).toBeDisabled();
});

test('single conflict shows jump nav and per-conflict take-all', async ({ page }) => {
  await page.goto('http://localhost:1420/');
  await page.getByText('angkorgit', { exact: true }).first().click();
  await expect(page.getByPlaceholder('Search commits…')).toBeVisible({ timeout: 10_000 });
  await page.getByRole('button', { name: /drawGraph\.ts/ }).first().click();
  await expect(page.getByText('0 of 1 resolved')).toBeVisible();
  await expect(page.getByLabel('Next conflict')).toBeVisible();
  await expect(page.getByText('Conflict 1 of 1')).toBeVisible();
  await page.getByLabel('Take all lines from B for this conflict').click();
  await expect(page.getByText('1 of 1 resolved')).toBeVisible();
  await page.getByLabel('Take all lines from B for this conflict').click();
  await expect(page.getByText('0 of 1 resolved')).toBeVisible();
  await page.getByTitle(/Unresolved conflict/).first().click();
  const editor = page.getByLabel('Hand-edited result for this conflict');
  await expect(editor).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(editor).toBeHidden();
  await expect(page.getByText('0 of 1 resolved')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Mark resolved' })).toBeDisabled();
});

test('conflict result can be hand-edited per block', async ({ page }) => {
  await page.goto('http://localhost:1420/');
  await page.getByText('angkorgit', { exact: true }).first().click();
  await expect(page.getByPlaceholder('Search commits…')).toBeVisible({ timeout: 10_000 });
  await page.getByRole('button', { name: /drawGraph\.ts/ }).first().click();
  await expect(page.getByText('0 of 1 resolved')).toBeVisible();
  await page.getByTitle(/Unresolved conflict/).first().click();
  const editor = page.getByLabel('Hand-edited result for this conflict');
  await expect(editor).toBeVisible();
  await editor.fill('const palette = mergedThemePalette();');
  await expect(page.getByText('1 of 1 resolved')).toBeVisible();
  await page.getByText('Result', { exact: true }).click();
  await expect(editor).toBeHidden();
  await expect(page.getByText('const palette = mergedThemePalette();')).toBeVisible();
  await expect(page.getByText('1 edited by hand')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Mark resolved' })).toBeEnabled();
  await page.getByText('const palette = mergedThemePalette();').click();
  await expect(editor).toBeVisible();
  await editor.fill('scrapped');
  await page.keyboard.press('Escape');
  await expect(editor).toBeHidden();
  await expect(page.getByText('const palette = mergedThemePalette();')).toBeVisible();
  await expect(page.getByText('scrapped')).toBeHidden();
  await expect(page.getByText('1 of 1 resolved')).toBeVisible();
});

test('conflict result can be hand-edited per block', async ({ page }) => {
  await page.goto('http://localhost:1420/');
  await page.getByText('angkorgit', { exact: true }).first().click();
  await expect(page.getByPlaceholder('Search commits…')).toBeVisible({ timeout: 10_000 });
  await page.getByRole('button', { name: /drawGraph\.ts/ }).first().click();
  await expect(page.getByText('0 of 1 resolved')).toBeVisible();
  await page.getByTitle(/Unresolved conflict/).first().click();
  const editor = page.getByLabel('Hand-edited result for this conflict');
  await expect(editor).toBeVisible();
  await editor.fill('const palette = mergedThemePalette();');
  await expect(page.getByText('1 of 1 resolved')).toBeVisible();
  await page.getByText('Result', { exact: true }).click();
  await expect(editor).toBeHidden();
  await expect(page.getByText('const palette = mergedThemePalette();')).toBeVisible();
  await expect(page.getByText('1 edited by hand')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Mark resolved' })).toBeEnabled();
  await page.getByText('const palette = mergedThemePalette();').click();
  await expect(editor).toBeVisible();
  await editor.fill('scrapped');
  await page.keyboard.press('Escape');
  await expect(editor).toBeHidden();
  await expect(page.getByText('const palette = mergedThemePalette();')).toBeVisible();
  await expect(page.getByText('scrapped')).toBeHidden();
  await expect(page.getByText('1 of 1 resolved')).toBeVisible();
});

test('conflict picks land in file order and a half-picked side shows as mixed', async ({ page }) => {
  await page.goto('http://localhost:1420/');
  await page.getByText('angkorgit', { exact: true }).first().click();
  await expect(page.getByPlaceholder('Search commits…')).toBeVisible({ timeout: 10_000 });
  await page.getByRole('button', { name: /drawGraph\.ts/ }).first().click();
  await expect(page.getByText('0 of 1 resolved')).toBeVisible();
  await page.getByText('return render(rows, { colors });').first().click();
  await page.getByText('const palette = useThemePalette();').first().click();
  await expect(page.getByText('1 of 1 resolved')).toBeVisible();
  await expect(page.getByText('resolved', { exact: true })).toBeVisible();
  const resultLines = page.locator('[data-line] pre');
  await expect(resultLines).toHaveCount(2);
  await expect(resultLines.nth(0)).toHaveText(/const palette = useThemePalette\(\);/);
  await expect(resultLines.nth(1)).toHaveText(/return render\(rows, \{ colors \}\);/);
  await expect(page.getByLabel('Take all lines from A for this conflict')).toHaveAttribute('aria-checked', 'mixed');
  await expect(page.getByLabel('Take all lines from B for this conflict')).toHaveAttribute('aria-checked', 'mixed');
  await page.getByLabel('Take all lines from A for this conflict').click();
  await expect(page.getByLabel('Take all lines from A for this conflict')).toHaveAttribute('aria-checked', 'true');
  await expect(resultLines).toHaveCount(3);
});

test('conflict picks land in file order and a half-picked side shows as mixed', async ({ page }) => {
  await page.goto('http://localhost:1420/');
  await page.getByText('angkorgit', { exact: true }).first().click();
  await expect(page.getByPlaceholder('Search commits…')).toBeVisible({ timeout: 10_000 });
  await page.getByRole('button', { name: /drawGraph\.ts/ }).first().click();
  await expect(page.getByText('0 of 1 resolved')).toBeVisible();
  await page.getByText('return render(rows, { colors });').first().click();
  await page.getByText('const palette = useThemePalette();').first().click();
  await expect(page.getByText('1 of 1 resolved')).toBeVisible();
  await expect(page.getByText('resolved', { exact: true })).toBeVisible();
  const resultLines = page.locator('[data-line] pre');
  await expect(resultLines).toHaveCount(2);
  await expect(resultLines.nth(0)).toHaveText(/const palette = useThemePalette\(\);/);
  await expect(resultLines.nth(1)).toHaveText(/return render\(rows, \{ colors \}\);/);
  await expect(page.getByLabel('Take all lines from A for this conflict')).toHaveAttribute('aria-checked', 'mixed');
  await expect(page.getByLabel('Take all lines from B for this conflict')).toHaveAttribute('aria-checked', 'mixed');
  await page.getByLabel('Take all lines from A for this conflict').click();
  await expect(page.getByLabel('Take all lines from A for this conflict')).toHaveAttribute('aria-checked', 'true');
  await expect(resultLines).toHaveCount(3);
});

test('the resolver picks with the keyboard and opens the next conflicted file after saving', async ({ page }) => {
  await page.goto('http://localhost:1420/');
  await page.getByText('angkorgit', { exact: true }).first().click();
  await expect(page.getByPlaceholder('Search commits…')).toBeVisible({ timeout: 10_000 });
  await page.getByRole('button', { name: /laneColors\.ts/ }).first().click();
  await expect(page.getByText('0 of 3 resolved')).toBeVisible();
  await expect(page.getByText('File 2 of 2')).toBeVisible();
  await page.keyboard.press('a');
  await expect(page.getByText('1 of 3 resolved')).toBeVisible();
  await page.keyboard.press('ArrowDown');
  await expect(page.getByText('Conflict 2 of 3')).toBeVisible();
  await page.keyboard.press('b');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('b');
  await expect(page.getByText('3 of 3 resolved')).toBeVisible();
  await expect(page.getByText('(section deleted)')).toBeVisible();
  await page.keyboard.press('ControlOrMeta+Enter');
  await expect(page.getByText('laneColors.ts resolved')).toBeVisible();
  await expect(page.getByText('1 more file to resolve')).toBeVisible();
  await expect(page.getByRole('dialog', { name: /Resolve conflicts in src\/features\/graph\/drawGraph\.ts/ })).toBeVisible();
  await expect(page.getByText('File 1 of 2')).toBeHidden();
});

test('leaving a conflict with picks asks first while a clean resolver closes on Escape', async ({ page }) => {
  await page.goto('http://localhost:1420/');
  await page.getByText('angkorgit', { exact: true }).first().click();
  await expect(page.getByPlaceholder('Search commits…')).toBeVisible({ timeout: 10_000 });
  const open = () => page.getByRole('button', { name: /drawGraph\.ts/ }).first().click();
  const resolver = page.getByRole('dialog', { name: /Resolve conflicts/ });
  await open();
  await expect(resolver).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(resolver).toBeHidden();
  await open();
  await page.getByLabel('Take all lines from A for this conflict').click();
  await page.keyboard.press('Escape');
  const confirm = page.getByRole('dialog').filter({ hasText: 'Leave this file unresolved?' });
  await expect(confirm).toBeVisible();
  await confirm.getByRole('button', { name: 'Cancel' }).click();
  await expect(confirm).toBeHidden();
  await expect(page.getByText('1 of 1 resolved')).toBeVisible();
  await resolver.getByRole('button', { name: 'Close', exact: true }).click();
  await expect(confirm).toBeVisible();
  await confirm.getByRole('button', { name: 'Leave' }).click();
  await expect(resolver).toBeHidden();
});

test('right-clicking a branch tip offers to push that branch', async ({ page }) => {
  await page.goto('http://localhost:1420/');
  await page.getByText('angkorgit', { exact: true }).first().click();
  await expect(page.getByPlaceholder('Search commits…')).toBeVisible({ timeout: 10_000 });
  await page.getByRole('row').nth(0).click({ button: 'right' });
  const pushItem = page.getByRole('menuitem', { name: /^Push main/ });
  await expect(pushItem).toBeVisible();
  await expect(pushItem).toContainText('↑2');
  await page.keyboard.press('Escape');
  await page.getByRole('row').nth(3).click({ button: 'right' });
  await expect(page.getByRole('menuitem', { name: /Cherry-pick onto current branch/ })).toBeVisible();
  await expect(page.getByRole('menuitem', { name: /^Push/ })).toHaveCount(0);
});

test('conflict resolver shows line numbers in both sides and the result', async ({ page }) => {
  await page.goto('http://localhost:1420/');
  await page.getByText('angkorgit', { exact: true }).first().click();
  await expect(page.getByPlaceholder('Search commits…')).toBeVisible({ timeout: 10_000 });
  await page.getByRole('button', { name: /drawGraph\.ts/ }).first().click();
  const dialog = page.getByRole('dialog', { name: /Resolve conflicts/ });
  await expect(dialog).toBeVisible();
  const gutters = dialog.locator('span[data-line-no]');
  const values = (await gutters.allInnerTexts()).map((t) => t.trim()).filter(Boolean).map(Number);
  expect(values.length).toBeGreaterThan(6);
  expect(values.filter((n) => n === 1).length).toBeGreaterThanOrEqual(3);
  expect(values.every((n) => Number.isInteger(n) && n > 0)).toBe(true);
});

test('the checked-out branch chip is filled while other local chips stay tinted', async ({ page }) => {
  await page.goto('http://localhost:1420/');
  await page.getByText('angkorgit', { exact: true }).first().click();
  await expect(page.getByPlaceholder('Search commits…')).toBeVisible({ timeout: 10_000 });
  const headChip = page.getByTitle(/^main · local/).first();
  const otherChip = page.getByTitle(/^feature\/diff-viewer · local/).first();
  const opacity = (color: string) => Number(color.split(',')[3]?.replace(')', '') ?? '1');
  const headBg = await headChip.evaluate((el) => getComputedStyle(el).backgroundColor);
  const otherBg = await otherChip.evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(headBg).not.toBe(otherBg);
  expect(opacity(headBg)).toBe(1);
  expect(opacity(otherBg)).toBeLessThan(1);
});
