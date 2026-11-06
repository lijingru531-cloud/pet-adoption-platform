import { describe, it, expect, beforeEach } from 'vitest';
import * as apiAuth from '@/api/auth';
import * as apiScience from '@/api/science';
import { ERROR_CODE } from '@/constants/errorCode';
import { resetBackend } from '../helpers';

beforeEach(() => {
  resetBackend();
});

/** 登录并绑定手机号 */
async function loginBind(mobile = '13800001111') {
  await apiAuth.login({ platform: 'MP', code: `code_${mobile}` });
  await apiAuth.bindMobile({ mobile });
}

const validPost = (over = {}) => ({
  title: '幼猫喂养误区',
  category: 'feeding',
  cover: 'https://img/cover.jpg',
  content: '家有一只猫，已疫苗，性格温顺，注意科学喂养',
  ...over,
});

describe('api/science - 列表/详情 信封结构', () => {
  it('listSciencePosts 返回 {code,data,message} 且 data.list 为数组', async () => {
    const r = await apiScience.listSciencePosts({});
    expect(r.code).toBe(ERROR_CODE.SUCCESS);
    expect(r).toHaveProperty('message');
    expect(Array.isArray(r.data.list)).toBe(true);
    expect(r.data.total).toBeGreaterThan(0);
  });

  it('getScienceDetail 返回 code=0 且含 author', async () => {
    const list = await apiScience.listSciencePosts({});
    const id = list.data.list[0]._id;
    const r = await apiScience.getScienceDetail(id);
    expect(r.code).toBe(ERROR_CODE.SUCCESS);
    expect(r.data.author).toBeTruthy();
    expect(r.data._id).toBe(id);
  });

  it('listScienceTags 返回标签聚合数组', async () => {
    const r = await apiScience.listScienceTags();
    expect(r.code).toBe(ERROR_CODE.SUCCESS);
    expect(Array.isArray(r.data)).toBe(true);
    expect(r.data.length).toBeGreaterThan(0);
    expect(r.data[0]).toHaveProperty('tag');
    expect(r.data[0]).toHaveProperty('count');
  });
});

describe('api/science - 发布（兼容 Sprint1 无参占位）', () => {
  it('无参 createSciencePost 仍返回 code=0（向后兼容）', async () => {
    const r = await apiScience.createSciencePost();
    expect(r.code).toBe(ERROR_CODE.SUCCESS);
  });

  it('合规发布 -> code=0 且 status=pass 并生成摘要/标签', async () => {
    await loginBind('13800002222');
    const r = await apiScience.createSciencePost(validPost());
    expect(r.code).toBe(ERROR_CODE.SUCCESS);
    expect(r.data.status).toBe('pass');
    expect(r.data.post.summary).toBeTruthy();
    expect(Array.isArray(r.data.post.tags)).toBe(true);
  });

  it('违规内容发布 -> status=blocked', async () => {
    await loginBind('13800003333');
    const r = await apiScience.createSciencePost(validPost({ content: '来吃狗肉吧，很香' }));
    expect(r.code).toBe(ERROR_CODE.SUCCESS);
    expect(r.data.status).toBe('blocked');
  });

  it('缺少必填项 -> INVALID_PARAM', async () => {
    await loginBind('13800004444');
    const r = await apiScience.createSciencePost(validPost({ title: '' }));
    expect(r.code).toBe(ERROR_CODE.INVALID_PARAM);
  });
});
