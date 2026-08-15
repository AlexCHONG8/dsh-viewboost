# Changelog

本插件从 DSH 动态插件（会话级）演进为正式安装插件（profile 级）。动态期版本记录于此。

## [1.0.0] — 2026-08-15 — 正式插件版

### Added
- 正式 DSH 插件包 `@dsh-external/viewboost`（`dsh plugin --profile web add` 安装）
- Host 全部逻辑迁移为 `/viewboost/*` HTTP 路由（webServer 服务）
- Client 迁移为 module-loader 包装 + fetch RPC（不再依赖动态 `host.call`）

## 动态插件版 (vwbst-3, 会话级)

### v27 — 稳定版
- 回退 v26 的 aionui 按钮图标化（改第三方 React 按钮导致其重渲染冲突、按钮消失）
- 恢复：aionui 原按钮 + viewboost 4 个图标按钮

### v26 — ❌ 回退
- 尝试把 aionui 自带「源码/预览/分屏」也换 SVG 图标 → 按钮消失，回退

### v25 — FanBox 同款图标
- 工具栏 4 按钮换 FanBox feather SVG（folder/maximize/clip/copy）+ 自定义 hover 提示

### v24 — 复制文件按钮
- 新增「复制文件」：osascript 把文件引用放进 macOS 剪贴板，Finder 可粘贴
- 复制修复：同步 execCommand（离屏 textarea）+ Clipboard API 双保险

### v23 — 按钮加文字标签
- 图标+文字（Finder/全屏/复制）+ 自定义 hover tooltip
- 复制再修复：`opacity:0` → `left:-9999px`（官方 writeClipboard 同款）
- toast 纯 CSS 动画自动消失（不依赖 timer）

### v22 — timer 修复 + 路径兜底
- 动态 client 禁用 setTimeout → 改用 `ctx.timer.timeout`（`inject: ['timer']`）
- 路径追踪补 `/aionui-panel/list` root 记录 + 激活 tab 标题兜底

### v21 — RPC 桥绑定修复
- `host` 是词法注入不在 globalThis → 模块顶部 `const VB_HOST = host` 捕获

### v20 — host 变量遮蔽修复
- Finder 按钮闭包局部 `host`（DOM 元素）遮蔽 RPC 桥 → 改名 `hostEl`

### v19 — mtimeMs 作用域修复
- `vb.usage` 引用 `vb.list` 内部作用域的 `mtimeMs` → 提升到 apply 顶层

### v18 — 学 dsh-better-sidebar
- `ctx.workspaces.openPath` 包装（所有文件打开的唯一入口）做正规路径追踪

### v17 — aionui 工具栏注入
- 首次把 Finder/最大化/复制按钮注入 aionui 预览工具栏（MutationObserver）
- Token 卡改本地 3 宫格（近5h/今日/本周）+ MiniMax 状态行

### v16 — emoji 图标
- 冷门 Unicode 字符换通用 emoji，复制加 fallback

### v15 — 重建
- 原 vwbst-1 因 DSH 重启丢失，以 vwbst-3 重建
- Finder 真修复：`subprocess.spawn('open -R')` 正确 spec
- MiniMax 真数据：key 读 `~/.dsh/viewboost.env` + subprocess curl

## 早期动态插件 (vwbst-1)

### v14 — 沙箱 process 安全
### v13 — ❌ MiniMax 字段对齐（process 未定义崩溃）
### v12 — MiniMax 配额入口
### v11 — 三宫格 v2
### v10 — 双计数修复（lastPromptAt）
### v9 — Finder 入口（首次）
### v8 — FAB minimal
### v7 — DSH 配色融合
### v6 — 花叔三宫格
### v5 — 用量卡（shell.overlay + FAB）
### v4 — ❌ 用量卡 v1（槽不存在）
### v3 — mtime 序列化修复
### v2 — Office 套件（PDF/Excel/Word/CSV）
### v1 — 基础（读图/Markdown/代码/浏览）
