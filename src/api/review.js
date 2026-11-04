/**
 * 审核结果查询 API 门面（架构设计 src/api/review.js）
 * 运营端 / 用户查看审核记录（human-review 为运营决策入口）。
 */
import { services } from '@/services';

export const getReviewRecords = (targetType, targetId) =>
  services.review.records(targetType, targetId);
