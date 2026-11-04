import { describe, it, expect, beforeEach } from 'vitest';
import { services } from '@/services';
import { ERROR_CODE } from '@/constants/errorCode';
import {
  POST_STATUS,
  AI_REVIEW_STATUS,
  CONVERSATION_STATUS,
  MESSAGE_TYPE,
  NOTIFICATION_TYPE,
} from '@/constants/enum';
import { resetBackend, uniq } from '../helpers';

beforeEach(() => {
  resetBackend();
});

/**
 * 登录并绑定手机号，返回 user。
 * 使用「手机号决定 code」使同一手机号在多次登录时复用同一账号
 * （mock 后端以 code 作为 openid，手机号合并主键），便于在测试中
 * 以「作者 / 领养人」两种身份切换操作同一份数据。
 */
async function loginAndBind(mobile = '13800001111') {
  const r = await services.auth.login({ platform: 'MP', code: `code_${mobile}` });
  expect(r.code).toBe(ERROR_CODE.SUCCESS);
  const b = await services.auth.bindMobile({ mobile });
  expect(b.code).toBe(ERROR_CODE.SUCCESS);
  return b.data.user;
}

const validPost = (over = {}) => ({
  species: 'cat',
  breed: '英国短毛猫',
  age: 8,
  gender: 'female',
  healthStatus: ['vaccinated'],
  location: { city: '深圳', district: '南山区' },
  personality: '温顺亲人',
  reason: '工作调动无法继续照料',
  photos: ['https://img/1.jpg'],
  ...over,
});

describe('services/mock - 种子数据', () => {
  it('首次注入 3 条可领养种子帖', async () => {
    const r = await services.post.list();
    expect(r.code).toBe(ERROR_CODE.SUCCESS);
    expect(r.data.list.length).toBe(3);
    expect(r.data.total).toBe(3);
  });
});

describe('services/mock - post.create 校验与审核状态机', () => {
  beforeEach(async () => {
    await loginAndBind();
  });

  it('合规帖 -> 待领养(ADOPTABLE) + 审核通过(PASS)，并生成摘要/标签', async () => {
    const r = await services.post.create(validPost());
    expect(r.code).toBe(ERROR_CODE.SUCCESS);
    expect(r.data.aiReviewStatus).toBe(AI_REVIEW_STATUS.PASS);
    expect(r.data.post.status).toBe(POST_STATUS.ADOPTABLE);
    expect(r.data.post.summary).toBeTruthy();
    expect(Array.isArray(r.data.post.aiTags)).toBe(true);
  });

  it('疑似内容 -> 审核转人工(REVIEW)，状态仍为 pending', async () => {
    const r = await services.post.create(validPost({ reason: '加微信 转账 可私聊' }));
    expect(r.data.aiReviewStatus).toBe(AI_REVIEW_STATUS.REVIEW);
    expect(r.data.post.status).toBe(POST_STATUS.PENDING);
  });

  it('极端违规 -> 拦截(BLOCKED) + 下架(TAKEN_DOWN)', async () => {
    const r = await services.post.create(validPost({ reason: '这是食用狗肉的帖子' }));
    expect(r.data.aiReviewStatus).toBe(AI_REVIEW_STATUS.BLOCKED);
    expect(r.data.post.status).toBe(POST_STATUS.TAKEN_DOWN);
  });

  it('缺少必填项 -> INVALID_PARAM', async () => {
    const r = await services.post.create(validPost({ breed: '' }));
    expect(r.code).toBe(ERROR_CODE.INVALID_PARAM);
  });

  it('无照片 -> INVALID_PARAM', async () => {
    const r = await services.post.create(validPost({ photos: [] }));
    expect(r.code).toBe(ERROR_CODE.INVALID_PARAM);
  });

  it('未绑定手机号被拒 FORBIDDEN', async () => {
    // 登出（客户端清除 token；mock 后端无 logout，直接清存储）
    uni.removeStorageSync('token');
    await services.auth.login({ platform: 'MP', code: uniq('code2') }); // 未绑定
    const r = await services.post.create(validPost());
    expect(r.code).toBe(ERROR_CODE.FORBIDDEN);
  });
});

describe('services/mock - 发布->列表可见 链路连通', () => {
  it('合规帖发布后出现在公开列表', async () => {
    await loginAndBind('13800002222');
    const created = await services.post.create(validPost({ breed: '布偶猫' }));
    const list = await services.post.list({ keyword: '布偶猫' });
    expect(list.code).toBe(ERROR_CODE.SUCCESS);
    const ids = list.data.list.map((p) => p._id);
    expect(ids).toContain(created.data.post._id);
  });

  it('审核转人工的帖不进入公开列表', async () => {
    await loginAndBind('13800003333');
    const created = await services.post.create(validPost({ reason: '加微信 付款' }));
    const list = await services.post.list();
    const ids = list.data.list.map((p) => p._id);
    expect(ids).not.toContain(created.data.post._id);
  });
});

