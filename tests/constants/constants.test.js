import { describe, it, expect } from 'vitest';
import {
  ERROR_CODE,
  ERROR_MESSAGE,
  ok,
  fail,
} from '@/constants/errorCode';
import * as enumMod from '@/constants/enum';
import { APP_CONFIG, CONTACT_TYPE } from '@/constants/config';

describe('constants/errorCode', () => {
  it('SUCCESS 为 0', () => {
    expect(ERROR_CODE.SUCCESS).toBe(0);
  });

  it('各错误码数值唯一（无重复值）', () => {
    const vals = Object.values(ERROR_CODE);
    expect(new Set(vals).size).toBe(vals.length);
  });

  it('ERROR_MESSAGE 覆盖全部错误码', () => {
    const codes = Object.values(ERROR_CODE);
    for (const c of codes) {
      expect(ERROR_MESSAGE).toHaveProperty(String(c));
      expect(typeof ERROR_MESSAGE[c]).toBe('string');
    }
  });

  it('ok() 返回 {code:0, data, message}', () => {
    const r = ok({ a: 1 }, 'ok-msg');
    expect(r).toEqual({ code: 0, data: { a: 1 }, message: 'ok-msg' });
  });

  it('fail() 返回 {code, data:null, message}', () => {
    const r = fail(ERROR_CODE.FORBIDDEN, '无权限');
    expect(r.code).toBe(ERROR_CODE.FORBIDDEN);
    expect(r.data).toBeNull();
    expect(r.message).toBe('无权限');
  });

  it('fail() 缺省 message 回落到 ERROR_MESSAGE 文案', () => {
    const r = fail(ERROR_CODE.NOT_FOUND);
    expect(r.message).toBe(ERROR_MESSAGE[ERROR_CODE.NOT_FOUND]);
  });
});

describe('constants/enum - 标签一致性 & 值唯一', () => {
  const pairs = [
    ['POST_STATUS', 'POST_STATUS_LABEL'],
    ['AI_REVIEW_STATUS', 'AI_REVIEW_STATUS_LABEL'],
    ['SPECIES', 'SPECIES_LABEL'],
    ['GENDER', 'GENDER_LABEL'],
    ['HEALTH_STATUS', 'HEALTH_STATUS_LABEL'],
    ['CONVERSATION_STATUS', 'CONVERSATION_STATUS_LABEL'],
    ['REPORT_REASON', 'REPORT_REASON_LABEL'],
    ['NOTIFICATION_TYPE', 'NOTIFICATION_TYPE_LABEL'],
  ];

  for (const [enumName, labelName] of pairs) {
    describe(`${enumName}`, () => {
      const enumObj = enumMod[enumName];
      const labelObj = enumMod[labelName];

      it('导出存在且为对象', () => {
        expect(enumObj).toBeTypeOf('object');
        expect(labelObj).toBeTypeOf('object');
      });

      it('枚举值唯一（无重复）', () => {
        const vals = Object.values(enumObj);
        expect(new Set(vals).size).toBe(vals.length);
      });

      it('LABEL 键集合 == 枚举值集合（引用一致）', () => {
        const enumVals = Object.values(enumObj).sort();
        const labelKeys = Object.keys(labelObj).sort();
        expect(labelKeys).toEqual(enumVals);
      });

      it('每个标签为非空字符串', () => {
        for (const v of Object.values(labelObj)) {
          expect(typeof v).toBe('string');
          expect(v.length).toBeGreaterThan(0);
        }
      });
    });
  }

  it('独立枚举（无 LABEL）值唯一', () => {
    for (const name of ['RISK_LEVEL', 'MESSAGE_TYPE', 'TARGET_TYPE', 'USER_ROLE', 'PLATFORM']) {
      const vals = Object.values(enumMod[name]);
      expect(new Set(vals).size).toBe(vals.length);
    }
  });
});

describe('constants/config', () => {
  it('APP_CONFIG 关键限额与架构设计一致', () => {
    expect(APP_CONFIG.AI_DAILY_QUOTA).toBe(20);
    expect(APP_CONFIG.MAX_CONTEXT_TURNS).toBe(10);
    expect(APP_CONFIG.MAX_CONTEXT_TOKENS).toBe(4000);
    expect(APP_CONFIG.MAX_PHOTOS).toBe(6);
    expect(APP_CONFIG.PAGE_SIZE).toBe(10);
  });
  it('CONTACT_TYPE 含 mobile/wechat/qq', () => {
    expect(CONTACT_TYPE.MOBILE).toBe('mobile');
    expect(CONTACT_TYPE.WECHAT).toBe('wechat');
    expect(CONTACT_TYPE.QQ).toBe('qq');
  });
});
