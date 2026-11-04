# 幸运锦鲤 · 宠物领养与互助平台 — Sprint 1 工程说明

> 技术栈：**uniapp (Vue3 + Vite) + Pinia + uView Plus + WorkBuddy 云服务抽象层**  
> 范围：基础设施 + 登录 + 领养主链路 + AI 审核基础版（Sprint 1）  
> 科普模块（B1/B2/B3）与地图模块（C1–C3）按规划留待 Sprint 2 / Sprint 4，本期仅预留目录与路由。

---

## 1. 目录结构（落地于工作区根目录）

```
宠物领养与互助平台/
├── index.html                 # H5 入口（Vite）
├── package.json
├── vite.config.js             # Vite + @alias '@' -> src
├── jsconfig.json
├── manifest.json              # 多端配置（小程序 AppId / H5 / App）
├── pages.json                 # 路由 + TabBar + easycom(uView/uni-ui)
├── SETUP.md
└── src/
    ├── main.js                # 入口：挂载 Pinia、uView、初始化登录态
    ├── App.vue                # 应用根，未读红点初始化
    ├── uni.scss / styles/global.scss
    ├── env/                   # 环境配置（USE_MOCK 开关、端点、限额）
    ├── constants/             # 错误码 / 枚举 / 业务常量
    ├── utils/                 # request 网关、auth 适配、upload、crypto、minor、format
    ├── prompts/               # AI 提示词集中管理（review/qa/summary）
    ├── services/              # ★ 后端抽象层（Mock / 云端 二选一）
    │   ├── storage.js         # 本地存储（Mock 数据库）
    │   ├── ai.js              # ★ AI 网关：合规过滤/日限频/上下文截断/审核/问答
    │   ├── mock.js            # 本地 Mock 后端（离线可运行，含种子数据）
    │   ├── cloud.js           # 云端实现（函数名/参数与架构设计一致）
    │   └── index.js           # 选择器：按 ENV.USE_MOCK 切换
    ├── api/                   # 业务门面（页面/store 统一调用入口）
    ├── store/                 # Pinia：user / post / conversation / ai
    ├── components/            # post-card / filter-bar / chat-bubble / safety-tip-modal / report-modal / empty-state / map-picker(占位)
    └── pages/                 # home / adopt / publish / science(占位) / message / mine / lostpet(占位) / login
```

---

## 2. 安装依赖

```bash
# 使用 HBuilderX 打开本目录，或命令行用 uni 脚手架：
npm install
# 若需 H5/小程序/App 构建，确保已安装对应平台依赖（@dcloudio/uni-h5、@dcloudio/uni-mp-weixin 等已在 package.json）
```

> 未安装依赖时不影响源码审阅；首次 `npm install` 可能因平台包体积较大耗时数分钟。

---

## 3. 运行 / 构建三端

```bash
# 微信小程序（需微信开发者工具 + 配置 manifest.json 中 mp-weixin.appid）
npm run dev:mp-weixin
npm run build:mp-weixin

# H5
npm run dev:h5
npm run build:h5

# App（需 HBuilderX 或云端打包）
npm run dev:app
npm run build:app
```

---

## 4. Mock 与真实云端切换

所有后端调用经 `src/services/index.js` 统一出口；底层 `mock.js`（本地存储模拟）与 `cloud.js`（真实云函数）接口契约完全一致，仅由 `src/env/config.js` 的开关决定：

```js
// src/env/config.js
export default {
  USE_MOCK: true,          // true=本地 Mock；改为 false 即走真实云端
  CLOUD_BASE_URL: '',      // 真实云端函数统一入口（WorkBuddy cloud-service）
  AI_DAILY_QUOTA: 20,      // 单用户每日 AI 调用上限
  ENABLE_MAP: false,       // 地图模块（P2）开关
  MINOR_RESTRICT: true,    // 未成年限制发布/领养
}
```

