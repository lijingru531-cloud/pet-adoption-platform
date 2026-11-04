<template>
  <view class="placeholder">
    <u-icon name="map" size="100" color="#c0c4cc" />
    <text class="title">地图寻宠</text>
    <text class="desc">
      丢宠标注、附近聚合查询与 AI 寻宠提醒属 Sprint 4（P2）规划。
      地图能力本期不做；位置将统一模糊到街道级以保护隐私（见架构设计 Q3）。
    </text>
    <u-button size="mini" text="返回首页" @click="goHome" />
  </view>
</template>

<script setup>
function goHome() {
  uni.switchTab({ url: '/pages/home/index' });
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
