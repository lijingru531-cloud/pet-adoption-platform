/**
 * 测试公共辅助：在每用例前清空 Mock 存储并重新注入种子数据，
 * 保证 `services`（单例）内部的集合读到的是干净基线。
 */
import { seedMockData } from '@/services/mock';

export function resetBackend() {
  globalThis.__resetUniStorage();
  seedMockData();
}

let seq = 0;
export function uniq(suffix = '') {
  seq += 1;
  return `u_${Date.now().toString(36)}_${seq}_${suffix}`;
}
