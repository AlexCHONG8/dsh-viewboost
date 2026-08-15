# viewboost — DSH 右侧预览工具栏增强

一个 [DeepSeek Harness](https://github.com/deepseek-ai) 插件：给右侧 **aionui 预览面板**的工具栏加上实用的文件操作按钮，并提供 Token 用量卡片。

## ✨ 功能

| 按钮 | 图标 | 功能 |
|---|---|---|
| 📁 在访达显示 | folder | macOS Finder 中选中当前预览文件（`open -R`） |
| ⤢ 全屏放大 | maximize | 预览面板全屏，Esc 退出 |
| 📋 复制路径 | clip | 复制当前文件完整绝对路径 |
| ⧉ 复制文件 | copy | 把文件放进 macOS 剪贴板（文件引用），Finder 里 Cmd+V 可粘贴/复制该文件 |
| 📊 Token 用量 | — | 左下角浮卡：近5h / 今日 / 本周 token 用量（FanBox trio 风格），可选 MiniMax 真实配额状态行 |

图标全部取自 [FanBox](https://github.com/alchaincyf/fanbox) 的同款 feather SVG 集。

## 🚀 安装

### 方式一：直接安装（推荐）

```sh
# 把仓库 clone 到本地后
dsh plugin --profile web add link:/path/to/viewboost
# 重启 dsh web 即生效
```

### 方式二：从 GitHub 安装（发布后）

```sh
dsh plugin --profile web add github:<你的用户名>/viewboost
```

安装后 **重启 DSH**（`dsh web`），插件随 profile 启动自动挂载——不需要像动态插件那样每次点「运行」。

## 🎯 使用

1. 右侧文件树点开任意文件 → 预览面板工具栏出现 4 个图标按钮
2. 点 **📁** → Finder 弹出并选中该文件
3. 点 **📋** → 复制完整路径到剪贴板
4. 点 **⧉** → 文件进剪贴板，切到 Finder 按 Cmd+V 粘贴（相当于复制文件）
5. 点 **⤢** → 预览全屏，Esc 退出
6. 左下角 **📊** → Token 用量卡

### MiniMax 配额（可选）

在 `~/.dsh/viewboost.env`（权限 0600）写入：

```env
MINIMAX_CN_API_KEY=sk-cp-...    # 国内版 api.minimaxi.com
# 或
MINIMAX_API_KEY=sk-...          # 国际版 api.minimax.io
```

卡片底部会显示真实 Token Plan 状态（5h 滚动窗口 / 周配额剩余、倒计时）。

## 🗂 项目结构

```
viewboost/
├── dsh.plugin.json      # DSH 插件清单 (client.main)
├── cordis.patch.yml     # bundle patch (dsh plugin add 时自动挂载)
├── package.json         # npm 包 + dsh.bundle/client 声明
└── lib/
    ├── index.js         # Host: /viewboost/* HTTP 路由 (fs/subprocess/curl)
    └── client.js        # Client: 工具栏注入 + Token 卡 (module-loader 包装)
```

## 🔌 技术要点

- **Host**：`inject: ['fs', 'webServer']`，注册 `/viewboost/{list,read,fileUrl,stat,thumb,binary,finder,copyfile,usage,minimax}` 路由
- **Client**：`window.__ModuleLoader__.load()` 包装，`fetch('/viewboost/...')` 调用 host
- **aionui 集成**：MutationObserver 把按钮注入 `.aionui-preview-col` 工具栏（刷新按钮旁），路径追踪用 fetch 拦截 `/aionui-panel/read|list`
- **复制**：同步 `execCommand('copy')`（离屏 textarea，官方 writeClipboard 同款）+ Clipboard API 双保险
- 不修改任何第三方插件源码

## 📄 License

MIT
