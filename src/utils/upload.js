/**
 * 图片上传工具（云存储 / Mock）
 *
 * Mock 模式：直接返回本地临时路径（最多 6 张）。
 * 云端模式：上传至平台文件存储，返回可访问 URL。
 */
import ENV from '@/env';

/**
 * @param {string} filePath 本地临时路径（uni.chooseImage 返回）
 * @returns {Promise<string>} 返回图片标识/URL
 */
export function uploadImage(filePath) {
  if (!filePath) return Promise.resolve('');
  if (ENV.USE_MOCK) {
    // Mock：本地路径即作为图片标识（演示用）
    return Promise.resolve(filePath);
  }
  // 云端：真实上传到 WorkBuddy 文件存储
  return new Promise((resolve, reject) => {
    uni.uploadFile({
      url: `${ENV.CLOUD_BASE_URL}/upload`,
      filePath,
      name: 'file',
      header: { Authorization: `Bearer ${uni.getStorageSync('token') || ''}` },
      success: (res) => {
        try {
          const body = JSON.parse(res.data);
          resolve(body.data && body.data.url ? body.data.url : filePath);
        } catch (e) {
          reject(new Error('上传失败'));
        }
      },
      fail: (err) => reject(err),
    });
  });
}

/**
 * 选择图片（封装 uni.chooseMedia，限制数量）
 * @param {number} count 最多张数
 */
export function chooseImages(count = 1) {
  return new Promise((resolve) => {
    // #ifdef MP-WEIXIN
    uni.chooseMedia({
      count,
      mediaType: ['image'],
      success: (res) => resolve(res.tempFiles.map((f) => f.tempFilePath)),
      fail: () => resolve([]),
    });
    // #endif

    // #ifndef MP-WEIXIN
    uni.chooseImage({
      count,
      success: (res) => resolve(res.tempFilePaths || []),
      fail: () => resolve([]),
    });
    // #endif
  });
}
