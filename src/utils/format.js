/**
 * 通用格式化工具
 */
import dayjs from 'dayjs';

/** 相对时间：刚刚 / x分钟前 / x小时前 / x天前 / 日期 */
export function fromNow(ts) {
  if (!ts) return '';
  const d = dayjs(ts);
  const diffMin = dayjs().diff(d, 'minute');
  if (diffMin < 1) return '刚刚';
  if (diffMin < 60) return `${diffMin}分钟前`;
  const diffHour = dayjs().diff(d, 'hour');
  if (diffHour < 24) return `${diffHour}小时前`;
  const diffDay = dayjs().diff(d, 'day');
  if (diffDay < 7) return `${diffDay}天前`;
  return d.format('YYYY-MM-DD');
}

/** 标准日期时间 */
export function formatDateTime(ts) {
  if (!ts) return '';
  return dayjs(ts).format('YYYY-MM-DD HH:mm');
}

/** 年龄数值 -> 友好文案（月/岁） */
export function formatAge(ageInMonth) {
  if (ageInMonth == null) return '未知';
  if (ageInMonth < 12) return `${ageInMonth} 个月`;
  const years = Math.floor(ageInMonth / 12);
  const months = ageInMonth % 12;
  return months > 0 ? `${years} 岁 ${months} 个月` : `${years} 岁`;
}

/** 位置对象 -> 文案（仅到城市/区，不暴露街道级精确位置） */
export function formatLocation(location) {
  if (!location) return '未知';
  const parts = [location.city, location.district].filter(Boolean);
  return parts.join(' · ') || '未知';
}

/** 列表首字母/封面占位 */
export function firstPhoto(photos) {
  if (Array.isArray(photos) && photos.length > 0) return photos[0];
  return '';
}
