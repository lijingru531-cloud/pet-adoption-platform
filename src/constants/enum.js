/**
 * 业务枚举（架构设计 3.2 + 8.4）
 * 集合字段使用 camelCase，状态值使用 snake_case 字符串常量。
 */

/** 帖子状态机：待领养/已预定/已领养/撤下/重新上架(回到待领养) */
export const POST_STATUS = {
  PENDING: 'pending', // 审核中
  ADOPTABLE: 'adoptable', // 待领养（公开可见）
  RESERVED: 'reserved', // 已预定
  ADOPTED: 'adopted', // 已领养
  TAKEN_DOWN: 'taken_down', // 已撤下/下架
};

export const POST_STATUS_LABEL = {
  [POST_STATUS.PENDING]: '审核中',
  [POST_STATUS.ADOPTABLE]: '待领养',
  [POST_STATUS.RESERVED]: '已预定',
  [POST_STATUS.ADOPTED]: '已领养',
  [POST_STATUS.TAKEN_DOWN]: '已撤下',
};

/** 帖子审核状态（AI 管理员） */
export const AI_REVIEW_STATUS = {
  PENDING: 'pending',
  PASS: 'pass',
  BLOCKED: 'blocked',
  REVIEW: 'review', // 疑似，转人工
};

export const AI_REVIEW_STATUS_LABEL = {
  [AI_REVIEW_STATUS.PENDING]: '待审核',
  [AI_REVIEW_STATUS.PASS]: '审核通过',
  [AI_REVIEW_STATUS.BLOCKED]: '已拦截',
  [AI_REVIEW_STATUS.REVIEW]: '待人工复核',
};

/** 风险等级 */
export const RISK_LEVEL = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
};

/** 物种 */
export const SPECIES = {
  CAT: 'cat',
  DOG: 'dog',
  OTHER: 'other',
};

export const SPECIES_LABEL = {
  [SPECIES.CAT]: '猫',
  [SPECIES.DOG]: '狗',
  [SPECIES.OTHER]: '其他',
};

/** 性别 */
export const GENDER = {
  MALE: 'male',
  FEMALE: 'female',
  UNKNOWN: 'unknown',
};

export const GENDER_LABEL = {
  [GENDER.MALE]: '公',
  [GENDER.FEMALE]: '母',
  [GENDER.UNKNOWN]: '未知',
};

/** 健康状态（多选，存数组） */
export const HEALTH_STATUS = {
  HEALTHY: 'healthy', // 健康
  VACCINATED: 'vaccinated', // 已疫苗
  NEUTERED: 'neutered', // 已绝育
  DEWORMED: 'dewormed', // 已驱虫
  SICK: 'sick', // 有病/需照顾
};

export const HEALTH_STATUS_LABEL = {
  [HEALTH_STATUS.HEALTHY]: '健康',
  [HEALTH_STATUS.VACCINATED]: '已疫苗',
  [HEALTH_STATUS.NEUTERED]: '已绝育',
  [HEALTH_STATUS.DEWORMED]: '已驱虫',
  [HEALTH_STATUS.SICK]: '需特别照顾',
};

/** 会话状态 */
export const CONVERSATION_STATUS = {
  ACTIVE: 'active',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  CLOSED: 'closed',
};

export const CONVERSATION_STATUS_LABEL = {
  [CONVERSATION_STATUS.ACTIVE]: '沟通中',
  [CONVERSATION_STATUS.ACCEPTED]: '已接受',
  [CONVERSATION_STATUS.REJECTED]: '已拒绝',
  [CONVERSATION_STATUS.CLOSED]: '已关闭',
};

/** 消息类型 */
export const MESSAGE_TYPE = {
  TEXT: 'text',
  IMAGE: 'image',
  CONTACT: 'contact', // 联系方式卡（仅双方可见）
  INTENT: 'intent', // 领养意向卡
  SYSTEM: 'system', // 系统提示（接受/拒绝）
};

/** 举报原因 */
export const REPORT_REASON = {
  AD: 'ad', // 广告
  VIOLATION: 'violation', // 违规
  DUPLICATE: 'duplicate', // 重复
  SENSITIVE: 'sensitive', // 敏感
  OTHER: 'other', // 其他
};

export const REPORT_REASON_LABEL = {
  [REPORT_REASON.AD]: '广告/引流',
  [REPORT_REASON.VIOLATION]: '违规内容',
  [REPORT_REASON.DUPLICATE]: '重复发布',
  [REPORT_REASON.SENSITIVE]: '敏感信息',
  [REPORT_REASON.OTHER]: '其他',
};

/** 举报/审核目标类型 */
export const TARGET_TYPE = {
  POST: 'post',
  USER: 'user',
  SCIENCE: 'science',
  MESSAGE: 'message',
};

/** 通知类型 */
export const NOTIFICATION_TYPE = {
  INTENT: 'intent', // 新领养意向
  ACCEPT: 'accept', // 被接受
  REJECT: 'reject', // 被拒绝
  REPORT: 'report', // 举报结果
  APPEAL: 'appeal', // 申诉结果
  SYSTEM: 'system', // 系统消息
};

export const NOTIFICATION_TYPE_LABEL = {
  [NOTIFICATION_TYPE.INTENT]: '领养意向',
  [NOTIFICATION_TYPE.ACCEPT]: '领养结果',
  [NOTIFICATION_TYPE.REJECT]: '领养结果',
  [NOTIFICATION_TYPE.REPORT]: '举报反馈',
  [NOTIFICATION_TYPE.APPEAL]: '申诉反馈',
  [NOTIFICATION_TYPE.SYSTEM]: '系统通知',
};

/** 用户角色 */
export const USER_ROLE = {
  USER: 'user',
  OPERATOR: 'operator',
  ADMIN: 'admin',
};

/** 端标识 */
export const PLATFORM = {
  MP: 'MP',
  H5: 'H5',
  APP: 'APP',
};

/** 科普帖分类（B1/B2，架构设计 3.2） */
export const SCIENCE_CATEGORY = {
  FEEDING: 'feeding', // 喂养
  HEALTH: 'health', // 健康医疗
  BEHAVIOR: 'behavior', // 行为训练
  ADOPTION: 'adoption', // 领养须知
  OTHER: 'other', // 其他
};

export const SCIENCE_CATEGORY_LABEL = {
  [SCIENCE_CATEGORY.FEEDING]: '喂养',
  [SCIENCE_CATEGORY.HEALTH]: '健康医疗',
  [SCIENCE_CATEGORY.BEHAVIOR]: '行为训练',
  [SCIENCE_CATEGORY.ADOPTION]: '领养须知',
  [SCIENCE_CATEGORY.OTHER]: '其他',
};

/** 科普帖 AI 审核状态（沿用 AI 管理员语义，架构设计 3.2 / D1） */
export const SCIENCE_REVIEW_STATUS = {
  PENDING: 'pending', // 审核中
  PASS: 'pass', // 通过（公开可见）
  BLOCKED: 'blocked', // 已拦截
  REVIEW: 'review', // 疑似，转人工
};

export const SCIENCE_REVIEW_STATUS_LABEL = {
  [SCIENCE_REVIEW_STATUS.PENDING]: '审核中',
  [SCIENCE_REVIEW_STATUS.PASS]: '已发布',
  [SCIENCE_REVIEW_STATUS.BLOCKED]: '已拦截',
  [SCIENCE_REVIEW_STATUS.REVIEW]: '待人工复核',
};
