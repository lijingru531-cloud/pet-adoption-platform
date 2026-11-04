/**
 * 举报与复核 API 门面（架构设计 src/api/report.js）
 */
import { services } from '@/services';

export const createReport = (params) => services.report.create(params);
export const listReports = () => services.report.list();
export const decideReport = (reportId, decision) => services.report.decide({ reportId, decision });
