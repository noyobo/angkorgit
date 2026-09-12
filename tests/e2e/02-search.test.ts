import { expect, test } from '@rstest/playwright';

// 增加 CI 环境的超时时间
const CI_TIMEOUT = 15_000;

test('the status bar branch name opens a local branch switcher', async ({ page }) => {
  await page.goto('http://localhost:1420/');
  await page.getByText('angkorgit', { exact: true }).first().click();
  await expect(page.getByPlaceholder('Search commits…')).toBeVisible({ timeout: CI_TIMEOUT });
  // 等待页面完全加载后再点击状态栏
  await page.waitForTimeout(500);
  await page.getByTestId('status-bar-branch').click();
  const filter = page.getByPlaceholder('Filter branches…');
  await expect(filter).toBeFocused({ timeout: CI_TIMEOUT });
  await expect(page.getByRole('option', { name: 'develop' })).toBeVisible({ timeout: CI_TIMEOUT });
  await expect(page.getByRole('option', { name: /develop/ })).toContainText(/ago|just now/);
  await expect(page.getByRole('option', { name: 'origin/main' })).toHaveCount(0);
  await filter.fill('origin');
  await expect(page.getByText('No branches match')).toBeVisible({ timeout: CI_TIMEOUT });
  await filter.fill('develop');
  await page.getByRole('option', { name: 'develop' }).click();
  await expect(page.getByText('Checkout develop done')).toBeVisible({ timeout: CI_TIMEOUT });
});

test('commit search finds matches in the full graph and steps through them', async ({ page }) => {
  await page.goto('http://localhost:1420/');
  await page.getByText('angkorgit', { exact: true }).first().click();
  const search = page.getByPlaceholder('Search commits…');
  await expect(search).toBeVisible({ timeout: 10_000 });
  await search.fill('virtualize');
  await expect(page.getByText(/^1 of \d+$/)).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText(/200\+ commits/)).toBeVisible();
  await expect(page.locator('[data-search-match="active"]')).toHaveText(/virtualize commit rows/);
  await expect(page.locator('[data-search-match]').first()).toBeVisible();
  await search.press('Enter');
  await expect(page.getByText(/^2 of \d+$/)).toBeVisible();
  await page.getByLabel('Previous match').click();
  await expect(page.getByText(/^1 of \d+$/)).toBeVisible();
  await page.getByText('fix(diff): handle renamed files in word diff').first().click();
  await expect(search).toHaveValue('virtualize');
  await expect(page.locator('[data-search-match="active"]')).toHaveCount(0);
  await search.press('Escape');
  await expect(search).toHaveValue('');
  await expect(page.getByText(/^1 of \d+$/)).toBeHidden();
});

test('the author box finds commits without flattening the graph', async ({ page }) => {
  await page.goto('http://localhost:1420/');
  await page.getByText('angkorgit', { exact: true }).first().click();
  const author = page.getByPlaceholder('Find author…');
  await expect(author).toBeVisible({ timeout: 10_000 });
  await author.fill('Dara');
  await expect(page.getByText(/^1 of \d+$/)).toBeVisible({ timeout: 10_000 });
  await expect(page.locator('[data-search-match="active"]')).toContainText('Dara Kim');
  await expect(page.getByText(/200\+ commits/)).toBeVisible();
  await expect(page.locator('[data-graph-tail]').first()).toBeVisible();
  await page.getByPlaceholder('Search commits…').fill('renamed');
  await expect(page.locator('[data-search-match="active"]')).toContainText('fix(diff): handle renamed files');
  await author.press('Enter');
  await expect(page.getByText(/^2 of \d+$/)).toBeVisible();
});
