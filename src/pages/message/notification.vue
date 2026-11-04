<template>
  <view class="notification">
    <view class="bar">
      <text class="title">消息通知</text>
      <view class="bar-actions">
        <u-button size="mini" type="primary" plain text="我的会话" @click="goConversations" />
        <u-button size="mini" text="全部已读" @click="markAll" />
      </view>
    </view>
    <view v-if="loading" class="loading"><u-loading-icon /></view>
    <empty-state v-else-if="list.length === 0" text="暂无通知" icon="bell" />
    <view v-else class="items">
      <view
        v-for="n in list"
        :key="n._id"
        class="noti-item"
        :class="{ unread: !n.read }"
        @click="onClick(n)"
      >
        <view class="noti-dot" v-if="!n.read" />
        <view class="noti-body">
          <view class="noti-top">
            <u-tag :text="typeLabel(n.type)" size="mini" :type="tagType(n.type)" />
            <text class="time">{{ fromNow(n.createdAt) }}</text>
          </view>
          <text class="content">{{ n.content }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { onShow } from '@dcloudio/uni-app';
import { ref } from 'vue';
import { listNotifications, markRead } from '@/api/notification';
import EmptyState from '@/components/empty-state.vue';
import { NOTIFICATION_TYPE_LABEL } from '@/constants/enum';
import { fromNow } from '@/utils/format';

const list = ref([]);
const loading = ref(false);

function typeLabel(t) {
  return NOTIFICATION_TYPE_LABEL[t] || '通知';
}
function tagType(t) {
  const map = { intent: 'primary', accept: 'success', reject: 'error', report: 'warning', appeal: 'warning', system: 'info' };
  return map[t] || 'info';
}
async function load() {
  loading.value = true;
  const res = await listNotifications();
  loading.value = false;
  if (res.code === 0) list.value = res.data;
}
function onClick(n) {
  if (!n.read) markRead(n._id);
  // 关联会话则跳转
  if (n.relatedId && n.type === 'intent') {
    uni.navigateTo({ url: `/pages/message/chat?id=${n.relatedId}` });
  }
}
function markAll() {
  markRead('').then(load);
}
function goConversations() {
  uni.navigateTo({ url: '/pages/message/conversation-list' });
}
function refreshBadge() {
  const unread = list.value.filter((n) => !n.read).length;
  if (unread > 0) uni.setTabBarBadge({ index: 3, text: String(unread) });
  else uni.removeTabBarBadge({ index: 3 });
}

onShow(() => {
  load().then(refreshBadge);
});
</script>

<style scoped lang="scss">
.notification {
  min-height: 100vh;
  background: #f5f6f8;
  padding-bottom: 30rpx;
  .bar { display: flex; align-items: center; justify-content: space-between; padding: 20rpx 24rpx; .title { font-size: 32rpx; font-weight: 600; color: #303133; } .bar-actions { display: flex; gap: 12rpx; } }
  .loading { padding: 60rpx; display: flex; justify-content: center; }
  .items { padding: 0 16rpx; }
  .noti-item {
    display: flex;
    align-items: flex-start;
    gap: 16rpx;
    background: #fff;
    border-radius: 16rpx;
    padding: 24rpx;
    margin-bottom: 16rpx;
    &.unread { background: #f0f7ff; }
    .noti-dot { width: 14rpx; height: 14rpx; border-radius: 50%; background: #2979ff; margin-top: 14rpx; }
    .noti-body { flex: 1; .noti-top { display: flex; align-items: center; justify-content: space-between; .time { font-size: 22rpx; color: #c0c4cc; } } .content { display: block; margin-top: 10rpx; font-size: 28rpx; color: #303133; line-height: 1.5; } }
  }
}
</style>
