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
    // Dev server rebuilds leave a blank page when HMR/liveReload are off (CI).
    // Serve a one-shot production build instead so e2e is stable.
    command: isCi
      ? 'bun --filter @angkorgit/desktop build && bun tests/e2e/static-server.mjs'
      : 'bun --filter @angkorgit/desktop dev',
    cwd: root,
    url: 'http://localhost:1420',
    reuseExistingServer: !isCi,
    timeout: isCi ? 180_000 : 60_000,
  },
});
