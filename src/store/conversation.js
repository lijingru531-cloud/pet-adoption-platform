/**
 * 会话与消息状态管理（架构设计 src/store/conversation.js）
 * 会话列表 / 当前会话 / 消息；轮询刷新由页面控制。
 */
import { defineStore } from 'pinia';
import {
  createConversation,
  listConversations,
  getConversation,
  listMessages,
  sendMessage,
  decideConversation,
} from '@/api/conversation';

export const useConversationStore = defineStore('conversation', {
  state: () => ({
    list: [],
    current: null,
    messages: [],
    loading: false,
    sending: false,
  }),
  actions: {
    async fetchList() {
      this.loading = true;
      const res = await listConversations();
      this.loading = false;
      if (res.code === 0) this.list = res.data;
      return res;
    },

    async fetchDetail(conversationId) {
      const res = await getConversation(conversationId);
      if (res.code === 0) this.current = res.data;
      return res;
    },

    async fetchMessages(conversationId) {
      const res = await listMessages(conversationId);
      if (res.code === 0) this.messages = res.data;
      return res;
    },

    /** 发起领养意向会话 */
    async create(postId) {
      return createConversation(postId);
    },

    async send(params) {
      this.sending = true;
      const res = await sendMessage(params);
      this.sending = false;
      if (res.code === 0) this.messages = [...this.messages, res.data.message];
      return res;
    },

    /** 发帖人接受 / 拒绝 */
    async decide(conversationId, action) {
      return decideConversation(conversationId, action);
    },
  },
});
