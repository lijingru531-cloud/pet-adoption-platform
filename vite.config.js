import { defineConfig } from 'vite';
import uni from '@dcloudio/vite-plugin-uni';
import path from 'node:path';

// uniapp (Vue3) 工程配置：Vite 构建，条件编译支持 微信小程序 / H5 / App 三端。
// 通过 alias '@' 指向 src，保证跨端相对引用一致。
export default defineConfig({
  plugins: [uni()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
  build: {
    // 提升 chunk 体积上限，避免 warns
    chunkSizeWarningLimit: 2000,
  },
});
