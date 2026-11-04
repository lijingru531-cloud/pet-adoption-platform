<template>
  <view class="map-picker">
    <!--
      P2 寻宠模块地图选点（架构设计 7.2 / Q3）。
      本期地图能力不做；此处为预留适配层占位，
      真实实现需通过 map-sdk 抽象层屏蔽微信/JS API/原生差异，
      并将坐标模糊到街道级（geo 精度截断）以保护隐私。
    -->
    <u-empty mode="location" text="地图选点将于 Sprint 4（寻宠模块）上线" />
  </view>
</template>

<script setup>
// TODO(Sprint4): 接入高德/腾讯地图 SDK，实现街道级模糊选点
</script>

<style scoped lang="scss">
.map-picker {
  width: 100%;
  height: 360rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f6f8;
  border-radius: 12rpx;
}
</style>
