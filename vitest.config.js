import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

// Vitest 配置：
// - resolve.alias '@' -> ./src （与 vite.config.js 保持一致）
// - 全局 uni 桩对象在 vitest.setup.js 中注入，使依赖 uni 的模块可在 node 下 import
export default defineConfig({
  // 关闭缓存，避免 CI/沙箱临时目录（AppData\Local\Temp）写入权限问题导致的偶发收集失败
  cache: false,
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/**/*.test.js'],
    setupFiles: ['./vitest.setup.js'],
  },
});
