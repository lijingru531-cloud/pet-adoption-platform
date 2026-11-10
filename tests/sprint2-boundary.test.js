/**
 * Sprint 2 独立回归 / 边界 / 异常测试（QA 严过关）
 *
 * 目标：对 Sprint 2 新增/改动的科普模块（B1 发布 / B2 列表搜索 / B3 AI 问答 /
 * D3 摘要标签 / E5 首页全局搜索 / E6 科普举报 / detail 浏览量自增修复）做
 * 独立于工程师交付用例的边界与异常验证。
 *
 * 约定：
 *  - 统一返回 { code, data, message } 信封，code=0 为成功。
 *  - 每用例前 resetBackend() 清空 Mock 存储并重新注入种子数据（4 条科普帖）。
 *  - 源码行为若与 PRD/设计一致，用例通过；若断言（基于 PRD/设计）与实现不符，
 *    判定为源码 Bug，反馈 team-lead 协调工程师修复。
 *
 * 设计说明类发现（非源码 Bug，仅锁定/记录行为）单独标注。
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { services } from '@/services';
import * as apiScience from '@/api/science';
import * as apiPost from '@/api/post';
import { useScienceStore } from '@/store/science';
import { ERROR_CODE } from '@/constants/errorCode';
import ENV from '@/env';
import {
  SCIENCE_CATEGORY,
  SCIENCE_REVIEW_STATUS,
  REPORT_REASON,
  TARGET_TYPE,
} from '@/constants/enum';
import { QA_DISCLAIMER } from '@/prompts/qa';
import { resetBackend, uniq } from './helpers';

/** 种子科普帖数量（src/services/mock.js seedSciencePosts） */
const SEED_SCIENCE = 4;

beforeEach(() => {
  resetBackend();
  setActivePinia(createPinia());
});

/** 登录并绑定手机号，返回 user；token 持久化到 storage，后续 create 复用 */
async function loginBind(mobile) {
  const r = await services.auth.login({ platform: 'MP', code: `code_${mobile}_${uniq()}` });
  expect(r.code).toBe(ERROR_CODE.SUCCESS);
  const b = await services.auth.bindMobile({ mobile });
  expect(b.code).toBe(ERROR_CODE.SUCCESS);
  return b.data.user;
}

const validSciencePost = (over = {}) => ({
  title: '幼猫喂养误区',
  category: SCIENCE_CATEGORY.FEEDING,
  cover: 'https://img/cover.jpg',
  content: '家有一只猫，已疫苗，性格温顺，注意科学喂养',
  ...over,
});

const validAdoptPost = (over = {}) => ({
  species: 'cat',
  breed: '英短',
  age: 8,
  gender: 'female',
  healthStatus: ['vaccinated'],
  location: { city: '深圳', district: '南山' },
  reason: '找负责任的领养家庭',
  photos: ['https://img/p.jpg'],
  ...over,
});

// =====================================================================
// B3 边界：AI 科普问答 chat（合规拦截 / 日配额 20 / 空串 / 匿名）
// =====================================================================
describe('B3 边界: AI 科普问答 chat', () => {
  it('空问题不崩溃，返回默认演示回答且扣 1 次配额', async () => {
    const uid = uniq('empty');
    const r = await services.ai.chat({ userId: uid, question: '' });
    expect(r.code).toBe(ERROR_CODE.SUCCESS);
    expect(r.data).not.toBeNull();
    expect(r.data.answer).toContain(QA_DISCLAIMER);
    expect(r.data.quotaLeft).toBe(ENV.AI_DAILY_QUOTA - 1);
  });

  it('极端敏感词 -> CONTENT_BLOCKED 且 data=null（多组词）', async () => {
    const phrases = ['食用狗肉的方法', '来吃猫肉', '活体屠宰现场'];
    for (const q of phrases) {
      const uid = uniq('block');
      const r = await services.ai.chat({ userId: uid, question: q });
      expect(r.code).toBe(ERROR_CODE.CONTENT_BLOCKED);
      expect(r.data).toBeNull();
    }
  });

  it('设计说明: review 级敏感词(加微信/转账) 当前不拦截，返回正常回答', async () => {
    // complianceFilter 仅对 EXTREME_SENSITIVE 返回 block；SENSITIVE_WORDS 为 review 级，
    // chat 仅拦截 block 级，故此类问题当前仍会得到 Mock 回答（见 ai-chat.vue 亦仅处理 block/quota）。
    const uid = uniq('review');
    const r = await services.ai.chat({ userId: uid, question: '怎么加微信转账买猫粮' });
    expect(r.code).toBe(ERROR_CODE.SUCCESS);
    expect(r.data).not.toBeNull();
  });

  it('匿名(userId 为空) 仍可用且配额不计入(quotaLeft=20)', async () => {
    const r = await services.ai.chat({ userId: '', question: '小猫应该怎么喂养' });
    expect(r.code).toBe(ERROR_CODE.SUCCESS);
    expect(r.data.quotaLeft).toBe(20); // 匿名不计配额
  });

  it('配额边界: 第 20 次放行，第 21 次 AI_QUOTA_EXCEEDED 且 data=null', async () => {
    const uid = uniq('quota');
    for (let i = 0; i < 20; i += 1) {
      const rr = await services.ai.chat({ userId: uid, question: '普通养宠问题' });
      expect(rr.code).toBe(ERROR_CODE.SUCCESS);
    }
    const r = await services.ai.chat({ userId: uid, question: '再来一次' });
    expect(r.code).toBe(ERROR_CODE.AI_QUOTA_EXCEEDED);
    expect(r.data).toBeNull();
  });

  it('设计说明: 被拦截的违规问题仍占用一次配额（enforceQuota 在合规判断之前）', async () => {
    // chat 先 enforceQuota(递增) 后做合规判断，故被拦截请求也消耗配额。
    const uid = uniq('quota_block');
    for (let i = 0; i < 20; i += 1) {
      await services.ai.chat({ userId: uid, question: '食用狗肉' }); // 全部 block，但仍 +1
    }
    const r = await services.ai.chat({ userId: uid, question: '正常问题' });
    expect(r.code).toBe(ERROR_CODE.AI_QUOTA_EXCEEDED); // 20 次拦截已耗尽配额
  });
});

