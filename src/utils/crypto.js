/**
 * 联系方式字段加密工具
 *
 * ⚠️ 安全说明（占位实现，仅供 Mock / 演示）：
 * 真实生产应通过「端到端加密（E2EE）」+ 服务端 RLS 权限控制，
 * 使联系方式仅对话双方经云函数读取，且服务端不公开索引（架构设计 7.5）。
 * 此处使用轻量混淆（Base64 + XOR）演示「加密存储」意图，
 * 切勿视为真实加密方案——接入云端时替换为 WebCrypto/平台 KMS。
 */

const SECRET = 'pet-adoption-demo-secret';

function xor(str) {
  let out = '';
  for (let i = 0; i < str.length; i += 1) {
    out += String.fromCharCode(str.charCodeAt(i) ^ SECRET.charCodeAt(i % SECRET.length));
  }
  return out;
}

function toBase64(str) {
  // 兼容小程序/H5/App 的编码
  try {
    if (typeof btoa === 'function') return btoa(unescape(encodeURIComponent(str)));
  } catch (e) {
    /* ignore */
  }
  if (typeof uni !== 'undefined' && uni.arrayBufferToBase64) {
    const bytes = [...unescape(encodeURIComponent(str))].map((c) => c.charCodeAt(0));
    return uni.arrayBufferToBase64(new Uint8Array(bytes).buffer);
  }
  return str;
}

function fromBase64(str) {
  try {
    if (typeof atob === 'function') return decodeURIComponent(escape(atob(str)));
  } catch (e) {
    /* ignore */
  }
  return str;
}

/** 加密联系方式明文 -> 密文（contactEnc） */
export function encryptContact(plainText) {
  if (!plainText) return '';
  return toBase64(xor(String(plainText)));
}

/** 解密 contactEnc -> 明文（仅会话双方调用） */
export function decryptContact(enc) {
  if (!enc) return '';
  try {
    return xor(fromBase64(String(enc)));
  } catch (e) {
    return '';
  }
}

/** 手机号脱敏：138****8888 */
export function maskMobile(mobile) {
  if (!mobile) return '';
  const s = String(mobile);
  if (s.length < 7) return s;
  return `${s.slice(0, 3)}****${s.slice(-4)}`;
}
