<template>
  <view class="login">
    <view class="logo">
      <u-icon name="heart" color="#2979ff" size="80" />
      <text class="app-name">幸运锦鲤 · 宠物领养与互助</text>
      <text class="slogan">负责任领养，从一次相遇开始</text>
    </view>

    <!-- 微信一键登录（小程序端条件编译可用；其余端走手机号兜底） -->
    <u-button
      type="primary"
      text="微信一键登录"
      :loading="loading"
      @click="onWechatLogin"
    />

    <!-- 手机号绑定 / 验证码登录兜底 -->
    <view class="phone-area" v-if="showBind">
      <u-input v-model="mobile" placeholder="请输入手机号" type="number" class="mb" />
      <view class="code-row">
        <u-input v-model="smsCode" placeholder="验证码（演示：000000）" class="mb" />
        <u-button size="mini" text="获取验证码" :disabled="counting" @click="sendCode" />
      </view>
      <u-button type="success" text="绑定并登录" @click="onBind" />
    </view>

    <u-button class="phone-login-btn" text="手机号验证码登录" type="default" @click="toggleBind" />

    <text class="privacy">登录即代表同意《隐私政策》与《用户协议》</text>
  </view>
</template>

<script setup>
import { ref } from 'vue';
import { useUserStore } from '@/store/user';
import { getWechatLoginCode, getCurrentPlatform } from '@/utils/auth';

const userStore = useUserStore();
const loading = ref(false);
const showBind = ref(false);
const mobile = ref('');
const smsCode = ref('');
const counting = ref(false);

function toggleBind() {
  showBind.value = !showBind.value;
}

/** 微信一键登录（三端条件编译取 code） */
async function onWechatLogin() {
  loading.value = true;
  const platform = getCurrentPlatform();
  const code = await getWechatLoginCode();
  const res = await userStore.login({ platform, code, userInfo: {} });
  loading.value = false;
  if (res.code === 0) {
    if (res.data.needBindMobile) {
      uni.$u.toast('请绑定手机号');
      showBind.value = true;
    } else {
      finishLogin();
    }
  } else {
    uni.$u.toast(res.message);
  }
}

function sendCode() {
  if (!/^1\d{10}$/.test(mobile.value)) return uni.$u.toast('请输入正确手机号');
  counting.value = true;
  uni.$u.toast('验证码已发送（演示）');
  setTimeout(() => (counting.value = false), 60 * 1000);
}

/** 手机号绑定 / 验证码登录 */
async function onBind() {
  if (!/^1\d{10}$/.test(mobile.value)) return uni.$u.toast('请输入正确手机号');
  const res = await userStore.bindMobile({ mobile: mobile.value, smsCode: smsCode.value || '000000' });
  if (res.code === 0) {
    // 若此前已通过微信登录则补全，否则以手机号建号
    if (!userStore.isLogin) {
      const r = await userStore.login({ platform: getCurrentPlatform(), code: `mobile_${mobile.value}`, userInfo: {} });
      if (r.code !== 0) return uni.$u.toast(r.message);
    }
    finishLogin();
  } else {
    uni.$u.toast(res.message);
  }
}

function finishLogin() {
  uni.$u.toast('登录成功');
  setTimeout(() => {
    const redirect = uni.getStorageSync('login_redirect');
    if (redirect) {
      uni.removeStorageSync('login_redirect');
      uni.redirectTo({ url: redirect });
    } else {
      uni.switchTab({ url: '/pages/home/index' });
    }
  }, 600);
}
</script>

<style scoped lang="scss">
.login {
  min-height: 100vh;
  background: linear-gradient(180deg, #2979ff 0%, #f5f6f8 40%);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 120rpx 60rpx 60rpx;
  gap: 30rpx;
  .logo {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16rpx;
    margin-bottom: 40rpx;
    .app-name { font-size: 36rpx; font-weight: 700; color: #fff; }
    .slogan { font-size: 24rpx; color: #e0eaff; }
  }
  :deep(.u-button) { width: 100%; }
  .phone-area { width: 100%; background: #fff; border-radius: 16rpx; padding: 24rpx; .mb { margin-bottom: 16rpx; } .code-row { display: flex; gap: 16rpx; align-items: center; :deep(.u-button) { width: auto; } } }
  .phone-login-btn { background: #fff; }
  .privacy { font-size: 22rpx; color: #909399; margin-top: 20rpx; }
}
</style>
