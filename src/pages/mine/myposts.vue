<template>
  <view class="myposts">
    <view v-if="postStore.loading" class="loading"><u-loading-icon /></view>
    <empty-state v-else-if="postStore.myPosts.length === 0" text="还没有发布帖子" icon="file-text">
      <u-button size="mini" type="primary" text="去发布" @click="goPublish" />
    </empty-state>
    <view v-else class="list">
      <post-card
        v-for="post in postStore.myPosts"
        :key="post._id"
        :post="post"
        @click="goDetail"
      />
    </view>
  </view>
</template>

<script setup>
import { onShow } from '@dcloudio/uni-app';
import { usePostStore } from '@/store/post';
import PostCard from '@/components/post-card.vue';
import EmptyState from '@/components/empty-state.vue';

const postStore = usePostStore();
function goPublish() {
  uni.navigateTo({ url: '/pages/publish/index' });
}
function goDetail(post) {
  uni.navigateTo({ url: `/pages/adopt/detail?id=${post._id}` });
}
onShow(() => postStore.fetchMyPosts());
</script>

<style scoped lang="scss">
.myposts {
  min-height: 100vh;
  background: #f5f6f8;
  padding: 16rpx;
  .loading { padding: 60rpx; display: flex; justify-content: center; }
  .list { display: grid; grid-template-columns: 1fr 1fr; gap: 16rpx; }
}
</style>
