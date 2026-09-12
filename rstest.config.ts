import { defineConfig } from '@rstest/core';
import { withRspackConfig } from '@rstest/adapter-rspack';

export default defineConfig({
  // Reuse Rspack configuration
  extends: withRspackConfig({
    configFile: './apps/desktop/rspack.config.js',
  }),
  
  // Test timeout configuration (generous for CI environment)
  testTimeout: 60000,
  
  // Test file patterns
  include: ['tests/**/*.test.ts', 'tests/**/*.spec.ts'],
  
  // Excluded paths
  exclude: ['**/node_modules/**', '**/dist/**', '**/build/**'],
});
