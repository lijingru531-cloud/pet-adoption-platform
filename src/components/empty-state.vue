<template>
  <view class="empty-state">
    <u-icon :name="icon" :size="iconSize" :color="iconColor" />
    <text class="text">{{ text }}</text>
    <slot />
  </view>
</template>

<script setup>
defineProps({
  text: { type: String, default: '暂无内容' },
  icon: { type: String, default: 'list' },
  iconSize: { type: [Number, String], default: 80 },
  iconColor: { type: String, default: '#c0c4cc' },
});
</script>

<style scoped lang="scss">
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80rpx 40rpx;
  .text {
    margin-top: 20rpx;
    font-size: 26rpx;
    color: #909399;
    text-align: center;
  }
}
</style>
