<template>
  <view class="profile">
    <view class="avatar-row" @click="changeAvatar">
      <u-avatar :src="form.avatar" size="120" />
      <text class="tip">点击更换头像</text>
    </view>

    <u-form label-position="top" class="form">
      <u-form-item label="昵称">
        <u-input v-model="form.nickname" placeholder="请输入昵称" />
      </u-form-item>
      <u-form-item label="城市">
        <u-input v-model="form.city" placeholder="如：深圳" />
      </u-form-item>
      <u-form-item label="个人简介">
        <u-textarea v-model="form.bio" placeholder="一句话介绍自己" height="120" />
      </u-form-item>
    </u-form>

    <u-button type="primary" text="保存" :loading="saving" @click="save" />
  </view>
</template>

<script setup>
import { onShow } from '@dcloudio/uni-app';
import { reactive, ref } from 'vue';
import { useUserStore } from '@/store/user';
import { chooseImages, uploadImage } from '@/utils/upload';

const userStore = useUserStore();
const saving = ref(false);
const form = reactive({ nickname: '', avatar: '', city: '', bio: '' });

onShow(() => {
  const u = userStore.user || {};
  form.nickname = u.nickname || '';
  form.avatar = u.avatar || '';
  form.city = u.city || '';
  form.bio = u.bio || '';
});

async function changeAvatar() {
  const paths = await chooseImages(1);
  if (!paths.length) return;
  const url = await uploadImage(paths[0]);
  form.avatar = url;
}

function save() {
  if (!form.nickname) return uni.$u.toast('昵称不能为空');
  saving.value = true;
  userStore.updateProfile(form).then((res) => {
    saving.value = false;
    if (res.code === 0) {
      uni.$u.toast('已保存');
      setTimeout(() => uni.navigateBack(), 600);
    } else {
      uni.$u.toast(res.message);
    }
  });
}
</script>

<style scoped lang="scss">
.profile {
  min-height: 100vh;
  background: #f5f6f8;
  padding: 30rpx 24rpx;
  .avatar-row {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12rpx;
    margin-bottom: 30rpx;
    .tip { font-size: 22rpx; color: #909399; }
  }
  .form { background: #fff; border-radius: 16rpx; padding: 24rpx; margin-bottom: 30rpx; }
}
</style>
