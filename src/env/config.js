/**
 * 环境与运行配置（集中管理，详见架构设计 8.5）
 *
 * 前端不落地任何密钥；仅保留开关与端点占位。
 * 切换真实云端：将 USE_MOCK 置为 false，并填写 CLOUD_BASE_URL。
 */
const ENV = {
  /** 是否使用本地 Mock 后端。生产接入云服务时置为 false */
  USE_MOCK: true,

  /**
   * 云端函数统一入口（WorkBuddy cloud-service）。
   * 真实接入时填写，例如 https://your-cloud.fn.example.com
   */
  CLOUD_BASE_URL: '',

  /** 免密钥大模型网关端点（仅服务端使用，前端不持有密钥） */
  AI_GATEWAY_URL: '',

  /** 单用户每日 AI 调用上限（架构设计：20） */
  AI_DAILY_QUOTA: 20,

  /** 单次问答上下文轮次上限 */
  MAX_CONTEXT_TURNS: 10,

  /** 单次问答上下文 token 上限（粗略字符估算） */
  MAX_CONTEXT_TOKENS: 4000,

  /** 是否启用地图模块（本期 P2，默认关闭） */
  ENABLE_MAP: false,

  /** 未成年限制发布/领养（实名校验占位，本期默认开启拦截） */
  MINOR_RESTRICT: true,

  /** 单帖最多照片数 */
  MAX_PHOTOS: 6,

  /** 当前编译端（由 uniapp 注入 UNI_PLATFORM） */
  PLATFORM: (typeof process !== 'undefined' && process.env && process.env.UNI_PLATFORM) || 'h5',
};

export default ENV;
