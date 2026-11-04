<template>
  <view class="placeholder">
    <u-icon name="edit-pen" size="100" color="#19be6b" />
    <text class="title">发布科普帖</text>
    <text class="desc">经验帖发布与 AI 合规审核将于 Sprint 2 上线（接口已预留：api/science.js）。</text>
    <u-button size="mini" text="返回" @click="goBack" />
  </view>
</template>

<script setup>
function goBack() {
  uni.navigateBack();
}
</script>

<style scoped lang="scss">
.placeholder {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20rpx;
  background: #f5f6f8;
  .title { font-size: 34rpx; font-weight: 700; color: #303133; }
  .desc { font-size: 26rpx; color: #909399; padding: 0 60rpx; text-align: center; line-height: 1.6; }
}
</style>
