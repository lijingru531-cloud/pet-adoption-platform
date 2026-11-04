<template>
  <view class="publish">
    <!-- 步骤指示 -->
    <u-steps :current="step" :list="steps" />

    <view class="form">
      <!-- 第一步：基本信息 -->
      <view v-if="step === 0" class="step">
        <u-form label-position="top">
          <u-form-item label="物种" required>
            <u-radio-group v-model="form.species">
              <u-radio v-for="(label, key) in speciesOptions" :key="key" :name="key" :label="label" class="radio" />
            </u-radio-group>
          </u-form-item>
          <u-form-item label="品种" required>
            <u-input v-model="form.breed" placeholder="如：英国短毛猫 / 中华田园犬" />
          </u-form-item>
          <u-form-item label="年龄（月）" required>
            <u-input v-model="form.age" type="number" placeholder="单位：月，如 8" />
          </u-form-item>
          <u-form-item label="性别" required>
            <u-radio-group v-model="form.gender">
              <u-radio v-for="(label, key) in genderOptions" :key="key" :name="key" :label="label" class="radio" />
            </u-radio-group>
          </u-form-item>
          <u-form-item label="所在地" required>
            <view class="city-row">
              <u-input v-model="form.city" placeholder="城市，如：深圳" class="city-input" />
              <u-input v-model="form.district" placeholder="区，如：南山区" />
            </view>
          </u-form-item>
        </u-form>
      </view>

      <!-- 第二步：照片 -->
      <view v-else-if="step === 1" class="step">
        <text class="hint">请上传至少 1 张、最多 6 张宠物照片（必填）</text>
        <u-upload
          :file-list="fileList"
          :max-count="6"
          @afterRead="onAfterRead"
          @delete="onDelete"
        />
      </view>

      <!-- 第三步：健康与性格 -->
      <view v-else-if="step === 2" class="step">
        <u-form label-position="top">
          <u-form-item label="健康状态（可多选）">
            <u-checkbox-group v-model="form.healthStatus">
              <u-checkbox v-for="(label, key) in healthOptions" :key="key" :name="key" :label="label" class="check" />
            </u-checkbox-group>
          </u-form-item>
          <u-form-item label="性格描述">
            <u-textarea v-model="form.personality" placeholder="如：温顺亲人、活泼好动" height="120" />
          </u-form-item>
        </u-form>
      </view>

      <!-- 第四步：送养原因 -->
      <view v-else class="step">
        <u-form label-position="top">
          <u-form-item label="送养原因" required>
            <u-textarea v-model="form.reason" placeholder="请说明送养原因，帮助领养人了解背景" height="200" />
          </u-form-item>
          <u-form-item label="补充说明（选填）">
            <u-textarea v-model="form.note" placeholder="疫苗/绝育/饮食习惯等" height="120" />
          </u-form-item>
        </u-form>
      </view>
    </view>

    <!-- 底部步骤控制 -->
    <view class="footer">
      <u-button v-if="step > 0" text="上一步" @click="prev" />
      <u-button v-if="step < steps.length - 1" type="primary" text="下一步" @click="next" />
      <u-button v-else type="primary" :loading="postStore.submitting" text="提交并进入 AI 审核" @click="submit" />
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
import { usePostStore } from '@/store/post';
import { useUserStore } from '@/store/user';
import { chooseImages, uploadImage } from '@/utils/upload';
import { SPECIES_LABEL, GENDER, GENDER_LABEL, HEALTH_STATUS, HEALTH_STATUS_LABEL } from '@/constants/enum';

const postStore = usePostStore();
const userStore = useUserStore();

const steps = [
  { title: '基本信息' },
  { title: '照片' },
  { title: '健康性格' },
  { title: '送养原因' },
];
const step = ref(0);

const speciesOptions = SPECIES_LABEL;
const genderOptions = GENDER_LABEL;
const healthOptions = HEALTH_STATUS_LABEL;

