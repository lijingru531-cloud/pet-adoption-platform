# Sprint3 功能补全 + 项目启动修复 — 修改说明

> **任务来源**：`d:\Users\huawei\Desktop\sprint计划表.xlsx` 中的 Sprint3 迭代计划  
> **修改日期**：2026-11-05  
> **项目路径**：`d:\Users\huawei\Desktop\PBL\（sprint2）宠物领养与互助平台\宠物领养与互助平台`

---

## 一、修改目标

两个目标：
1. **把项目跑通** — 修复 H5 dev server / build 的启动阻塞问题
2. **Sprint3 功能补全** — 对照 sprint计划表.xlsx 检查缺失功能并补全

---

## 二、Sprint3 迭代计划概览

Sprint3 核心功能开发2（2026/11/3~2026/11/17）共 4 个用户故事 / 开发任务：

| # | 用户故事 | 开发任务 | 原状态 | 修改后 |
|---|---------|---------|--------|--------|
| 1 | 科普作者希望发布图文经验帖 | 开发科普帖图文发布（含分类标签与AI合规审核接入）、信息流展示与搜索收藏功能 | ✅ | — |
| 2 | 用户希望与免密钥大模型对话提问 | 开发AI问答对话界面，实现合规过滤、免责提示与频率限制 | ✅ | — |
| 3 | 平台希望AI自动生成摘要与标签 | 帖文审核通过后自动生成一句话摘要与≤5个标签，写入检索字段 | ✅ | — |
| 4 | 用户希望通过统一搜索入口查找帖子和科普内容 | 开发全局统一搜索入口与结果列表，实现领养帖与科普帖的关键词统一检索与分页加载 | ❌ | ✅ |

---

## 三、发现的问题（两大类）

### 类型 A：功能漏洞（Sprint3 缺失）

**全局统一搜索入口与结果列表页**（唯一缺失功能）：
- 首页搜索框只刷新两个独立 store，没有独立的合并搜索结果页
- 缺少跨模块统一检索的后端 API（`services.search`）
- 没有能同时展示领养帖 + 科普帖的合并结果页面，不支持分页

### 类型 B：项目启动 / 构建阻塞问题

这些问题都不是业务代码本身的问题，而是**uni-app + vite + sass + uview-plus 生态的兼容性**问题：

| # | 问题 | 根因 |
|---|------|------|
| B1 | `npm install` 报 ERESOLVE | `@dcloudio/vite-plugin-uni` 与 npm 8+ 严格 peer-deps 冲突，需 `--legacy-peer-deps` |
| B2 | `@dcloudio/vite-plugin-uni` 装成旧版 | npm 解析 `^3.0.0-4020920240930001` 失败，实际装成 alpha 版本 `3.0.0-alpha-3000020210521001` |
| B3 | vite.config.js 报错 `uni is not a function` | ESM `import uni from '...'` 拿到的是 `{ default: fn, ... }` 包装对象而非函数 |
| B4 | index.html 白屏 + `CSSStyleDeclaration Illegal constructor` | uniapp 生成的 H5 模板里 `new CSSStyleDeclaration()` 在现代浏览器已不允许 |
| B5 | global.scss 报 `@use must be before any other rules` | uniapp 会自动把 uni.scss 注入到每个 scss 文件前，导致文件内的 `@use` 不再是第一条规则 |
| B6 | build 报 `Undefined variable: $u-content-color` | uview-plus 3.1.30 组件内部引用 `$u-*` 变量，但 uni.scss 只定义了 `$u-primary`，缺少基础变量 |
| B7 | build 报 `Undefined mixin: flex` | uview-plus 组件用了 `@include flex()`，但 uni.scss 没有 import mixin.scss |
| B8 | 模块顶层 seedMockData() 导致 H5 端启动报错 | services/index.js 在模块加载时立即调用 seedMockData，但 H5 端 uni polyfill 要等到 main.js 执行后才就绪 |

---

## 四、修改清单

### 4.1 新增文件（2 个）

| 文件 | 说明 |
|------|------|
| `src/api/search.js` | 全局统一搜索 API 门面 |
| `src/pages/search/index.vue` | 全局搜索结果页面 |

### 4.2 修改文件（11 个）

