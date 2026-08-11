# 英雄人格数据

运行时数据由脚本生成到 `web/src/data/`：

| 源文件 | 产物 |
| --- | --- |
| `题库.txt` | `web/src/data/questions.json` |
| `Dota2_hero_personality_database_archetype.xlsx` | `web/src/data/heroes.json` |
| `web/src/data/hero-result-copy.json`（手写） | 结果页文案；`npm run data:copy` 仅校验 |

刷新题库/英雄：

```bash
cd web && npm run data
```

同域头像（结果海报截图用）：

```bash
cd web && npm run data:portraits
```
