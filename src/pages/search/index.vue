<template>
  <view class="global-search">
    <!-- 搜索框 -->
    <view class="search-bar">
      <view class="search-inner">
        <u-icon name="search" color="#909399" size="28" />
        <input
          v-model="keyword"
          class="input"
          type="text"
          placeholder="搜索品种 / 城市 / 养宠知识"
          confirm-type="search"
          :focus="autoFocus"
          @confirm="onSearch"
        />
        <u-icon v-if="keyword" name="close-circle-fill" color="#c0c4cc" size="24" @click="clearKeyword" />
      </view>
      <text class="cancel" @click="onCancel">取消</text>
    </view>

    <!-- 统计 -->
    <view v-if="hasSearched" class="stats">
      <text class="stats-text">
        共找到 <text class="num">{{ data.total }}</text> 条结果
        <text v-if="data.postTotal"> · 领养 {{ data.postTotal }}</text>
        <text v-if="data.scienceTotal"> · 科普 {{ data.scienceTotal }}</text>
      </text>
    </view>

    <!-- 空状态 -->
    <empty-state
      v-if="hasSearched && !data.list.length && !loading"
      text="没有找到相关内容，换个关键词试试"
      icon="search"
    />

    <!-- 加载中 -->
    <view v-if="loading" class="loading"><u-loading-icon /></view>

    <!-- 结果列表（合并展示） -->
    <view v-else-if="data.list.length" class="result-list">
      <view
        v-for="item in data.list"
        :key="`${item._type}_${item._id}`"
        class="result-item"
        :class="item._type"
        @click="onItemClick(item)"
      >
        <image class="cover" :src="item._type === 'post' ? item.cover : item.cover" mode="aspectFill" />
        <view class="info">
          <view class="top-row">
            <view class="title-area">
              <text class="title">{{ item._type === 'post' ? item.breed : item.title }}</text>
              <text class="type-tag" :class="item._type">{{ item._typeLabel }}</text>
            </view>
          </view>
          <view class="summary" v-if="item.summary">{{ item.summary }}</view>
          <view class="bottom-row">
            <text class="meta" v-if="item._type === 'post'">
              {{ item.species === 'cat' ? '🐱' : '🐶' }} · {{ item.age }}岁
            </text>
            <text class="meta" v-else-if="item.author">{{ item.author.nickname || '匿名作者' }}</text>
            <text class="views">{{ item._type === 'post' ? (item.favoriteCount || 0) + ' 收藏' : (item.views || 0) + ' 浏览' }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 加载更多 -->
    <u-loadmore
      v-if="data.list.length > 0"
      :status="loadMoreStatus"
      @loadmore="loadMore"
    />
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { globalSearch } from '@/api/search';
import EmptyState from '@/components/empty-state.vue';

const keyword = ref('');
const loading = ref(false);
const autoFocus = ref(true);
const hasSearched = ref(false);
const data = ref({ list: [], total: 0, page: 1, pageSize: 10, postTotal: 0, scienceTotal: 0 });

const hasMore = computed(() => data.value.list.length < data.value.total);
const loadMoreStatus = computed(() => (hasMore.value ? 'loadmore' : 'nomore'));

// 支持首页跳转时带 keyword 参数
onLoad((options) => {
  if (options && options.keyword) {
    keyword.value = decodeURIComponent(options.keyword);
    autoFocus.value = false;
    onSearch();
  }
});

onMounted(() => {
  // 从首页 URL 参数获取 keyword 备用
});

function clearKeyword() {
  keyword.value = '';
  data.value = { list: [], total: 0, page: 1, pageSize: 10, postTotal: 0, scienceTotal: 0 };
  hasSearched.value = false;
}

function onCancel() {
  uni.navigateBack({ delta: 1, fail: () => uni.switchTab({ url: '/pages/home/index' }) });
}

async function onSearch() {
  const kw = keyword.value.trim();
  if (!kw) return uni.$u.toast('请输入搜索关键词');
  loading.value = true;
  hasSearched.value = true;
  const res = await globalSearch({ keyword: kw, page: 1 });
  loading.value = false;
  if (res.code === 0) {
    data.value = { ...res.data, list: res.data.list, page: 1 };
  } else {
    uni.$u.toast(res.message || '搜索失败');
  }
}

async function loadMore() {
  if (!hasMore.value || loading.value) return;
  loading.value = true;
  const nextPage = data.value.page + 1;
  const res = await globalSearch({ keyword: keyword.value.trim(), page: nextPage });
  loading.value = false;
  if (res.code === 0) {
    data.value.list = [...data.value.list, ...res.data.list];
    data.value.page = nextPage;
  }
}

function onItemClick(item) {
  if (item._type === 'post') {
    uni.navigateTo({ url: `/pages/adopt/detail?id=${item._id}` });
  } else {
    // 科普帖：进入科普列表页并打开详情（或扩展独立详情页）
    uni.switchTab({ url: '/pages/science/list' });
  }
}
</script>

<style scoped lang="scss">
.global-search {
  min-height: 100vh;
  background: #f5f6f8;
  display: flex;
  flex-direction: column;
  .search-bar {
    display: flex;
    align-items: center;
    gap: 16rpx;
    padding: 20rpx 24rpx;
    background: #fff;
    position: sticky;
    top: 0;
    z-index: 10;
    .search-inner {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 12rpx;
      background: #f5f6f8;
      border-radius: 40rpx;
      padding: 0 24rpx;
      height: 72rpx;
      .input {
        flex: 1;
        font-size: 28rpx;
        color: #303133;
        height: 72rpx;
      }
    }
    .cancel {
      font-size: 28rpx;
      color: #909399;
      white-space: nowrap;
    }
  }
  .stats {
    padding: 16rpx 24rpx;
    font-size: 24rpx;
    color: #909399;
    .num {
      font-weight: 600;
      color: #19be6b;
      font-size: 28rpx;
    }
  }
  .loading {
    padding: 60rpx;
    display: flex;
    justify-content: center;
  }
  .result-list {
    padding: 16rpx;
    display: flex;
    flex-direction: column;
    gap: 16rpx;
  }
  .result-item {
    display: flex;
    gap: 20rpx;
    background: #fff;
    border-radius: 16rpx;
    overflow: hidden;
    padding: 20rpx;
    box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
    .cover {
      width: 180rpx;
      height: 140rpx;
      border-radius: 12rpx;
      background: #f0f0f0;
      flex-shrink: 0;
    }
    .info {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 8rpx;
      .top-row {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 12rpx;
        .title-area {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 12rpx;
          min-width: 0;
        }
        .title {
          font-size: 30rpx;
          font-weight: 600;
          color: #303133;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          flex: 1;
        }
        .type-tag {
          font-size: 20rpx;
          padding: 4rpx 14rpx;
          border-radius: 100rpx;
          flex-shrink: 0;
          &.post {
            color: #2979ff;
            background: #ecf5ff;
          }
          &.science {
            color: #19be6b;
            background: #e8f8ef;
          }
        }
      }
      .summary {
        font-size: 24rpx;
        color: #606266;
        line-height: 1.4;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
      .bottom-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-top: auto;
        .meta, .views {
          font-size: 22rpx;
          color: #909399;
        }
      }
    }
  }
}
</style>
