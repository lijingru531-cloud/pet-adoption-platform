<template>
  <view class="adopt-list">
    <filter-bar :filter="postStore.filter" @change="onFilterChange" />
    <view class="list">
      <view v-if="postStore.loading" class="loading"><u-loading-icon /></view>
      <empty-state
        v-else-if="postStore.list.length === 0"
        text="没有符合条件的宠物"
        icon="search"
      >
        <u-button size="mini" text="重置筛选" @click="reset" />
      </empty-state>
      <post-card
        v-for="post in postStore.list"
        v-else
        :key="post._id"
        :post="post"
        @click="goDetail"
      />
    </view>
    <u-loadmore v-if="postStore.list.length > 0" :status="loadStatus" @loadmore="loadMore" />
  </view>
</template>

<script setup>
import { onShow, onReachBottom } from '@dcloudio/uni-app';
import { computed } from 'vue';
import { usePostStore } from '@/store/post';
import FilterBar from '@/components/filter-bar.vue';
import PostCard from '@/components/post-card.vue';
import EmptyState from '@/components/empty-state.vue';

const postStore = usePostStore();

const loadStatus = computed(() =>
  postStore.list.length >= postStore.total ? 'nomore' : 'loadmore'
);

function onFilterChange(filter) {
  postStore.setFilter(filter);
  postStore.fetchList({ page: 1 });
}
function reset() {
  postStore.resetFilter();
  postStore.fetchList({ page: 1 });
}
function goDetail(post) {
  uni.navigateTo({ url: `/pages/adopt/detail?id=${post._id}` });
}
function loadMore() {
  if (postStore.list.length < postStore.total) {
    postStore.fetchList({ page: postStore.page + 1, append: true });
  }
}

onShow(() => {
  postStore.fetchList({ page: 1 });
});
onReachBottom(() => loadMore());
</script>

<style scoped lang="scss">
.adopt-list {
  min-height: 100vh;
  background: #f5f6f8;
  padding-bottom: 30rpx;
  .list {
    padding: 16rpx;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16rpx;
  }
  .loading { padding: 60rpx; display: flex; justify-content: center; }
}
</style>
