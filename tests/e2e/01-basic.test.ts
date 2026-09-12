import { expect, test } from '@rstest/playwright';

test('splash fades into the welcome screen', async ({ page }) => {
  await page.goto('http://localhost:1420/');
  await expect(page.getByText('Strength. Simplicity. Craftsmanship.')).toBeVisible();
  await expect(page.getByText('Recent repositories')).toBeVisible({ timeout: 10_000 });
});

test('opens the demo repository and shows the commit graph', async ({ page }) => {
  await page.goto('http://localhost:1420/');
  await page.getByText('angkorgit', { exact: true }).first().click();
  await expect(page.getByPlaceholder('Search commits…')).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText('main', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('Working copy')).toBeVisible();
});

test('opens the demo repository and shows the commit graph', async ({ page }) => {
  await page.goto('http://localhost:1420/');
  await page.getByText('angkorgit', { exact: true }).first().click();
  await expect(page.getByPlaceholder('Search commits…')).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText('main', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('Working copy')).toBeVisible();
});

test('selecting a commit opens the inspector', async ({ page }) => {
  await page.goto('http://localhost:1420/');
  await page.getByText('angkorgit', { exact: true }).first().click();
  await expect(page.getByPlaceholder('Search commits…')).toBeVisible({ timeout: 10_000 });
  await page.getByRole('row').first().click();
  await expect(page.getByRole('complementary', { name: 'Inspector' }).getByLabel('4 modified')).toBeVisible();
});

test('selecting a commit opens the inspector', async ({ page }) => {
  await page.goto('http://localhost:1420/');
  await page.getByText('angkorgit', { exact: true }).first().click();
  await expect(page.getByPlaceholder('Search commits…')).toBeVisible({ timeout: 10_000 });
  await page.getByRole('row').first().click();
  await expect(page.getByRole('complementary', { name: 'Inspector' }).getByLabel('4 modified')).toBeVisible();
});

test('command palette opens with keyboard shortcut', async ({ page }) => {
  await page.goto('http://localhost:1420/');
  await page.getByText('angkorgit', { exact: true }).first().click();
  await expect(page.getByPlaceholder('Search commits…')).toBeVisible({ timeout: 10_000 });
  await page.keyboard.press('ControlOrMeta+k');
  await expect(page.getByPlaceholder('Type a command or branch name…')).toBeVisible();
});

test('command palette opens with keyboard shortcut', async ({ page }) => {
  await page.goto('http://localhost:1420/');
  await page.getByText('angkorgit', { exact: true }).first().click();
  await expect(page.getByPlaceholder('Search commits…')).toBeVisible({ timeout: 10_000 });
  await page.keyboard.press('ControlOrMeta+k');
  await expect(page.getByPlaceholder('Type a command or branch name…')).toBeVisible();
});

test('command palette previews a color theme and keeps it only on enter', async ({ page }) => {
  await page.goto('http://localhost:1420/');
  await page.getByText('angkorgit', { exact: true }).first().click();
  await expect(page.getByPlaceholder('Search commits…')).toBeVisible({ timeout: 10_000 });
  const html = page.locator('html');
  await expect(html).toHaveClass(/theme-angkor-dusk/);

  await page.keyboard.press('ControlOrMeta+k');
  await page.getByPlaceholder('Type a command or branch name…').fill('color theme');
  await page.getByRole('option', { name: 'Color theme' }).click();
  const search = page.getByPlaceholder('Search themes…');
  await expect(search).toBeVisible();

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

test('command palette previews a color theme and keeps it only on enter', async ({ page }) => {
  await page.goto('http://localhost:1420/');
  await page.getByText('angkorgit', { exact: true }).first().click();
  await expect(page.getByPlaceholder('Search commits…')).toBeVisible({ timeout: 10_000 });
  const html = page.locator('html');
  await expect(html).toHaveClass(/theme-angkor-dusk/);

  await page.keyboard.press('ControlOrMeta+k');
  await page.getByPlaceholder('Type a command or branch name…').fill('color theme');
  await page.getByRole('option', { name: 'Color theme' }).click();
  const search = page.getByPlaceholder('Search themes…');
  await expect(search).toBeVisible();

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
  await expect(page.getByPlaceholder('Search commits…')).toBeVisible({ timeout: 10_000 });
  await page.keyboard.press('ControlOrMeta+k');
  await page.getByPlaceholder('Type a command or branch name…').fill('temple-ui');
  await page.keyboard.press('Enter');
  const angkor = page.locator('[data-tab-path$="/angkorgit"]');
  const temple = page.locator('[data-tab-path$="/temple-ui"]');
  await expect(temple).toHaveAttribute('aria-selected', 'true', { timeout: 10_000 });
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

test('mod+1 and mod+2 switch repository tabs', async ({ page }) => {
  await page.goto('http://localhost:1420/');
  await page.getByText('angkorgit', { exact: true }).first().click();
  await expect(page.getByPlaceholder('Search commits…')).toBeVisible({ timeout: 10_000 });
  await page.keyboard.press('ControlOrMeta+k');
  await page.getByPlaceholder('Type a command or branch name…').fill('temple-ui');
  await page.keyboard.press('Enter');
  const angkor = page.locator('[data-tab-path$="/angkorgit"]');
  const temple = page.locator('[data-tab-path$="/temple-ui"]');
  await expect(temple).toHaveAttribute('aria-selected', 'true', { timeout: 10_000 });
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

test('the status bar branch name opens a local branch switcher', async ({ page }) => {
  await page.goto('http://localhost:1420/');
  await page.getByText('angkorgit', { exact: true }).first().click();
  await expect(page.getByPlaceholder('Search commits…')).toBeVisible({ timeout: 10_000 });
  await page.getByTestId('status-bar-branch').click();
  const filter = page.getByPlaceholder('Filter branches…');
  await expect(filter).toBeFocused();
  await expect(page.getByRole('option', { name: 'develop' })).toBeVisible();
  await expect(page.getByRole('option', { name: /develop/ })).toContainText(/ago|just now/);
  await expect(page.getByRole('option', { name: 'origin/main' })).toHaveCount(0);
  await filter.fill('origin');
  await expect(page.getByText('No branches match')).toBeVisible();
  await filter.fill('develop');
  await page.getByRole('option', { name: 'develop' }).click();
  await expect(page.getByText('Checkout develop done')).toBeVisible();
});
