import { describe, it, expect, beforeEach } from 'vitest';
import { services } from '@/services';
import { ERROR_CODE } from '@/constants/errorCode';
import { SCIENCE_REVIEW_STATUS, SCIENCE_CATEGORY } from '@/constants/enum';
import { resetBackend, uniq } from '../helpers';

beforeEach(() => {
  resetBackend();
});

/** 登录并绑定手机号，返回 user */
async function loginAndBind(mobile = '13800001111') {
  const r = await services.auth.login({ platform: 'MP', code: `code_${mobile}` });
  expect(r.code).toBe(ERROR_CODE.SUCCESS);
  const b = await services.auth.bindMobile({ mobile });
  expect(b.code).toBe(ERROR_CODE.SUCCESS);
  return b.data.user;
}

const validPost = (over = {}) => ({
  title: '幼猫喂养误区',
  category: SCIENCE_CATEGORY.FEEDING,
  cover: 'https://img/cover.jpg',
  content: '家有一只猫，已疫苗，性格温顺，科学喂养少踩坑',
  ...over,
});

describe('services/science - 种子数据', () => {
  it('注入 4 条可公开科普帖', async () => {
    const r = await services.science.list();
    expect(r.code).toBe(ERROR_CODE.SUCCESS);
    expect(r.data.list.length).toBe(4);
    expect(r.data.total).toBe(4);
  });
});

describe('services/science - create 校验与审核状态机', () => {
  beforeEach(async () => {
    await loginAndBind();
  });

  it('合规帖 -> pass + 摘要/标签', async () => {
    const r = await services.science.create(validPost());
    expect(r.code).toBe(ERROR_CODE.SUCCESS);
    expect(r.data.status).toBe(SCIENCE_REVIEW_STATUS.PASS);
    expect(r.data.post.summary).toBeTruthy();
    expect(Array.isArray(r.data.post.tags)).toBe(true);
    expect(r.data.post.tags.length).toBeGreaterThan(0);
  });

  it('疑似内容 -> review（不公开）', async () => {
    const r = await services.science.create(validPost({ content: '加微信 转账 可私聊' }));
    expect(r.data.status).toBe(SCIENCE_REVIEW_STATUS.REVIEW);
    const list = await services.science.list();
    const ids = list.data.list.map((p) => p._id);
    expect(ids).not.toContain(r.data.post._id);
  });

  it('极端违规 -> blocked', async () => {
    const r = await services.science.create(validPost({ content: '这是食用狗肉的帖子' }));
    expect(r.data.status).toBe(SCIENCE_REVIEW_STATUS.BLOCKED);
  });

  it('缺少必填项 -> INVALID_PARAM', async () => {
    const r = await services.science.create(validPost({ cover: '' }));
    expect(r.code).toBe(ERROR_CODE.INVALID_PARAM);
  });

  it('非法分类 -> INVALID_PARAM', async () => {
    const r = await services.science.create(validPost({ category: 'hack' }));
    expect(r.code).toBe(ERROR_CODE.INVALID_PARAM);
  });

  it('未绑定手机号被拒 FORBIDDEN', async () => {
    uni.removeStorageSync('token');
    await services.auth.login({ platform: 'MP', code: uniq('code2') }); // 未绑定
    const r = await services.science.create(validPost());
    expect(r.code).toBe(ERROR_CODE.FORBIDDEN);
  });
});

describe('services/science - 未登录拒绝', () => {
  it('UNAUTHORIZED', async () => {
    uni.removeStorageSync('token');
    const r = await services.science.create(validPost());
    expect(r.code).toBe(ERROR_CODE.UNAUTHORIZED);
  });
});

describe('services/science - 列表筛选 / 搜索 / 标签', () => {
  it('按分类筛选（health 命中 2 条）', async () => {
    const r = await services.science.list({ filter: { category: SCIENCE_CATEGORY.HEALTH } });
    expect(r.data.list.length).toBe(2);
    expect(r.data.list.every((p) => p.category === SCIENCE_CATEGORY.HEALTH)).toBe(true);
  });

  it('按标签筛选（猫 命中 2 条）', async () => {
    const r = await services.science.list({ tag: '猫' });
    expect(r.data.list.length).toBe(2);
    expect(r.data.list.every((p) => (p.tags || []).includes('猫'))).toBe(true);
  });

  it('关键词搜索（疫苗）', async () => {
    const r = await services.science.list({ keyword: '疫苗' });
    expect(r.data.list.length).toBeGreaterThanOrEqual(1);
    expect(r.data.list.every((p) =>
      [p.title, p.summary, p.content, (p.tags || []).join(' ')].join(' ').includes('疫苗')
    )).toBe(true);
  });

  it('发布后出现在公开列表', async () => {
    await loginAndBind('13800005555');
    const created = await services.science.create(validPost({ title: '独家科普测试帖' }));
    const list = await services.science.list({ keyword: '独家科普测试帖' });
    const ids = list.data.list.map((p) => p._id);
    expect(ids).toContain(created.data.post._id);
  });
});

describe('services/science - 详情浏览量自增', () => {
  it('detail 返回 author 且 views +1', async () => {
    const list = await services.science.list();
    const id = list.data.list[0]._id;
    const before = list.data.list[0].views;
    const r = await services.science.detail(id);
    expect(r.code).toBe(ERROR_CODE.SUCCESS);
    expect(r.data.author).toBeTruthy();
    expect(r.data.views).toBe(before + 1);
  });

  it('不存在的帖子 -> NOT_FOUND', async () => {
    const r = await services.science.detail('nope');
    expect(r.code).toBe(ERROR_CODE.NOT_FOUND);
  });
});

describe('services/science - 热门标签聚合', () => {
  it('tags 返回聚合数组且按数量降序', async () => {
    const r = await services.science.tags();
    expect(r.code).toBe(ERROR_CODE.SUCCESS);
    expect(Array.isArray(r.data)).toBe(true);
    for (let i = 1; i < r.data.length; i += 1) {
      expect(r.data[i - 1].count).toBeGreaterThanOrEqual(r.data[i].count);
    }
  });
});
