<template>
  <view class="chat" v-if="store.current">
    <!-- 头部：发帖人显示接受/拒绝 -->
    <view class="chat-header" v-if="store.current.isPublisher && store.current.status === 'active'">
      <u-button size="mini" type="success" text="接受" @click="onDecide('accept')" />
      <u-button size="mini" type="error" text="拒绝" @click="onDecide('reject')" />
    </view>

    <!-- 消息区 -->
    <scroll-view class="msg-scroll" scroll-y :scroll-into-view="scrollAnchor" :scroll-with-animation="true">
      <view v-for="m in store.messages" :key="m._id" :id="`m_${m._id}`">
        <chat-bubble
          :message="m"
          :is-self="m.senderId === userStore.user?._id"
          @reveal-contact="onRevealContact"
        />
      </view>
    </scroll-view>

    <!-- 输入区 -->
    <view class="input-bar">
      <u-icon name="plus-circle" size="48" color="#909399" @click="showActions = true" />
      <u-input v-model="draft" placeholder="输入消息…" class="input" @confirm="onSendText" />
      <u-button type="primary" size="mini" text="发送" @click="onSendText" />
    </view>

    <!-- 联系方式快捷发送 -->
    <u-popup :show="showContact" mode="bottom" @close="showContact = false" round="16">
      <view class="contact-form">
        <view class="cf-title">发送联系方式（仅双方可见）</view>
        <u-radio-group v-model="contactType">
          <u-radio name="mobile" label="手机号" />
          <u-radio name="wechat" label="微信号" />
          <u-radio name="qq" label="QQ" />
        </u-radio-group>
        <u-input v-model="contactValue" :placeholder="contactType === 'mobile' ? '请输入手机号' : '请输入账号'" />
        <u-button type="primary" text="发送" @click="onSendContact" />
      </view>
    </u-popup>

    <u-action-sheet
      :show="showActions"
      :actions="actions"
      title="选择操作"
      @close="showActions = false"
      @select="onActionSelect"
    />

    <!-- 平台外沟通安全提示（Q1） -->
    <safety-tip-modal :show="showSafety" @confirm="confirmSend" @cancel="cancelSend" />
  </view>
</template>

<script setup>
import { onLoad, onUnload } from '@dcloudio/uni-app';
import { ref, reactive, nextTick, onMounted } from 'vue';
import { useConversationStore } from '@/store/conversation';
import { useUserStore } from '@/store/user';
import ChatBubble from '@/components/chat-bubble.vue';
import SafetyTipModal from '@/components/safety-tip-modal.vue';
import { encryptContact } from '@/utils/crypto';
import { chooseImages, uploadImage } from '@/utils/upload';
import { CONTACT_TYPE } from '@/constants/config';

const store = useConversationStore();
const userStore = useUserStore();
const convId = ref('');
const draft = ref('');
const showActions = ref(false);
const showContact = ref(false);
const showSafety = ref(false);
const contactType = ref(CONTACT_TYPE.MOBILE);
const contactValue = ref('');
const scrollAnchor = ref('');
const pending = reactive({ active: false, fn: null });

const actions = [
  { name: '发送图片', value: 'image' },
  { name: '发送联系方式', value: 'contact' },
];

let timer = null;

onLoad((query) => {
  convId.value = query.id || '';
  store.fetchDetail(convId.value).then(() => store.fetchMessages(convId.value));
});

onMounted(() => {
  timer = setInterval(() => {
    if (convId.value) store.fetchMessages(convId.value);
  }, 4000);
});
onUnload(() => {
  if (timer) clearInterval(timer);
});

function scrollToBottom() {
  nextTick(() => {
    const list = store.messages;
    if (list.length) scrollAnchor.value = `m_${list[list.length - 1]._id}`;
  });
}

async function refreshAndScroll() {
  await store.fetchMessages(convId.value);
  scrollToBottom();
}

/** 发送文字（先过安全提示） */
function onSendText() {
  const text = draft.value.trim();
  if (!text) return;
  const needTip = /微信|电话|手机号|加我|qq|私聊|线下/i.test(text);
  draft.value = '';
  if (needTip) {
    pending.active = true;
    pending.fn = () => doSend({ type: 'text', content: text });
    showSafety.value = true;
  } else {
    doSend({ type: 'text', content: text });
  }
}

function onActionSelect(item) {
  showActions.value = false;
  if (item.value === 'image') pickImage();
  if (item.value === 'contact') showContact.value = true;
}

async function pickImage() {
  const paths = await chooseImages(1);
  if (!paths.length) return;
  const url = await uploadImage(paths[0]);
  doSend({ type: 'image', content: url });
}

function onSendContact() {
  const val = contactValue.value.trim();
  if (!val) return uni.$u.toast('请输入联系方式');
  const enc = encryptContact(val);
  showContact.value = false;
  pending.active = true;
  pending.fn = () => doSend({ type: 'contact', content: val, contactEnc: enc, contactType: contactType.value });
  showSafety.value = true;
  contactValue.value = '';
}

function onRevealContact() {
  // 解密已在 chat-bubble 内处理；此处可记录审计（占位）
}

async function doSend(payload) {
  const res = await store.send({ conversationId: convId.value, ...payload });
  if (res.code !== 0) {
    uni.$u.toast(res.message);
    return;
  }
  refreshAndScroll();
}

function confirmSend() {
  showSafety.value = false;
  if (pending.active && pending.fn) {
    const fn = pending.fn;
    pending.active = false;
    pending.fn = null;
    fn();
  }
}
function cancelSend() {
  showSafety.value = false;
  pending.active = false;
  pending.fn = null;
}

function onDecide(action) {
  uni.showModal({
    title: action === 'accept' ? '接受该领养意向？' : '拒绝该领养意向？',
    success: async (r) => {
      if (!r.confirm) return;
      const res = await store.decide(convId.value, action);
      if (res.code === 0) {
        uni.$u.toast(action === 'accept' ? '已接受' : '已拒绝');
        store.fetchDetail(convId.value);
      } else {
        uni.$u.toast(res.message);
      }
    },
  });
}
</script>

<style scoped lang="scss">
.chat {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f6f8;
  .chat-header {
    display: flex;
    gap: 16rpx;
    padding: 16rpx 24rpx;
    background: #fff;
    border-bottom: 1rpx solid #eee;
  }
  .msg-scroll {
    flex: 1;
    padding: 16rpx 24rpx;
    overflow-y: auto;
  }
  .input-bar {
    display: flex;
    align-items: center;
    gap: 16rpx;
    padding: 16rpx 24rpx calc(16rpx + env(safe-area-inset-bottom));
    background: #fff;
    border-top: 1rpx solid #eee;
    .input { flex: 1; background: #f5f6f8; border-radius: 100rpx; padding: 0 24rpx; }
  }
  .contact-form {
    padding: 30rpx;
    display: flex;
    flex-direction: column;
    gap: 20rpx;
    .cf-title { font-size: 28rpx; font-weight: 600; color: #303133; }
  }
}
</style>
