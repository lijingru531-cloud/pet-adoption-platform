import { describe, it, expect } from 'vitest';
import {
  fromNow,
  formatDateTime,
  formatAge,
  formatLocation,
  firstPhoto,
} from '@/utils/format';
import dayjs from 'dayjs';

describe('utils/format', () => {
  describe('fromNow', () => {
    it('空值返回空串', () => {
      expect(fromNow(0)).toBe('');
      expect(fromNow(null)).toBe('');
      expect(fromNow(undefined)).toBe('');
    });

    it('刚刚（<1 分钟）', () => {
      expect(fromNow(Date.now())).toBe('刚刚');
    });

    it('x 分钟前', () => {
      expect(fromNow(Date.now() - 5 * 60 * 1000)).toBe('5分钟前');
    });

    it('x 小时前', () => {
      expect(fromNow(Date.now() - 3 * 60 * 60 * 1000)).toBe('3小时前');
    });

    it('x 天前（<7天）', () => {
      expect(fromNow(Date.now() - 2 * 24 * 60 * 60 * 1000)).toBe('2天前');
    });

    it('>=7 天返回 YYYY-MM-DD 日期', () => {
      const ts = Date.now() - 10 * 24 * 60 * 60 * 1000;
      expect(fromNow(ts)).toBe(dayjs(ts).format('YYYY-MM-DD'));
    });
  });

  describe('formatDateTime', () => {
    it('空值返回空串', () => {
      expect(formatDateTime('')).toBe('');
      expect(formatDateTime(null)).toBe('');
    });
    it('格式化 YYYY-MM-DD HH:mm', () => {
      const ts = new Date(2024, 0, 2, 3, 4).getTime();
      expect(formatDateTime(ts)).toBe('2024-01-02 03:04');
    });
  });

  describe('formatAge', () => {
    it('null/undefined -> 未知', () => {
      expect(formatAge(null)).toBe('未知');
      expect(formatAge(undefined)).toBe('未知');
    });
    it('不足 12 个月 -> x 个月', () => {
      expect(formatAge(5)).toBe('5 个月');
    });
    it('恰好 12 个月 -> 1 岁', () => {
      expect(formatAge(12)).toBe('1 岁');
    });
    it('有余数 -> x 岁 y 个月', () => {
      expect(formatAge(15)).toBe('1 岁 3 个月');
      expect(formatAge(26)).toBe('2 岁 2 个月');
    });
    it('整年 -> x 岁', () => {
      expect(formatAge(24)).toBe('2 岁');
    });
  });

  describe('formatLocation', () => {
    it('空值 -> 未知', () => {
      expect(formatLocation(null)).toBe('未知');
      expect(formatLocation({})).toBe('未知');
    });
    it('仅城市', () => {
      expect(formatLocation({ city: '深圳' })).toBe('深圳');
    });
    it('城市+区 用 · 连接', () => {
      expect(formatLocation({ city: '深圳', district: '南山区' })).toBe('深圳 · 南山区');
    });
  });

  describe('firstPhoto', () => {
    it('空数组 -> 空串', () => {
      expect(firstPhoto([])).toBe('');
      expect(firstPhoto(null)).toBe('');
    });
    it('返回首张', () => {
      expect(firstPhoto(['a.jpg', 'b.jpg'])).toBe('a.jpg');
    });
  });
});
