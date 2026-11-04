import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  getWechatLoginCode,
  getCurrentPlatform,
  redirectToWechatH5Auth,
} from '@/utils/auth';

/**
 * 说明：utils/auth.js 大量使用 uniapp 条件编译（// #ifdef MP-WEIXIN 等）。
 * 在纯 node 环境下这些只是注释，所有分支会顺序执行，因此无法逐端验证，
 * 但可针对“纯逻辑且不依赖真实端”的入口做可控桩测试，其余标注跳过。
 */

describe('utils/auth', () => {
  it('模块可正常 import（无语法/依赖错误）', () => {
    expect(typeof getWechatLoginCode).toBe('function');
    expect(typeof getCurrentPlatform).toBe('function');
  });

  describe('getWechatLoginCode（以 uni.login 成功桩验证 MP 分支）', () => {
    let origLogin;
    beforeEach(() => {
      origLogin = uni.login;
      // 在 node 下所有 #ifdef 分支都会执行到 uni.login；桩 success 返回 code
      uni.login = (opts) => opts && typeof opts.success === 'function' && opts.success({ code: 'WXCODE_123' });
    });
    afterEach(() => {
      uni.login = origLogin;
    });

    it('微信登录凭证获取成功返回 code', async () => {
      const code = await getWechatLoginCode();
      expect(code).toBe('WXCODE_123');
    });
  });

  describe('redirectToWechatH5Auth（URL 拼接逻辑）', () => {
    let origLocation;
    beforeEach(() => {
      origLocation = globalThis.location;
      globalThis.location = { href: '' }; // 避免 node 下 ReferenceError
    });
    afterEach(() => {
      globalThis.location = origLocation;
    });

    it('拼接微信网页授权 URL（appId + 回调）', () => {
      redirectToWechatH5Auth('wx_appid_xyz', 'https://example.com/cb');
      const href = globalThis.location.href;
      expect(href).toContain('open.weixin.qq.com/connect/oauth2/authorize');
      expect(href).toContain('appid=wx_appid_xyz');
      expect(href).toContain('redirect_uri=');
      expect(href).toContain('scope=snsapi_userinfo');
    });
  });

  it('getCurrentPlatform 在 node 下返回合法端标识', () => {
    // 因条件编译在 node 下退化，仅断言返回非空且属于已知端集合
    expect(['MP', 'H5', 'APP']).toContain(getCurrentPlatform());
  });
});
