<template>
  <view class="home">
    <!-- 顶部搜索 -->
    <view class="search-bar">
      <u-search
        v-model="keyword"
        placeholder="搜索品种 / 城市 / 关键词"
        :show-action="true"
        action-text="搜索"
        @search="onSearch"
        @custom="onSearch"
      />
    </view>

    <!-- Banner -->
    <view class="banner">
      <u-icon name="shield" color="#fff" size="36" />
      <text class="banner-text">AI 管理员 7×24 守护社区安全 · 零金钱交易</text>
    </view>

    <!-- 快捷入口 -->
    <view class="quick">
      <view class="quick-item" @click="goAdopt">
        <u-icon name="gift" color="#2979ff" size="44" />
        <text>领养</text>
      </view>
      <view class="quick-item" @click="goScience">
        <u-icon name="book" color="#19be6b" size="44" />
        <text>科普</text>
      </view>
      <view class="quick-item disabled">
        <u-icon name="map" color="#c0c4cc" size="44" />
        <text>寻宠(即将上线)</text>
      </view>
    </view>

    <!-- 为你推荐 -->
    <view class="section-title">
      <text>为你推荐</text>
    </view>
    <view v-if="postStore.loading" class="loading"><u-loading-icon /></view>
    <empty-state v-else-if="postStore.list.length === 0" text="暂无待领养宠物，换个筛选试试" />
    <view v-else class="waterfall">
      <post-card
        v-for="post in postStore.list"
        :key="post._id"
        :post="post"
        @click="goDetail"
      />
    </view>
  </view>
</template>

<script setup>
import { onShow } from '@dcloudio/uni-app';
import { ref } from 'vue';
import { usePostStore } from '@/store/post';
import PostCard from '@/components/post-card.vue';
import EmptyState from '@/components/empty-state.vue';

const postStore = usePostStore();
const keyword = ref('');

function onSearch() {
  postStore.setKeyword(keyword.value);
  postStore.fetchList({ page: 1 });
}
function goAdopt() {
  uni.switchTab({ url: '/pages/adopt/list' });
}
function goScience() {
  uni.switchTab({ url: '/pages/science/list' });
}
function goDetail(post) {
  uni.navigateTo({ url: `/pages/adopt/detail?id=${post._id}` });
}

onShow(() => {
  postStore.fetchList({ page: 1 });
});
</script>

<style scoped lang="scss">
.home {
  min-height: 100vh;
  background: #f5f6f8;
  padding-bottom: 30rpx;
  .search-bar { padding: 20rpx 24rpx; background: #2979ff; }
  .banner {
    display: flex;
    align-items: center;
    gap: 12rpx;
    padding: 18rpx 24rpx;
    background: linear-gradient(135deg, #2979ff, #19be6b);
    color: #fff;
    .banner-text { font-size: 24rpx; }
  }
  .quick {
    display: flex;
    padding: 24rpx;
    gap: 20rpx;
    .quick-item {
      flex: 1;
      background: #fff;
      border-radius: 16rpx;
      padding: 24rpx 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10rpx;
      font-size: 24rpx;
      color: #303133;
      &.disabled { opacity: 0.6; }
    }
  }
  .section-title {
    padding: 10rpx 24rpx;
    font-size: 30rpx;
    font-weight: 600;
    color: #303133;
  }
  .waterfall {
    padding: 0 16rpx;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16rpx;
  }
  .loading { padding: 60rpx; display: flex; justify-content: center; }
}
</style>
