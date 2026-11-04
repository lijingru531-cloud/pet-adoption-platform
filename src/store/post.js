/**
 * 领养帖状态管理（架构设计 src/store/post.js）
 * 列表 / 筛选 / 详情缓存 / 收藏。
 */
import { defineStore } from 'pinia';
import {
  listPosts,
  getPostDetail,
  createPost,
  changePostStatus,
  toggleFavorite,
  getMyPosts,
  getMyFavorites,
} from '@/api/post';

export const usePostStore = defineStore('post', {
  state: () => ({
    list: [],
    total: 0,
    page: 1,
    pageSize: 10,
    filter: {},
    keyword: '',
    detail: null,
    myPosts: [],
    myFavorites: [],
    loading: false,
    submitting: false,
  }),
  actions: {
    /** 拉取列表（支持筛选 + 关键词 + 分页） */
    async fetchList({ page = 1, append = false } = {}) {
      this.loading = true;
      const res = await listPosts({ filter: this.filter, keyword: this.keyword, page });
      this.loading = false;
      if (res.code === 0) {
        const { list, total } = res.data;
        this.total = total;
        this.page = page;
        this.list = append ? [...this.list, ...list] : list;
      }
      return res;
    },

    setFilter(filter) {
      this.filter = { ...this.filter, ...filter };
    },
    resetFilter() {
      this.filter = {};
      this.keyword = '';
    },
    setKeyword(kw) {
      this.keyword = kw;
    },

    async fetchDetail(postId) {
      const res = await getPostDetail(postId);
      if (res.code === 0) this.detail = res.data;
      return res;
    },

    async create(payload) {
      this.submitting = true;
      const res = await createPost(payload);
      this.submitting = false;
      return res;
    },

    async changeStatus(postId, status) {
      return changePostStatus(postId, status);
    },

    async favorite(postId) {
      return toggleFavorite(postId);
    },

    async fetchMyPosts() {
      const res = await getMyPosts();
      if (res.code === 0) this.myPosts = res.data;
      return res;
    },

    async fetchMyFavorites() {
      const res = await getMyFavorites();
      if (res.code === 0) this.myFavorites = res.data;
      return res;
    },
  },
});
