/**
 * 领养帖 API 门面（架构设计 src/api/post.js）
 */
import { services } from '@/services';

export const createPost = (payload) => services.post.create(payload);
export const listPosts = (params) => services.post.list(params);
export const getPostDetail = (postId) => services.post.detail(postId);
export const changePostStatus = (postId, status) => services.post.changeStatus(postId, status);
export const toggleFavorite = (postId) => services.post.toggleFavorite(postId);
export const getMyPosts = () => services.post.myPosts();
export const getMyFavorites = () => services.post.myFavorites();
