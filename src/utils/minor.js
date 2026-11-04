/**
 * 未成年校验工具（占位实现，详见架构设计 9.4 / Q5）
 *
 * 真实生产应接入「身份证 OCR / 第三方实名（微信实名）」，
 * 并校验 ageVerified。本期仅做基于出生日期的年龄判断占位。
 */

const ADULT_AGE = 18;

/**
 * 根据出生日期判断是否为未成年
 * @param {string|number|Date} birthday 出生日期
 * @returns {{ isMinor: boolean, age: number }}
 */
export function checkMinor(birthday) {
  if (!birthday) {
    return { isMinor: true, age: 0 }; // 未校验默认按未成年限制（MINOR_RESTRICT=true）
  }
  const b = new Date(birthday);
  if (Number.isNaN(b.getTime())) return { isMinor: true, age: 0 };
  const now = new Date();
  let age = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age -= 1;
  return { isMinor: age < ADULT_AGE, age };
}

/**
 * 是否允许发布领养帖 / 作为领养人
 * @param {object} user 当前用户
 * @param {boolean} minorRestrict 全局开关
 */
export function canPublishOrAdopt(user, minorRestrict = true) {
  if (!minorRestrict) return true;
  if (!user) return false;
  if (user.ageVerified) return true; // 已实名通过
  const r = checkMinor(user.birthday);
  return !r.isMinor;
}
