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
| `npm run test:scoring` | 用示例答卷抽检匹配与 URL 编解码 |
| `npm run build` | 生产构建 |
| `npm run preview` | 预览构建产物 |

## 路由

- `/` 落地页
- `/quiz` 32 题答题（localStorage 断点续答；`?fresh=1` 重新开始）
- `/result?a=...` 结果与海报保存

## 访问统计

复制 `.env.example` 为 `.env.local`，填入统计 ID 后重新 `npm run build`（或在 GitHub Actions secrets 里配置同名变量）。

| 变量 | 说明 |
| --- | --- |
| `VITE_BAIDU_TONGJI_ID` | 百度统计站点 ID（国内访问主推） |
| `VITE_GA_MEASUREMENT_ID` | 可选，GA4 的 `G-` ID |

未配置时统计为 no-op，不影响功能。会上报：页面浏览、开始/续测、完成测试、保存海报。

## 部署到 GitHub Pages

线上地址：https://weimufeng.github.io/DOTI/

1. 把改动推到 `main`（仓库已带 `.github/workflows/deploy-pages.yml`）。
2. 打开 GitHub 仓库 → **Settings → Pages** → Build and deployment → Source 选 **GitHub Actions**。
3. 等 Actions 跑完即可访问。可选：在 **Settings → Secrets and variables → Actions** 添加统计用的 `VITE_BAIDU_TONGJI_ID` 等。

本地预览生产构建（注意路径带 `/DOTI/`）：

```bash
npm run build && npm run preview
# 打开 http://localhost:4173/DOTI/
```
