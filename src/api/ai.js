/**
 * AI 科普问答 API 门面（架构设计 src/api/ai.js）
 * 注意：问答(QA)业务属 Sprint 2 科普模块，本期仅打通网关调用占位。
 * AI 文本审核由 services.ai 提供，发帖时由 services.post.create 内部触发。
 */
import { services } from '@/services';

export const aiChat = (params) => services.ai.chat(params);
