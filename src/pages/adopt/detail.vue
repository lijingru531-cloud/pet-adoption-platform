<template>
  <view class="detail" v-if="postStore.detail">
    <!-- 顶部操作 -->
    <view class="top-actions">
      <u-icon name="more-dot-fill" size="40" color="#303133" @click="showReport = true" />
    </view>

    <!-- 照片轮播 -->
    <u-swiper
      :list="photos"
      height="420"
      radius="0"
      :autoplay="false"
      indicator
      indicator-mode="line"
    />

    <!-- 信息与操作 -->
    <view class="card">
      <view class="title-row">
        <text class="breed">{{ post.breed }}</text>
        <u-tag :text="statusLabel" :type="statusType" size="mini" />
      </view>
      <view class="meta">{{ ageText }} · {{ genderLabel }} · {{ locationText }}</view>

      <u-cell-group :border="false">
        <u-cell title="物种" :value="speciesLabel" />
        <u-cell title="品种" :value="post.breed" />
        <u-cell title="年龄" :value="ageText" />
        <u-cell title="性别" :value="genderLabel" />
        <u-cell title="健康" :value="healthText" />
        <u-cell title="所在地" :value="locationText" />
      </u-cell-group>

      <view class="block">
        <text class="block-title">性格</text>
        <text class="block-text">{{ post.personality || '未填写' }}</text>
      </view>
      <view class="block">
        <text class="block-title">送养原因</text>
        <text class="block-text">{{ post.reason }}</text>
      </view>
    </view>

    <!-- 发帖人 -->
    <view class="card author" v-if="post.author">
      <u-avatar :src="post.author.avatar" size="64" />
      <view class="author-info">
        <text class="name">{{ post.author.nickname }}</text>
        <text class="sub">送养人</text>
      </view>
    </view>

    <!-- 底部操作栏 -->
    <view class="footer">
      <view class="fav" @click="onFavorite">
        <u-icon :name="favorited ? 'star-fill' : 'star'" :color="favorited ? '#ff9900' : '#909399'" size="36" />
        <text class="fav-text">{{ favorited ? '已收藏' : '收藏' }}</text>
      </view>

      <!-- 发帖人：状态管理 -->
      <block v-if="isAuthor">
        <u-button
          v-if="post.status === 'adoptable'"
          size="mini"
          text="撤下"
          @click="onChangeStatus('taken_down')"
        />
        <u-button
          v-if="post.status === 'taken_down'"
          size="mini"
          type="primary"
          text="重新上架"
          @click="onChangeStatus('adoptable')"
        />
        <u-button
          v-if="post.status === 'adoptable'"
          size="mini"
          type="warning"
          text="标记已预定"
          @click="onChangeStatus('reserved')"
        />
      </block>

      <!-- 领养人：发起领养 -->
      <u-button
        v-else
        type="primary"
        text="我要领养"
        :disabled="post.status !== 'adoptable'"
        @click="onAdopt"
      />
    </view>

    <report-modal
      :show="showReport"
      target-type="post"
      :target-id="post._id"
      @submit="onReport"
      @close="showReport = false"
    />
  </view>
</template>

<script setup>
import { onLoad } from '@dcloudio/uni-app';
import { computed, ref } from 'vue';
import { usePostStore } from '@/store/post';
import { useUserStore } from '@/store/user';
import { createReport } from '@/api/report';
import { createConversation } from '@/api/conversation';
import ReportModal from '@/components/report-modal.vue';
import {
  POST_STATUS_LABEL,
  GENDER_LABEL,
  SPECIES_LABEL,
  HEALTH_STATUS_LABEL,
} from '@/constants/enum';
import { formatAge, formatLocation } from '@/utils/format';

const postStore = usePostStore();
const userStore = useUserStore();
const postId = ref('');
const favorited = ref(false);
const showReport = ref(false);

