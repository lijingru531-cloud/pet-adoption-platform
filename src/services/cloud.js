/**
 * 云端后端实现（WorkBuddy cloud-service）
 *
 * 接口契约与架构设计 3.3 保持一致；通过 utils/request.js 调用云函数。
 * 仅在 ENV.USE_MOCK=false 时被启用。本环境可能无云端连接，故为「清晰接口占位」，
 * 上线前只需保证云函数端实现对应函数名/参数即可无缝切换。
 *
 * 统一请求/响应：{ code, data, message }（request 已归一）。
 */
import request from '@/utils/request';

/** 便捷封装：调用云函数并透传响应 */
function call(fn, data = {}, opts = {}) {
  return request({ url: fn, data, ...opts });
}

const cloudBackend = {
  auth: {
    login: (p) => call('auth-login', p),
    bindMobile: (p) => call('auth-bindMobile', p),
    getProfile: () => call('auth-profile', {}, { auth: true }),
    updateProfile: (patch) => call('auth-update', patch),
  },
  post: {
    create: (payload) => call('post-create', payload),
    list: (p) => call('post-list', p),
    detail: (postId) => call('post-detail', { postId }),
    changeStatus: (postId, status) => call('post-update-status', { postId, status }),
    toggleFavorite: (postId) => call('post-favorite', { postId }),
    myPosts: () => call('post-mine', {}),
    myFavorites: () => call('post-favorites', {}),
  },
  conversation: {
    create: (p) => call('conversation-create', p),
    list: () => call('conversation-list', {}),
    detail: (conversationId) => call('conversation-detail', { conversationId }),
    messages: (conversationId) => call('message-list', { conversationId }),
    sendMessage: (p) => call('message-send', p),
    decide: (p) => call('conversation-decide', p),
  },
  notification: {
    list: () => call('notification-list', {}),
    unreadCount: () => call('notification-unread', {}),
    markRead: (id) => call('notification-read', { id }),
  },
  report: {
    create: (p) => call('report-create', p),
    list: () => call('report-list', {}),
    decide: (p) => call('human-review', p),
  },
  review: {
    records: (targetType, targetId) => call('review-records', { targetType, targetId }),
  },
  science: {
    create: (payload) => call('science-create', payload),
    list: (p) => call('science-list', p),
    detail: (id) => call('science-detail', { id }),
    tags: () => call('science-tags', {}),
  },
  // 全局统一搜索（Sprint3）
  search: (p) => call('search-global', p),
  imageReview: (images = []) => call('image-review', { images }),
  ai: {
    // 真实大模型调用统一走云端 ai-chat（ai-gateway 封装免密钥 LLM）
    chat: (p) => call('ai-chat', p),
  },
};

export default cloudBackend;