describe('services/mock - 帖子状态机 (待领养->已预定->已领养)', () => {
  let postId;
  beforeEach(async () => {
    await loginAndBind('13800004444');
    const r = await services.post.create(validPost());
    postId = r.data.post._id;
  });

  it('ADOPTABLE -> RESERVED -> ADOPTED 合法流转', async () => {
    let r = await services.post.changeStatus(postId, POST_STATUS.RESERVED);
    expect(r.code).toBe(ERROR_CODE.SUCCESS);
    expect(r.data.status).toBe(POST_STATUS.RESERVED);

    r = await services.post.changeStatus(postId, POST_STATUS.ADOPTED);
    expect(r.code).toBe(ERROR_CODE.SUCCESS);
    expect(r.data.status).toBe(POST_STATUS.ADOPTED);
  });

  it('已领养仅可标记一次（二次 ADOPTED 被拒）', async () => {
    await services.post.changeStatus(postId, POST_STATUS.ADOPTED);
    const r = await services.post.changeStatus(postId, POST_STATUS.ADOPTED);
    expect(r.code).toBe(ERROR_CODE.INVALID_PARAM);
  });

  it('非法状态被拒', async () => {
    const r = await services.post.changeStatus(postId, 'not_a_status');
    expect(r.code).toBe(ERROR_CODE.INVALID_PARAM);
  });
});

describe('services/mock - 详情隐私（不泄露 contactEnc）', () => {
  it('detail 不含 contactEnc 字段', async () => {
    await loginAndBind('13800005555');
    const created = await services.post.create(validPost());
    const r = await services.post.detail(created.data.post._id);
    expect(r.code).toBe(ERROR_CODE.SUCCESS);
    expect(r.data.contactEnc).toBeUndefined();
    expect(r.data.author).toBeTruthy();
  });
});

describe('services/mock - 会话/消息 流程', () => {
  let authorPostId;
  let adopter;
  beforeEach(async () => {
    // 作者
    const author = await loginAndBind('13800006666');
    const cp = await services.post.create(validPost({ breed: '苏格兰折耳猫' }));
    authorPostId = cp.data.post._id;
    // 领养人（不同账号）
    adopter = await loginAndBind('13800007777');
  });

  it('发起领养意向 -> 创建会话 + 自动意向卡 + 通知', async () => {
    const r = await services.conversation.create({ postId: authorPostId });
    expect(r.code).toBe(ERROR_CODE.SUCCESS);
    const cid = r.data.conversationId;

    const msgs = await services.conversation.messages(cid);
    expect(msgs.code).toBe(ERROR_CODE.SUCCESS);
    expect(msgs.data.some((m) => m.type === MESSAGE_TYPE.INTENT)).toBe(true);

    // 意向通知推送给「发帖人」，切回作者账号查看
    await loginAndBind('13800006666');
    const ntf = await services.notification.list();
    expect(ntf.data.some((n) => n.type === NOTIFICATION_TYPE.INTENT)).toBe(true);
  });

  it('不能对自己帖子发起领养 FORBIDDEN', async () => {
    // 切到作者本人身份
    await loginAndBind('13800006666');
    const r = await services.conversation.create({ postId: authorPostId });
    expect(r.code).toBe(ERROR_CODE.FORBIDDEN);
  });

  it('发送联系方式卡 -> isContactShared=true', async () => {
    const c = await services.conversation.create({ postId: authorPostId });
    const cid = c.data.conversationId;
    const r = await services.conversation.sendMessage({
      conversationId: cid,
      type: MESSAGE_TYPE.CONTACT,
      content: '我的微信',
      contactEnc: 'enc==',
      contactType: 'wechat',
    });
    expect(r.code).toBe(ERROR_CODE.SUCCESS);
    expect(r.data.message.isContactShared).toBe(true);
    expect(r.data.message.contactEnc).toBe('enc==');
  });

  it('发帖人接受 -> 会话 ACCEPTED 且帖子 ADOPTED', async () => {
    const c = await services.conversation.create({ postId: authorPostId });
    const cid = c.data.conversationId;
    // 切回作者账号来 accept
    await loginAndBind('13800006666'); // 作者（同 mobile 合并为同一账号）
    const d = await services.conversation.decide({ conversationId: cid, action: 'accept' });
    expect(d.code).toBe(ERROR_CODE.SUCCESS);
    expect(d.data.status).toBe(CONVERSATION_STATUS.ACCEPTED);

    const detail = await services.post.detail(authorPostId);
    expect(detail.data.status).toBe(POST_STATUS.ADOPTED);
  });
});

describe('services/mock - 举报流程', () => {
  it('举报合规帖 -> ok，并记录审核', async () => {
    await loginAndBind('13800008888');
    // 取一条种子帖
    const list = await services.post.list();
    const targetId = list.data.list[0]._id;
    const r = await services.report.create({ targetType: 'post', targetId, reason: 'ad', detail: '广告' });
    expect(r.code).toBe(ERROR_CODE.SUCCESS);
    expect(r.data.aiResult).toBeTruthy();
  });

  it('举报原因非法 -> INVALID_PARAM', async () => {
    await loginAndBind('13800009999');
    const r = await services.report.create({ targetType: 'post', targetId: 'x', reason: 'bad_reason' });
    expect(r.code).toBe(ERROR_CODE.INVALID_PARAM);
  });
});
