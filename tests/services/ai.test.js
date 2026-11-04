import { describe, it, expect, beforeEach } from 'vitest';
import {
  complianceFilter,
  enforceQuota,
  quotaLeft,
  truncateContext,
  reviewText,
  reviewImages,
  generateSummary,
  postProcess,
  chat,
  genId,
} from '@/services/ai';
import { ERROR_CODE } from '@/constants/errorCode';
import { REVIEW_SYSTEM_PROMPT } from '@/prompts/review';
import { QA_DISCLAIMER } from '@/prompts/qa';
import { resetBackend, uniq } from '../helpers';

beforeEach(() => {
  resetBackend();
});

describe('services/ai - complianceFilter', () => {
  it('极端敏感词 -> block + 上报', () => {
    const r = complianceFilter('我想食用狗肉');
    expect(r.level).toBe('block');
    expect(r.riskLevel).toBe('high');
    expect(r.report).toBe(true);
  });

  it('普通敏感词 -> review（转人工）', () => {
    const r = complianceFilter('可以加微信 转账 吗');
    expect(r.level).toBe('review');
    expect(r.riskLevel).toBe('medium');
    expect(r.report).toBeUndefined();
  });

  it('正常内容 -> pass', () => {
    const r = complianceFilter('这只小猫很温顺，已接种疫苗');
    expect(r.level).toBe('pass');
    expect(r.riskLevel).toBe('low');
    expect(r.reason).toBe('');
  });

  it('空串 -> pass', () => {
    expect(complianceFilter('').level).toBe('pass');
  });
});

describe('services/ai - enforceQuota (日限频 20)', () => {
  it('未登录(userId 空) 放行且不计数', () => {
    expect(enforceQuota('')).toBe(true);
    expect(quotaLeft('')).toBe(20);
  });

  it('连续 20 次通过，第 21 次被拒', () => {
    const uid = uniq('quota');
    for (let i = 1; i <= 20; i += 1) {
      expect(enforceQuota(uid)).toBe(true);
    }
    expect(enforceQuota(uid)).toBe(false); // 超阈值
    expect(quotaLeft(uid)).toBe(0);
  });

  it('配额随调用递减', () => {
    const uid = uniq('quota2');
    enforceQuota(uid);
    expect(quotaLeft(uid)).toBe(19);
    enforceQuota(uid);
    expect(quotaLeft(uid)).toBe(18);
  });
});

describe('services/ai - truncateContext', () => {
  it('空上下文返回空数组', () => {
    expect(truncateContext([])).toEqual([]);
  });

  it('保留最近 maxTurns 轮', () => {
    const turns = Array.from({ length: 15 }, (_, i) => ({ role: 'user', content: `m${i}` }));
    const out = truncateContext(turns, 10, 4000);
    expect(out.length).toBe(10);
    expect(out[0].content).toBe('m5'); // 最近 10 条：5..14
    expect(out[9].content).toBe('m14');
  });

  it('总字符数不超过 maxTokens', () => {
    const turns = Array.from({ length: 20 }, () => ({ role: 'user', content: 'x'.repeat(500) }));
    const out = truncateContext(turns, 10, 4000);
    const total = out.reduce((s, t) => s + (t.content || '').length, 0);
    expect(total).toBeLessThanOrEqual(4000);
    expect(out.length).toBeLessThanOrEqual(10);
  });
});

describe('services/ai - reviewText', () => {
  it('违规文本 -> code 0 / aiResult block / report true', async () => {
    const r = await reviewText({ targetType: 'post', targetId: 'p1', text: '来吃狗肉' });
    expect(r.code).toBe(ERROR_CODE.SUCCESS);
    expect(r.data.aiResult).toBe('block');
    expect(r.data.report).toBe(true);
    expect(r.data.confidence).toBeGreaterThan(0);
  });

  it('疑似文本 -> aiResult review', async () => {
    const r = await reviewText({ targetType: 'post', targetId: 'p2', text: '加微信 付款' });
    expect(r.code).toBe(ERROR_CODE.SUCCESS);
    expect(r.data.aiResult).toBe('review');
  });

  it('正常文本 -> aiResult pass', async () => {
    const r = await reviewText({ targetType: 'post', targetId: 'p3', text: '温顺的英短，已疫苗' });
    expect(r.code).toBe(ERROR_CODE.SUCCESS);
    expect(r.data.aiResult).toBe('pass');
  });
});