- **Mock 模式（默认）**：无需任何后端，前端可完整离线运行与演示（含种子帖子、模拟登录、模拟 AI 审核）。
- **云端模式**：将 `USE_MOCK` 置 `false`，并填写 `CLOUD_BASE_URL`；`src/services/cloud.js` 已按架构设计 §3.3 的函数名/参数（`auth-login`、`post-create`、`conversation-create`、`message-send`、`conversation-decide`、`report-create`、`ai-chat` …）封装 `uni.request`，云端侧实现对应云函数即可无缝接入。

---

## 5. AI 管理员网关接入说明（`services/ai.js`）

遵循架构设计 §1.4「AI 网关单一出入口」原则，前端/审核服务永不直接调用大模型：

| 能力     | 实现                                         | 说明                                                           |
| ------ | ------------------------------------------ | ------------------------------------------------------------ |
| 合规前置过滤 | `complianceFilter(text)`                   | 极端敏感词（食用猫狗等）命中即 **block + 上报**；普通敏感词命中即 **review（转人工）**      |
| 日限频    | `enforceQuota(userId)`                     | 按 `userId + 日期` 计数，默认 20 次/日（架构设计 1.4），超限返回 `QUOTA_EXCEEDED` |
| 上下文截断  | `truncateContext(turns)`                   | 保留最近 10 轮且 ≤4000 字符（可配）                                      |
| 文本审核   | `reviewText({targetType, targetId, text})` | 发帖时由 `post.create` 内部触发，写入审核记录（可审计）                          |
| 摘要/标签  | `generateSummary(text)`                    | D3 占位，云端模式经 ai-gateway 生成                                    |
| 科普问答   | `chat({userId, question})`                 | 仅打通网关调用占位，问答 UI 属 Sprint 2                                   |

**接入真实免密钥大模型**：云端模式由 `cloud.js` 的 `ai-chat` 云函数内部调用平台 ai-gateway（密钥由平台托管，前端不持有），`services/ai.js` 的 `chat()` 在云端模式直接委托该云函数，无需改动业务代码。

**图片审核（已知限制）**：`reviewImages()` 为占位实现，打印 `pendingApi: true` 并标注 `TODO`。免密钥大模型大概率不支持图片识别，需搭配内容安全 API（微信 `imgSecCheck` / 云厂商）后填充（见 §7）。

---

## 6. 关键合规点落地

- **联系方式隐私**：会话中联系方式经 `utils/crypto.js` 加密为 `contactEnc` 存储，仅会话双方可见，详情/列表不返回（隐私合规 7.5）。
- **未成年限制**：`utils/minor.js` 提供年龄判定占位；`MINOR_RESTRICT=true` 时限制发布/领养（实名校验待接入）。
- **平台外沟通安全提示**：会话发送联系方式和引导性文案前弹 `safety-tip-modal`（Q1）。
- **地图**：本期不做，仅 `map-picker.vue` 占位，街道级模糊预留。

---

## 7. 已知限制与待办（Top 5）

1. **图片审核未接入**：`services/ai.js#reviewImages` 为占位（TODO），需接入内容安全 API（微信 imgSecCheck / 云厂商）。
2. **H5 / App 登录需主体资质**：微信 H5 授权需**公众号服务号**资质；App 需**企业主体 + 开放平台费用 + Universal Link**（待确认项 9.2/9.3），否则走手机号兜底登录。
3. **未成年实名校验占位**：`utils/minor.js` 仅做年龄判定，真实身份证 OCR / 微信实名方案待定（待确认项 9.4）。
4. **免密钥大模型能力边界未联调**：模型名、多模态、速率上限需在接入前确认（待确认项 9.6）；当前 Mock 为规则判定。
5. **科普 / 地图业务未实现**：`science/*`、`lostpet/*` 仅占位页 + 预留 `api/science.js`、`api/lostpet.js` 接口，待 Sprint 2 / Sprint 4 填充。

> 其余非 P0 项（推送细化、短信服务商选型、地图厂商 Key）见架构设计 §9 待明确事项。
