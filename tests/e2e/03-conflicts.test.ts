import { expect, test } from '@rstest/playwright';

// 增加 CI 环境的超时时间
const CI_TIMEOUT = 15_000;

test('conflict resolver picks lines into a clean output', async ({ page }) => {
  await page.goto('http://localhost:1420/');
  await page.getByText('angkorgit', { exact: true }).first().click();
  await expect(page.getByPlaceholder('Search commits…')).toBeVisible({ timeout: CI_TIMEOUT });
  // 等待冲突文件按钮加载
  await page.waitForTimeout(500);
  await page.getByRole('button', { name: /drawGraph\.ts/ }).first().click();
  await expect(page.getByText('0 of 1 resolved')).toBeVisible({ timeout: CI_TIMEOUT });
  await expect(page.getByTitle(/Unresolved conflict/).first()).toBeVisible({ timeout: CI_TIMEOUT });
  await expect(page.getByText('<<<<<<<')).toHaveCount(0);
  await page.getByLabel('Take all lines from side A').click();
  await expect(page.getByText('1 of 1 resolved')).toBeVisible({ timeout: CI_TIMEOUT });
  await expect(page.getByText('const palette = useThemePalette();')).toHaveCount(2);
  await expect(page.getByRole('button', { name: 'Mark resolved' })).toBeEnabled();
});

