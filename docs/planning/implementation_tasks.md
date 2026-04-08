# 达能 AI Consumer Runtime MVP 实施任务拆解

> **给 AI 员工执行：** 必须先阅读 [system_design.md](/Users/dingcheng/Desktop/danone_ai_consumer/system_design.md) 和 [mvp_prd.md](/Users/dingcheng/Desktop/danone_ai_consumer/mvp_prd.md)。默认采用 Runtime-first Agent 架构，任何任务都不得退化为“Chat UI + prompt 拼装器”。

**目标：** 在单租户、达能场景下，交付一个可运行、可审批、可回放、可校准的 AI Consumer Runtime MVP。

**架构：** 先落 Runtime、对象模型和持久化，再落 Asset Ingestion、Twin Factory、Study Workbench、Qual / Quant、Replay、Calibration。所有 Agent 只能挂在显式业务对象和 workflow 上执行。

**技术栈：** FastAPI、PostgreSQL、pgvector、Temporal、Object Storage、React Workbench、AgentRunner 适配层

---

## 1. 实施原则

- 先把运行时对象和状态机立住，再接 Agent
- 先把 `study / study_plan_version / study_run / run_step` 跑通，再做页面美化
- 先把结构化输出对象立住，再做总结类文案
- 先做 deterministic services，再做 explanation agents
- 所有版本对象不可变
- 所有任务必须有完成标准，不接受“差不多能跑”

## 2. 推荐代码结构

如果新建仓库，建议按以下结构启动：

- `apps/api`
- `apps/worker`
- `apps/web`
- `packages/domain-models`
- `packages/contracts`
- `packages/agent-runner`
- `packages/replay-builder`
- `infra/temporal`
- `infra/sql`
- `infra/observability`
- `docs/adr`
- `docs/runbooks`

## 3. 工作流总览

实施顺序建议固定为：

1. Runtime Foundation
2. Domain Schema
3. Asset Ingestion
4. Twin Center
5. Study Planning
6. Study Runtime
7. Qual Engine
8. Quant Engine
9. Replay / Report
10. Calibration Lite
11. Security / Audit / Release Hardening

## 4. 任务拆解

### Task 1: Runtime Foundation

**目标**

搭建 MVP 的运行时骨架，保证后续所有能力都挂在统一的状态与 workflow 上。

**主要交付物**

- 后端项目骨架
- Temporal 基础运行环境
- `AgentRunner` 接口与最小适配器
- 基础配置、日志、错误模型

**建议创建的模块**

- `apps/api/src/app`
- `apps/worker/src/worker`
- `packages/agent-runner/src`
- `infra/temporal/docker-compose.yml`

**完成标准**

- API、worker、Temporal 可以本地启动
- 可以创建一个空 `StudyWorkflow`
- `AgentRunner` 可被 workflow activity 调用
- 业务层不直接引用具体模型 SDK 类型

### Task 2: Domain Schema

**目标**

先把核心对象表和版本关系固化，否则后面的 Agent 输出无处可落。

**主要交付物**

- Postgres schema
- migration 脚本
- 基础 repository 层
- domain contract 文档

**必须覆盖的对象**

- `workspace`
- `asset_manifest`
- `ingestion_job`
- `qual_report`
- `transcript_corpus`
- `quant_dataset`
- `dataset_schema_mapping`
- `stimulus`
- `anchor_set`
- `anchor_statement`
- `benchmark_pack`
- `target_audience`
- `persona_profile`
- `consumer_twin`
- `twin_version`
- `study`
- `study_plan`
- `study_plan_version`
- `study_run`
- `run_step`
- `qual_session`
- `qual_transcript`
- `qual_theme_set`
- `qual_theme_item`
- `twin_response`
- `scoring_result`
- `segment_comparison_result`
- `approval_gate`
- `artifact`
- `benchmark`
- `calibration_run`
- `confidence_snapshot`
- `drift_alert`

**完成标准**

- 所有关键外键关系可落库
- 版本对象不可变
- `study_run` 能显式绑定 `study_plan_version_id`
- schema 能支持 rerun、replay、calibration 追溯

### Task 3: Asset Ingestion

**目标**

把历史研究资产和 stimulus 导进系统，并形成类型化对象，而不是文件黑盒。

