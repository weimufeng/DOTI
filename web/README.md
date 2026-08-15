# DOTI Web App

测测你的 DOTA2 本命英雄 — 移动端优先网页 MVP。

## 开发

```bash
npm install
npm run data          # 可选：从 ../data 刷新题库/英雄 JSON
npm run data:portraits # 可选：拉取同域英雄头像
npm run dev
```

## 脚本

| 命令 | 说明 |
| --- | --- |
| `npm run data` | 从 `../data` 生成 `src/data/questions.json` 与 `heroes.json` |
| `npm run data:copy` | 校验手写的 `hero-result-copy.json` |
| `npm run data:portraits` | 拉取原版英雄头像到 `public/portraits`（同域截图用） |
| `npm run data:stats` | 用百度统计 OpenAPI 生成首页浏览量/地域 JSON |
| `npm run test:scoring` | 用示例答卷抽检匹配与 URL 编解码 |
| `npm run build` | 生产构建 |
| `npm run preview` | 预览构建产物 |

## 路由

- `/` 落地页
- `/quiz` 32 题答题（localStorage 断点续答；`?fresh=1` 重新开始）
- `/result?a=...` 结果与海报保存

## 访问统计（百度统计）

线上构建读取 `web/.env.production`。把站点 ID 填进去并推到 `main` 后，GitHub Pages 就会带上统计代码。

1. 打开 [百度统计](https://tongji.baidu.com) 并登录。
2. **管理 → 网站列表 → 新增网站**。网站域名填 `weimufeng.github.io`（不要填 `/DOTI/` 路径）。
3. 打开该网站的 **代码获取**，复制 `hm.js?` **后面那一串**（一般是 32 位十六进制）。
4. 写入 `web/.env.production`：

   ```
   VITE_BAIDU_TONGJI_ID=你的站点ID
   ```

5. 提交并推送 `main`，等 Actions 部署完成。用手机打开一次首页，后台 **实时访客** 里应能看到。

本地 `npm run dev` 默认不上报，避免把开发流量算进去。未配置 ID 时统计为 no-op。会上报：页面浏览（含 `/quiz`、`/result`）、开始/续测、完成测试、保存海报。

可选：`.env.local` 里同样可写 `VITE_GA_MEASUREMENT_ID`（GA4）。

### 首页浏览量与地域分布

页面本身不能带 OpenAPI 密钥（会随 GitHub Pages 公开）。部署时用 [百度账号 OpenAPI](https://tongji.baidu.com/api/manual/Chapter2/openapi.html) 拉 [趋势数据](https://tongji.baidu.com/api/manual/Chapter1/overview_getTimeTrendRpt.html) 和 [地域分布](https://tongji.baidu.com/api/manual/Chapter1/overview_getDistrictRpt.html)，写成 `public/tongji-stats.json`，首页再展示。

在仓库 **Settings → Secrets and variables → Actions** 添加：

| Secret | 说明 |
| --- | --- |
| `BAIDU_TONGJI_API_KEY` | 数据导出服务里的 API Key |
| `BAIDU_TONGJI_SECRET_KEY` | Secret Key |
| `BAIDU_TONGJI_REFRESH_TOKEN` | OAuth 换到的 refresh_token（有效期约十年） |
| `BAIDU_TONGJI_ACCESS_TOKEN` | 可选备用；没有刷新三件套时用。有 Key + Secret + refresh_token 时脚本会优先刷新，不必删这个 secret |
| `BAIDU_TONGJI_SITE_ID` | 可选；后台网址里的数字站点 ID（不是 `hm.js?` 那串） |

开通步骤：百度统计 → **管理 → 数据导出服务** → 拿到 Key → 按手册用 `client_id` 完成授权，保存 `refresh_token`。

未配置密钥时首页不显示这块；配置后推送或等每日定时部署即可。本地可先 `export` 上述变量再 `npm run data:stats`。

## 部署到 GitHub Pages

线上地址：https://weimufeng.github.io/DOTI/

1. 把改动推到 `main`（仓库已带 `.github/workflows/deploy-pages.yml`）。
2. 打开 GitHub 仓库 → **Settings → Pages** → Build and deployment → Source 选 **GitHub Actions**。
3. 等 Actions 跑完即可访问。百度统计见上文：把 ID 写入 `web/.env.production` 后推送即可。

本地预览生产构建（注意路径带 `/DOTI/`）：

```bash
npm run build && npm run preview
# 打开 http://localhost:4173/DOTI/
```
