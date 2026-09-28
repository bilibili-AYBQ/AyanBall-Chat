# AyanBall Chat

专业桌面聊天软件（Tauri 2 + React 19 + TypeScript + Vite + Tailwind + Zustand，Rust 后端）。

**服务端已改造为 Netlify 动态部署**：Netlify Functions（业务接口）+ Netlify Blobs（数据/文件存储）+ Pusher（毫秒级实时通道），不再依赖常驻 Node.js 进程，可免费部署到 Netlify。

UI 参考了 QQ/微信的 IM 产品形态（**聊天壁纸、会话窗口顶部语音/视频/屏幕共享入口、群聊管理**）与 XIGUA Security 10x 的 Apple 风设计语言（白侧边栏 / 圆角卡片 / 柔和阴影），但为**原创实现**：默认白色主题、可深色/跟随系统、无表情包、丝滑交互，定位专业办公通讯。

---

## ✨ 功能清单

| 模块 | 说明 |
|---|---|
| 账号系统 | 打开即登录/注册；**首个注册用户自动成为管理员（无敌的存在）**；服务端支持 `ADMIN_KEY` 提升任意用户 |
| **头像** | QQ 风格：**12 个矢量预设头像**（注册时即可选择）+ **自定义上传**（≤200KB），聊天消息/会话列表/好友/群成员/通话列表全部显示头像，换头像即时同步给好友 |
| 好友 | 添加好友（按用户名搜索+申请）、好友设置（拉黑/解除拉黑/删除好友）、好友申请处理 |
| **群管理** | 创建群聊（邀请码）、邀请码/用户名邀请加群、**设管理员/撤销管理员、踢人、转让群主、解散群聊、群成员上限 100 人**；群主不能直接退群（需先转让） |
| 拉黑 | 双向拉黑即双向禁言（服务端强制拦截），黑名单管理页 |
| 消息 | 私聊/群聊、消息气泡（我方靠右/对方靠左）、未读角标、会话搜索 |
| 文件 | **仅支持 ≤50MB**，超限弹窗提示："目前服务器原因，仅支持发送50MB以内的文件，且有效期3天！！！"；服务端强制 413 拦截；文件 **3 天有效**，过期自动清理 |
| 通话 | 语音通话 / 视频通话 / 屏幕共享（WebRTC + 信令中转）；**发起前强制弹出反诈安全知识提示**；入口在聊天窗口顶部（QQ 风格） |
| **聊天壁纸** | QQ 风格：默认/极光/海洋/落日/森林 5 种内置壁纸 + 上传自定义图片（≤5MB，本地保存） |
| 通知 | **Windows 气泡弹窗**（Tauri 原生 Toast，Windows 10+）；浏览器环境自动降级 Web Notification / 应用内气泡 |
| 提醒音 | 内置清脆提示音（`src/assets/notify.mp3`），可在设置中开关 |
| 多语言 | 简体中文 / English / 繁體中文 一键切换，实时生效 |
| **主题** | **默认浅色（白色）**，可切换深色 / **跟随系统**（官方 `prefers-color-scheme` + `matchMedia` 写法，实时响应系统切换） |
| 窗口 | **无边框窗口 + 自绘标题栏**：最小化/最大化/关闭采用 **Tauri 2 官方标准写法**（`@tauri-apps/api/window` + `data-tauri-drag-region` + capabilities 权限声明） |
| 设置 | 个人资料（**更换头像**）、外观主题（三态）、聊天壁纸、界面语言、服务器地址、通知/声音开关、管理员面板、退出登录 |
| 侧边栏 | 4 个**清晰矢量图标**（消息气泡/通讯录/电话/齿轮），一眼可辨，激活态蓝色胶囊高亮 |

---

## 🛠 技术栈

- 客户端：**Tauri 2.0**（Rust 后端）+ **React 19** + **TypeScript** + **Vite** + **Tailwind CSS v4** + **Zustand**
- 动态服务端：**Netlify Functions**（注册/登录/好友/群管理/消息/文件/管理面板 API）
- 数据与文件：**Netlify Blobs**（用户/群/会话/消息分 key 持久化；文件 ≤50MB 预签名直传，3 天有效）
- 实时通道：**Pusher Channels**（消息 `private-conv_*` / 个人事件 `private-user_*` / 通话信令 `private-call_*`；免费 Sandbox：100 并发连接 / 20 万消息每天 / 100 频道，个人项目足够，量大需升级）
- 通话：WebRTC（STUN: stun.l.google.com:19302）+ Pusher 信令中转

