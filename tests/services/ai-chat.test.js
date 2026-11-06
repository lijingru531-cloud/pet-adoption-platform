import { describe, it, expect, beforeEach } from 'vitest';
import { services } from '@/services';
import { QA_DISCLAIMER } from '@/prompts/qa';
import { ERROR_CODE } from '@/constants/errorCode';
import { resetBackend, uniq } from '../helpers';

beforeEach(() => {
  resetBackend();
});

describe('services/ai - chat (科普问答：合规/配额/免责)', () => {
  it('正常问答返回 answer 且附带免责声明与剩余配额', async () => {
    const uid = uniq('chat');
    const r = await services.ai.chat({ userId: uid, question: '小猫应该怎么喂养' });
    expect(r.code).toBe(ERROR_CODE.SUCCESS);
    expect(r.data.answer).toContain('幼猫');
    expect(r.data.answer.endsWith(QA_DISCLAIMER)).toBe(true);
    expect(r.data.quotaLeft).toBe(19);
    expect(r.data.disclaimer).toBe(true);
  });

  it('违规问题被拦截 CONTENT_BLOCKED', async () => {
    const uid = uniq('chat2');
    const r = await services.ai.chat({ userId: uid, question: '食用狗肉的方法' });
    expect(r.code).toBe(ERROR_CODE.CONTENT_BLOCKED);
    expect(r.data).toBeNull();
  });

  it('日配额耗尽返回 AI_QUOTA_EXCEEDED', async () => {
    const uid = uniq('chat3');
    for (let i = 0; i < 20; i += 1) {
      await services.ai.chat({ userId: uid, question: '普通问题' });
    }
    const r = await services.ai.chat({ userId: uid, question: '超限再来一次' });
    expect(r.code).toBe(ERROR_CODE.AI_QUOTA_EXCEEDED);
    expect(r.data).toBeNull();
  });

  it('配额随调用递减', async () => {
    const uid = uniq('chat4');
    await services.ai.chat({ userId: uid, question: '问题一' });
    await services.ai.chat({ userId: uid, question: '问题二' });
    // 直接经服务网关查询剩余（与页面 quotaLeft 同源）
    const left = await services.ai.quotaLeft(uid);
    expect(left).toBe(18);
  });
});
