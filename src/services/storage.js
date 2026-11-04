/**
 * 本地存储封装（uni 多端统一）
 * 用于 Mock 模式下的「数据库」与登录态持久化。
 */
export const storage = {
  get(key, def = null) {
    try {
      const v = uni.getStorageSync(key);
      return v === undefined || v === null || v === '' ? def : v;
    } catch (e) {
      return def;
    }
  },
  set(key, val) {
    try {
      uni.setStorageSync(key, val);
    } catch (e) {
      /* ignore quota */
    }
  },
  remove(key) {
    try {
      uni.removeStorageSync(key);
    } catch (e) {
      /* ignore */
    }
  },
};

/** 通用集合存取（Mock 数据库） */
export function collection(name) {
  const key = `mock_db_${name}`;
  return {
    all() {
      return storage.get(key, []);
    },
    save(list) {
      storage.set(key, list);
      return list;
    },
    insert(doc) {
      const list = this.all();
      list.push(doc);
      this.save(list);
      return doc;
    },
    update(id, patch) {
      const list = this.all();
      const idx = list.findIndex((x) => x._id === id);
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...patch };
        this.save(list);
        return list[idx];
      }
      return null;
    },
    find(predicate) {
      return this.all().filter(predicate);
    },
    findOne(predicate) {
      return this.all().find(predicate) || null;
    },
    getById(id) {
      return this.all().find((x) => x._id === id) || null;
    },
    remove(id) {
      this.save(this.all().filter((x) => x._id !== id));
    },
  };
}
