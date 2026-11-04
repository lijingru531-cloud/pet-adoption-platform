/**
 * Vitest 全局 setup：注入 node 环境下的 `uni` 桩对象。
 *
 * 仅实现测试中用到的接口；所有存储基于内存 Map，
 * 通过 globalThis.__resetUniStorage() 供用例在 beforeEach 中清空，
 * 保证用例之间互不污染（Mock 数据库 / 登录态 / 配额计数）。
 *
 * 注意：request / uploadFile / chooseImage 等仅在真实端/云端模式调用，
 * 此处为空实现或可控桩，满足 import 不报错即可；媒体选择器不在 node 中真实触发。
 */
const mem = new Map();

const uni = {
  // ---- 存储（Mock 数据库 + 登录态）----
  getStorageSync: (k) => (mem.has(k) ? mem.get(k) : ''),
  setStorageSync: (k, v) => mem.set(k, v),
  removeStorageSync: (k) => mem.delete(k),

  // ---- 网络 / 媒体（云端模式才真正使用，node 下为可控桩）----
  request: (opts) => opts && typeof opts.fail === 'function' && opts.fail({ errMsg: 'stub' }),
  uploadFile: (opts) => opts && typeof opts.fail === 'function' && opts.fail({ errMsg: 'stub' }),
  chooseImage: () => {},
  chooseMedia: () => {},
  login: () => {},

  // ---- UI 反馈（空实现）----
  showToast: () => {},
  showModal: () => {},
  showLoading: () => {},
  hideLoading: () => {},

  // arrayBufferToBase64 故意不实现，crypto.js 会回退到全局 btoa/atob
};

globalThis.uni = uni;
globalThis.__resetUniStorage = () => mem.clear();
