import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useScienceStore } from '@/store/science';
import { services } from '@/services';
import { resetBackend } from '../helpers';

beforeEach(() => {
  resetBackend();
  setActivePinia(createPinia());
});

describe('store/science - 列表 / 筛选 / 标签', () => {
  it('fetchList 写入 list/total/page', async () => {
    const store = useScienceStore();
    const res = await store.fetchList({ page: 1 });
    expect(res.code).toBe(0);
    expect(Array.isArray(store.list)).toBe(true);
    expect(store.total).toBe(4);
    expect(store.page).toBe(1);
  });

  it('getter hasMore 随结果集变化', async () => {
    const store = useScienceStore();
    await store.fetchList({ page: 1 });
    expect(store.hasMore).toBe(false); // 4 条 < 分页 10
  });

  it('setKeyword + fetchList 仅返回命中关键词', async () => {
    const store = useScienceStore();
    store.setKeyword('疫苗');
    const res = await store.fetchList({ page: 1 });
    expect(res.code).toBe(0);
    expect(store.list.length).toBeGreaterThanOrEqual(1);
    expect(store.list.every((p) =>
      [p.title, p.summary, p.content, (p.tags || []).join(' ')].join(' ').includes('疫苗')
    )).toBe(true);
  });

  it('setTag + fetchList 仅返回含该标签', async () => {
    const store = useScienceStore();
    store.setTag('猫');
    const res = await store.fetchList({ page: 1 });
    expect(res.code).toBe(0);
    expect(store.list.every((p) => (p.tags || []).includes('猫'))).toBe(true);
  });

  it('fetchTags 写入 tags', async () => {
    const store = useScienceStore();
    const res = await store.fetchTags();
    expect(res.code).toBe(0);
    expect(store.tags.length).toBeGreaterThan(0);
  });

  it('resetFilter 清空筛选态', async () => {
    const store = useScienceStore();
    store.setKeyword('疫苗');
    store.setTag('猫');
    store.resetFilter();
    expect(store.keyword).toBe('');
    expect(store.tag).toBe('');
  });
});

describe('store/science - 详情 / 发布', () => {
  it('fetchDetail 写入 detail', async () => {
    const store = useScienceStore();
    const list = await store.fetchList({ page: 1 });
    const id = list.data.list[0]._id;
    const res = await store.fetchDetail(id);
    expect(res.code).toBe(0);
    expect(store.detail._id).toBe(id);
  });

  it('create 走 AI 审核并返回 status', async () => {
    // 先登录并绑定手机号
    await services.auth.login({ platform: 'MP', code: 'code_store_1' });
    await services.auth.bindMobile({ mobile: '13800006666' });
    const store = useScienceStore();
    const res = await store.create({
      title: 'store 测试科普',
      category: 'feeding',
      cover: 'https://img/c.jpg',
      content: '家有一只猫，已疫苗，科学喂养',
    });
    expect(res.code).toBe(0);
    expect(res.data.status).toBe('pass');
  });
});
