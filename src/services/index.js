/**
 * 后端服务选择器（架构设计 1.1 / 团队决策：services/ 抽象层）
 *
 * 统一对外暴露 `services`，其余模块（store / api / 页面）只依赖此入口，
 * 不关心底层是 Mock 还是云端。通过 ENV.USE_MOCK 一键切换。
 *
 *   services.auth.*       账号登录 / 绑定 / 资料
 *   services.post.*       领养帖 CRUD / 列表 / 筛选 / 收藏
 *   services.conversation.* 会话 / 消息 / 接受拒绝
 *   services.notification.* 消息中心
 *   services.report.*     举报 / 复核
 *   services.review.*     审核记录查询
 *   services.ai.*         AI 网关（合规/限频/上下文/审核/问答）
 */
import ENV from '@/env';
import mockBackend, { seedMockData } from './mock';
import cloudBackend from './cloud';
import ai from './ai';
import { ERROR_CODE } from '@/constants/errorCode';

const useMock = ENV.USE_MOCK === true;

/** 选中底层实现 */
const backend = useMock ? mockBackend : cloudBackend;

/** Mock 模式首次注入演示数据 */
if (useMock && typeof seedMockData === 'function') {
  seedMockData();
}

/**
 * AI 网关合并：
 *  - Mock 模式：本地规则判定（services/ai.js）
 *  - 云端模式：chat 委托云端 ai-chat 函数；文本审核由服务端 post-create 触发 review-trigger
 */
const aiGateway = {
  ...ai,
  async chat(params) {
    if (useMock) return ai.chat(params);
    // 云端：委托 ai-chat 云函数（内部经 ai-gateway 调免密钥大模型）
    return cloudBackend.ai.chat(params);
  },
  async reviewText(params) {
    if (useMock) return ai.reviewText(params);
    // 云端：服务端已在 post-create 同步触发 review-trigger，前端仅展示审核中
    return {
      code: ERROR_CODE.SUCCESS,
      data: { aiResult: 'pending', riskLevel: 'low', reason: '云端审核中' },
    };
  },
  async generateSummary(text) {
    if (useMock) return ai.generateSummary(text);
    return { code: ERROR_CODE.SUCCESS, data: { summary: '', tags: [] } };
  },
};

/** 对外统一服务入口 */
const services = {
  ...backend,
  ai: aiGateway,
  /** 当前是否 Mock 模式（便于 UI 提示） */
  isMock: useMock,
};

export { services };
export default services;
