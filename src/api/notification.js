/**
 * 消息中心 API 门面（架构设计 src/api/notification.js）
 */
import { services } from '@/services';

export const listNotifications = () => services.notification.list();
export const getUnreadCount = () => services.notification.unreadCount();
export const markRead = (id) => services.notification.markRead(id);
