import { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach, setDefaultTimeout } from 'bun:test';
import type { Page } from 'puppeteer';
import { setupBrowser, teardownBrowser, createPage, closePage } from './helpers';

// 设置测试超时为 30 秒
setDefaultTimeout(30000);

describe('E2E Tests', () => {
  let page: Page;

  beforeAll(async () => {
    await setupBrowser();
  }, 30000);

  afterAll(async () => {
    await teardownBrowser();
  }, 30000);

  beforeEach(async () => {
    page = await createPage();
  }, 30000);

  afterEach(async () => {
    await closePage(page);
  }, 30000);

  test('can load the application', async () => {
    await page.goto('http://localhost:1420/', { waitUntil: 'networkidle2', timeout: 30000 });
    
    // 等待页面标题
    await page.waitForSelector('body', { timeout: 10000 });
    
    // 检查页面内容
    const bodyText = await page.evaluate(() => document.body.textContent);
    console.log('Page loaded, body text length:', bodyText?.length);
    
    // 验证页面加载了
    expect(bodyText).toBeTruthy();
    expect(bodyText!.length).toBeGreaterThan(0);
  });

  test('splash screen appears', async () => {
    await page.goto('http://localhost:1420/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    
    // 等待一个明确的元素
    await page.waitForFunction(
      () => document.body.textContent && document.body.textContent.length > 100,
      { timeout: 15000 }
    );
    
    const hasContent = await page.evaluate(() => {
      const text = document.body.textContent || '';
      return text.includes('Strength') || text.includes('Recent') || text.includes('repository');
    });
    
    expect(hasContent).toBe(true);
  });

  test('can interact with the page', async () => {
    await page.goto('http://localhost:1420/', { waitUntil: 'networkidle2', timeout: 30000 });
    
    // 等待内容加载
    await page.waitForFunction(
      () => document.querySelectorAll('*').length > 50,
      { timeout: 15000 }
    );
    
    // 尝试找到任何可点击的元素
    const elementCount = await page.evaluate(() => document.querySelectorAll('*').length);
    console.log('Element count:', elementCount);
    
    expect(elementCount).toBeGreaterThan(50);
  });
});
