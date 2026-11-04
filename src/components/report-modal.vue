<template>
  <u-popup :show="show" mode="bottom" @close="onClose" round="16">
    <view class="report-modal">
      <view class="header">
        <text class="title">举报</text>
        <u-icon name="close" size="32" color="#909399" @click="onClose" />
      </view>
      <view class="section">
        <text class="label">举报原因</text>
        <u-radio-group v-model="reason">
          <u-radio
            v-for="(label, key) in reasonOptions"
            :key="key"
            :name="key"
            :label="label"
            class="radio-item"
          />
        </u-radio-group>
      </view>
      <view class="section">
        <text class="label">补充说明（选填）</text>
        <u-textarea v-model="detail" placeholder="请描述具体问题，便于平台核实" height="140" />
      </view>
      <u-button type="error" text="提交举报" :disabled="!reason" @click="onSubmit" />
    </view>
  </u-popup>
</template>

<script setup>
import { reactive, ref, watch } from 'vue';
import { REPORT_REASON_LABEL } from '@/constants/enum';

const props = defineProps({
  show: { type: Boolean, default: false },
  targetType: { type: String, default: 'post' },
  targetId: { type: String, default: '' },
});
const emit = defineEmits(['submit', 'close']);

const reasonOptions = REPORT_REASON_LABEL;
const reason = ref('');
const detail = ref('');

watch(
  () => props.show,
  (v) => {
    if (v) {
      reason.value = '';
      detail.value = '';
    }
  }
);

function onSubmit() {
  if (!reason.value) return;
  emit('submit', { targetType: props.targetType, targetId: props.targetId, reason: reason.value, detail: detail.value });
}
function onClose() {
  emit('close');
}
</script>

<style scoped lang="scss">
.report-modal {
  padding: 28rpx 28rpx 40rpx;
  background: #fff;
  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20rpx;
    .title { font-size: 32rpx; font-weight: 600; color: #303133; }
  }
  .section { margin-bottom: 24rpx; .label { display: block; font-size: 26rpx; color: #909399; margin-bottom: 12rpx; } }
  .radio-item { margin: 12rpx 0; }
}
</style>
