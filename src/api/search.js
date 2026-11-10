/**
 * 全局统一搜索 API 门面（Sprint3：跨模块关键词检索）
 *
 * 同时检索领养帖与科普帖，合并返回结果。
 * 底层由 services.search（mock/cloud）统一实现。
 */
import { services } from '@/services';

/**
 * 全局统一搜索
 * @param {{keyword:string, page?:number, pageSize?:number}} params
 * @returns {{code:number, data:{list:Array, total:number, page:number, pageSize:number, postTotal:number, scienceTotal:number}}}
 *   - list: 合并后的统一结果列表，每项带 _type 标识 ('post' | 'science')
 *   - postTotal: 命中的领养帖数量
 *   - scienceTotal: 命中的科普帖数量
 */
export const globalSearch = (params = {}) => services.search(params);
