# viewboost 迭代复盘：给 DeepSeek Harness 改 UI 踩过的 20 个坑

> 本文记录 viewboost 从「半天交付的玩具」到「正式 DSH 插件」过程中遇到的全部问题——
> 从沙箱限制、槽位系统，到一行 CSS、一个按钮图标的细枝末节。
> 很多坑在网上查不到，属于改 DSH 客户端 UI 的「实战经验」，写下来给后来的插件作者。

---

## 0. 背景

viewboost 的目标很简单：给 DSH 右侧 aionui 预览面板的工具栏加上「在访达显示 / 全屏 / 复制路径 / 复制文件」四个按钮，再送一个 Token 用量卡。

**灵感来源**：花叔（Huashu）的 [FanBox](https://github.com/alchaincyf/fanbox) —— 第一次看到「给 Agent 的 UI 配上可视化浏览 + 文件预览」的设计时就被打动了。这个插件从交互形态（预览工具栏）到图标（feather SVG 同款），都是向 FanBox 的致敬。**感恩花叔，没有 FanBox 就没有 viewboost。** 🙏

当时以为「半天交付」。实际上，从第一个动态插件版本（v1）到正式版（v1.0.0），一共迭代了 27+ 个版本，横跨 **插件架构、浏览器渲染、UI 细节、安装链路、进程编排** 五个战场。

---

## 1. 插件架构的坑（沙箱世界）

### 坑 1：idPrefix 必须是 3–6 个小写英文字母
第一次定义动态插件用 `idPrefix: 'viewboost'`，直接报错。动态插件的 idPrefix 只接受 3–6 个小写字母，改 `vwbst` 才通过。

### 坑 2：plugin sandbox 里没有 `process`
想读环境变量拿 MiniMax API key，结果 `process` 和 `globalThis.process` 都是 `undefined`——**连 `typeof process` 都会抛 ReferenceError**。`process.env` 这条路在插件沙箱里彻底走不通。

### 坑 3：`web.fetch` 不支持 headers
沙箱提供的 `web.fetch` 只接受 `{url}`，不能带 `Authorization` header → 带 Bearer 调 MiniMax API 这条路也死了。

> 解法：key 放 `~/.dsh/viewboost.env`（0600），host 端用 `subprocess.spawn('curl', ['-H', 'Bearer ...'])` 拉数据。

### 坑 4：动态 client 禁用 `setTimeout`
`setTimeout` 在动态 client 半区直接抛 "setTimeout is not available in a dynamic client half"。计时逻辑得改用 `ctx.timer.timeout`。

### 坑 5：`Date` 对象不能跨 RPC 序列化
host 返回 `mtime`（Date 对象）→ client 端拿到的是空对象。必须自己转 `number`（`mtimeMs`）。

---

## 2. UI 细节的坑（小改动，大翻车）

### 坑 6：冷门 Unicode 字符渲染成空白
工具栏最初用 `⤢ ⎘ ⌖` 这类字符当图标——在用户机器上全部渲染成豆腐块/空白。换 emoji（`🗖 📋 🔍`）才正常。**别用稀有字符当图标**，图标要么 emoji 要么 SVG。

### 坑 7：直接改第三方 React 按钮 = 按钮消失
尝试把 aionui 自带的「源码/预览/分屏」按钮也换成 SVG 图标 → 一重渲染按钮全消失（截图只剩 1 个按钮）。
**教训：不能改没有本地源码的第三方 React 组件的 DOM 内容**，它们的重渲染会把你注入的东西清掉。只能往**容器级**元素注入、用 MutationObserver 重新补挂。

### 坑 8：DSH 配色不是 #fff，是 oklch
抄了个 `#ffffff` 背景的卡片，跟 DSH 的米白面板格格不入。DSH 用的是 **oklch 色值**（如 `oklch(0.97 0.006 85)` 米白、`oklch(0.28 0.02 60)` 暖灰深）。
正确做法：用 `browser_eval` 抓 computed style 拿真实色，再 `oklch()` 写进插件。

### 坑 9：字体也要跟 DSH 对齐
默认字体在中文/日文混合环境下渲染难看。DSH 用 `"Noto Sans JP", "Hiragino Kaku Gothic ProN"`，CSS 里必须显式指定，否则卡片字体跟面板不一致。

### 坑 10：FAB 遮挡设置按钮
第一版 FAB 是 232px 宽卡片浮在左下角，用户反馈「挡住了原来的设置」。
**教训：叠加层先量宿主布局再定位**——FAB 缩到 28×28 透明圆，hover 才显底，卡片 232px 也要确认右缘不超侧栏（见坑 11）。

### 坑 11：卡片宽度超侧栏
用量卡 `position:fixed; left:16px; width:276px`，而侧栏最窄只有 264px（layout 契约 `clampWidth(sidebar, 264, 420)`）→ 卡片右缘 292px 压到聊天区。
**解法**：宽度固定 = 最小侧栏宽 − 32px 边距 = **232px**；侧栏收起成 56px rail 时用 ResizeObserver 检测宽度 <150px，直接隐藏 FAB+卡片。

### 坑 12：按钮注入的宿主选错
最初把按钮加进自家 ReadPreview 组件——但用户根本不用 read 工具的预览，用的是 **aionui-panel**（第三方）。按钮从不出现在用户眼前。
**教训：先确认用户实际用的 UI 路径**（这里是通过浏览器自动化实测确认是 aionui），再决定注入点。

---

## 3. 动态插件 → 正式插件的两连坑（最阴间）

### 坑 13：`exports.inject: ['slots','timer']` 导致 apply 静默不执行
动态插件能用的 `timer` 服务，正式 profile 的模块世界**没有对应 provider**。cordis Loader 发现 `timer` 注入声明就永远停在 inject waiting，apply 不执行、**没有任何报错**。
诊断铁证：对比 `style[data-plugin]` 标签——turn-rewind（inject `['slots','sessions','conversation']`）的样式在，viewboost 的不在。
**修复**：`inject` 只留 `['slots']`。

### 坑 14：ctx 是守卫代理，读未声明属性直接抛
修完坑 13 后 apply 终于执行，却在 `VB_TIMER = ctx.timer || null` 抛 `cannot get property "timer" without inject`——**`|| null` 救不了**，属性 GET 本身被代理拒绝。
**修复**：`ctx.timer` 直接删掉（本来就没用到）。

> 这两坑合起来是「插件没生效」的最隐蔽形态：页面无任何报错横幅，就是没按钮。排查时先怀疑 inject 声明，再查 ctx 属性访问。

---

## 4. 安装链路与假阳性

### 坑 15：`dsh plugin add link:` 只建了符号链接
当初用 CLI 安装，以为成功了——其实 **profile 的 package.json（dependencies + dsh.profile.bundles）根本没写入**。表现为：
- Cordis 面板看不到（正常，正式插件不进动态面板）
- `/plugins/@dsh-external/viewboost/client.js` → **404**
- `/viewboost/*` → **200 是假阳性**（SPA fallback 返回 text/html）

**解法**：手工编辑 `~/.dsh/profiles/web/package.json`（加 dependencies link 条目 + bundles 数组），再 `pnpm install`。

### 坑 16：`__DSH_BOOT__` 是真相
判断正式插件是否被服务端加载，唯一可靠手段：
```bash
curl -s http://127.0.0.1:3080/ | grep viewboost   # 命中 __DSH_BOOT__ 条目
curl -sI http://127.0.0.1:3080/plugins/@dsh-external/viewboost/client.js  # 应 200 text/javascript
```

### 坑 17：插件集合变更要重启，bundle 内容变更不用
dsh-client-modules 按包名缓存插件名单——**新增/移除插件必须重启 dsh web 才生效**；但改 bundle 文件内容（client.js）会自动 bump boot rev，**无需重启**，浏览器 Cmd+R 就拿新包。

---

## 5. 进程编排的坑

### 坑 18：杀 dsh web 宿主会连带清掉编排脚本
写了个重启编排脚本（nohup + sleep 10 缓冲 + TERM→KILL 降级 + 自动验证写报告），结果旧 dsh web 退出时清了自己的进程树，**同进程组的编排脚本被连带杀死**，报告没写成。
**教训：编排脚本要 double-fork / launchd 脱离进程组再杀宿主**，否则自尽。

---

## 6. 验证与浏览器自动化的坑

### 坑 19：合成事件点不开预览
用 `dispatchEvent(new MouseEvent('click'))` 模拟点击文件树 → 预览纹丝不动。应用忽略非信任事件。
**必须用 Playwright 真点击**（trusted click）才打得开文件。

### 坑 20：Cmd+R 后 GUI 落在会话列表页
服务端改了 bundle，浏览器刷新后落在会话列表页——没有右侧面板是正常的，**必须点进会话**才有 aionui 面板和按钮。排查时别误以为插件丢了。

---

## 7. 经验教训总结

1. **先验证用户实际路径，再动手**——坑 12 浪费了最多版本。
2. **DSH 是 oklch 色系**，别拿 #fff 硬上；字体显式指定。
3. **稀有字符别当图标**——emoji / SVG。
4. **别改第三方 React 组件的 DOM**——注入到容器级，靠 MutationObserver 补挂。
5. **动态 → 正式插件**：inject 服务名逐个核对 provider；ctx 守卫代理下未声明属性别读。
6. **固定宽度控件要先量宿主最小宽度**（layout 契约），再谈好看。
7. **假阳性**：HTTP 200 不代表插件活着，看 `__DSH_BOOT__`。
8. **改 UI 的验证闭环**：改 bundle → 看 boot rev 变了 → Cmd+R → 点进会话 → 真点击验证。

---

*以上内容来自 viewboost 实际迭代（v1 → v27 → 正式版 1.0.0），对应版本细节见 [CHANGELOG.md](../CHANGELOG.md)。*
