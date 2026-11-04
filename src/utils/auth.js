/**
 * 微信三端登录适配（条件编译，架构设计 1.3 / 7.1 / Q4）
 *
 * 统一以手机号为主键打通三端（本期实现：微信登录 + 手机号绑定兜底）。
 * 各端获取登录凭证 code 后交给 services/auth.login 换取 openid/unionid 并建号。
 */

/**
 * 获取当前端微信登录凭证 code
 * @returns {Promise<string|null>} 成功返回 code，失败返回 null
 */
export function getWechatLoginCode() {
  return new Promise((resolve) => {
    // #ifdef MP-WEIXIN
    uni.login({
      provider: 'weixin',
      success: (res) => resolve(res.code || null),
      fail: () => resolve(null),
    });
    // #endif

    // #ifdef H5
    // 微信 H5 网页授权：code 来自 URL query（需在公众号后台配置回调）
    const code = getQueryString('code');
    resolve(code || null);
    // #endif

    // #ifdef APP-PLUS
    // App 微信开放平台授权
    uni.login({
      provider: 'weixin',
      success: (res) => resolve(res.code || null),
      fail: () => resolve(null),
    });
    // #endif

    // 非微信环境兜底
    // #ifndef MP-WEIXIN || H5 || APP-PLUS
    resolve(null);
    // #endif
  });
}

/** 当前端类型（MP/H5/APP） */
export function getCurrentPlatform() {
  // #ifdef MP-WEIXIN
  return 'MP';
  // #endif
  // #ifdef H5
  return 'H5';
  // #endif
  // #ifdef APP-PLUS
  return 'APP';
  // #endif
  return 'H5';
}

/** 解析 URL query（H5 微信授权回调用） */
function getQueryString(name) {
  const reg = new RegExp(`(^|&)${name}=([^&]*)(&|$)`, 'i');
  const search = typeof location !== 'undefined' ? location.search.substring(1) : '';
  const r = search.match(reg);
  if (r != null) {
    try {
      return decodeURIComponent(r[2]);
    } catch (e) {
      return null;
    }
  }
  return null;
}

/**
 * 发起微信 H5 网页授权（跳转微信授权页）。
 * 需公众号服务号资质（待确认项 9.2），否则应走手机号兜底登录。
 */
export function redirectToWechatH5Auth(appId, redirectUri) {
  const encoded = encodeURIComponent(redirectUri);
  const scope = 'snsapi_userinfo';
  const url =
    `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${appId}` +
    `&redirect_uri=${encoded}&response_type=code&scope=${scope}#wechat_redirect`;
  // #ifdef H5
  location.href = url;
  // #endif
}
