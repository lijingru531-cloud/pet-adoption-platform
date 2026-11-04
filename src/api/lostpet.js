/**
 * 寻宠模块 API 门面（架构设计 src/api/lostpet.js）
 *
 * ⚠️ 寻宠模块属 Sprint 4（P2），本期不实现业务代码；此处仅预留接口占位。
 * 地图能力本期不做（街道级模糊预留）。
 */
export const createLostPetMark = () =>
  Promise.resolve({ code: 0, data: null, message: '寻宠地图将于 Sprint 4 上线' });
export const listNearbyLostPet = () =>
  Promise.resolve({ code: 0, data: [], message: '敬请期待' });