---

## 📁 目录结构（客户端）

```
AyanBall-Chat/
├─ index.html / vite.config.ts / netlify.toml / package.json
├─ src/                      # React 前端
│  ├─ App.tsx                # 主入口（登录态路由 + 主题跟随系统 + 全局弹窗）
│  ├─ api/client.ts          # HTTP(Netlify Functions) + Pusher 实时客户端 + 事件路由
│  ├─ lib/                   # webrtc / 通知 / 提醒音 / 格式化
│  ├─ stores/                # Zustand：auth / chat / friend / call / settings(主题三态+壁纸) / toast
│  ├─ components/            # Sidebar / ChatWindow(壁纸+群管理) / GroupManageModal / SettingsPanel ...
│  ├─ i18n/                  # 中 / 英 / 繁体 字典
│  └─ assets/                # app-icon.png + notify.mp3 / notify.wav
├─ public/admin.html         # 图形化管理面板（部署后 /admin.html）
├─ netlify/functions/        # 动态服务端（Netlify Functions）
│  ├─ api.js                 # 业务 API（注册/登录/好友/群/消息/通话信令/提权）
│  ├─ pusher.js              # Pusher 频道鉴权（private-* 订阅签名，密钥只在服务端）
│  ├─ upload.js / file.js    # 文件上传下载（Blobs 预签名直传，50MB/3天）
│  ├─ admin.js               # 管理面板 API
│  └─ _lib.js                # 共享：Blobs 读写 + 业务工具
└─ src-tauri/                # Rust 后端（通知插件）+ Tauri 配置 + 图标
```

---

## 🚀 快速开始

### 1. 部署到 Netlify（动态服务端 + 客户端一步到位）
1. **注册 Pusher**：打开 https://dashboard.pusher.com → 注册（推荐 GitHub 登录）→ **Channels** → **Create App**（填应用名，前端 React / 后端 Node）→ 在 **App Keys** 页复制 `App ID / Key / Secret / Cluster`
2. **推送仓库**：本项目整包推送到 GitHub
3. **Netlify 建站**（Import from Git → 选仓库）：
   | 配置项 | 值 |
   |---|---|
   | 项目名称 | `ayanballchatservice` |
   | 分支 | `main` |
   | 基础目录 | 留空 |
   | 构建命令 | `npm install && npm run build` |
   | 发布目录 | `dist` |
4. **环境变量**（Site configuration → Environment variables）：
   ```
   PUSHER_APP_ID  = 你在 Pusher 后台复制的 App ID
   PUSHER_KEY     = 你在 Pusher 后台复制的 Key（客户端公开，用于连接）
   PUSHER_SECRET  = 你在 Pusher 后台复制的 Secret（签名鉴权，绝不进客户端）
   PUSHER_CLUSTER = 你在 Pusher 后台复制的 Cluster，如 mt1
   ADMIN_KEY      = （可选）自定义管理面板密码，默认 ayanball-admin
   ```
5. 部署完成后：
   - 客户端：`https://你的站点.netlify.app`
   - 管理面板：`https://你的站点.netlify.app/admin.html`
6. **桌面客户端打包**（本地，可选）：
   ```bash
   npm install && npm run tauri build   # Windows 产出 NSIS 安装包
   ```
   > 客户端 `设置 → 服务器` 默认就是当前站点的 `/.netlify/functions`，无需手工改。

### 2. 本地开发（可选）
```bash
npm install
npm run dev                  # 浏览器调试 http://localhost:5173
```
> 本地跑前端时 API 默认指向 `/.netlify/functions`（本地无函数），可用 `.env` 指定远程：
> ```
> VITE_API_BASE=https://你的站点.netlify.app/.netlify/functions
> ```

### 3. 群管理使用（QQ 风格）
- 进入任意群聊 → 点聊天窗口右上角**齿轮图标**（或通讯录 → 群聊 → 群管理）
- **群主**：设/撤管理员、踢人、邀请成员（按用户名）、转让群主、解散群、退出需先转让
- **管理员**：把普通成员设为管理员、踢普通成员、邀请成员
- **普通成员**：查看成员列表、退出群聊

---

## 🪟 窗口控制（Tauri 2 官方标准写法）

最小化 / 最大化 / 关闭按钮此前自己实现经常失效，本次**完全按官方写法**实现：

