<template>
  <view class="science-list">
    <!-- 搜索 -->
    <view class="search-bar">
      <u-search
        v-model="keyword"
        placeholder="搜索科普标题 / 内容 / 标签"
        :show-action="true"
        action-text="搜索"
        @search="onSearch"
        @custom="onSearch"
      />
    </view>

    <!-- 分类 Tabs -->
    <u-tabs :list="tabs" :current="currentIndex" @click="onTab" line-color="#19be6b" />

    <!-- 标签筛选 -->
    <scroll-view v-if="scienceStore.tags.length" class="tag-bar" scroll-x>
      <view class="tag-row">
        <text
          class="tag-chip"
          :class="{ active: !scienceStore.tag }"
          @click="onTag('')"
        >全部</text>
        <text
          v-for="t in scienceStore.tags"
          :key="t.tag"
          class="tag-chip"
          :class="{ active: scienceStore.tag === t.tag }"
          @click="onTag(t.tag)"
        >{{ t.tag }}</text>
      </view>
    </scroll-view>

    <!-- 列表 -->
    <view class="list">
      <view v-if="scienceStore.loading" class="loading"><u-loading-icon /></view>
      <empty-state
        v-else-if="scienceStore.list.length === 0"
        text="没有符合条件的科普帖"
        icon="book"
      >
        <u-button size="mini" text="重置筛选" @click="reset" />
      </empty-state>
      <science-card
        v-for="item in scienceStore.list"
        v-else
        :key="item._id"
        :post="item"
        @click="openDetail"
        @tag="onTag"
      />
    </view>

    <u-loadmore v-if="scienceStore.list.length > 0" :status="loadStatus" @loadmore="loadMore" />

    <!-- 进入 AI 问答 -->
    <view class="fab" @click="goChat">
      <u-icon name="chat" color="#fff" size="40" />
    </view>

    <!-- 详情弹层 -->
    <u-popup :show="detailShow" mode="bottom" :round="16" @close="detailShow = false">
      <view v-if="scienceStore.detail" class="detail">
        <image class="detail-cover" :src="scienceStore.detail.cover" mode="aspectFill" />
        <view class="detail-body">
          <view class="detail-head">
            <text class="detail-title">{{ scienceStore.detail.title }}</text>
            <text class="detail-cat">{{ categoryLabel }}</text>
          </view>
          <view class="detail-meta">
            <text>{{ authorName }}</text>
            <text>{{ scienceStore.detail.views || 0 }} 浏览</text>
          </view>
          <view class="detail-content">{{ scienceStore.detail.content }}</view>
          <view class="detail-tags">
            <text
              v-for="t in scienceStore.detail.tags"
              :key="t"
              class="tag"
              @click="onTag(t)"
            >{{ t }}</text>
          </view>
        </view>
      </view>
    </u-popup>
  </view>
</template>

<script setup>
import { onShow, onReachBottom } from '@dcloudio/uni-app';
import { ref, computed } from 'vue';
import { useScienceStore } from '@/store/science';
import { SCIENCE_CATEGORY_LABEL } from '@/constants/enum';
import ScienceCard from '@/components/science-card.vue';
import EmptyState from '@/components/empty-state.vue';

const scienceStore = useScienceStore();
const keyword = ref('');
const detailShow = ref(false);
const currentIndex = ref(0);

const tabs = [
  { name: '全部', value: '' },
  ...Object.keys(SCIENCE_CATEGORY_LABEL).map((k) => ({ name: SCIENCE_CATEGORY_LABEL[k], value: k })),
];

const loadStatus = computed(() => (scienceStore.hasMore ? 'loadmore' : 'nomore'));
const categoryLabel = computed(() =>
  SCIENCE_CATEGORY_LABEL[scienceStore.detail && scienceStore.detail.category] || '科普'
);
const authorName = computed(() => {
  const a = scienceStore.detail && scienceStore.detail.author;
  return (a && a.nickname) || '匿名作者';
});

function onSearch() {
  scienceStore.setKeyword(keyword.value);
  scienceStore.fetchList({ page: 1 });
}
function onTab(item) {
  currentIndex.value = item.index;
  scienceStore.setFilter({ category: item.value });
  scienceStore.fetchList({ page: 1 });
}
function onTag(tag) {
  scienceStore.setTag(tag);
  scienceStore.fetchList({ page: 1 });
  detailShow.value = false;
}
function reset() {
  currentIndex.value = 0;
  keyword.value = '';
  scienceStore.resetFilter();
  scienceStore.fetchList({ page: 1 });
}
function openDetail(post) {
  scienceStore.fetchDetail(post._id);
  detailShow.value = true;
}
function loadMore() {
  if (scienceStore.hasMore) {
    scienceStore.fetchList({ page: scienceStore.page + 1, append: true });
  }
}
function goChat() {
  uni.navigateTo({ url: '/pages/science/ai-chat' });
}

onShow(() => {
  scienceStore.fetchTags();
  scienceStore.fetchList({ page: 1 });
});
onReachBottom(() => loadMore());
</script>

<style scoped lang="scss">
.science-list {
  min-height: 100vh;
  background: #f5f6f8;
  padding-bottom: 120rpx;
  .search-bar { padding: 20rpx 24rpx; background: #fff; }
  .tag-bar {
    background: #fff;
    border-top: 1rpx solid #f0f0f0;
    .tag-row {
      display: flex;
      gap: 16rpx;
      padding: 16rpx 24rpx;
      white-space: nowrap;
      .tag-chip {
        font-size: 24rpx;
        color: #606266;
        background: #f5f6f8;
        padding: 8rpx 24rpx;
        border-radius: 100rpx;
        &.active { color: #19be6b; background: #e8f8ef; }
      }
    }
  }
  .list {
    padding: 16rpx;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16rpx;
  }
  .loading { padding: 60rpx; display: flex; justify-content: center; }
  .fab {
    position: fixed;
    right: 40rpx;
    bottom: 60rpx;
    width: 96rpx;
    height: 96rpx;
    border-radius: 50%;
    background: #19be6b;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 8rpx 24rpx rgba(25, 190, 107, 0.4);
  }
  .detail {
    max-height: 80vh;
    overflow-y: auto;
    .detail-cover { width: 100%; height: 320rpx; background: #f5f5f5; }
    .detail-body { padding: 24rpx; }
    .detail-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12rpx;
      .detail-title { font-size: 34rpx; font-weight: 700; color: #303133; flex: 1; }
      .detail-cat {
        flex-shrink: 0;
        font-size: 22rpx;
        color: #19be6b;
        background: #e8f8ef;
        padding: 4rpx 16rpx;
        border-radius: 100rpx;
      }
    }
    .detail-meta {
      margin-top: 12rpx;
      display: flex;
      gap: 24rpx;
      font-size: 24rpx;
      color: #909399;
    }
    .detail-content {
      margin-top: 20rpx;
      font-size: 28rpx;
      color: #303133;
      line-height: 1.7;
      white-space: pre-wrap;
    }
    .detail-tags {
      margin-top: 20rpx;
      display: flex;
      flex-wrap: wrap;
      gap: 12rpx;
      .tag {
        font-size: 22rpx;
        color: #2979ff;
        background: #ecf5ff;
        padding: 4rpx 16rpx;
        border-radius: 100rpx;
      }
    }
  }
}
</style>
