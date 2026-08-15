# 参与贡献

先谢了。这个项目不大，规矩也少，说几条实在的。

## 提 issue

- 说清楚是哪个功能、哪一步出问题
- 附上 DSH 版本（`dsh --version`）和系统（macOS / Linux / Windows）
- 有截图就贴，比打字快

## 提 PR

- 改动尽量小，一个 PR 解决一件事
- 改完 `node --check lib/client.js` 跑一遍，别把语法错误推上来
- 如果改了 client 端，commit message 里注明：bundle 改了，别人要 Cmd+R 才看得到
- 不用写测试（项目还没有测试框架），但改动要自己手点一遍

## 本地跑起来

```sh
git clone https://github.com/AlexCHONG8/dsh-viewboost.git
dsh plugin --profile web add link:/path/to/dsh-viewboost
dsh web
```

改 `lib/client.js` 会自动热更新（boot rev 会变），浏览器 Cmd+R 就能拿到新包，不用重启。

## 踩坑记录

改 DSH 客户端 UI 的坑都写在 [docs/ITERATION-NOTES.md](docs/ITERATION-NOTES.md)。动手前先翻一遍，能省半天。
