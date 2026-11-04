<template>
  <view class="placeholder">
    <u-icon name="chat" size="100" color="#19be6b" />
    <text class="title">AI 科普问答</text>
    <text class="desc">
      基于免密钥大模型的养宠问答（零成本）。网关已就绪（services/ai.js），
      问答 UI 将在 Sprint 2 接通 ai-chat 云函数后开放。
    </text>
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
