/**
 * 会话与消息 API 门面（架构设计 src/api/conversation.js）
 */
import { services } from '@/services';

export const createConversation = (postId) => services.conversation.create({ postId });
export const listConversations = () => services.conversation.list();
export const getConversation = (conversationId) => services.conversation.detail(conversationId);
export const listMessages = (conversationId) => services.conversation.messages(conversationId);
export const sendMessage = (params) => services.conversation.sendMessage(params);
export const decideConversation = (conversationId, action) =>
  services.conversation.decide({ conversationId, action });
