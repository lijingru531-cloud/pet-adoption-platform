import { describe, it, expect } from 'vitest';
import { checkMinor, canPublishOrAdopt } from '@/utils/minor';

describe('utils/minor', () => {
  describe('checkMinor', () => {
    it('无生日默认按未成年限制', () => {
      expect(checkMinor(null)).toEqual({ isMinor: true, age: 0 });
      expect(checkMinor('')).toEqual({ isMinor: true, age: 0 });
      expect(checkMinor(undefined)).toEqual({ isMinor: true, age: 0 });
    });

    it('非法日期 -> 未成年', () => {
      expect(checkMinor('not-a-date')).toEqual({ isMinor: true, age: 0 });
    });

    it('成年人判定', () => {
      const adult = new Date();
      adult.setFullYear(adult.getFullYear() - 25);
      const r = checkMinor(adult.toISOString());
      expect(r.isMinor).toBe(false);
      expect(r.age).toBe(25);
    });

    it('未成年判定（10岁）', () => {
      const kid = new Date();
      kid.setFullYear(kid.getFullYear() - 10);
      const r = checkMinor(kid.toISOString());
      expect(r.isMinor).toBe(true);
      expect(r.age).toBe(10);
    });

    it('恰好 18 岁生日当天 -> 成年', () => {
      const exactly = new Date();
      exactly.setFullYear(exactly.getFullYear() - 18);
      const r = checkMinor(exactly.toISOString());
      expect(r.isMinor).toBe(false);
    });
  });

  describe('canPublishOrAdopt', () => {
    it('开关关闭 -> 一律允许', () => {
      expect(canPublishOrAdopt(null, false)).toBe(true);
      expect(canPublishOrAdopt({ isMinor: true }, false)).toBe(true);
    });

    it('无用户 -> 拒绝', () => {
      expect(canPublishOrAdopt(null, true)).toBe(false);
    });

    it('已实名 -> 允许', () => {
      expect(canPublishOrAdopt({ ageVerified: true, birthday: '2010-01-01' }, true)).toBe(true);
    });

    it('未成年 -> 拒绝', () => {
      const kid = new Date();
      kid.setFullYear(kid.getFullYear() - 10);
      expect(canPublishOrAdopt({ birthday: kid.toISOString() }, true)).toBe(false);
    });

    it('成年 -> 允许', () => {
      const adult = new Date();
      adult.setFullYear(adult.getFullYear() - 30);
      expect(canPublishOrAdopt({ birthday: adult.toISOString() }, true)).toBe(true);
    });
  });
});