// =====================================================================
// B1 边界：科普发布 create（未登录/未绑手机/必填/分类/审核状态机）
// =====================================================================
describe('B1 边界: 科普发布 create', () => {
  it('未登录 -> UNAUTHORIZED', async () => {
    uni.removeStorageSync('token');
    const r = await services.science.create(validSciencePost());
    expect(r.code).toBe(ERROR_CODE.UNAUTHORIZED);
  });

  it('已登录但未绑手机号 -> FORBIDDEN', async () => {
    await services.auth.login({ platform: 'MP', code: `code_nomobile_${uniq()}` }); // 不绑手机
    const r = await services.science.create(validSciencePost());
    expect(r.code).toBe(ERROR_CODE.FORBIDDEN);
  });

  it('缺必填项(标题/正文/封面/分类) 分别 INVALID_PARAM', async () => {
    await loginBind('13800001111');
    const fields = ['title', 'content', 'cover', 'category'];
    for (const f of fields) {
      const payload = validSciencePost();
      payload[f] = '';
      const r = await services.science.create(payload);
      expect(r.code).toBe(ERROR_CODE.INVALID_PARAM);
    }
  });

  it('非法分类 -> INVALID_PARAM', async () => {
    await loginBind('13800002222');
    const r = await services.science.create(validSciencePost({ category: 'hack' }));
    expect(r.code).toBe(ERROR_CODE.INVALID_PARAM);
  });

  it('合规帖 -> pass 且生成 summary/非空 tags(D3)', async () => {
    await loginBind('13800003333');
    const r = await services.science.create(validSciencePost());
    expect(r.code).toBe(ERROR_CODE.SUCCESS);
    expect(r.data.status).toBe(SCIENCE_REVIEW_STATUS.PASS);
    expect(r.data.post.summary).toBeTruthy();
    expect(Array.isArray(r.data.post.tags)).toBe(true);
    expect(r.data.post.tags.length).toBeGreaterThan(0);
  });

  it('疑似(review 级敏感词) -> review 且不进入公开列表', async () => {
    await loginBind('13800004444');
    const r = await services.science.create(validSciencePost({ content: '加微信 转账 可私聊' }));
    expect(r.data.status).toBe(SCIENCE_REVIEW_STATUS.REVIEW);
    const list = await services.science.list();
    const ids = list.data.list.map((p) => p._id);
    expect(ids).not.toContain(r.data.post._id);
  });

  it('极端违规(极端敏感词) -> blocked', async () => {
    await loginBind('13800005555');
    const r = await services.science.create(validSciencePost({ content: '这是食用狗肉的帖子' }));
    expect(r.data.status).toBe(SCIENCE_REVIEW_STATUS.BLOCKED);
  });

  it('设计说明: 纯空白标题(仅空格) 通过必填校验(宽松)并仍可发布', async () => {
    await loginBind('13800006666');
    const r = await services.science.create(validSciencePost({ title: '   ' }));
    // 当前用 !payload[k] 判断，'   ' 为真值 -> 通过必填；进入审核后 pass
    expect(r.code).toBe(ERROR_CODE.SUCCESS);
    expect(r.data.status).toBe(SCIENCE_REVIEW_STATUS.PASS);
  });
});