**主要交付物**

- `/assets/import`
- `/ingestion/jobs`
- typed parser 路由
- ingestion job 状态查询

**必须实现的 parser**

- `qual_report_parser`
- `transcript_parser`
- `quant_dataset_parser`
- `stimulus_parser`

**关键规则**

- `ingestion_profile` 决定业务流程
- `parser_type` 决定技术执行器
- quant dataset 必须经过 `dataset_schema_mapping` 人工确认
- `benchmark_pack` 不允许 parser 自动发布

**完成标准**

- 一份 qual 报告可导入并生成 `qual_report`
- 一组 transcript 可导入并生成 `transcript_corpus`
- 一份 quant dataset 可导入并进入 mapping review
- 一组 stimulus 可导入并形成业务对象

### Task 4: Twin Center

**目标**

让达能拥有可查看、可追溯、可版本化的 consumer twins 资产。

**主要交付物**

- target audience 管理
- persona profile 管理
- consumer twin 管理
- twin version 生成流程

**关键规则**

- `persona_profile` 是可复用画像原型
- `consumer_twin` 是逻辑身份
- `twin_version` 是执行快照
- 校准后升级版本，不回写旧版本

**完成标准**

- 能看到同一 audience 下多个 persona profiles
- 能看到同一 twin 的多个 versions
- 每个 version 都能追溯来源和配置

### Task 5: Study Planning

**目标**

让 study 不再是“提一个问题”，而是生成一个可审批、可运行、可回放的计划版本。

**主要交付物**

- 创建 study
- Planner Agent 输出 `study_plan_version`
- 计划审批流
- 计划版本历史

**必须显示的计划内容**

- business goal
- twin selection
- stimulus selection
- anchor set
- qual config
- quant config
- estimated cost
- approval required

**完成标准**

- 可生成 draft plan version
- 可批准 plan version
- 已批准版本可作为 run 输入
- 修改关键字段时自动产生新版本

### Task 6: Study Runtime

**目标**

把运行时状态机和执行生命周期跑通，这是整个系统是否成立的分水岭。

**主要交付物**

- `StudyWorkflow`
- `study_run` / `run_step` 写回
- status 查询
- resume
- rerun
- mid-run approval

**关键规则**

- `Study` 是业务级状态
- `StudyRun` 是执行级状态
- mid-run 审批只改变 `study_run.status`
- rerun 一律创建新 run
- `reuse_source_run_id` 用于复用旧输出

**完成标准**

- 能从 approved plan 启动 run
- 能在 mid-run 审批后恢复
- 能在 review 后创建 rerun
- rerun 可按 stage 复用既有输出

### Task 7: Qual Engine

**目标**

交付首版可用的定性洞察引擎，而不是只会输出一段聊天记录。

**主要交付物**

- AI IDI
- AI mini FGD
- `qual_session`
- `qual_transcript`
- `qual_theme_set`
- `qual_theme_item`

**关键规则**

- 输入侧 `transcript_corpus` 与输出侧 `qual_transcript` 必须分离
- `qual_theme_item` 必须能直接被 synthesis 消费
- evidence 必须保留引用，不允许纯主观总结

**完成标准**

- 对同一 stimulus 能生成至少一组 qual transcript
- 能抽取主题和证据
- 页面上可查看 qual summary 和 theme items

### Task 8: Quant Engine

**目标**

交付首版可用的 SSR 量化引擎，形成排序、差异和 confidence 信号。

**主要交付物**

- `twin_response`
- `scoring_result`
- `segment_comparison_result`
- SSR scoring pipeline

**关键规则**

- 必须先生成开放文本反馈，再做 anchor similarity 映射
- 每个 response 必须记录 `replica_no`
- quant run 必须显式配置 `replicas_per_twin` 和 `parallelism_limit`
- 人群差异只能标记为模拟差异信号，不能伪装成真实统计显著性

**完成标准**

- 至少一组 stimulus 可跑出多 twin 评分
- 可输出排序结果
- 可输出 segment differences
- 输出包含 anchor set 版本引用

### Task 9: Replay 与 Report

**目标**

把研究过程变成业务可读资产，而不是底层日志堆。

**主要交付物**

- replay builder
- `artifact` 落盘
- 报告生成
- 管理层摘要

**关键规则**

