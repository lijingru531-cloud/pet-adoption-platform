<template>
  <view class="conv-list">
    <u-tabs :list="tabs" @click="onTab" />
    <view v-if="store.loading" class="loading"><u-loading-icon /></view>
    <empty-state v-else-if="store.list.length === 0" text="暂无会话" />
    <view v-else class="items">
      <view
        v-for="c in store.list"
        :key="c._id"
        class="conv-item"
        @click="goChat(c)"
      >
        <u-avatar :src="c.peer?.avatar" size="80" />
        <view class="conv-main">
          <view class="conv-top">
            <text class="name">{{ c.peer?.nickname || '用户' }}</text>
            <u-tag v-if="c.post" :text="c.post.breed" size="mini" type="primary" />
          </view>
          <text class="last">{{ lastText(c.lastMessage) }}</text>
        </view>
        <view class="conv-side">
          <text class="status">{{ statusLabel(c.status) }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { onShow } from '@dcloudio/uni-app';
import { ref } from 'vue';
import { useConversationStore } from '@/store/conversation';
import { useUserStore } from '@/store/user';
import EmptyState from '@/components/empty-state.vue';
import { CONVERSATION_STATUS_LABEL } from '@/constants/enum';

const store = useConversationStore();
const userStore = useUserStore();
const tabs = [{ name: '全部' }, { name: '我发起的' }, { name: '我收到的' }];
const tabIndex = ref(0);

function onTab(item) {
  tabIndex.value = item.index;
}
function statusLabel(s) {
  return CONVERSATION_STATUS_LABEL[s] || s;
}
function lastText(m) {
  if (!m) return '';
  if (m.type === 'contact') return '[联系方式]';
  if (m.type === 'intent') return '[领养意向]';
  if (m.type === 'system') return m.content;
  return m.content;
}
function goChat(c) {
  uni.navigateTo({ url: `/pages/message/chat?id=${c._id}` });
}

onShow(() => {
  if (!userStore.isLogin) {
    uni.$u.toast('请先登录');
    return uni.navigateTo({ url: '/pages/login/index' });
  }
  store.fetchList();
});
</script>

<style scoped lang="scss">
.conv-list {
  min-height: 100vh;
  background: #f5f6f8;
  .loading { padding: 60rpx; display: flex; justify-content: center; }
  .items { padding: 16rpx; }
  .conv-item {
    display: flex;
    align-items: center;
    gap: 20rpx;
    background: #fff;
    border-radius: 16rpx;
    padding: 20rpx;
    margin-bottom: 16rpx;
    .conv-main { flex: 1; min-width: 0; .conv-top { display: flex; align-items: center; gap: 12rpx; .name { font-size: 28rpx; font-weight: 600; color: #303133; } } .last { font-size: 24rpx; color: #909399; margin-top: 6rpx; display: block; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; } }
    .conv-side { .status { font-size: 22rpx; color: #909399; } }
  }
}
</style>
