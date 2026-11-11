# GameHOT 免费静态版

游戏行业资讯、热点、日报、主题，以及 Steam、国内与海外分类手游榜。基于 AIHOT 的公开采集器改造；网页读取静态 JSON，不依赖 Netlify、PostgreSQL、常驻服务器或付费模型接口。

## 来源与许可

本项目基于 [数字生命卡兹克的 AIHOT](https://github.com/KKKKhazix/AIHOT) 二次开发，是独立的 GameHOT 网站，并非 AIHOT 官方产品。保留原项目的 MIT 许可证、原作者版权声明与 NOTICE；不使用 AIHOT 的名称或 Logo 作为本站品牌。新增部分包括游戏行业配置、分类游戏榜单、游戏详情，以及无需数据库的静态发布方式。

代码许可见 `LICENSE`，原项目声明见 `NOTICE`，打包依赖许可见 `THIRD_PARTY_NOTICES.md`。新闻、游戏名称、图标和截图仍属于各自权利人，不因本仓库开源而变成 MIT 授权素材；新闻仅展示摘要和原文链接。

## 免费运行条件

采用 GitHub Free 的**公开仓库**、GitHub Pages 和 Actions 标准 `ubuntu-latest` 运行器。代码、新闻摘要、排行榜数据会公开；无需绑卡或购买域名。不得把密钥、私有数据库快照或整个原工作目录上传。仅发布本目录经检查的文件。

- [GitHub Pages 公开仓库免费条件](https://docs.github.com/en/pages/quickstart)
- [Actions 公开仓库标准运行器免费条件](https://docs.github.com/en/actions/concepts/billing-and-usage)
- [Pages 使用限制](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits)

这不是无限资源或可用性保证。Pages 有流量和体积限制，中国大陆网络可能访问较慢。Actions 定时任务可能排队；公共仓库连续 60 天无活动时定时任务可能停用。本任务只提交真实新增/过期新闻的变更，不制造空提交。

## 发布

1. 在自己的 GitHub 账号新建独立的公开仓库 `gamehot`，将本目录受版本管理的文件推送至 `main`。
2. 仓库 Settings → Pages → Source 选择 **GitHub Actions**。
3. Actions → **Update GameHOT and publish Pages** → Run workflow。
4. 首次工作流成功后打开部署返回的网址，通常为 `https://用户名.github.io/gamehot/`。页面右上角会显示实际生成时间。

工作流每天按 UTC 的偶数小时 15 分尝试采集、校验和发布，等同北京时间每两小时 15 分。定时任务在云端运行，电脑可以关机。初始代码准备完成不等于远程定时任务已启用；以 GitHub 实际成功运行与线上状态为准。

## 内容与故障行为

- 新闻保留原发布日期，最多 90 天 / 2000 条，站内展示摘要和原文链接。
- 热点仅使用最近 48 小时至少两个独立信源交叉报道，按时间衰减；不足时显示真实空状态，不展示过期预览。
- 日报按北京时间分日、按六个栏目整理，不生成未经来源支持的分析。
- 手游榜按地区、类型与指标分开；SLG 为策略榜内经核验游戏的观察榜，保留原榜名次。
- 游戏点击进入同一 App ID 的站内详情，官网区分游戏专属站、开发者站与支持页；避免海外 App Store 跳转中国区首页。
- 某个信源失败时保留其上次有效资料和日期；所有内容为空时中止发布，线上旧版本继续可用。收录源故障会记录在 `data/status.json`。
- 采集前读取上次公开发布的状态。真实新闻历史另外保存在仓库 `data/news.json`，不依赖付费数据库。
- 构建只在 CI 采集公开资料。浏览网页不会触发采集或模型调用。

## 本地验证

安装 Node.js 24 后，无需安装运行依赖：

```sh
node --test tests/*.test.mjs
node scripts/collector.mjs --build
node scripts/verify.mjs
node scripts/preview.mjs
```

默认只从已保留资料生成。需要实际联网更新时设置 `COLLECT_ENABLED=true`；可选 `GAMEHOT_PREVIOUS_URL` 为上次公开站点 HTTPS 根地址。资料保留历史时不会用构建时间冒充原文时间。预览默认 `http://127.0.0.1:4177`。

`scripts/collector.mjs` 是自包含采集器；`web/` 是网页源码；`data/sources.json` 与 `data/topics.json` 是信源及主题配置；`data/seed.json` 仅含首次发布所需公开资料。第三方图片仍从原始公开 CDN 加载。

采集器的可编辑源码在 `collector-src/`。此目录保留来源解析、日期处理、分类和游戏采集代码，将 RSS 使用的纯函数与数据库依赖拆开。需要修改并重新打包采集器时运行 `npm install`、`npm run bundle`、`npm test`；正常自动更新无需安装依赖。第三方代码许可见 `THIRD_PARTY_NOTICES.md`。

原 Netlify 项目没有被删除或升级。其 `netlify.app` 子域名不能转给 GitHub，恢复运行需要使用新地址；需要迁移自有域名时可另行配置。