1. **无边框窗口**：`src-tauri/tauri.conf.json` → `"decorations": false`
2. **自绘标题栏**：`src/components/TitleBar.tsx`
   - 拖动：`data-tauri-drag-region`（官方拖动机制，双击自动最大化）
   - 按钮：动态导入 `@tauri-apps/api/window` 的 `getCurrentWindow()`，调用
     `minimize()` / `toggleMaximize()` / `close()`，并用 `isMaximized()` + `onResized()`
     同步最大化/还原图标
3. **权限声明**（必须，否则按钮无响应）：`src-tauri/capabilities/default.json` 显式添加
   `core:window:allow-minimize`、`core:window:allow-toggle-maximize`、
   `core:window:allow-close`、`core:window:allow-is-maximized`、
   `core:window:allow-start-dragging`、`core:event:allow-listen`
4. 浏览器模式下自动隐藏窗口按钮，不影响 `npm run dev` 调试

---

## 🌓 主题机制（默认白色 + 深色 + 跟随系统）

- **默认浅色（白色）**：`settingsStore` 默认 `theme = "light"`，首次启动即为白底 Apple 风
- **深色模式**：设置 → 外观主题 → 深色模式
- **跟随系统**：`App.tsx` 使用官方 `window.matchMedia("(prefers-color-scheme: dark)")` +
  `addEventListener("change", ...)` 实时监听系统深浅色切换（Windows 深色模式开关即时生效）

---

## 🔐 管理员机制

- **首个注册用户 = 管理员**（服务端自动授予，无可争议的"无敌"）
- 管理员在 **设置 → 管理员面板** 输入用户名即可提升他人
- 也可用环境变量 `ADMIN_KEY=xxx` 启动服务端，任何用户凭该密钥可提升自己

---

## 🌐 Netlify 动态架构（方案二：Functions + Pusher）

```
┌────────────┐   HTTP    ┌──────────────────────┐
│ Tauri 客户端 │ ───────▶ │ Netlify Functions     │
│ (React19)   │          │  api.js / upload.js   │ ──▶ Netlify Blobs（用户/群/消息/文件）
│             │          │  pusher.js / admin.js │
└─────┬──────┘          └──────────────────────┘
      │ Pusher WebSocket（毫秒级）
      ▼
  private-conv_{会话} 频道（消息） / private-user_{id} 频道（好友/群事件） / private-call_{id} 频道（通话信令）
```

- **为什么用 Pusher**：Netlify 函数是无状态短时进程，不支持常驻 WebSocket；Pusher 托管实时通道。所有频道为 `private-` 前缀，订阅前调用 `/.netlify/functions/pusher` 由服务端用 Secret 签名鉴权（**密钥永不进客户端**）；在线状态改用 **HTTP 心跳**（客户端每 30s `ping` 写 `lastSeen`，60 秒内视为在线，Pusher REST 无 presence 成员查询）
- **50MB 文件**：Netlify 函数请求体有限，采用 **Blobs 预签名直传**——函数校验大小后签发 PUT 地址，客户端直传；下载同理走签名 GET 地址；超限返回 `too-large`，客户端提示"目前服务器原因，仅支持发送50MB以内的文件，且有效期3天！！！"
- **数据分 key 存储**：`users` / `tokens` / `groups` / `requests` / `friends:{id}` / `blocked:{id}` / `room:{会话}` / `files`，减少并发写竞争
- **Pusher 事件体上限 10KB**：推送时超长文本自动截断（历史消息完整保留在 Blobs，重新打开会话即恢复完整内容）

---

## ✅ 已验证

- `tsc --noEmit` 类型检查通过
- `vite build` 生产构建通过
- **Netlify 函数回归测试 48/48 通过**（`node test-netlify.cjs`）：注册（首个自动管理员）/登录/重复与错误密码/好友搜索申请接受/拉黑与解除/头像/建群/群号加群/设撤管理员/邀请权限/退群与群主限制/转让/100 人上限/解散/私聊消息与历史（双向可见）/文件 50MB 限制与预签名直传/管理面板（登录/统计/用户/群/消息/文件/广播/401）/提权权限
- 登录/注册/所有错误路径统一走 `error` 协议（服务端 fail → `{error}`），客户端 reject 兼容

> 本机未安装 Rust 工具链，`src-tauri` 已按 Tauri 2 规范编写，未做 `cargo build` 验证；在装有 Rust 的机器上 `npm run tauri dev` 即可。