test('single conflict shows jump nav and per-conflict take-all', async ({ page }) => {
  await page.goto('http://localhost:1420/');
  await page.getByText('angkorgit', { exact: true }).first().click();
  await expect(page.getByPlaceholder('Search commits…')).toBeVisible({ timeout: CI_TIMEOUT });
  await page.waitForTimeout(500);
  await page.getByRole('button', { name: /drawGraph\.ts/ }).first().click();
  await expect(page.getByText('0 of 1 resolved')).toBeVisible({ timeout: CI_TIMEOUT });
  await expect(page.getByLabel('Next conflict')).toBeVisible({ timeout: CI_TIMEOUT });
  await expect(page.getByText('Conflict 1 of 1')).toBeVisible({ timeout: CI_TIMEOUT });
  await page.getByLabel('Take all lines from B for this conflict').click();
  await expect(page.getByText('1 of 1 resolved')).toBeVisible({ timeout: CI_TIMEOUT });
  await page.getByLabel('Take all lines from B for this conflict').click();
  await expect(page.getByText('0 of 1 resolved')).toBeVisible({ timeout: CI_TIMEOUT });
  await page.getByTitle(/Unresolved conflict/).first().click();
  const editor = page.getByLabel('Hand-edited result for this conflict');
  await expect(editor).toBeVisible({ timeout: CI_TIMEOUT });
  await page.keyboard.press('Escape');
  await expect(editor).toBeHidden();
  await expect(page.getByText('0 of 1 resolved')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Mark resolved' })).toBeDisabled();
});

test('conflict result can be hand-edited per block', async ({ page }) => {
  await page.goto('http://localhost:1420/');
  await page.getByText('angkorgit', { exact: true }).first().click();
  await expect(page.getByPlaceholder('Search commits…')).toBeVisible({ timeout: CI_TIMEOUT });
  await page.waitForTimeout(500);
  await page.getByRole('button', { name: /drawGraph\.ts/ }).first().click();
  await expect(page.getByText('0 of 1 resolved')).toBeVisible({ timeout: CI_TIMEOUT });
  await page.getByTitle(/Unresolved conflict/).first().click();
  const editor = page.getByLabel('Hand-edited result for this conflict');
  await expect(editor).toBeVisible({ timeout: CI_TIMEOUT });
  await editor.fill('const palette = mergedThemePalette();');
  await expect(page.getByText('1 of 1 resolved')).toBeVisible({ timeout: CI_TIMEOUT });
  await page.getByText('Result', { exact: true }).click();
  await expect(editor).toBeHidden();
  await expect(page.getByText('const palette = mergedThemePalette();')).toBeVisible();
  await expect(page.getByText('1 edited by hand')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Mark resolved' })).toBeEnabled();
  await page.getByText('const palette = mergedThemePalette();').click();
  await expect(editor).toBeVisible({ timeout: CI_TIMEOUT });
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
  await expect(page.getByPlaceholder('Search commits…')).toBeVisible({ timeout: CI_TIMEOUT });
  await page.waitForTimeout(500);
  await page.getByRole('button', { name: /drawGraph\.ts/ }).first().click();
  await expect(page.getByText('0 of 1 resolved')).toBeVisible({ timeout: CI_TIMEOUT });
  const sideA = page.getByLabel('Take all lines from side A').first();
  await expect(sideA).not.toBeChecked();
  const line2 = page.getByLabel('Take line 2 from side A');
  await line2.click();
  await expect(sideA).toHaveAttribute('data-state', 'indeterminate');
  const line3 = page.getByLabel('Take line 3 from side A');
  await line3.click();
  await expect(sideA).toBeChecked();
  await expect(page.getByText('const palette = useThemePalette();')).toHaveCount(2);
  await line3.click();
  await expect(sideA).toHaveAttribute('data-state', 'indeterminate');
  await expect(page.getByText('const palette = useThemePalette();')).toHaveCount(1);
});

test('the resolver picks with the keyboard and opens the next conflicted file after saving', async ({ page }) => {
  await page.goto('http://localhost:1420/');
  await page.getByText('angkorgit', { exact: true }).first().click();
  await expect(page.getByPlaceholder('Search commits…')).toBeVisible({ timeout: CI_TIMEOUT });
  await page.waitForTimeout(500);
  await page.getByRole('button', { name: /drawGraph\.ts/ }).first().click();
  await expect(page.getByText('0 of 1 resolved')).toBeVisible({ timeout: CI_TIMEOUT });
  await page.keyboard.press('KeyA');
  await expect(page.getByText('1 of 1 resolved')).toBeVisible({ timeout: CI_TIMEOUT });
  await page.keyboard.press('ControlOrMeta+Enter');
  await expect(page.getByText('1 more file to resolve')).toBeVisible({ timeout: CI_TIMEOUT });
  await expect(page.locator('[data-conflict-file="active"]')).toContainText('laneColors.ts');
});

test('leaving a conflict with picks asks first while a clean resolver closes on Escape', async ({ page }) => {
  await page.goto('http://localhost:1420/');
  await page.getByText('angkorgit', { exact: true }).first().click();
  await expect(page.getByPlaceholder('Search commits…')).toBeVisible({ timeout: CI_TIMEOUT });
  await page.waitForTimeout(500);
  await page.getByRole('button', { name: /drawGraph\.ts/ }).first().click();
  await expect(page.getByText('0 of 1 resolved')).toBeVisible({ timeout: CI_TIMEOUT });
  await page.keyboard.press('Escape');
  await expect(page.getByText('Discard edits and leave?')).toBeHidden();
  await page.getByRole('button', { name: /drawGraph\.ts/ }).first().click();
  await page.keyboard.press('KeyA');
  await page.keyboard.press('Escape');
  await expect(page.getByText('Discard edits and leave?')).toBeVisible({ timeout: CI_TIMEOUT });
  await page.getByRole('button', { name: 'Cancel' }).click();
  await expect(page.getByText('1 of 1 resolved')).toBeVisible();
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Discard' }).click();
  await expect(page.getByText('0 of 1 resolved')).toBeHidden();
});

test('right-clicking a branch tip offers to push that branch', async ({ page }) => {
  await page.goto('http://localhost:1420/');
  await page.getByText('angkorgit', { exact: true }).first().click();
  await expect(page.getByPlaceholder('Search commits…')).toBeVisible({ timeout: CI_TIMEOUT });
  const mainTip = page.getByRole('row').filter({ has: page.locator('[data-ref-name="main"]') }).first();
  await mainTip.click({ button: 'right' });
  await expect(page.getByRole('menuitem', { name: /Push main/ })).toBeVisible({ timeout: CI_TIMEOUT });
  await page.keyboard.press('Escape');
  const develop = page.getByRole('row').filter({ has: page.locator('[data-ref-name="develop"]') });
  await develop.first().click({ button: 'right' });
  await expect(page.getByRole('menuitem', { name: /Push develop/ })).toBeVisible({ timeout: CI_TIMEOUT });
});

test('conflict resolver shows line numbers in both sides and the result', async ({ page }) => {
  await page.goto('http://localhost:1420/');
  await page.getByText('angkorgit', { exact: true }).first().click();
  await expect(page.getByPlaceholder('Search commits…')).toBeVisible({ timeout: CI_TIMEOUT });
  await page.waitForTimeout(500);
  await page.getByRole('button', { name: /drawGraph\.ts/ }).first().click();
  await expect(page.getByText('0 of 1 resolved')).toBeVisible({ timeout: CI_TIMEOUT });
  const aGutter = page.locator('[data-pane="a"] [data-line-no]').first();
  await expect(aGutter).toHaveText('1');
  const bGutter = page.locator('[data-pane="b"] [data-line-no]').first();
  await expect(bGutter).toHaveText('1');
  await page.getByLabel('Take all lines from side A').click();
  const resultGutter = page.locator('[data-pane="result"] [data-line-no]').first();
  await expect(resultGutter).toHaveText('1');
});

test('the checked-out branch chip is filled while other local chips stay tinted', async ({ page }) => {
  await page.goto('http://localhost:1420/');
  await page.getByText('angkorgit', { exact: true }).first().click();
  await expect(page.getByPlaceholder('Search commits…')).toBeVisible({ timeout: CI_TIMEOUT });
  const mainChip = page.locator('[data-ref-name="main"]').first();
  await expect(mainChip).toHaveClass(/bg-success/);
  const developRow = page.getByRole('row').filter({ has: page.locator('[data-ref-name="develop"]') });
  const developChip = developRow.locator('[data-ref-name="develop"]').first();
  await expect(developChip).not.toHaveClass(/bg-success/);
  await expect(developChip).toHaveClass(/bg-success\/15/);
});
