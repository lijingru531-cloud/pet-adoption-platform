/**
 * 全局错误码（架构设计 8.2）
 * 统一响应结构 { code, data, message }
 */
export const ERROR_CODE = {
  SUCCESS: 0,
  UNAUTHORIZED: 1001, // 未登录 / token 失效
  FORBIDDEN: 1002, // 无权限（非会话双方 / 未成年受限）
  INVALID_PARAM: 2001, // 参数校验失败
  AI_QUOTA_EXCEEDED: 3001, // AI 配额超限（日 20 次）
  CONTENT_BLOCKED: 3002, // 内容违规被拦截
  NOT_FOUND: 4001, // 资源不存在
  SERVER_ERROR: 5000, // 服务器 / 云函数内部错误
  RATE_LIMITED: 6001, // 风控 / 限频
};

/** 错误码 -> 默认中文文案 */
export const ERROR_MESSAGE = {
  [ERROR_CODE.SUCCESS]: '成功',
  [ERROR_CODE.UNAUTHORIZED]: '未登录或登录态已失效，请重新登录',
  [ERROR_CODE.FORBIDDEN]: '无权限执行该操作',
  [ERROR_CODE.INVALID_PARAM]: '请求参数不完整或格式不正确',
  [ERROR_CODE.AI_QUOTA_EXCEEDED]: '今日 AI 调用次数已达上限（20 次/日）',
  [ERROR_CODE.CONTENT_BLOCKED]: '内容命中平台安全规则，已被拦截',
  [ERROR_CODE.NOT_FOUND]: '请求的资源不存在',
  [ERROR_CODE.SERVER_ERROR]: '服务暂时不可用，请稍后重试',
  [ERROR_CODE.RATE_LIMITED]: '操作过于频繁，请稍后再试',
};

/**
 * 统一错误响应构造器
 * @param {number} code 错误码
 * @param {string} [message] 覆盖文案
 */
export function fail(code = ERROR_CODE.SERVER_ERROR, message) {
  return {
    code,
    data: null,
    message: message || ERROR_MESSAGE[code] || '未知错误',
  };
}

/** 统一成功响应构造器 */
export function ok(data = null, message = 'success') {
  return { code: ERROR_CODE.SUCCESS, data, message };
}
