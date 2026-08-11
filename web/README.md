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