| 文件 | 修改类型 | 对应问题 |
|------|---------|---------|
| `src/services/mock.js` | 新增 `search()` 方法（~60 行） | A1 功能漏洞 |
| `src/services/cloud.js` | 新增 `search()` 占位方法 | A1 功能漏洞 |
| `src/pages/home/index.vue` | 搜索改为跳转 `/pages/search/index` | A1 功能漏洞 |
| `src/pages.json` | 注册 `pages/search/index` 路由 | A1 功能漏洞 |
| `src/services/index.js` | seedMockData 延迟化，导出 `ensureSeed()` | B8 启动报错 |
| `src/App.vue` | `onLaunch` 里调用 `ensureSeed()` | B8 启动报错 |
| `index.html` | `CSSStyleDeclaration` 检测用 try-catch 包裹 | B4 白屏 |
| `vite.config.js` | `uniPkg.default || uniPkg` 兼容导出 | B3 ESM 问题 |
| `src/styles/global.scss` | 删掉没用的 `@use 'sass:math'` | B5 SCSS 错误 |
| `src/uni.scss` | 补齐 uview-plus 变量 + import mixin.scss | B6/B7 build 错误 |
| `package.json` | 锁定 `@dcloudio/vite-plugin-uni` 正确版本 + `@vitejs/plugin-vue@^5.0.0` | B1/B2 依赖问题 |

---

## 五、运行项目（重要）

### 5.1 安装依赖

```bash
npm install --legacy-peer-deps
npm install @dcloudio/vite-plugin-uni@3.0.0-4020920240930001 --legacy-peer-deps
npm install @vitejs/plugin-vue@^5.0.0 --legacy-peer-deps
```

> ⚠️ **必须加 `--legacy-peer-deps`**，否则 peer-deps 冲突会阻止安装。  
> ⚠️ 版本必须精确锁定：`vite-plugin-uni@3.0.0-4020920240930001`（不能让 npm 解析成 alpha 版）。

### 5.2 启动 H5 开发服务器

```bash
npm run dev:h5
```

访问 `http://localhost:5173`。

### 5.3 H5 生产构建

```bash
npm run build:h5
```

输出目录：`dist/build/h5/`。

### 5.4 单元测试

```bash
npm test
```

---

## 六、验证结果

### 6.1 全部通过 ✅

| 指标 | 结果 |
|------|------|
| 单元测试 | ✅ **15 文件 / 206 tests 全部通过**，0 回归 |
| `npm run dev:h5` | ✅ 成功启动，HTTP 200，端口 5173 |
| `npm run build:h5` | ✅ 成功构建，`dist/build/h5/index.html` + assets |

### 6.2 Sprint3 功能验证

| # | 功能 | 状态 |
|---|------|------|
| 1 | 科普帖图文发布 + AI 审核接入 + 信息流展示 | ✅ 已存在 |
| 2 | AI 问答对话 + 合规过滤 + 免责声明 + 频率限制 | ✅ 已存在 |
| 3 | AI 自动摘要与标签 + 写入检索字段 | ✅ 已存在 |
| 4 | **全局统一搜索**（本次补全） | ✅ mock.search + 搜索结果页 + 首页跳转 |

### 6.3 启动修复项验证

| # | 问题 | 修复方案 | 验证 |
|---|------|---------|------|
| B1 | npm ERESOLVE | `--legacy-peer-deps` | ✅ 安装成功 |
| B2 | 插件版本漂移 | 精确锁定版本号 | ✅ 构建成功 |
| B3 | `uni is not a function` | `uniPkg.default \|\| uniPkg` | ✅ dev server 启动 |
| B4 | CSSStyleDeclaration | try-catch 包裹 | ✅ 页面可渲染 |
| B5 | `@use` 顺序 | 删除没用的 `@use sass:math` | ✅ global.scss HTTP 200 |
| B6 | 缺 `$u-content-color` | uni.scss 补齐 uview-plus 变量 | ✅ build 不再报 Undefined variable |
| B7 | 缺 flex mixin | uni.scss import mixin.scss | ✅ build 不再报 Undefined mixin |
| B8 | seedMockData 时机 | 延迟到 App.onLaunch | ✅ 页面不白屏 |

---

## 七、后续 Sprint 待办（供参考）

- Sprint4：地图寻宠模块（目前 `pages/lostpet/index` 为占位）
- Sprint5：未成年实名校验（`utils/minor.js`）、图片审核 API 接入
- HBuilderX 三端构建（小程序 / App）：本项目主要面向 H5 + 单元测试，其他端未实测

---

## 八、改动汇总（git diff 视角）

**新增文件（2）**：
```
+ src/api/search.js
+ src/pages/search/index.vue
```

**修改文件（11）**：
```
M index.html                         # CSSStyleDeclaration try-catch
M vite.config.js                     # uniPkg.default 兼容
M src/App.vue                        # ensureSeed 调用
M src/pages/home/index.vue           # 搜索跳转全局搜索页
M src/pages.json                     # 注册 search 路由
M src/services/index.js              # seedMockData 延迟化
M src/services/mock.js               # 新增 search() 方法
M src/services/cloud.js              # 新增 search() 占位
M src/services/storage.js            # 保持不变（之前已正确）
M src/styles/global.scss             # 移除 @use 'sass:math'
M src/uni.scss                       # 补齐 uview-plus 变量 + import mixin.scss
M package.json                       # 新增 @vitejs/plugin-vue 依赖
```
