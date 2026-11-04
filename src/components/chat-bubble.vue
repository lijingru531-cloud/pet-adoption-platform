<template>
  <view class="chat-bubble" :class="isSelf ? 'self' : 'peer'">
    <!-- 领养意向卡 -->
    <view v-if="message.type === 'intent'" class="bubble intent">
      <u-icon name="heart" color="#fff" size="28" />
      <text class="intent-text">{{ message.content }}</text>
    </view>

    <!-- 系统提示（接受/拒绝） -->
    <view v-else-if="message.type === 'system'" class="bubble system">
      <text>{{ message.content }}</text>
    </view>

    <!-- 联系方式卡（仅双方可见） -->
    <view v-else-if="message.type === 'contact'" class="bubble contact" @click="onContactTap">
      <u-icon name="phone" color="#2979ff" size="28" />
      <view class="contact-body">
        <text class="contact-type">{{ contactTypeLabel }}</text>
        <text class="contact-value">{{ revealed ? contactValue : masked }}</text>
      </view>
      <text class="contact-tip">仅双方可见</text>
    </view>

    <!-- 图片 -->
    <image v-else-if="message.type === 'image'" class="bubble image" :src="message.content" mode="aspectFill" @click="preview" />

    <!-- 文本 -->
    <view v-else class="bubble text">{{ message.content }}</view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue';
import { MESSAGE_TYPE, CONTACT_TYPE } from '@/constants/config';
import { decryptContact, maskMobile } from '@/utils/crypto';

const props = defineProps({
  message: { type: Object, required: true },
  isSelf: { type: Boolean, default: false },
});
const emit = defineEmits(['reveal-contact']);

const revealed = ref(false);
const contactValue = computed(() => {
  // contactEnc 为加密字段，仅双方可见；解密由调用方在有权限时触发
  return props.message.contactEnc ? decryptContact(props.message.contactEnc) : props.message.content || '';
});
const masked = computed(() => maskMobile(contactValue.value) || '***');
const contactTypeLabel = computed(() => {
  const t = props.message.contactType || CONTACT_TYPE.MOBILE;
  return t === CONTACT_TYPE.WECHAT ? '微信号' : t === CONTACT_TYPE.QQ ? 'QQ' : '手机号';
});

function onContactTap() {
  // 点击后向父级请求解密展示（父级确保当前用户为会话双方之一）
  if (!revealed.value) {
    emit('reveal-contact', props.message);
    revealed.value = true;
  }
}
function preview() {
  uni.previewImage({ urls: [props.message.content] });
}
</script>

<style scoped lang="scss">
.chat-bubble {
  display: flex;
  margin: 16rpx 0;
  &.self { justify-content: flex-end; }
  &.peer { justify-content: flex-start; }
  .bubble {
    max-width: 70%;
    padding: 18rpx 24rpx;
    border-radius: 20rpx;
    font-size: 28rpx;
    line-height: 1.5;
  }
  .text {
    background: #fff;
    color: #303133;
    border-top-left-radius: 4rpx;
  }
  .self .text {
    background: #2979ff;
    color: #fff;
    border-top-left-radius: 20rpx;
    border-top-right-radius: 4rpx;
  }
  .intent {
    display: flex;
    align-items: center;
    gap: 10rpx;
    background: linear-gradient(135deg, #ff7e5f, #fe5196);
    color: #fff;
    .intent-text { font-size: 26rpx; }
  }
  .system {
    background: transparent;
    color: #909399;
    font-size: 24rpx;
    text-align: center;
    max-width: 100%;
  }
  .contact {
    display: flex;
    align-items: center;
    gap: 14rpx;
    background: #ecf5ff;
    color: #2979ff;
    .contact-body { display: flex; flex-direction: column; }
    .contact-type { font-size: 22rpx; color: #909399; }
    .contact-value { font-size: 28rpx; font-weight: 600; }
    .contact-tip { font-size: 20rpx; color: #c0c4cc; }
  }
  .image {
    width: 240rpx;
    height: 240rpx;
    border-radius: 12rpx;
  }
}
</style>
