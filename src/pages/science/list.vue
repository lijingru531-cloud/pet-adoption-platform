<template>
  <view class="placeholder">
    <u-icon name="book" size="100" color="#19be6b" />
    <text class="title">养宠科普</text>
    <text class="desc">科普信息流、经验帖与 AI 问答将在 Sprint 2 上线。</text>
    <u-button size="mini" text="返回首页" @click="goHome" />
  </view>
</template>

<script setup>
import { onShow } from '@dcloudio/uni-app';
import { useUserStore } from '@/store/user';
const userStore = useUserStore();
function goHome() {
  uni.switchTab({ url: '/pages/home/index' });
}
onShow(() => {
  // 预留：Sprint 2 接入 science-post 云函数
  if (!userStore.isLogin) userStore.initFromStorage();
});
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
