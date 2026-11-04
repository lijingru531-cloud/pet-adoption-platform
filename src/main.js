import { createSSRApp } from 'vue';
import App from './App.vue';
import { createPinia } from 'pinia';
import uviewPlus from 'uview-plus';
import { useUserStore } from '@/store/user';
import '@/styles/global.scss';

export function createApp() {
  const app = createSSRApp(App);
  const pinia = createPinia();
  app.use(pinia);
  app.use(uviewPlus);

  // 启动时恢复登录态
  const userStore = useUserStore(pinia);
  userStore.initFromStorage();

  return { app, pinia };
}
