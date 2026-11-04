import { describe, it, expect } from 'vitest';
import {
  encryptContact,
  decryptContact,
  maskMobile,
} from '@/utils/crypto';

describe('utils/crypto', () => {
  describe('encryptContact / decryptContact 往返', () => {
    it('明文加密后可还原', () => {
      const plain = 'wxid_abc123 / 13800001111';
      const enc = encryptContact(plain);
      expect(enc).not.toBe(plain); // 应被混淆，不应出现明文
      expect(decryptContact(enc)).toBe(plain);
    });

    it('中文联系方式可还原', () => {
      const plain = '微信号：lucky_cat_2024';
      expect(decryptContact(encryptContact(plain))).toBe(plain);
    });

    it('空值安全', () => {
      expect(encryptContact('')).toBe('');
      expect(encryptContact(null)).toBe('');
      expect(decryptContact('')).toBe('');
      expect(decryptContact(null)).toBe('');
    });

    it('密文不含明文片段（隐私脱敏基本校验）', () => {
      const plain = '13800001111';
      const enc = encryptContact(plain);
      expect(enc).not.toContain('13800001111');
    });
  });

  describe('maskMobile', () => {
    it('标准手机号脱敏 138****0000', () => {
      expect(maskMobile('13800000000')).toBe('138****0000');
    });
    it('含区号/非11位但长度>=7 仍脱敏', () => {
      expect(maskMobile('13812345678')).toBe('138****5678');
    });
    it('长度<7 原样返回', () => {
      expect(maskMobile('123')).toBe('123');
    });
    it('空值安全', () => {
      expect(maskMobile('')).toBe('');
      expect(maskMobile(null)).toBe('');
    });
  });
});
