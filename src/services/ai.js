/**
 * AI 管理员网关（架构设计 1.4 / 5 / T06）
 *
 * 单一出入口：所有 AI 能力（审核 D1/D2、问答 B3、摘要 D3）统一经此网关。
 * 前端/审核服务永不直接调用大模型；密钥由平台托管（云端模式经 ai-gateway）。
 *
 * 职责：
 *  1. complianceFilter  合规前置过滤（极端敏感/敏感词，命中即拦截/打标）
 *  2. enforceQuota      单用户日调用上限（默认 20）
 *  3. truncateContext   上下文轮次/Token 截断
 *  4. callLLM           调用大模型（Mock 模式为规则判定；云端模式走 ai-gateway）
 *  5. postProcess       后处理（追加免责声明、token 统计占位）
 *
 * ⚠️ 图片审核：本期大模型大概率不支持图片识别，使用「待接入内容安全 API」占位（见 imageReview）。
 */
import ENV from '@/env';
import { ERROR_CODE, ok } from '@/constants/errorCode';
import { EXTREME_SENSITIVE, SENSITIVE_WORDS } from '@/prompts/review';
import { QA_DISCLAIMER } from '@/prompts/qa';
import { storage } from './storage';

/** 生成唯一 ID */
export function genId(prefix = 'id') {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/** 今日日期串（Y-M-D） */
function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

/**
 * 合规前置过滤
 * @param {string} text
 * @returns {{level:'pass'|'review'|'block', riskLevel, reason, report?:boolean}}
 */
export function complianceFilter(text = '') {
  const t = String(text || '');
  for (const w of EXTREME_SENSITIVE) {
    if (t.includes(w)) {
      return { level: 'block', riskLevel: 'high', reason: `命中极端敏感词「${w}」，已标记上报`, report: true };
    }
  }
  for (const w of SENSITIVE_WORDS) {
    if (t.includes(w)) {
      return { level: 'review', riskLevel: 'medium', reason: `命中敏感词「${w}」，转人工复核` };
    }
  }
  return { level: 'pass', riskLevel: 'low', reason: '' };
}

/**
 * 单用户日配额校验（架构设计 1.4：20 次/日）
 * @returns {boolean} true=配额内，false=已超限
 */
export function enforceQuota(userId) {
  if (!userId) return true; // 未登录放行（由调用方决定是否拦截）
  const key = `ai_quota_${userId}_${todayKey()}`;
  const used = storage.get(key, 0);
  if (used >= ENV.AI_DAILY_QUOTA) return false;
  storage.set(key, used + 1);
  return true;
}

/** 查询剩余配额 */
export function quotaLeft(userId) {
  if (!userId) return ENV.AI_DAILY_QUOTA;
  const used = storage.get(`ai_quota_${userId}_${todayKey()}`, 0);
  return Math.max(0, ENV.AI_DAILY_QUOTA - used);
}

/**
 * 上下文截断（架构设计 1.4）
 * 保留最近 maxTurns 轮，且总字符数不超过 maxTokens（粗略估算）。
 */
export function truncateContext(turns = [], maxTurns = ENV.MAX_CONTEXT_TURNS, maxTokens = ENV.MAX_CONTEXT_TOKENS) {
  const recent = turns.slice(-maxTurns);
  let total = 0;
  const out = [];
  for (let i = recent.length - 1; i >= 0; i -= 1) {
    const len = (recent[i].content || '').length;
    if (total + len > maxTokens) break;
    out.unshift(recent[i]);
    total += len;
  }
  return out;
}

/**
 * 调用大模型（云端模式由 services/cloud 实现；此处为 Mock 规则判定）
 * Mock 下直接复用合规过滤 + 简单打分，return null 表示未真正调用模型。
 */
async function callLLM({ system, user }) {
  if (ENV.USE_MOCK) {
    // Mock 审核：基于合规过滤结果 + 正则启发式打分
    const text = `${system || ''}\n${user || ''}`;
    const filter = complianceFilter(text);
    if (filter.level === 'block') return { aiResult: 'block', riskLevel: 'high', reason: filter.reason, confidence: 0.95 };
    if (filter.level === 'review') return { aiResult: 'review', riskLevel: 'medium', reason: filter.reason, confidence: 0.6 };
    return { aiResult: 'pass', riskLevel: 'low', reason: '内容未发现风险', confidence: 0.9 };
  }
  // 云端模式：调用 ai-gateway（密钥不落地前端）
  // 由 services/cloud.aiReview 实现，此处不重复。返回 null 交由云端分支。
  return null;
}

/** 后处理：追加免责声明 */
export function postProcess(answer = '') {
  if (!answer) return answer;
  return `${answer.trim()}\n\n${QA_DISCLAIMER}`;
}

/**
 * 文本审核主入口（D1/D2）——供发帖/编辑/会话触发
 * @param {{targetType:string, targetId:string, text:string}} params
 * @returns {Promise<{code:number, data:{aiResult, riskLevel, reason, confidence, report?}}>}
 */
export async function reviewText({ targetType, targetId, text }) {
  const filter = complianceFilter(text);
  if (filter.level === 'block') {
    return ok({ aiResult: 'block', riskLevel: 'high', reason: filter.reason, confidence: 0.95, report: true });
  }
  if (filter.level === 'review') {
    return ok({ aiResult: 'review', riskLevel: 'medium', reason: filter.reason, confidence: 0.6 });
  }
  const llm = await callLLM({ system: '', user: text });
  const res = llm || { aiResult: 'pass', riskLevel: 'low', reason: '内容未发现风险', confidence: 0.9 };
  return ok(res);
}

/**
 * 图片审核占位（TODO：接入内容安全 API）
 * 免密钥大模型大概率不支持图片识别，本期标注待接入微信 imgSecCheck / 云厂商内容安全。
 * @param {string[]} images
 * @returns {Promise<{code:number, data:{aiResult, riskLevel, reason}}>}
 */
export async function reviewImages(images = []) {
  // TODO: 接入内容安全 API（微信 imgSecCheck / 云厂商）。本期默认放行并打标。
  return ok({ aiResult: 'pass', riskLevel: 'low', reason: '图片审核待接入内容安全 API（TODO）', pendingApi: true });
}

/**
 * 生成摘要与标签（D3，占位）
 * Mock 下基于文本简单抽取；云端模式调 ai-gateway。
 */
export async function generateSummary(text = '') {
  if (ENV.USE_MOCK) {
    const clean = String(text || '').replace(/\s+/g, ' ').trim();
    const summary = clean.slice(0, 40) + (clean.length > 40 ? '…' : '');
    const tags = [];
    if (clean.includes('猫')) tags.push('猫');
    if (clean.includes('狗')) tags.push('狗');
    if (clean.includes('疫苗')) tags.push('已疫苗');
    if (clean.includes('绝育')) tags.push('已绝育');
    if (clean.includes('温顺')) tags.push('温顺');
    return ok({ summary: summary || '暂无摘要', tags: tags.slice(0, 5) });
  }
  // 云端：由 services/cloud.aiSummary 实现
  return ok({ summary: '', tags: [] });
}

/**
 * AI 科普问答（B3，基础版）
 * 受日配额与合规过滤约束（US-10）。云端模式经 ai-gateway 调用。
 * @param {{userId:string, sessionId:string, question:string}} params
 */
export async function chat({ userId, question }) {
  if (!enforceQuota(userId)) {
    return { code: ERROR_CODE.AI_QUOTA_EXCEEDED, message: '今日 AI 调用次数已达上限（20 次/日）', data: null };
  }
  const filter = complianceFilter(question);
  if (filter.level === 'block') {
    return { code: ERROR_CODE.CONTENT_BLOCKED, message: '内容不合规，已被拦截', data: null };
  }
  if (ENV.USE_MOCK) {
    const answer = mockQaAnswer(question);
    return ok({ answer: postProcess(answer), quotaLeft: quotaLeft(userId), disclaimer: true });
  }
  // 云端：由 services/cloud.aiChat 实现
  return { code: ERROR_CODE.SERVER_ERROR, data: null };
}

/** Mock 问答答案（启发式，仅演示） */
function mockQaAnswer(question = '') {
  const q = String(question);
  if (q.includes('喂食') || q.includes('喂')) return '幼猫建议少量多餐（每日 3-4 次），选择优质猫粮并备足饮水；换粮需 7 天逐步过渡。';
  if (q.includes('疫苗')) return '猫咪 8 周龄起接种猫三联，之后每年加强；接种后观察 30 分钟有无过敏反应。';
  if (q.includes('绝育')) return '绝育可降低生殖疾病与走失风险，建议 6 月龄后由专业兽医评估手术。';
  if (q.includes('领养')) return '领养前请确认自身时间与经济能力，优先选择健康、已疫苗、性格匹配的宠物，并签订领养协议。';
  return '这是一个演示用的 AI 科普助手（Mock）。接入云端后将由免密钥大模型提供专业养宠建议。';
}

export default {
  genId,
  complianceFilter,
  enforceQuota,
  quotaLeft,
  truncateContext,
  reviewText,
  reviewImages,
  generateSummary,
  chat,
  postProcess,
};
