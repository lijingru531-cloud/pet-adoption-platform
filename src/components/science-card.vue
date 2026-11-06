<template>
  <view class="science-card" @click="onClick">
    <image class="cover" :src="post.cover" mode="aspectFill" lazy-load />
    <view class="info">
      <view class="title-row">
        <text class="title">{{ post.title || '未命名科普' }}</text>
        <text class="cat">{{ categoryLabel }}</text>
      </view>
      <view v-if="post.summary" class="summary">{{ post.summary }}</view>
      <view class="tags">
        <text
          v-for="t in post.tags"
          :key="t"
          class="tag"
          @click.stop="onTag(t)"
        >{{ t }}</text>
      </view>
      <view class="meta">
        <text class="author">{{ authorName }}</text>
        <text class="views">{{ (post.views || 0) }} 浏览</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue';
import { SCIENCE_CATEGORY_LABEL } from '@/constants/enum';

const props = defineProps({
  post: { type: Object, required: true },
});
const emit = defineEmits(['click', 'tag']);

const categoryLabel = computed(
  () => SCIENCE_CATEGORY_LABEL[props.post.category] || props.post.category || '科普'
);
const authorName = computed(() => {
  const a = props.post.author;
  return (a && a.nickname) || '匿名作者';
});

function onClick() {
  emit('click', props.post);
}
function onTag(t) {
  emit('tag', t);
}
</script>

<style scoped lang="scss">
.science-card {
  position: relative;
  background: #fff;
  border-radius: 16rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);
  .cover {
    width: 100%;
    height: 260rpx;
    background: #f5f5f5;
  }
  .info {
    padding: 16rpx 20rpx 20rpx;
    .title-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12rpx;
      .title {
        font-size: 30rpx;
        font-weight: 600;
        color: #303133;
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .cat {
        flex-shrink: 0;
        font-size: 20rpx;
        color: #19be6b;
        background: #e8f8ef;
        padding: 2rpx 12rpx;
        border-radius: 100rpx;
      }
    }
    .summary {
      margin-top: 10rpx;
      font-size: 24rpx;
      color: #606266;
      line-height: 1.4;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .tags {
      margin-top: 12rpx;
      display: flex;
      flex-wrap: wrap;
      gap: 8rpx;
      .tag {
        font-size: 20rpx;
        color: #2979ff;
        background: #ecf5ff;
        padding: 2rpx 12rpx;
        border-radius: 100rpx;
      }
    }
    .meta {
      margin-top: 12rpx;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 22rpx;
      color: #909399;
    }
  }
}
</style>
