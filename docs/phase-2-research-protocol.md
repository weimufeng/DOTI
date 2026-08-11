# 阶段 2：PDB 人格数据导入流程

## 目标

从 PDB 的 DOTA2 分类页直接导入英雄的 MBTI 与九型人格数据，记录来源、抓取日期和导入状态。

## 数据库状态

- 基础英雄目录：从 Dota 2 官方英雄接口导入，2026-08-06 获取，共 127 条活跃英雄记录。
- 人格字段：尚未填写；2026-08-07 对指定 PDB 分类页的一次公开访问尝试返回 HTTP 403，且浏览器页面未能在限定时间内呈现可读内容。
- 项目文档的“128 位英雄”应改为版本化英雄数量，当前以官方接口返回的 127 位为准。

## 单英雄导入工作流

1. **访问分类页**：读取 `https://www.personality-database.com/profile?pid=2&cid=11&sub_cat_id=880` 中显示的 DOTA2 英雄列表；不登录、不提交表单、不绕过访问限制。
2. **逐英雄读取**：从英雄 profile 页面读取当前显示的 MBTI、九型人格核心型及翼（如有）。
3. **规范化写入**：将类型写入对应字段，并写入 profile URL、抓取日期、`source=PDB` 和 `review_status=imported_from_pdb`。
4. **导入校验**：英雄名称须与官方目录唯一对应；无法对应、类型缺失或页面不可访问时跳过并记录原因。
5. **版本维护**：每次全量导入生成一个日期快照；PDB 显示结果发生变化时更新 `updated_on`，保留上一版快照。

## 字段完整性检查

| 字段 | 批准要求 |
| --- | --- |
| `mbti` | 16 型之一 |
| `enneagram_core` | 1–9 之一 |
| `evidence_summary` | 标注 `PDB direct import` 或页面显示的简短说明（如有） |
| `evidence_urls` | 对应 PDB profile URL |
| `license_status` | `pdb_direct_import` |
| `confidence` | `low`、`medium` 或 `high` |
| `researcher` / `reviewer` | 非必填 |
| `review_status` | `imported_from_pdb` |

## 导入质量标准

- 首批导入完成后，抽样核对 16 位英雄的英文名与 profile URL 是否一致。
- 不为凑满英雄数而虚构或推断类型。MVP 只能从已成功导入的英雄集合返回结果。
- HTTP 403、登录、验证码或空页面均视为 `blocked_by_source`；保留失败时间和目标 URL，不做规避性重试。