describe('services/ai - reviewImages (占位 TODO)', () => {
  it('返回明确 pendingApi 标记', async () => {
    const r = await reviewImages(['img1.jpg']);
    expect(r.code).toBe(ERROR_CODE.SUCCESS);
    expect(r.data.aiResult).toBe('pass');
    expect(r.data.pendingApi).toBe(true);
    expect(r.data.reason).toMatch(/TODO|待接入/);
  });
});

describe('services/ai - generateSummary / postProcess', () => {
  it('generateSummary 抽取标签与摘要', async () => {
    const r = await generateSummary('家有一只猫，已疫苗已绝育，性格温顺');
    expect(r.code).toBe(ERROR_CODE.SUCCESS);
    expect(r.data.tags).toContain('猫');
    expect(r.data.tags).toContain('已疫苗');
    expect(r.data.tags).toContain('已绝育');
    expect(r.data.tags).toContain('温顺');
    expect(typeof r.data.summary).toBe('string');
    expect(r.data.summary.length).toBeGreaterThan(0);
  });

  it('postProcess 追加免责声明；空串不追加', () => {
    expect(postProcess('')).toBe('');
    const out = postProcess('回答内容');
    expect(out.startsWith('回答内容')).toBe(true);
    expect(out.endsWith(QA_DISCLAIMER)).toBe(true);
  });
});

describe('services/ai - chat (问答 + 限频 + 合规)', () => {
  it('正常问答返回 answer 且附带免责声明与剩余配额', async () => {
    const uid = uniq('chat');
    const r = await chat({ userId: uid, question: '小猫应该怎么喂养' });
    expect(r.code).toBe(ERROR_CODE.SUCCESS);
    expect(r.data.answer).toContain('幼猫');
    expect(r.data.answer.endsWith(QA_DISCLAIMER)).toBe(true);
    expect(r.data.quotaLeft).toBe(19);
    expect(r.data.disclaimer).toBe(true);
  });

  it('违规问题被拦截 CONTENT_BLOCKED', async () => {
    const uid = uniq('chat2');
    const r = await chat({ userId: uid, question: '食用狗肉的方法' });
    expect(r.code).toBe(ERROR_CODE.CONTENT_BLOCKED);
    expect(r.data).toBeNull();
  });

  it('日配额耗尽返回 AI_QUOTA_EXCEEDED', async () => {
    const uid = uniq('chat3');
    for (let i = 0; i < 20; i += 1) {
      await chat({ userId: uid, question: '普通问题' });
    }
    const r = await chat({ userId: uid, question: '超限再来一次' });
    expect(r.code).toBe(ERROR_CODE.AI_QUOTA_EXCEEDED);
    expect(r.data).toBeNull();
  });
});

describe('services/ai - prompts 拼接', () => {
  it('REVIEW_SYSTEM_PROMPT 要求输出 JSON 且含 aiResult 字段', () => {
    expect(REVIEW_SYSTEM_PROMPT).toMatch(/aiResult/);
    expect(REVIEW_SYSTEM_PROMPT).toMatch(/pass\|block\|review/);
  });
  it('QA_DISCLAIMER 非空', () => {
    expect(QA_DISCLAIMER.length).toBeGreaterThan(0);
  });
});

describe('services/ai - genId', () => {
  it('生成带前缀的唯一 id', () => {
    const id = genId('post');
    expect(id.startsWith('post_')).toBe(true);
    expect(genId('post')).not.toBe(id);
  });
});
