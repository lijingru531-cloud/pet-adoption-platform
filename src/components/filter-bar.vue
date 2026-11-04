<template>
  <view class="filter-bar">
    <u-row gutter="8">
      <u-col span="6">
        <view class="field" @click="openSpecies">
          <text class="label">{{ speciesLabel || '品种' }}</text>
          <u-icon name="arrow-down" size="20" color="#909399" />
        </view>
      </u-col>
      <u-col span="6">
        <view class="field" @click="openGender">
          <text class="label">{{ genderLabel || '性别' }}</text>
          <u-icon name="arrow-down" size="20" color="#909399" />
        </view>
      </u-col>
      <u-col span="6">
        <view class="field" @click="openHealth">
          <text class="label">{{ healthLabel || '健康' }}</text>
          <u-icon name="arrow-down" size="20" color="#909399" />
        </view>
      </u-col>
      <u-col span="6">
        <view class="field" @click="openAge">
          <text class="label">{{ ageLabel || '年龄' }}</text>
          <u-icon name="arrow-down" size="20" color="#909399" />
        </view>
      </u-col>
    </u-row>
    <view v-if="filter.city" class="city-row">
      <u-tag :text="`城市：${filter.city}`" size="mini" closable @close="clearCity" />
    </view>

    <u-action-sheet :show="sheet.show" :actions="sheet.actions" title="请选择" @close="sheet.show = false" @select="onSelect" />
  </view>
</template>

<script setup>
import { reactive, computed } from 'vue';
import { SPECIES, SPECIES_LABEL, GENDER, GENDER_LABEL, HEALTH_STATUS, HEALTH_STATUS_LABEL } from '@/constants/enum';

const emit = defineEmits(['change']);
const props = defineProps({
  filter: { type: Object, default: () => ({}) },
});

const filter = reactive({ ...props.filter });
const sheet = reactive({ show: false, key: '', actions: [] });

const speciesLabel = computed(() => (filter.species ? SPECIES_LABEL[filter.species] : ''));
const genderLabel = computed(() => (filter.gender ? GENDER_LABEL[filter.gender] : ''));
const healthLabel = computed(() => (filter.healthStatus ? HEALTH_STATUS_LABEL[filter.healthStatus] : ''));
const ageLabel = computed(() => {
  if (filter.ageMax != null) return `≤${filter.ageMax}月`;
  if (filter.ageMin != null) return `≥${filter.ageMin}月`;
  return '';
});

function emitChange() {
  emit('change', { ...filter });
}

function openSpecies() {
  sheet.key = 'species';
  sheet.actions = Object.keys(SPECIES).map((k) => ({ name: SPECIES_LABEL[SPECIES[k]], value: SPECIES[k] }));
  sheet.show = true;
}
function openGender() {
  sheet.key = 'gender';
  sheet.actions = Object.keys(GENDER).map((k) => ({ name: GENDER_LABEL[GENDER[k]], value: GENDER[k] }));
  sheet.show = true;
}
function openHealth() {
  sheet.key = 'healthStatus';
  sheet.actions = Object.keys(HEALTH_STATUS).map((k) => ({ name: HEALTH_STATUS_LABEL[HEALTH_STATUS[k]], value: HEALTH_STATUS[k] }));
  sheet.show = true;
}
function openAge() {
  sheet.key = 'ageMax';
  sheet.actions = [
    { name: '不限', value: '' },
    { name: '≤6 个月', value: 6 },
    { name: '≤1 岁', value: 12 },
    { name: '≤3 岁', value: 36 },
  ];
  sheet.show = true;
}
function onSelect(item) {
  const key = sheet.key;
  if (item.value === '' || item.value == null) delete filter[key];
  else filter[key] = item.value;
  sheet.show = false;
  emitChange();
}
function clearCity() {
  delete filter.city;
  emitChange();
}
</script>

<style scoped lang="scss">
.filter-bar {
  background: #fff;
  padding: 16rpx 20rpx;
  .field {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 64rpx;
    padding: 0 20rpx;
    background: #f5f6f8;
    border-radius: 100rpx;
    .label { font-size: 24rpx; color: #606266; }
  }
  .city-row { margin-top: 12rpx; }
}
</style>
