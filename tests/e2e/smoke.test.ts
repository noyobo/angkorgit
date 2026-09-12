import { expect, test } from '@rstest/playwright';

test('can load the application', async ({ page }) => {
  await page.goto('http://localhost:1420/', { waitUntil: 'networkidle' });
  
  // 等待页面加载
  await page.waitForSelector('body');
  
  // 检查页面内容
  const bodyText = await page.textContent('body');
  expect(bodyText).toBeTruthy();
  expect(bodyText!.length).toBeGreaterThan(0);
});

test('splash screen appears', async ({ page }) => {
  await page.goto('http://localhost:1420/');
  
  // 等待内容加载
  await page.waitForFunction(
    () => document.body.textContent && document.body.textContent.length > 100,
    { timeout: 15000 }
  );
  
  const bodyText = await page.textContent('body');
  const hasContent = bodyText?.includes('Strength') || 
                     bodyText?.includes('Recent') || 
                     bodyText?.includes('repository');
  
  expect(hasContent).toBe(true);
});

test('can interact with the page', async ({ page }) => {
  await page.goto('http://localhost:1420/', { waitUntil: 'networkidle' });
  
  // 等待页面完全加载
  await page.waitForFunction(
    () => document.querySelectorAll('*').length > 50,
    { timeout: 15000 }
  );
  
  // 检查元素数量
  const elementCount = await page.locator('*').count();
  expect(elementCount).toBeGreaterThan(50);
});

test('opens the demo repository', async ({ page }) => {
  await page.goto('http://localhost:1420/');
  
  // 等待欢迎页面
  await expect(page.getByText('Recent repositories')).toBeVisible({ timeout: 10000 });
  
  // 点击 demo 仓库
  const demoRepo = page.locator('[data-testid="recent-repo"][data-path$="/angkorgit"]');
  await expect(demoRepo).toBeVisible();
  await demoRepo.click();
  
  // 验证打开了仓库
  await expect(page.getByPlaceholder('Search commits…')).toBeVisible({ timeout: 15000 });
  await expect(page.getByText('Working copy')).toBeVisible();
});

test('selecting a commit opens the inspector', async ({ page }) => {
  await page.goto('http://localhost:1420/');
  
  // 打开 demo 仓库
  await page.getByText('Recent repositories').waitFor({ state: 'visible', timeout: 10000 });
  const demoRepo = page.locator('[data-testid="recent-repo"][data-path$="/angkorgit"]');
  await demoRepo.click();
  await page.getByPlaceholder('Search commits…').waitFor({ state: 'visible', timeout: 15000 });
  
  // 点击第一个提交
  await page.locator('[role="row"]').first().click();
  
  // 验证 inspector 打开
  const inspector = page.getByRole('complementary', { name: 'Inspector' });
  await expect(inspector.locator('[aria-label*="modified"]')).toBeVisible();
});
