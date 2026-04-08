# SQL schema

这里放 AIpersona demo 的数据库骨架。

## 当前阶段

- 只覆盖 R02 需要的核心对象
- 版本对象独立建表
- `study_run` 通过复合外键显式绑定 `study_plan_version`
- 暂未落表的上游对象，先保留为显式 UUID 字段，不合并成万能 JSON 表

## 文件约定

- `schema/001_domain_core.sql`：当前最小 schema 快照
- `migrations/001_domain_core.up.sql`：迁移执行脚本
- `migrations/001_domain_core.down.sql`：回滚脚本
