import type { Browser, Page } from 'puppeteer';
import puppeteer from 'puppeteer';

let browser: Browser | null = null;
let devServerProcess: any = null;

export async function setupBrowser() {
  if (browser) return;
  
  // 启动浏览器
  browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
}

export async function teardownBrowser() {
  if (browser) {
    await browser.close();
    browser = null;
  }
}

export async function createPage(): Promise<Page> {
  if (!browser) {
    await setupBrowser();
  }
  const page = await browser!.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  return page;
}

export async function closePage(page: Page) {
  try {
    if (!page.isClosed()) {
      await page.close();
    }
  } catch (err) {
    // 忽略关闭错误
  }
}

// 辅助函数：等待元素可见
export async function waitForText(page: Page, text: string, timeout = 10000) {
  await page.waitForFunction(
    (text) => {
      const element = Array.from(document.querySelectorAll('*')).find(
        (el) => el.textContent?.includes(text)
      );
      return element && element.offsetParent !== null;
    },
    { timeout },
    text
  );
}

// 辅助函数：等待并点击包含文本的元素
export async function clickText(page: Page, text: string, timeout = 10000) {
  await page.waitForFunction(
    (text) => {
      const element = Array.from(document.querySelectorAll('*')).find(
        (el) => el.textContent?.includes(text)
      );
      return element && element.offsetParent !== null;
    },
    { timeout },
    text
  );
  
  await page.evaluate((text) => {
    const element = Array.from(document.querySelectorAll('*')).find(
      (el) => el.textContent?.includes(text)
    ) as HTMLElement;
    element?.click();
  }, text);
}

// 打开 demo 仓库
export async function openDemoRepo(page: Page) {
  await page.goto('http://localhost:1420/');
  await waitForText(page, 'Recent repositories', 10000);
  await waitForText(page, 'folder missing', 10000);
  
  const row = await page.waitForSelector('[data-testid="recent-repo"][data-path$="/angkorgit"]', {
    visible: true,
  });
  await row!.click();
  
  await page.waitForSelector('[placeholder="Search commits…"]', {
    visible: true,
    timeout: 15000,
  });
}

// 等待选择器
export async function waitFor(page: Page, selector: string, timeout = 10000) {
  await page.waitForSelector(selector, { visible: true, timeout });
}

// 按键
export async function pressKey(page: Page, key: string) {
  // 处理 Playwright 的 ControlOrMeta 快捷键
  if (key === 'ControlOrMeta+k') {
    const isMac = process.platform === 'darwin';
    await page.keyboard.down(isMac ? 'Meta' : 'Control');
    await page.keyboard.press('k');
    await page.keyboard.up(isMac ? 'Meta' : 'Control');
  } else {
    await page.keyboard.press(key);
  }
}
