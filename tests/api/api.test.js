import { describe, it, expect, beforeEach } from 'vitest';
import { services } from '@/services';
import * as apiAuth from '@/api/auth';
import * as apiPost from '@/api/post';
import * as apiConv from '@/api/conversation';
import * as apiReport from '@/api/report';
import * as apiNotification from '@/api/notification';
import * as apiAi from '@/api/ai';
import * as apiScience from '@/api/science';
import * as apiLostpet from '@/api/lostpet';
import { ERROR_CODE } from '@/constants/errorCode';
import { POST_STATUS, AI_REVIEW_STATUS, MESSAGE_TYPE } from '@/constants/enum';
import { resetBackend, uniq } from '../helpers';

beforeEach(() => {
  resetBackend();
});

/** 登录并绑定手机号（同手机号复用同一账号） */
async function loginBind(mobile = '13800001111') {
  await apiAuth.login({ platform: 'MP', code: `code_${mobile}` });
  await apiAuth.bindMobile({ mobile });
}

const validPost = (over = {}) => ({
  species: 'cat',
  breed: '美国短毛猫',
  age: 6,
  gender: 'male',
  healthStatus: ['vaccinated'],
  location: { city: '广州', district: '天河区' },
  personality: '活泼',
  reason: '寻找好人家',
  photos: ['https://img/1.jpg'],
  ...over,
});

describe('api 层（Mock 模式）统一返回结构', () => {
  it('每个 api 方法返回 {code, data, message} 且 code 为 number', async () => {
    await loginBind();
    const calls = [
      apiPost.listPosts({}),
      apiPost.getPostDetail('nonexistent'),
      apiNotification.listNotifications(),
      apiNotification.getUnreadCount(),
      apiReport.listReports(),
      apiAi.aiChat({ userId: uniq('u'), question: '怎么喂猫' }),
      apiScience.listSciencePosts(),
      apiLostpet.listNearbyLostPet(),
    ];
    const results = await Promise.all(calls);
    for (const r of results) {
      expect(r).toHaveProperty('code');
      expect(typeof r.code).toBe('number');
      expect(r).toHaveProperty('message');
      expect(r).toHaveProperty('data');
    }
  });

  it('占位模块（科普/寻宠）返回 code=0 成功结构', async () => {
    const r1 = await apiScience.listSciencePosts();
    const r2 = await apiScience.createSciencePost();
    const r3 = await apiLostpet.listNearbyLostPet();
    expect(r1.code).toBe(0);
    expect(r3.code).toBe(0);
    // 科普列表返回 { list, total, page, pageSize } 信封
    expect(r1.data).toHaveProperty('list');
    expect(Array.isArray(r1.data.list)).toBe(true);
    expect(r2.code).toBe(0);
  });
});

describe('api 层 - 发布→列表可见 链路', () => {
  it('createPost 成功 code=0，且 listPosts 可见', async () => {
    await loginBind('13800002222');
    const c = await apiPost.createPost(validPost({ breed: '异国短毛猫' }));
    expect(c.code).toBe(ERROR_CODE.SUCCESS);
    expect(c.data.aiReviewStatus).toBe(AI_REVIEW_STATUS.PASS);

    const list = await apiPost.listPosts({ keyword: '异国短毛猫' });
    const ids = list.data.list.map((p) => p._id);
    expect(ids).toContain(c.data.post._id);
  });

  it('getPostDetail 返回 code=0 且含 author', async () => {
    await loginBind('13800003333');
    const c = await apiPost.createPost(validPost());
    const d = await apiPost.getPostDetail(c.data.post._id);
    expect(d.code).toBe(ERROR_CODE.SUCCESS);
    expect(d.data.author).toBeTruthy();
  });
});

describe('api 层 - 会话/消息/举报', () => {
  it('发起会话 + 发送消息 成功', async () => {
    await loginBind('13800004444');
    const cp = await apiPost.createPost(validPost({ breed: '暹罗猫' }));
    // 换领养人账号
    await loginBind('13800005555');
    const conv = await apiConv.createConversation(cp.data.post._id);
    expect(conv.code).toBe(ERROR_CODE.SUCCESS);

    const cid = conv.data.conversationId;
    const msg = await apiConv.sendMessage({
      conversationId: cid,
      type: MESSAGE_TYPE.TEXT,
      content: '您好',
    });
    expect(msg.code).toBe(ERROR_CODE.SUCCESS);

    const list = await apiConv.listConversations();
    expect(list.code).toBe(ERROR_CODE.SUCCESS);
  });

  it('举报创建返回 code=0', async () => {
    await loginBind('13800006666');
    const list = await apiPost.listPosts({});
    const targetId = list.data.list[0]._id;
    const r = await apiReport.createReport({ targetType: 'post', targetId, reason: 'ad', detail: '广告' });
    expect(r.code).toBe(ERROR_CODE.SUCCESS);
  });
});

describe('api 层 - 收藏', () => {
  it('toggleFavorite 切换收藏态', async () => {
    await loginBind('13800007777');
    const c = await apiPost.createPost(validPost());
    const r = await apiPost.toggleFavorite(c.data.post._id);
    expect(r.code).toBe(ERROR_CODE.SUCCESS);
    expect(typeof r.data.favorited).toBe('boolean');
  });
});
