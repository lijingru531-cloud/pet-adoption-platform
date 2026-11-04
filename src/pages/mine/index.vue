<template>
  <view class="mine">
    <!-- 用户信息卡 -->
    <view class="profile-card" @click="goProfile">
      <u-avatar :src="userStore.avatar" size="100" />
      <view class="pc-info">
        <text class="name">{{ userStore.nickname }}</text>
        <text class="sub">{{ userStore.mobileBound ? '已绑定手机号' : '未绑定手机号' }}</text>
      </view>
      <u-icon name="arrow-right" color="#fff" size="32" />
    </view>

    <!-- 我的数据统计 -->
    <view class="stat-row">
      <view class="stat" @click="goMyPosts"><text class="num">{{ postCount }}</text><text class="lab">我的发布</text></view>
      <view class="stat" @click="goFavorites"><text class="num">{{ favCount }}</text><text class="lab">我的收藏</text></view>
      <view class="stat"><text class="num">{{ adoptCount }}</text><text class="lab">领养记录</text></view>
    </view>

    <!-- 功能列表 -->
    <view class="menu">
      <u-cell-group>
        <u-cell icon="file-text" title="我的发布" is-link @click="goMyPosts" />
        <u-cell icon="star" title="我的收藏" is-link @click="goFavorites" />
        <u-cell icon="edit-pen" title="编辑资料" is-link @click="goProfile" />
        <u-cell icon="shield" title="隐私与通知设置" is-link @click="toast" />
        <u-cell icon="info-circle" title="关于平台" is-link @click="toast" />
      </u-cell-group>
    </view>

    <u-button class="logout" v-if="userStore.isLogin" text="退出登录" type="error" plain @click="logout" />
    <u-button class="login-btn" v-else text="登录 / 注册" type="primary" @click="goLogin" />
  </view>
</template>

<script setup>
import { onShow } from '@dcloudio/uni-app';
import { ref } from 'vue';
import { useUserStore } from '@/store/user';
import { usePostStore } from '@/store/post';

const userStore = useUserStore();
const postStore = usePostStore();
const postCount = ref(0);
const favCount = ref(0);
const adoptCount = ref(0);

function goProfile() {
  uni.navigateTo({ url: '/pages/mine/profile' });
}
function goMyPosts() {
  uni.navigateTo({ url: '/pages/mine/myposts' });
}
function goFavorites() {
  uni.navigateTo({ url: '/pages/mine/favorites' });
}
function goLogin() {
  uni.navigateTo({ url: '/pages/login/index' });
}
function logout() {
  uni.showModal({ title: '确认退出？', success: (r) => { if (r.confirm) { userStore.logout(); resetCounts(); } } });
}
function toast() {
  uni.$u.toast('功能将于后续版本开放');
}
function resetCounts() {
  postCount.value = 0;
  favCount.value = 0;
  adoptCount.value = 0;
}

onShow(() => {
  if (!userStore.isLogin) {
    userStore.initFromStorage();
  }
  if (userStore.isLogin) {
    postStore.fetchMyPosts().then(() => (postCount.value = postStore.myPosts.length));
    postStore.fetchMyFavorites().then(() => (favCount.value = postStore.myFavorites.length));
    adoptCount.value = postStore.myPosts.filter((p) => p.status === 'adopted').length;
  }
});
</script>

<style scoped lang="scss">
.mine {
  min-height: 100vh;
  background: #f5f6f8;
  padding-bottom: 40rpx;
  .profile-card {
    display: flex;
    align-items: center;
    gap: 20rpx;
    padding: 50rpx 40rpx;
    background: linear-gradient(135deg, #2979ff, #19be6b);
    .pc-info { flex: 1; display: flex; flex-direction: column; .name { font-size: 34rpx; font-weight: 700; color: #fff; } .sub { font-size: 24rpx; color: #e6f0ff; margin-top: 6rpx; } }
  }
  .stat-row {
    display: flex;
    background: #fff;
    margin: 16rpx;
    border-radius: 16rpx;
    padding: 24rpx 0;
    .stat { flex: 1; display: flex; flex-direction: column; align-items: center; .num { font-size: 36rpx; font-weight: 700; color: #303133; } .lab { font-size: 24rpx; color: #909399; margin-top: 6rpx; } }
  }
  .menu { margin: 16rpx; border-radius: 16rpx; overflow: hidden; }
  .logout, .login-btn { margin: 30rpx 24rpx 0; }
}
</style>
