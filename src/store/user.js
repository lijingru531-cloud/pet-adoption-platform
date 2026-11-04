/**
 * 用户状态管理（架构设计 src/store/user.js）
 * 负责登录态、当前用户、未成年标记；登录态持久化（Pinia + storage）。
 */
import { defineStore } from 'pinia';
import { login as apiLogin, bindMobile as apiBind, getProfile, updateProfile } from '@/api/auth';

export const useUserStore = defineStore('user', {
  state: () => ({
    user: null,
    token: '',
    isLogin: false,
  }),
  getters: {
    nickname: (s) => (s.user && s.user.nickname) || '未登录',
    avatar: (s) => (s.user && s.user.avatar) || '',
    isMinor: (s) => !!(s.user && s.user.isMinor),
    mobileBound: (s) => !!(s.user && s.user.mobile),
  },
  actions: {
    /** 应用启动时从本地恢复登录态 */
    initFromStorage() {
      const token = uni.getStorageSync('token') || '';
      const user = uni.getStorageSync('user') || null;
      this.token = token;
      this.user = user;
      this.isLogin = !!(token && user);
    },

    /** 登录（微信三端 / 手机号兜底统一入口） */
    async login(params) {
      const res = await apiLogin(params);
      if (res.code === 0) {
        this.token = res.data.token;
        this.user = res.data.user;
        this.isLogin = true;
        uni.setStorageSync('token', this.token);
        uni.setStorageSync('user', this.user);
      }
      return res;
    },

    /** 绑定手机号 */
    async bindMobile(params) {
      const res = await apiBind(params);
      if (res.code === 0) {
        this.user = res.data.user;
        uni.setStorageSync('user', this.user);
      }
      return res;
    },

    /** 拉取/刷新个人资料 */
    async refresh() {
      const res = await getProfile();
      if (res.code === 0) {
        this.user = res.data;
        uni.setStorageSync('user', this.user);
      }
      return res;
    },

    /** 更新资料 */
    async updateProfile(patch) {
      const res = await updateProfile(patch);
      if (res.code === 0) {
        this.user = res.data;
        uni.setStorageSync('user', this.user);
      }
      return res;
    },

    logout() {
      this.user = null;
      this.token = '';
      this.isLogin = false;
      uni.removeStorageSync('token');
      uni.removeStorageSync('user');
    },
  },
});