// =====================================================================
// B2 边界：科普列表 / 搜索 / 分页 / 空结果
// =====================================================================
describe('B2 边界: 科普列表/搜索/分页', () => {
  it('分页: 共创建 12 条后 total=16, page1=10, page2=6', async () => {
    await loginBind('13800007777');
    for (let i = 0; i < 12; i += 1) {
      const r = await services.science.create(validSciencePost({ title: `测试科普 ${i}` }));
      expect(r.code).toBe(ERROR_CODE.SUCCESS);
    }
    const p1 = await services.science.list({ page: 1 });
    expect(p1.data.total).toBe(SEED_SCIENCE + 12);
    expect(p1.data.list.length).toBe(10);
    const p2 = await services.science.list({ page: 2 });
    expect(p2.data.list.length).toBe(SEED_SCIENCE + 12 - 10); // 6
  });

  it('不存在的关键词 -> 0 结果', async () => {
    const r = await services.science.list({ keyword: 'zzz_不存在_zzz' });
    expect(r.data.total).toBe(0);
    expect(r.data.list).toEqual([]);
  });

  it('无帖分类(adoption) -> 0 结果', async () => {
    const r = await services.science.list({ filter: { category: SCIENCE_CATEGORY.ADOPTION } });
    expect(r.data.total).toBe(0);
  });

  it('不存在标签 -> 0 结果', async () => {
    const r = await services.science.list({ tag: 'zzz_标签_zzz' });
    expect(r.data.total).toBe(0);
  });

  it('组合筛选(分类+标签+关键词) 命中精确集合', async () => {
    // 种子：health 分类 2 条（疫苗/绝育），其中含「疫苗」标签 1 条
    const r = await services.science.list({
      filter: { category: SCIENCE_CATEGORY.HEALTH },
      tag: '疫苗',
      keyword: '疫苗',
    });
    expect(r.data.list.length).toBeGreaterThanOrEqual(1);
    expect(r.data.list.every((p) => p.category === SCIENCE_CATEGORY.HEALTH)).toBe(true);
    expect(r.data.list.every((p) => (p.tags || []).includes('疫苗'))).toBe(true);
  });
});

// =====================================================================
// D3 边界：generateSummary 增量标签 additive（不破坏旧用例）
// =====================================================================
describe('D3 边界: generateSummary 增量标签', () => {
  it('科普向新标签(营养/训练/行为/健康) 叠加在基础标签(猫)之上', async () => {
    // 内容仅含 猫 + 营养 + 训练 -> 候选标签 3 个，不触达 5 上限，可完整验证 additive
    const r = await services.ai.generateSummary('小猫 营养 训练 科学喂养');
    expect(r.code).toBe(ERROR_CODE.SUCCESS);
    expect(r.data.tags).toContain('猫'); // 基础标签仍在
    expect(r.data.tags).toContain('营养'); // 新增
    expect(r.data.tags).toContain('训练'); // 新增
  });

  it('设计说明: 候选标签 >5 时按出现顺序截断为 5（已驱虫/幼宠 可能被截掉）', async () => {
    // 内容含 疫苗/温顺/营养/训练/行为/健康/驱虫/幼 -> 候选 8 个，slice(0,5)
    const r = await services.ai.generateSummary('疫苗 温顺 营养 训练 行为 健康 驱虫 幼');
    expect(r.data.tags.length).toBe(5);
    expect(r.data.tags).toEqual(['已疫苗', '温顺', '营养', '训练', '行为']);
  });
});

// =====================================================================
// 科普 detail 浏览量自增修复验证
// =====================================================================
describe('科普 detail 浏览量自增(修复验证)', () => {
  it('列表读取的 views 基础上 +1 且返回 author', async () => {
    const list = await services.science.list();
    const id = list.data.list[0]._id;
    const before = list.data.list[0].views;
    const r = await services.science.detail(id);
    expect(r.code).toBe(ERROR_CODE.SUCCESS);
    expect(r.data.views).toBe(before + 1);
    expect(r.data.author).toBeTruthy();
  });

  it('连续两次 detail 自增 +2（验证使用更新后对象，无引用陈旧 bug）', async () => {
    const list = await services.science.list();
    const id = list.data.list[0]._id;
    const before = list.data.list[0].views;
    const d1 = await services.science.detail(id);
    const d2 = await services.science.detail(id);
    expect(d1.data.views).toBe(before + 1);
    expect(d2.data.views).toBe(before + 2);
  });

  it('不存在的帖子 -> NOT_FOUND', async () => {
    const r = await services.science.detail('nope_id');
    expect(r.code).toBe(ERROR_CODE.NOT_FOUND);
  });
});

