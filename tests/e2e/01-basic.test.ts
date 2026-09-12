import { expect, test } from '@rstest/playwright';

// 增加 CI 环境的超时时间
const CI_TIMEOUT = 15_000;

test('splash fades into the welcome screen', async ({ page }) => {
  await page.goto('http://localhost:1420/');
  // 等待 splash 动画完成并显示欢迎页面
  await expect(page.getByText('Strength. Simplicity. Craftsmanship.')).toBeVisible({ timeout: CI_TIMEOUT });
  await expect(page.getByText('Recent repositories')).toBeVisible({ timeout: CI_TIMEOUT });
});

test('opens the demo repository and shows the commit graph', async ({ page }) => {
  await page.goto('http://localhost:1420/');
  await page.getByText('angkorgit', { exact: true }).first().click();
  // 等待仓库加载完成
  await expect(page.getByPlaceholder('Search commits…')).toBeVisible({ timeout: CI_TIMEOUT });
  await expect(page.getByText('main', { exact: true }).first()).toBeVisible({ timeout: CI_TIMEOUT });
  await expect(page.getByText('Working copy')).toBeVisible({ timeout: CI_TIMEOUT });
});

test('selecting a commit opens the inspector', async ({ page }) => {
  await page.goto('http://localhost:1420/');
  await page.getByText('angkorgit', { exact: true }).first().click();
  await expect(page.getByPlaceholder('Search commits…')).toBeVisible({ timeout: CI_TIMEOUT });
  await page.getByRole('row').first().click();
  await expect(page.getByRole('complementary', { name: 'Inspector' }).getByLabel('4 modified')).toBeVisible({ timeout: CI_TIMEOUT });
});

test('command palette opens with keyboard shortcut', async ({ page }) => {
  await page.goto('http://localhost:1420/');
  await page.getByText('angkorgit', { exact: true }).first().click();
  await expect(page.getByPlaceholder('Search commits…')).toBeVisible({ timeout: CI_TIMEOUT });
  await page.keyboard.press('ControlOrMeta+k');
  await expect(page.getByPlaceholder('Type a command or branch name…')).toBeVisible({ timeout: CI_TIMEOUT });
});

test('command palette previews a color theme and keeps it only on enter', async ({ page }) => {
  await page.goto('http://localhost:1420/');
  await page.getByText('angkorgit', { exact: true }).first().click();
  await expect(page.getByPlaceholder('Search commits…')).toBeVisible({ timeout: CI_TIMEOUT });
  const html = page.locator('html');
  await expect(html).toHaveClass(/theme-angkor-dusk/);

  await page.keyboard.press('ControlOrMeta+k');
  await page.getByPlaceholder('Type a command or branch name…').fill('color theme');
  await page.getByRole('option', { name: 'Color theme' }).click();
  const search = page.getByPlaceholder('Search themes…');
  await expect(search).toBeVisible({ timeout: CI_TIMEOUT });

  await search.fill('dracula');
  await expect(page.getByRole('option', { name: 'Dracula' })).toBeVisible();
  await expect(html).toHaveClass(/theme-dracula/);
  await page.keyboard.press('Escape');
  await expect(search).toHaveCount(0);
  await expect(html).toHaveClass(/theme-angkor-dusk/);

  await page.keyboard.press('ControlOrMeta+k');
  await page.getByPlaceholder('Type a command or branch name…').fill('color theme');
  await page.getByRole('option', { name: 'Color theme' }).click();
  await page.getByPlaceholder('Search themes…').fill('dracula');
  await page.getByRole('option', { name: 'Dracula' }).click();
  await expect(html).toHaveClass(/theme-dracula/);
  await expect(page.getByPlaceholder('Search themes…')).toHaveCount(0);

  await page.keyboard.press('ControlOrMeta+k');
  await page.keyboard.press('Escape');
  await expect(html).toHaveClass(/theme-dracula/);

  await page.keyboard.press('ControlOrMeta+k');
  await page.getByPlaceholder('Type a command or branch name…').fill('color theme');
  await page.getByRole('option', { name: 'Color theme' }).click();
  await page.getByPlaceholder('Search themes…').fill('angkor dusk');
  await page.getByRole('option', { name: 'Angkor Dusk' }).click();
  await expect(html).toHaveClass(/theme-angkor-dusk/);
});

test('mod+1 and mod+2 switch repository tabs', async ({ page }) => {
  await page.goto('http://localhost:1420/');
  await page.getByText('angkorgit', { exact: true }).first().click();
  await expect(page.getByPlaceholder('Search commits…')).toBeVisible({ timeout: CI_TIMEOUT });
  await page.keyboard.press('ControlOrMeta+k');
  await page.getByPlaceholder('Type a command or branch name…').fill('temple-ui');
  await page.keyboard.press('Enter');
  const angkor = page.locator('[data-tab-path$="/angkorgit"]');
  const temple = page.locator('[data-tab-path$="/temple-ui"]');
  await expect(temple).toHaveAttribute('aria-selected', 'true', { timeout: CI_TIMEOUT });
  await page.keyboard.press('ControlOrMeta+1');
  await expect(angkor).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('ControlOrMeta+2');
  await expect(temple).toHaveAttribute('aria-selected', 'true');
  const hints = page.locator('[data-tab-hints]');
  await page.keyboard.down('ControlOrMeta');
  await expect(hints).toBeHidden();
  await expect(hints).toBeVisible({ timeout: 600 });
  await page.keyboard.up('ControlOrMeta');
  await expect(hints).toBeHidden();
});
