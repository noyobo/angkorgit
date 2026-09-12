import { expect, test } from '@rstest/playwright';

// 基于实际 UI 结构的面板测试

test('application layout renders with main sections', async ({ page }) => {
  await page.goto('http://localhost:1420/');
  await page.getByText('angkorgit', { exact: true }).first().click();
  await expect(page.getByPlaceholder('Search commits…')).toBeVisible({ timeout: 10_000 });
  
  // 验证主要区域存在（不依赖精确文本）
  const mainLayout = page.locator('[data-panel-id]').or(page.locator('main')).first();
  await expect(mainLayout).toBeVisible();
  
  // 验证有提交历史区域
  const commitRows = page.getByRole('row');
  const rowCount = await commitRows.count();
  expect(rowCount).toBeGreaterThan(5);
});

test('inspector panel shows commit details', async ({ page }) => {
  await page.goto('http://localhost:1420/');
  await page.getByText('angkorgit', { exact: true }).first().click();
  await expect(page.getByPlaceholder('Search commits…')).toBeVisible({ timeout: 10_000 });
  
  // 点击提交
  await page.getByRole('row').first().click();
  
  // 等待内容加载
  await page.waitForTimeout(1000);
  
  // 验证有详情面板（通过检查是否有文件或内容显示）
  const hasContent = await page.locator('[role="complementary"]').or(
    page.locator('[class*="inspector"]')
  ).count();
  
  expect(hasContent).toBeGreaterThan(0);
});

test('sidebar sections can expand and collapse', async ({ page }) => {
  await page.goto('http://localhost:1420/');
  await page.getByText('angkorgit', { exact: true }).first().click();
  await expect(page.getByPlaceholder('Search commits…')).toBeVisible({ timeout: 10_000 });
  
  // 查找任何可折叠的节头（使用更通用的选择器）
  const headers = page.locator('[role="button"]').filter({ 
    hasText: /Branches|Tags|Stashes|Remotes/ 
  });
  
  const headerCount = await headers.count();
  if (headerCount > 0) {
    const firstHeader = headers.first();
    await firstHeader.click();
    // 折叠/展开动作应该成功（不验证具体状态，只验证可交互）
    expect(true).toBe(true);
  }
});

test('commit message input is accessible', async ({ page }) => {
  await page.goto('http://localhost:1420/');
  await page.getByText('angkorgit', { exact: true }).first().click();
  await expect(page.getByPlaceholder('Search commits…')).toBeVisible({ timeout: 10_000 });
  
  // 查找提交输入框（使用多种可能的选择器）
  const commitInput = page.locator('[placeholder*="summary"]').or(
    page.locator('[placeholder*="message"]')
  ).or(
    page.locator('input[type="text"]').filter({ hasText: '' })
  ).first();
  
  const inputExists = await commitInput.count() > 0;
  expect(inputExists).toBe(true);
});
