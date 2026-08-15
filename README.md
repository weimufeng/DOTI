# DOTI

**测测你的 DOTA2 本命英雄** — 娱乐向人格测试，约 3–5 分钟。

[在线体验](https://weimufeng.github.io/DOTI/) · 32 道情境题 · 127 位英雄

完成答题后，你会得到一位本命英雄、MBTI、九型人格，以及英雄的标准十维画像。结果可以保存成海报，同一份答卷打开同一条链接会得到相同结果。

仅供娱乐，不构成心理评估。非 Valve / DOTA2 官方产品。

## 怎么匹配

1. 32 道与 DOTA2 相关的单选题，每题计入 MBTI、九型与十维。
2. 先锁定 MBTI + 九型（含翼型），再在同类型英雄里按十维欧氏距离选最近的一位。
3. 雷达图展示的是该英雄在图鉴里的标准十维（0–10），不是把你的分数强行拉伸。

十维：锋芒、掌控、领导、洞见、自由、荣誉、守护、混沌、社交、野心。

## 本地运行

需要 Node 22+。

```bash
cd web
npm install
npm run dev
```

浏览器打开提示的本地地址即可。生产构建带 GitHub Pages 子路径 `/DOTI/`：

```bash
cd web
npm run build && npm run preview
# http://localhost:4173/DOTI/
```

可选：`npm run test:scoring` 用示例答卷抽检匹配与分享链接编解码。刷新题库、英雄 JSON 或头像见 [`web/README.md`](web/README.md) 与 [`data/README.md`](data/README.md)。

## 仓库结构

```
web/          前端（Vite + React + TypeScript）
data/         题库与英雄人格源数据
scripts/      生成 web/src/data 的脚本
docs/         产品与内容规格
```

主路径：落地页 `/` → 答题 `/quiz`（可断点续答）→ 结果 `/result?a=...`。

推送到 `main` 后，[GitHub Actions](.github/workflows/deploy-pages.yml) 会构建并发布到 GitHub Pages。仓库 **Settings → Pages** 的 Source 需选 **GitHub Actions**。

访问统计使用百度统计；采集 ID 写在 `web/.env.production`。首页的浏览量与地域分布由部署时调用 [Tongji OpenAPI](https://tongji.baidu.com/api/manual/Chapter2/openapi.html) 生成快照，密钥放在 GitHub Actions secrets（不要写进前端）。本地 `npm run dev` 默认不上报。

## 作者

抖音 `1682816803` · 小红书 `2094184953`
