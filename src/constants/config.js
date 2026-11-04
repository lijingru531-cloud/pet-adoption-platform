/**
 * 业务常量（架构设计 8.5）
 */
export const APP_CONFIG = {
  /** 单用户每日 AI 调用上限（架构设计：20） */
  AI_DAILY_QUOTA: 20,

  /** 单次问答上下文轮次上限 */
  MAX_CONTEXT_TURNS: 10,

  /** 单次问答上下文 token 上限（粗略字符估算） */
  MAX_CONTEXT_TOKENS: 4000,

  /** 单帖最多照片数 */
  MAX_PHOTOS: 6,

  /** 分页大小 */
  PAGE_SIZE: 10,

  /** 列表轮询间隔（ms），会话实时性采用轻量轮询（架构设计 7.3） */
  POLL_INTERVAL: 4000,

  /** 平台外沟通安全提示（Q1） */
  SAFETY_TIP:
    '温馨提示：交换联系方式后，请务必在平台内确认对方身份与领养诚意。' +
    '平台严禁任何金钱交易、线下诈骗与食用猫狗等违规行为，如遇可疑情况请立即举报。',
};

/** 联系方式类型（联系方式卡） */
export const CONTACT_TYPE = {
  MOBILE: 'mobile',
  WECHAT: 'wechat',
  QQ: 'qq',
};
