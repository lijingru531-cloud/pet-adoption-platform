/**
 * 统一请求网关（架构设计 1.2 / 8.3）
 *
 * 封装 uni.request：鉴权头、统一响应归一、统一错误、loading 态。
 * 仅「真实云端模式（USE_MOCK=false）」下被 services/cloud.js 调用；
 * Mock 模式直接读写本地存储，不经过此网关。
 *
 * 统一响应结构：{ code, data, message }
 */
import ENV from '@/env';
import { ERROR_CODE, ERROR_MESSAGE, fail } from '@/constants/errorCode';

let loadingCount = 0;

function showLoading(title = '加载中') {
  loadingCount += 1;
  if (loadingCount === 1) uni.showLoading({ title, mask: true });
}

function hideLoading() {
  loadingCount -= 1;
  if (loadingCount <= 0) {
    loadingCount = 0;
    uni.hideLoading();
  }
}

/** 简易签名（占位）：真实生产应基于约定的密钥与 nonce/timestamp 生成 */
function buildSign(payload) {
  return `sig_${Date.now()}_${(payload && JSON.stringify(payload).length) || 0}`;
}

/**
 * 统一请求
 * @param {object} options
 * @param {string} options.url 云函数名（不含域名）
 * @param {string} [options.method='POST']
 * @param {object} [options.data={}]
 * @param {boolean} [options.auth=true] 是否携带 token
 * @param {boolean} [options.showLoading=true]
 */
export function request({ url, method = 'POST', data = {}, auth = true, showLoading = true }) {
  return new Promise((resolve, reject) => {
    if (showLoading) showLoading();
    const token = uni.getStorageSync('token') || '';
    const header = {
      'Content-Type': 'application/json',
      'X-Sign': buildSign(data),
      'X-Timestamp': String(Date.now()),
    };
    if (auth && token) header['Authorization'] = `Bearer ${token}`;

    uni.request({
      url: `${ENV.CLOUD_BASE_URL}/${url}`,
      method,
      data,
      header,
      success: (res) => {
        const body = res.data;
        if (res.statusCode >= 200 && res.statusCode < 300 && body && typeof body.code === 'number') {
          resolve(body);
          return;
        }
        // 网络层异常归一
        const code =
          res.statusCode === 401 ? ERROR_CODE.UNAUTHORIZED : ERROR_CODE.SERVER_ERROR;
        reject(fail(code, body && body.message) || ERROR_MESSAGE[code]);
      },
      fail: (err) => {
        reject(fail(ERROR_CODE.SERVER_ERROR, err && err.errMsg) || '网络请求失败');
      },
      complete: () => {
        if (showLoading) hideLoading();
      },
    });
  });
}

/** 供云函数直接返回成功/失败（便于 services 复用） */
export { fail, ERROR_CODE, ERROR_MESSAGE };
export default request;