// =====================================================================
// E6 边界：科普帖举报（targetType=science）
// =====================================================================
describe('E6 边界: 科普帖举报', () => {
  it('targetType=science 举报成功入队 code=0 且出现在 report.list(pending)', async () => {
    await loginBind('13800008888');
    const list = await apiScience.listSciencePosts({});
    const id = list.data.list[0]._id;
    const r = await services.report.create({
      targetType: TARGET_TYPE.SCIENCE,
      targetId: id,
      reason: REPORT_REASON.VIOLATION,
    });
    expect(r.code).toBe(ERROR_CODE.SUCCESS);
    expect(r.data.reportId).toBeTruthy();
    const pending = await services.report.list();
    expect(pending.data.some((x) => x._id === r.data.reportId)).toBe(true);
  });

  it('非法 reason -> INVALID_PARAM（即使是 science）', async () => {
    await loginBind('13800009999');
    const r = await services.report.create({
      targetType: TARGET_TYPE.SCIENCE,
      targetId: 'sci_seed_0',
      reason: 'not_a_reason',
    });
    expect(r.code).toBe(ERROR_CODE.INVALID_PARAM);
  });

  it('未登录 -> UNAUTHORIZED', async () => {
    uni.removeStorageSync('token');
    const r = await services.report.create({
      targetType: TARGET_TYPE.SCIENCE,
      targetId: 'sci_seed_0',
      reason: REPORT_REASON.VIOLATION,
    });
    expect(r.code).toBe(ERROR_CODE.UNAUTHORIZED);
  });

  it('设计说明: science 举报不触发降权（被举报帖仍公开，E6 未专项实现）', async () => {
    await loginBind('13800001234');
    const created = await services.science.create(validSciencePost({ title: '被举报测试帖' }));
    expect(created.data.status).toBe(SCIENCE_REVIEW_STATUS.PASS);
    const id = created.data.post._id;
    // 多次举报（即便含 block 级），science 目标不进入降权分支
    for (let i = 0; i < 3; i += 1) {
      await services.report.create({
        targetType: TARGET_TYPE.SCIENCE,
        targetId: id,
        reason: REPORT_REASON.VIOLATION,
      });
    }
    const list = await services.science.list({ keyword: '被举报测试帖' });
    const found = list.data.list.find((p) => p._id === id);
    expect(found).toBeTruthy(); // 仍公开，未被下架
  });
});

// =====================================================================
// store/science 边界：分页 append + 详情失败不写 detail
// =====================================================================
describe('store/science 边界', () => {
  it('分页 append: 12 条时分两页累计 16（含种子）且 hasMore 正确', async () => {
    await loginBind('13800005678');
    for (let i = 0; i < 12; i += 1) {
      await services.science.create(validSciencePost({ title: `store分页 ${i}` }));
    }
    const store = useScienceStore();
    const r1 = await store.fetchList({ page: 1 });
    expect(r1.code).toBe(0);
    expect(store.list.length).toBe(10);
    expect(store.total).toBe(SEED_SCIENCE + 12);
    expect(store.hasMore).toBe(true);
    await store.fetchList({ page: 2, append: true });
    expect(store.list.length).toBe(SEED_SCIENCE + 12);
    expect(store.hasMore).toBe(false);
  });

  it('fetchDetail 失败(不存在) 不写 detail 且 code!=0', async () => {
    const store = useScienceStore();
    const r = await store.fetchDetail('nope_id');
    expect(r.code).toBe(ERROR_CODE.NOT_FOUND);
    expect(store.detail).toBeNull();
  });
});

// =====================================================================
// E5 边界：首页全局搜索覆盖「领养帖 + 科普帖」数据层契约
// （home/index.vue 同时调用 postStore + scienceStore 的 fetchList，已代码复核；
//  此处验证两个列表端点对共享关键词均能命中，支撑统一搜索）
// =====================================================================
describe('E5 边界: 首页全局搜索(领养帖+科普帖)数据层契约', () => {
  it('共享关键词在领养帖与科普帖均命中', async () => {
    await loginBind('13800009090');
    // 科普帖：关键词放 title
    await apiScience.createSciencePost({
      title: '幸运锦鲤共享词科普',
      category: SCIENCE_CATEGORY.FEEDING,
      cover: 'https://img/c.jpg',
      content: '家有一只猫，科学喂养',
    });
    // 领养帖：关键词放 personality（post.list 检索字段含 personality）
    await apiPost.createPost(validAdoptPost({ personality: '幸运锦鲤共享词 温顺亲人' }));

    const sci = await apiScience.listSciencePosts({ keyword: '幸运锦鲤共享词' });
    const adopt = await apiPost.listPosts({ keyword: '幸运锦鲤共享词' });

    expect(sci.code).toBe(ERROR_CODE.SUCCESS);
    expect(adopt.code).toBe(ERROR_CODE.SUCCESS);
    expect(sci.data.list.length).toBeGreaterThanOrEqual(1);
    expect(adopt.data.list.length).toBeGreaterThanOrEqual(1);
  });
});