- Replay 来源于 `study_run`、`run_step`、`approval_gate`、`qual`、`quant`
- 物理形态至少包括 `replay_json` 和 HTML
- replay 不能直接暴露 workflow history

**完成标准**

- 每次 completed run 都能生成 replay artifact
- Study Detail 页面可查看 timeline + replay
- 报告中可引用 evidence chain

### Task 10: Calibration Lite

**目标**

让系统首版具备“为什么能信”的基础能力，而不是只会给推荐。

**主要交付物**

- benchmark pack build
- calibration run
- confidence snapshot
- drift alert

**关键规则**

- `Calibration Service` 负责确定性计算
- `Calibration Agent` 只负责解释性文本
- confidence 必须按 `scope_type + study_type + category` 产出
- freshness 衰减必须可配置

**完成标准**

- 能从历史数据生成一个 benchmark pack
- 能发起一次 calibration run
- 能计算并展示 confidence snapshot
- 能展示至少一种 drift alert

### Task 11: Workbench Frontend

**目标**

把前端收敛成业务可用工作台，而不是技术调试台。

**主要交付物**

- Dashboard
- Studies List
- Study Detail
- Consumer Twins
- Stimulus Library
- Calibration Center

**关键规则**

- `Study Detail` 是核心页
- plan、timeline、qual、quant、replay、approval、artifacts 必须聚合在一处
- 页面术语优先业务语言，不暴露底层技术对象细节

**完成标准**

- 市场用户能独立创建并查看 study
- 洞察用户能完成审批、复核、rerun、calibration
- 管理员能管理权限与策略

### Task 12: Security / Audit / Release Hardening

**目标**

确保这不是一个只能 demo 的系统，而是一个能进入真实使用的交付物。

**主要交付物**

- RBAC
- 审批审计日志
- PII 脱敏策略
- 导出策略
- 运行监控
- 基础 runbook

**完成标准**

- 关键动作均有审计记录
- transcript 与 prompt log 脱敏
- 失败 run 可追踪
- 关键发布路径有 runbook

## 5. 依赖关系

核心依赖按以下顺序锁定：

- Task 1 是所有任务前置
- Task 2 必须先于 Task 3-10
- Task 5 依赖 Task 4
- Task 6 依赖 Task 5
- Task 7 和 Task 8 依赖 Task 6
- Task 9 依赖 Task 7-8
- Task 10 依赖 Task 3、Task 8
- Task 11 依赖 Task 5-10 的接口稳定
- Task 12 贯穿全程，但在 Beta 前必须补齐

## 6. 建议并行策略

可以并行的工作流如下：

- Worker A：Task 1 + Task 2
- Worker B：Task 3
- Worker C：Task 4 + Task 5
- Worker D：Task 11 的信息架构与壳层页面

第二轮并行：

- Worker A：Task 6
- Worker B：Task 7
- Worker C：Task 8
- Worker D：Task 9

第三轮并行：

- Worker A：Task 10
- Worker B：Task 12
- Worker C：Task 11 收尾与联调

## 7. 里程碑

### Milestone 1: Runtime Ready

完成标准：

- Runtime foundation、domain schema、study planning 完成
- 可以创建 plan 并启动空 run

### Milestone 2: Research Loop Ready

完成标准：

- qual、quant、rerun、replay 跑通
- 可以完成一次完整 study

### Milestone 3: Trust Layer Ready

完成标准：

- benchmark、calibration、confidence、drift 跑通
- 工作台可支持首轮真实业务试用

## 8. AI 员工交付要求

所有 AI 员工执行任务时必须遵守：

- 每次只接一个明确任务，不跨模块发散
- 先交付结构化对象与接口，再做文案优化
- 每次改动都要带验收结果
- 遇到状态、版本、审批、回放、校准语义不清时，以 `system_design.md` 为准
- 发现设计缺口时先补文档，再写代码

## 9. 管理结论

这份实施拆解的目标，不是把工作拆得很碎，而是确保每个 AI 员工拿到的都是“边界清楚、产物明确、可验收”的任务。

如果按这份拆法执行，您后面管理的重点只剩三件事：

- 当前卡在哪个里程碑
- 哪个模块没有达到验收标准
- 哪个设计缺口需要先回写文档再继续开发