const form = reactive({
  species: '',
  breed: '',
  age: '',
  gender: GENDER.UNKNOWN,
  city: '',
  district: '',
  healthStatus: [],
  personality: '',
  reason: '',
  note: '',
  photos: [],
});

const fileList = ref([]);
const result = reactive({ show: false, title: '', text: '', icon: 'checkmark-circle-fill', color: '#19be6b' });

onShow(() => {
  if (!userStore.isLogin) {
    uni.$u.toast('请先登录');
    setTimeout(() => uni.navigateTo({ url: '/pages/login/index' }), 600);
  }
});

function validateStep() {
  if (step.value === 0) {
    if (!form.species) return '请选择物种';
    if (!form.breed) return '请填写品种';
    if (!form.age) return '请填写年龄';
    if (!form.gender || form.gender === GENDER.UNKNOWN) return '请选择性别';
    if (!form.city) return '请填写城市';
  }
  if (step.value === 1) {
    if (form.photos.length === 0) return '请至少上传 1 张照片';
  }
  if (step.value === 3) {
    if (!form.reason) return '请填写送养原因';
  }
  return '';
}

function next() {
  const err = validateStep();
  if (err) return uni.$u.toast(err);
  step.value += 1;
}
function prev() {
  step.value -= 1;
}

async function onAfterRead(event) {
  const { file } = event;
  const item = Array.isArray(file) ? file[0] : file;
  // 上传（Mock 直接返回本地路径）
  const url = await uploadImage(item.url || item.path || item);
  form.photos.push(url);
  fileList.value.push({ url });
}
function onDelete(event) {
  const idx = event.index;
  fileList.value.splice(idx, 1);
  form.photos.splice(idx, 1);
}

function submit() {
  const err = validateStep();
  if (err) return uni.$u.toast(err);
  if (!userStore.user || !userStore.user.mobile) {
    return uni.showModal({
      title: '需绑定手机号',
      content: '发布前请先绑定手机号',
      success: () => uni.navigateTo({ url: '/pages/login/index' }),
    });
  }
  const payload = {
    species: form.species,
    breed: form.breed,
    age: Number(form.age),
    gender: form.gender,
    healthStatus: form.healthStatus,
    location: { city: form.city, district: form.district },
    personality: form.personality,
    reason: form.reason,
    photos: form.photos,
  };
  postStore.create(payload).then((res) => {
    if (res.code !== 0) {
      result.title = '提交失败';
      result.icon = 'close-circle-fill';
      result.color = '#fa3534';
      result.text = res.message;
      result.show = true;
      return;
    }
    const status = res.data.aiReviewStatus;
    if (status === 'pass') {
      result.title = '发布成功';
      result.icon = 'checkmark-circle-fill';
      result.color = '#19be6b';
      result.text = 'AI 审核通过，帖子已公开！';
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
  uni.switchTab({ url: '/pages/adopt/list' });
}
</script>

<style scoped lang="scss">
.publish {
  min-height: 100vh;
  background: #f5f6f8;
  padding: 24rpx 24rpx 140rpx;
  .form { background: #fff; border-radius: 16rpx; padding: 24rpx; margin-top: 20rpx; }
  .radio, .check { margin: 12rpx 20rpx 12rpx 0; }
  .city-row { display: flex; gap: 16rpx; .city-input { margin-right: 16rpx; } }
  .hint { display: block; font-size: 24rpx; color: #909399; margin-bottom: 16rpx; }
  .footer {
    position: fixed;
    left: 0; right: 0; bottom: 0;
    display: flex;
    gap: 16rpx;
    padding: 16rpx 24rpx calc(16rpx + env(safe-area-inset-bottom));
    background: #fff;
    :deep(.u-button) { flex: 1; }
  }
  .result-modal { display: flex; flex-direction: column; align-items: center; gap: 16rpx; padding: 30rpx; .result-text { font-size: 26rpx; color: #606266; text-align: center; } }
}
</style>
