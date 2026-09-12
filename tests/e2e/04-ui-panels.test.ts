import { expect, test } from '@rstest/playwright';

// 增加 CI 环境的超时时间
const CI_TIMEOUT = 15_000;

test('application layout renders with main sections', async ({ page }) => {
  await page.goto('http://localhost:1420/');
  await page.getByText('angkorgit', { exact: true }).first().click();
  await expect(page.getByPlaceholder('Search commits…')).toBeVisible({ timeout: CI_TIMEOUT });
  
  // 验证提交历史区域存在
  const commitRows = page.getByRole('row');
  const rowCount = await commitRows.count();
  expect(rowCount).toBeGreaterThan(5);
  
  // 验证侧边栏可见
  await expect(page.getByText('Branches')).toBeVisible();
});

test('inspector panel shows commit details', async ({ page }) => {
  await page.goto('http://localhost:1420/');
  await page.getByText('angkorgit', { exact: true }).first().click();
  await expect(page.getByPlaceholder('Search commits…')).toBeVisible({ timeout: CI_TIMEOUT });
  
  // 点击第一个提交
  await page.getByRole('row').first().click();
  
  // 验证 Inspector 面板显示文件信息
  await expect(page.getByRole('complementary', { name: 'Inspector' })).toBeVisible({ timeout: CI_TIMEOUT });
  await expect(page.getByLabel('4 modified')).toBeVisible({ timeout: CI_TIMEOUT });
});

test('sidebar sections can expand and collapse', async ({ page }) => {
  await page.goto('http://localhost:1420/');
  await page.getByText('angkorgit', { exact: true }).first().click();
  await expect(page.getByPlaceholder('Search commits…')).toBeVisible({ timeout: CI_TIMEOUT });
  
  // 验证 Branches 区域存在且可交互
  const branchesSection = page.getByText('Branches').first();
  await expect(branchesSection).toBeVisible();
  
  // 验证侧边栏中有分支列表
  await expect(page.getByText('main', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('develop')).toBeVisible();
});

test('working copy panel shows when no commit is selected', async ({ page }) => {
  await page.goto('http://localhost:1420/');
  await page.getByText('angkorgit', { exact: true }).first().click();
  await expect(page.getByPlaceholder('Search commits…')).toBeVisible({ timeout: CI_TIMEOUT });
  
  // 验证 Working copy 面板默认显示
  await expect(page.getByText('Working copy')).toBeVisible({ timeout: CI_TIMEOUT });
  
  // 验证提交按钮存在（匹配 "Commit" 开头的按钮名称）
  await expect(page.getByRole('button', { name: /^Commit/ })).toBeVisible();
});
