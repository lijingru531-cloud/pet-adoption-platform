<template>
  <view class="ai-chat">
    <!-- 免责声明 -->
    <view class="disclaimer">
      <u-icon name="info-circle-fill" color="#ff9900" size="28" />
      <text class="disclaimer-text">AI 生成，仅供参考，必要时请及时就医</text>
    </view>

    <!-- 消息流 -->
    <scroll-view
      class="msg-scroll"
      scroll-y
      :scroll-into-view="scrollAnchor"
      :scroll-with-animation="true"
    >
      <view
        v-for="(m, i) in messages"
        :id="`msg-${i}`"
        :key="i"
        class="msg-row"
        :class="m.role"
      >
        <view class="bubble">{{ m.content }}</view>
      </view>

      <view v-if="loading" class="msg-row ai">
        <view class="bubble typing">正在思考…</view>
      </view>
    </scroll-view>

    <!-- 配额提示 -->
    <view v-if="quotaLeft !== null" class="quota-tip">
      今日剩余提问次数：{{ quotaLeft }}
    </view>

    <!-- 输入区 -->
    <view class="composer">
      <u-textarea
        v-model="question"
        class="input"
        placeholder="问问养宠问题，如：小猫怎么喂养？"
        :auto-height="true"
        :maxlength="200"
        :show-confirm-bar="false"
      />
      <u-button type="primary" size="mini" :loading="loading" text="发送" @click="send" />
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { useUserStore } from '@/store/user';
import { services } from '@/services';
import { ERROR_CODE } from '@/constants/errorCode';

const userStore = useUserStore();
const question = ref('');
const loading = ref(false);
const messages = ref([]);
const quotaLeft = ref(null);
const scrollAnchor = ref('');

onMounted(() => {
  messages.value.push({
    role: 'ai',
    content: '你好，我是幸运锦鲤的 AI 养宠助手（演示版）。关于猫狗喂养、健康、行为、领养的问题都可以问我～',
  });
});

onShow(() => {
  if (!userStore.isLogin) userStore.initFromStorage();
});

function userId() {
  return (userStore.user && userStore.user._id) || 'anonymous';
}

function scrollToBottom() {
  // 下一帧滚动到底部
  setTimeout(() => {
    scrollAnchor.value = `msg-${messages.value.length - 1}`;
  }, 50);
}

async function send() {
  const q = (question.value || '').trim();
  if (!q) return uni.$u.toast('请输入你的问题');
  if (loading.value) return;

  messages.value.push({ role: 'user', content: q });
  question.value = '';
  loading.value = true;
  scrollToBottom();

  const res = await services.ai.chat({ userId: userId(), question: q });
  loading.value = false;

  if (res.code === ERROR_CODE.AI_QUOTA_EXCEEDED) {
    messages.value.push({ role: 'ai', content: '今日 AI 调用次数已达上限（20 次/日），明天再来吧～' });
    quotaLeft.value = 0;
    scrollToBottom();
    return;
  }
  if (res.code === ERROR_CODE.CONTENT_BLOCKED) {
    messages.value.push({ role: 'ai', content: '内容不合规，已被拦截。请换一个养宠相关的问题～' });
    scrollToBottom();
    return;
  }
  if (res.code !== ERROR_CODE.SUCCESS || !res.data) {
    messages.value.push({ role: 'ai', content: '抱歉，我暂时无法回答，请稍后再试。' });
    scrollToBottom();
    return;
  }

  messages.value.push({ role: 'ai', content: res.data.answer });
  quotaLeft.value = res.data.quotaLeft;
  scrollToBottom();
}
</script>

<style scoped lang="scss">
.ai-chat {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f5f6f8;
  .disclaimer {
    display: flex;
    align-items: center;
    gap: 10rpx;
    padding: 16rpx 24rpx;
    background: #fff7e6;
    border-bottom: 1rpx solid #ffe7ba;
    .disclaimer-text { font-size: 24rpx; color: #d48806; }
  }
  .msg-scroll {
    flex: 1;
    padding: 24rpx;
    overflow-y: auto;
  }
  .msg-row {
    display: flex;
    margin: 16rpx 0;
    &.user { justify-content: flex-end; }
    &.ai { justify-content: flex-start; }
    .bubble {
      max-width: 76%;
      padding: 18rpx 24rpx;
      border-radius: 20rpx;
      font-size: 28rpx;
      line-height: 1.6;
      white-space: pre-wrap;
      word-break: break-word;
    }
    &.user .bubble {
      background: #19be6b;
      color: #fff;
      border-top-right-radius: 4rpx;
    }
    &.ai .bubble {
      background: #fff;
      color: #303133;
      border-top-left-radius: 4rpx;
    }
    .typing { color: #909399; }
  }
  .quota-tip {
    text-align: center;
    font-size: 22rpx;
    color: #909399;
    padding: 8rpx 0;
  }
  .composer {
    display: flex;
    align-items: flex-end;
    gap: 16rpx;
    padding: 16rpx 24rpx calc(16rpx + env(safe-area-inset-bottom));
    background: #fff;
    border-top: 1rpx solid #f0f0f0;
    .input {
      flex: 1;
      background: #f5f6f8;
      border-radius: 12rpx;
      padding: 8rpx 16rpx;
    }
  }
}
</style>
