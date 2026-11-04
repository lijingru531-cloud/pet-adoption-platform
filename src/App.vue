<script setup>
import { onLaunch, onShow } from '@dcloudio/uni-app';
import { useUserStore } from '@/store/user';
import { getUnreadCount } from '@/api/notification';

const MESSAGE_TAB_INDEX = 3;

const userStore = useUserStore();

/** 刷新消息未读红点（消息 Tab） */
async function refreshBadge() {
  if (!userStore.isLogin) {
    uni.removeTabBarBadge({ index: MESSAGE_TAB_INDEX });
    return;
  }
  const res = await getUnreadCount();
  if (res.code === 0 && res.data.count > 0) {
    uni.setTabBarBadge({ index: MESSAGE_TAB_INDEX, text: String(res.data.count) });
  } else {
    uni.removeTabBarBadge({ index: MESSAGE_TAB_INDEX });
  }
}

onLaunch(() => {
  userStore.initFromStorage();
  refreshBadge();
});

onShow(() => {
  refreshBadge();
});
</script>

<template>
  <view class="app-root"></view>
</template>

<style lang="scss">
.app-root {
  min-height: 100vh;
}
</style>
