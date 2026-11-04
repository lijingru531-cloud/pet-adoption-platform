<template>
  <view class="favorites">
    <view v-if="postStore.loading" class="loading"><u-loading-icon /></view>
    <empty-state v-else-if="postStore.myFavorites.length === 0" text="还没有收藏的帖子" icon="star" />
    <view v-else class="list">
      <post-card
        v-for="post in postStore.myFavorites"
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
function goDetail(post) {
  uni.navigateTo({ url: `/pages/adopt/detail?id=${post._id}` });
}
onShow(() => postStore.fetchMyFavorites());
</script>

<style scoped lang="scss">
.favorites {
  min-height: 100vh;
  background: #f5f6f8;
  padding: 16rpx;
  .loading { padding: 60rpx; display: flex; justify-content: center; }
  .list { display: grid; grid-template-columns: 1fr 1fr; gap: 16rpx; }
}
</style>
