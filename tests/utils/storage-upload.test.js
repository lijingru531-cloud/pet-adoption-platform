import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { uploadImage, chooseImages } from '@/utils/upload';
import { services } from '@/services';

describe('utils/upload (Mock 模式)', () => {
  it('uploadImage 空路径 -> 空串', async () => {
    expect(await uploadImage('')).toBe('');
  });

  it('uploadImage Mock 模式直接以本地路径作为图片标识', async () => {
    const p = await uploadImage('wxfile://tmp_abc.jpg');
    expect(p).toBe('wxfile://tmp_abc.jpg');
  });

  describe('chooseImages（桩 uni.chooseImage）', () => {
    let orig;
    beforeEach(() => {
      orig = uni.chooseImage;
      uni.chooseImage = (opts) =>
        opts && typeof opts.success === 'function' && opts.success({ tempFilePaths: ['a.jpg', 'b.jpg'] });
    });
    afterEach(() => {
      uni.chooseImage = orig;
    });
    it('返回临时路径数组', async () => {
      const paths = await chooseImages(2);
      expect(paths).toEqual(['a.jpg', 'b.jpg']);
    });
  });
});

describe('utils/request (云端模式，node 下仅 import 冒烟)', () => {
  it('模块可 import 且导出 request', async () => {
    const mod = await import('@/utils/request');
    expect(typeof mod.default).toBe('function');
    expect(typeof mod.request).toBe('function');
  });
});

describe('services 选择器（Mock 开关）', () => {
  it('USE_MOCK=true 时 services.isMock 为 true', () => {
    expect(services.isMock).toBe(true);
  });
});
