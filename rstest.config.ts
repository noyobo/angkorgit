import { defineConfig } from '@rstest/core';
import { withRspackConfig } from '@rstest/adapter-rspack';

export default defineConfig({
  // 复用 Rspack 配置
  extends: withRspackConfig({
    configFile: './apps/desktop/rspack.config.js',
  }),
  
  // 测试超时配置
  testTimeout: 30000,
  
  // 测试匹配模式
  include: ['tests/**/*.test.ts', 'tests/**/*.spec.ts'],
  
  // 排除文件
  exclude: ['**/node_modules/**', '**/dist/**', '**/build/**'],
});