const post = computed(() => postStore.detail || {});
const photos = computed(() => (post.value.photos || []).map((p) => ({ image: p })));
const statusLabel = computed(() => POST_STATUS_LABEL[post.value.status] || post.value.status);
const statusType = computed(() => {
  const map = { adoptable: 'success', reserved: 'primary', pending: 'warning', adopted: 'info', taken_down: 'error' };
  return map[post.value.status] || 'info';
});
const speciesLabel = computed(() => SPECIES_LABEL[post.value.species] || '');
const genderLabel = computed(() => GENDER_LABEL[post.value.gender] || '');
const ageText = computed(() => formatAge(post.value.age));
const locationText = computed(() => formatLocation(post.value.location));
const healthText = computed(() =>
  (post.value.healthStatus || []).map((h) => HEALTH_STATUS_LABEL[h]).join('、') || '未知'
);
const isAuthor = computed(() => userStore.user && post.value.authorId === userStore.user._id);

onLoad((query) => {
  postId.value = query.id || '';
  const favs = uni.getStorageSync('mock_db_favorites') || [];
  favorited.value = favs.some((f) => f.targetId === postId.value);
  postStore.fetchDetail(postId.value);
});

function onFavorite() {
  if (!userStore.isLogin) return toLogin();
  postStore.favorite(postId.value).then((res) => {
    if (res.code === 0) {
      favorited.value = res.data.favorited;
      uni.$u.toast(favorited.value ? '已收藏' : '已取消收藏');
    } else {
      uni.$u.toast(res.message);
    }
  });
}

function onAdopt() {
  if (!userStore.isLogin) return toLogin();
  uni.showLoading({ title: '创建会话中' });
  createConversation(postId.value).then((res) => {
    uni.hideLoading();
    if (res.code === 0) {
      uni.navigateTo({ url: `/pages/message/chat?id=${res.data.conversationId}` });
    } else {
      uni.$u.toast(res.message);
    }
  });
}

function onChangeStatus(status) {
  postStore.changeStatus(postId.value, status).then((res) => {
    if (res.code === 0) {
      uni.$u.toast('状态已更新');
      postStore.fetchDetail(postId.value);
    } else {
      uni.$u.toast(res.message);
    }
  });
}

function onReport(payload) {
  createReport(payload).then((res) => {
    showReport.value = false;
    uni.$u.toast(res.code === 0 ? '举报已提交，平台将复核' : res.message);
  });
}

function toLogin() {
  uni.navigateTo({ url: '/pages/login/index' });
}
</script>

<style scoped lang="scss">
.detail {
  min-height: 100vh;
  background: #f5f6f8;
  padding-bottom: 140rpx;
  .top-actions {
    position: fixed;
    top: 20rpx;
    right: 24rpx;
    z-index: 10;
    background: rgba(255, 255, 255, 0.8);
    border-radius: 50%;
    padding: 10rpx;
  }
  .card {
    background: #fff;
    margin: 16rpx;
    border-radius: 16rpx;
    padding: 24rpx;
  }
  .title-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    .breed { font-size: 36rpx; font-weight: 700; color: #303133; }
  }
  .meta { margin-top: 8rpx; font-size: 24rpx; color: #909399; }
  .block { margin-top: 20rpx; .block-title { display: block; font-size: 26rpx; color: #909399; margin-bottom: 8rpx; } .block-text { font-size: 28rpx; color: #303133; line-height: 1.6; } }
  .author { display: flex; align-items: center; gap: 16rpx; .author-info { display: flex; flex-direction: column; } .name { font-size: 28rpx; color: #303133; } .sub { font-size: 22rpx; color: #909399; } }
  .footer {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    gap: 16rpx;
    padding: 16rpx 24rpx calc(16rpx + env(safe-area-inset-bottom));
    background: #fff;
    box-shadow: 0 -2rpx 12rpx rgba(0, 0, 0, 0.05);
    .fav { display: flex; flex-direction: column; align-items: center; min-width: 100rpx; .fav-text { font-size: 22rpx; color: #909399; margin-top: 4rpx; } }
    :deep(.u-button) { flex: 1; }
  }
}
</style>
