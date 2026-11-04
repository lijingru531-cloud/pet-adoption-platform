/**
 * 登录与账号 API 门面（架构设计 src/api/auth.js）
 * 页面与 store 通过本模块访问登录/绑定/资料能力，不直接依赖 services 实现。
 */
import { services } from '@/services';

export const login = (params) => services.auth.login(params);
export const bindMobile = (params) => services.auth.bindMobile(params);
export const getProfile = () => services.auth.getProfile();
export const updateProfile = (patch) => services.auth.updateProfile(patch);
