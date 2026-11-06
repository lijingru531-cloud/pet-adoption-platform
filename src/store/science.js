/**
 * 科普帖状态管理（架构设计 src/store/science.js）
 * 列表 / 分类筛选 / 关键词 / 标签筛选 / 详情缓存 / 发布。
 * 复用领养帖 store 的约定（loading / submitting / 分页 append）。
 */
import { defineStore } from 'pinia';
import {
  listSciencePosts,
  getScienceDetail,
  createSciencePost,
  listScienceTags,
} from '@/api/science';

export const useScienceStore = defineStore('science', {
  state: () => ({
    list: [],
    total: 0,
    page: 1,
    pageSize: 10,
    filter: {}, // { category }
    keyword: '',
    tag: '',
    tags: [], // 热门标签聚合（筛选用）
    detail: null,
    loading: false,
    submitting: false,
  }),
  getters: {
    /** 是否还有更多（分页） */
    hasMore: (s) => s.list.length < s.total,
    /** 当前选中分类（用于 UI 高亮） */
    activeCategory: (s) => (s.filter && s.filter.category) || '',
  },
  actions: {
    /** 拉取列表（分类筛选 + 关键词 + 标签 + 分页） */
    async fetchList({ page = 1, append = false } = {}) {
      this.loading = true;
      const res = await listSciencePosts({
        filter: this.filter,
        keyword: this.keyword,
        tag: this.tag,
        page,
      });
      this.loading = false;
      if (res.code === 0) {
        const { list, total } = res.data;
        this.total = total;
        this.page = page;
        this.list = append ? [...this.list, ...list] : list;
      }
      return res;
    },

    /** 拉取热门标签 */
    async fetchTags() {
      const res = await listScienceTags();
      if (res.code === 0) this.tags = res.data;
      return res;
    },

    setFilter(filter) {
      this.filter = { ...this.filter, ...filter };
    },
    resetFilter() {
      this.filter = {};
      this.keyword = '';
      this.tag = '';
    },
    setKeyword(kw) {
      this.keyword = kw;
    },
    setTag(t) {
      this.tag = t;
    },

    async fetchDetail(id) {
      const res = await getScienceDetail(id);
      if (res.code === 0) this.detail = res.data;
      return res;
    },

    async create(payload) {
      this.submitting = true;
      const res = await createSciencePost(payload);
      this.submitting = false;
      return res;
    },
  },
});
