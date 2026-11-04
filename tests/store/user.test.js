import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useUserStore } from '@/store/user';
import { usePostStore } from '@/store/post';
import { services } from '@/services';
import { resetBackend, uniq } from '../helpers';

beforeEach(() => {
  resetBackend();
  setActivePinia(createPinia());
});

describe('store/user - 登录态读写', () => {
  it('initFromStorage：无本地态 -> 未登录', () => {
    const store = useUserStore();
    store.initFromStorage();
    expect(store.isLogin).toBe(false);
    expect(store.token).toBe('');
  });

  it('login：成功后写入 token/user 并持久化', async () => {
    const store = useUserStore();
    const res = await store.login({ platform: 'MP', code: uniq('code') });
    expect(res.code).toBe(0);
    expect(store.isLogin).toBe(true);
    expect(store.token).toBeTruthy();
    // 持久化校验
    expect(uni.getStorageSync('token')).toBe(store.token);
    expect(uni.getStorageSync('user')).toBeTruthy();
  });

  it('getter：nickname 默认与登录后取值', async () => {
    const store = useUserStore();
    expect(store.nickname).toBe('未登录');
    await store.login({ platform: 'MP', code: uniq('code2') });
    expect(store.nickname).toBeTruthy();
  });

  it('bindMobile 后 mobileBound 为真', async () => {
    const store = useUserStore();
    await store.login({ platform: 'MP', code: uniq('code3') });
    expect(store.mobileBound).toBe(false);
    const r = await store.bindMobile({ mobile: '13800001234' });
    expect(r.code).toBe(0);
    expect(store.mobileBound).toBe(true);
  });

  it('logout：清空内存态与本地存储', async () => {
    const store = useUserStore();
    await store.login({ platform: 'MP', code: uniq('code4') });
    store.logout();
    expect(store.isLogin).toBe(false);
    expect(store.token).toBe('');
    expect(uni.getStorageSync('token')).toBe('');
    expect(uni.getStorageSync('user')).toBe('');
  });

  it('initFromStorage：可从本地态恢复登录', async () => {
    const s1 = useUserStore();
    await s1.login({ platform: 'MP', code: uniq('code5') });
    // 新建一个 pinia/store 模拟重启
    setActivePinia(createPinia());
    const s2 = useUserStore();
    s2.initFromStorage();
    expect(s2.isLogin).toBe(true);
    expect(s2.token).toBe(s1.token);
  });
});

describe('store/post - 列表缓存', () => {
  it('fetchList 写入 list/total', async () => {
    const store = usePostStore();
    const res = await store.fetchList({ page: 1 });
    expect(res.code).toBe(0);
    expect(Array.isArray(store.list)).toBe(true);
    expect(store.total).toBeGreaterThanOrEqual(0);
    expect(store.page).toBe(1);
  });
});
