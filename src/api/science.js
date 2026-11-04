/**
 * 科普模块 API 门面（架构设计 src/api/science.js）
 *
 * ⚠️ 科普模块属 Sprint 2（P1），本期不实现业务代码；此处仅预留接口占位，
 * 待 Sprint 2 接入 science-post 云函数时填充实现。
 */
import { services } from '@/services';

export const listSciencePosts = () => Promise.resolve({ code: 0, data: [], message: '科普模块将于 Sprint 2 上线' });
export const createSciencePost = () => Promise.resolve({ code: 0, data: null, message: '敬请期待' });
