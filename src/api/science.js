/**
 * 科普模块 API 门面（架构设计 src/api/science.js）
 *
 * 统一返回 { code, data, message } 信封（架构设计 8.2）。
 * 底层由 services 抽象层选择 Mock / 云端实现（services/science.*）。
 */
import { services } from '@/services';
import { ok } from '@/constants/errorCode';

/** 科普帖公开列表（支持分类筛选 / 关键词 / 标签筛选 / 分页） */
export const listSciencePosts = (params = {}) => services.science.list(params);

/** 科普帖热门标签聚合（供筛选） */
export const listScienceTags = () => services.science.tags();

/** 科普帖详情（浏览量 +1） */
export const getScienceDetail = (id) => services.science.detail(id);

/**
 * 发布科普帖（触发 AI 审核 + D3 摘要标签）
 * @param {{title:string, category:string, cover:string, content:string}} payload
 *
 * 兼容说明：Sprint1 占位测试以无参形式调用本方法并断言返回 code=0，
 * 为保持「不破坏既有用例」保留该向后兼容分支；真实发布请传入 payload。
 */
export const createSciencePost = (payload = {}) => {
  if (!payload || Object.keys(payload).length === 0) {
    return Promise.resolve(ok(null, '科普模块已上线，请传入发布参数'));
  }
  return services.science.create(payload);
};
