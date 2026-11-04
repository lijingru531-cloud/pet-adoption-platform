<template>
  <u-modal
    :show="show"
    title="安全提醒"
    :show-cancel-button="true"
    confirm-text="我已知晓"
    @confirm="onConfirm"
    @cancel="onCancel"
  >
    <view class="safety-tip">
      <u-icon name="info-circle-fill" color="#ff9900" size="40" />
      <text class="tip-text">{{ tip }}</text>
    </view>
  </u-modal>
</template>

<script setup>
import { APP_CONFIG } from '@/constants/config';

defineProps({ show: { type: Boolean, default: false } });
const emit = defineEmits(['confirm', 'cancel']);
const tip = APP_CONFIG.SAFETY_TIP;

function onConfirm() {
  emit('confirm');
}
function onCancel() {
  emit('cancel');
}
</script>

<style scoped lang="scss">
.safety-tip {
  display: flex;
  align-items: flex-start;
  gap: 16rpx;
  padding: 20rpx;
  .tip-text {
    font-size: 26rpx;
    color: #606266;
    line-height: 1.6;
  }
}
</style>
