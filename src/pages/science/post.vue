<template>
  <view class="science-post">
    <u-form label-position="top">
      <u-form-item label="标题" required>
        <u-input v-model="form.title" placeholder="如：幼猫喂养的 5 个常见误区" maxlength="40" />
      </u-form-item>

      <u-form-item label="分类" required>
        <u-radio-group v-model="form.category">
          <u-radio
            v-for="(label, key) in categoryOptions"
            :key="key"
            :name="key"
            :label="label"
            class="radio"
          />
        </u-radio-group>
      </u-form-item>

      <u-form-item label="封面图" required>
        <u-upload
          :file-list="fileList"
          :max-count="1"
          @afterRead="onAfterRead"
          @delete="onDelete"
        />
      </u-form-item>

      <u-form-item label="正文" required>
        <u-textarea
          v-model="form.content"
          placeholder="分享你的养宠经验、知识或注意事项（AI 将进行审核与摘要生成）"
          height="320"
          maxlength="5000"
        />
      </u-form-item>
    </u-form>

    <view class="footer">
      <u-button
        type="primary"
        :loading="scienceStore.submitting"
        text="提交并进入 AI 审核"
        @click="submit"
      />
    </view>

    <!-- 审核结果 -->
    <u-modal
      :show="result.show"
      :title="result.title"
      :show-cancel-button="false"
      confirm-text="好的"
      @confirm="onResultConfirm"
    >
      <view class="result-modal">
        <u-icon :name="result.icon" :color="result.color" size="56" />
        <text class="result-text">{{ result.text }}</text>
      </view>
    </u-modal>
  </view>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { useScienceStore } from '@/store/science';
import { useUserStore } from '@/store/user';
import { uploadImage } from '@/utils/upload';
import { SCIENCE_CATEGORY_LABEL } from '@/constants/enum';

const scienceStore = useScienceStore();
const userStore = useUserStore();

const categoryOptions = SCIENCE_CATEGORY_LABEL;

const form = reactive({
  title: '',
  category: '',
  cover: '',
  content: '',
});
const fileList = ref([]);
const result = reactive({
  show: false,
  title: '',
  text: '',
  icon: 'checkmark-circle-fill',
  color: '#19be6b',
});

onShow(() => {
  if (!userStore.isLogin) {
    uni.$u.toast('请先登录');
    setTimeout(() => uni.navigateTo({ url: '/pages/login/index' }), 600);
  } else if (!userStore.mobileBound) {
    uni.showModal({
      title: '需绑定手机号',
      content: '发布前请先绑定手机号',
      success: () => uni.navigateTo({ url: '/pages/login/index' }),
    });
  }
});

function validate() {
  if (!form.title) return '请填写标题';
  if (!form.category) return '请选择分类';
  if (!form.cover) return '请上传封面图';
  if (!form.content) return '请填写正文';
  return '';
}

async function onAfterRead(event) {
  const { file } = event;
  const item = Array.isArray(file) ? file[0] : file;
  const url = await uploadImage(item.url || item.path || item);
  form.cover = url;
  fileList.value = [{ url }];
}
function onDelete() {
  form.cover = '';
  fileList.value = [];
}

function submit() {
  const err = validate();
  if (err) return uni.$u.toast(err);

  const payload = {
    title: form.title,
    category: form.category,
    cover: form.cover,
    content: form.content,
  };
  scienceStore.create(payload).then((res) => {
    if (res.code !== 0) {
      result.title = '提交失败';
      result.icon = 'close-circle-fill';
      result.color = '#fa3534';
      result.text = res.message;
      result.show = true;
      return;
    }
    const status = res.data.status;
    if (status === 'pass') {
      result.title = '发布成功';
      result.icon = 'checkmark-circle-fill';
      result.color = '#19be6b';
      result.text = 'AI 审核通过，科普帖已公开，并自动生成摘要与标签！';
    } else if (status === 'blocked') {
      result.title = '未通过审核';
      result.icon = 'close-circle-fill';
      result.color = '#fa3534';
      result.text = '内容命中安全规则被拦截，可修改后重新发布或申诉。';
    } else {
      result.title = '审核中';
      result.icon = 'info-circle-fill';
      result.color = '#ff9900';
      result.text = '内容疑似需人工复核，审核通过后将自动公开（≤5 分钟）。';
    }
    result.show = true;
  });
}

function onResultConfirm() {
  result.show = false;
  uni.switchTab({ url: '/pages/science/list' });
}
</script>

<style scoped lang="scss">
.science-post {
  min-height: 100vh;
  background: #f5f6f8;
  padding: 24rpx 24rpx 140rpx;
  .u-form {
    background: #fff;
    border-radius: 16rpx;
    padding: 24rpx;
  }
  .radio { margin: 12rpx 20rpx 12rpx 0; }
  .footer {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    padding: 16rpx 24rpx calc(16rpx + env(safe-area-inset-bottom));
    background: #fff;
  }
  .result-modal {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16rpx;
    padding: 30rpx;
    .result-text { font-size: 26rpx; color: #606266; text-align: center; }
  }
}
</style>
