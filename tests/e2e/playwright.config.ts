import { defineConfig } from '@playwright/test';
import path from 'node:path';

const isCi = Boolean(process.env.CI);
const root = path.resolve(__dirname, '../..');

export default defineConfig({
  testDir: '.',
  timeout: 30_000,
  retries: isCi ? 2 : 0,
  use: {
    baseURL: 'http://localhost:1420',
    viewport: { width: 1440, height: 900 },
  },
  webServer: {
    command: isCi
      ? 'bun tests/e2e/static-server.mjs'
      : 'bun --filter @angkorgit/desktop dev',
    cwd: root,
    url: 'http://localhost:1420',
    reuseExistingServer: !isCi,
    timeout: 60_000,
  },
});
