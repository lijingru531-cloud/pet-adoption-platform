/**
 * AI 审核提示词与规则（集中管理，架构设计 8.4）
 * 前端仅持有规则与提示词；实际模型调用统一经 ai-gateway（密钥由平台托管）。
 */

/** 极端敏感词库（命中即 block + 上报，架构设计 5.4 / Q5） */
export const EXTREME_SENSITIVE = [
  '狗肉',
  '猫肉',
  '吃猫',
  '吃狗',
  '食用猫',
  '食用狗',
  '宰杀猫',
  '宰杀狗',
  '猫狗肉',
  '活体屠宰',
];

/** 普通敏感词库（命中即打标转人工 review） */
export const SENSITIVE_WORDS = [
  '加微信',
  '转账',
  '付款',
  '定金',
  '押金',
  '代购',
  '微商',
  '兼职',
  '刷单',
  '贷款',
  '赌博',
  '色情',
  '现金交易',
  '售价',
  '出售宠物',
];

/**
 * 审核系统提示词
 * 要求模型输出 JSON：{ aiResult: 'pass'|'block'|'review', riskLevel, reason, confidence }
 */
export const REVIEW_SYSTEM_PROMPT = `你是「幸运锦鲤宠物领养平台」的 AI 内容审核员。
职责：审领养帖/会话/科普内容，识别广告引流、违规、重复、敏感信息。
规则：
1. 涉及食用猫狗、活体屠宰等极端敏感内容，判定为 block 并标记上报。
2. 含金钱交易、外部引流、疑似诈骗，判定为 block 或 review。
3. 无法确认但疑似违规，判定为 review（转人工，宁可误判为人审）。
4. 正常领养信息判定为 pass。
仅输出 JSON：{"aiResult":"pass|block|review","riskLevel":"low|medium|high","reason":"简短中文理由","confidence":0-1}`;

/**
 * 风险分级说明（供前端展示/人工复核参考）
 */
export const RISK_GRADING = {
  high: '高风险：自动拦截并上报',
  medium: '疑似：转人工复核队列',
  low: '低风险：通过',
};
