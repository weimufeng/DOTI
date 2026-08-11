# 内容规范（首版）

## 题目配额与硬性规则

**硬性规则：** 100% 的题目必须使用 DOTA2 内容或情境，并且 100% 的题目必须以非零权重影响人格结论。题目可同时带有赛事、英雄或社区趣味性，但不设纯彩蛋题。

| 类别 | 数量建议 | 目的 |
| --- | ---: | --- |
| 英雄与轻量对局情境题 | 6–8 | 以选人、沟通、支援、团战取舍等易理解情境测量 MBTI 四维；不考验操作或机制知识 |
| 团队协作与逆风应对题 | 6–8 | 从比赛内的冲突、风险、责任、认可等动机测量九型人格 |
| 赛事、历史与社区文化题 | 12–16 | 以战队、选手、经典赛事、TI 氛围、直播观赛和社区现象为题材，同时映射人格构念 |

总题量：**24–32 题**。每题只测量一个主要构念，必要时一个次要构念；题目随机排序，但保证维度均衡。

## 题目字段

`question_id`、`text`、`context_type`、`dota_reference_type`、`dota_reference`、`answer_scale`、`dimension_primary`、`dimension_secondary`、`weight`、`option_score_map`、`version`、`editor`、`reviewer`、`status`。

发布校验：`dota_reference_type`、`dota_reference`、`dimension_primary`、`weight` 和每个选项的 `option_score_map` 均不得为空；所有计分权重必须非零。

## 结果内容字段

`hero_id`、`hero_name_zh`、`hero_name_en`、`mbti`、`enneagram`、`summary`、`why_match`、`strengths`、`watch_out`、`similar_heroes`、`asset_id`、`source_status`、`review_status`、`updated_at`。

## 写作示例规则

- 题干从 DOTA2 中可观察的偏好或决策开始，例如“面对四名陌生队友时，你更倾向于如何开局沟通？”。
- 对非核心玩家不熟悉的机制附简短解释，例如“开雾找机会（用烟雾主动创造信息优势）”。
- 赛事与社区文化题可使用观赛、应援、复盘、经典名场面讨论、战队偏好与社区协作等情境；考察的是参与和决策方式，而不是能否答对史实。
- 避免复杂的操作、版本数值、装备合成、英雄技能与职业术语考题；必要时改写为易理解的英雄或观赛情境。
- 不使用“正确”“高段位”“菜”等价值判断。
- 不能把英雄知识、赛事记忆或段位高低作为人格判据；若用户不熟悉某个事件，提供等价的 DOTA2 对局情境，而不是“不了解”选项。
- 结果先给积极、具体的匹配依据，再给温和的局限提醒；不声称人格固定或绝对。
