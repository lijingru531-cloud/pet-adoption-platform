<template>
  <view class="post-card" @click="onClick">
    <image class="cover" :src="cover" mode="aspectFill" lazy-load />
    <view class="status-badge" :class="`st-${post.status}`">{{ statusLabel }}</view>
    <view class="info">
      <view class="title-row">
        <text class="breed">{{ post.breed || '未知品种' }}</text>
        <text class="gender">{{ genderLabel }}</text>
      </view>
      <view class="meta">
        <text class="meta-item">{{ ageText }}</text>
        <text class="meta-dot">·</text>
        <text class="meta-item">{{ locationText }}</text>
      </view>
      <view v-if="post.summary" class="summary">{{ post.summary }}</view>
      <view class="tags">
        <text v-for="t in post.aiTags" :key="t" class="tag">{{ t }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue';
import { POST_STATUS_LABEL, GENDER_LABEL, SPECIES_LABEL } from '@/constants/enum';
import { formatAge, formatLocation, firstPhoto } from '@/utils/format';

const props = defineProps({
  post: { type: Object, required: true },
});
const emit = defineEmits(['click']);

const cover = computed(() => firstPhoto(props.post.photos) || '');
const statusLabel = computed(() => POST_STATUS_LABEL[props.post.status] || props.post.status);
const genderLabel = computed(() => GENDER_LABEL[props.post.gender] || '');
const ageText = computed(() => formatAge(props.post.age));
const locationText = computed(() => formatLocation(props.post.location));

function onClick() {
  emit('click', props.post);
}
</script>

<style scoped lang="scss">
.post-card {
  position: relative;
  background: #fff;
  border-radius: 16rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);
  .cover {
    width: 100%;
    height: 280rpx;
    background: #f5f5f5;
  }
  .status-badge {
    position: absolute;
    top: 16rpx;
    left: 16rpx;
    padding: 4rpx 16rpx;
    border-radius: 100rpx;
    font-size: 22rpx;
    color: #fff;
    background: #19be6b;
    &.st-pending { background: #ff9900; }
    &.st-reserved { background: #2979ff; }
    &.st-adopted { background: #909399; }
    &.st-taken_down { background: #fa3534; }
  }
  .info {
    padding: 16rpx 20rpx 20rpx;
    .title-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      .breed { font-size: 30rpx; font-weight: 600; color: #303133; }
      .gender { font-size: 24rpx; color: #909399; }
    }
    .meta {
      margin-top: 8rpx;
      font-size: 24rpx;
      color: #909399;
      .meta-dot { margin: 0 8rpx; }
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
    .tags { margin-top: 12rpx; display: flex; flex-wrap: wrap; gap: 8rpx; }
    .tag {
      font-size: 20rpx;
      color: #2979ff;
      background: #ecf5ff;
      padding: 2rpx 12rpx;
      border-radius: 100rpx;
    }
  }
}
</style>
