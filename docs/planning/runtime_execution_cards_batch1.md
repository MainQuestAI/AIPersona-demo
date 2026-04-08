# AI Consumer Runtime Execution Cards Batch 1

文档版本：v1  
日期：2026-04-02  
状态：Runtime 首批执行卡  
适用范围：`AIpersona-demo` Runtime-first 基础实现批次

## 1. 使用方式

这份文档是给后续 AI 员工直接执行的 Runtime 卡片，不是系统设计摘要。

执行前必须先读：

1. `handoff.md`
2. `docs/planning/system_design.md`
3. `docs/planning/mvp_prd.md`
4. `docs/planning/implementation_tasks.md`

执行原则：

- 先 Runtime，后 Agent
- 先对象模型，后页面接口
- 先持久化和状态机，后解释型文案
- 不允许退化成 `Chat UI + function calling`

## 2. Batch 1 目标

Batch 1 不追求把 Runtime 全做完，而是先把最小系统骨架立住：

`可启动 API/Worker -> 有核心对象模型 -> 有 Study Plan / Study Run 状态骨架 -> 有空工作流可启动`

## 3. 卡片列表

### Card R01：Runtime Foundation

**目标**

把后续所有研究执行能力挂到统一运行时上。

**依赖**

- 无

**负责目录**

- `apps/api`
- `apps/worker`
- `packages/agent-runner`
- `infra/temporal`
- 根级 workspace 配置

**必须完成**

- 建立 Monorepo 基础工程
- API 可启动
- Worker 可启动
- Temporal 本地可启动
- `AgentRunner` 建立最小抽象层
- 业务层不直接绑定具体模型 SDK

**禁止事项**

- 不要直接把模型调用写进业务 service
- 不要先写 chat endpoint
- 不要先写“看起来能跑”的假 Agent 页面

**完成标准**

- 本地能启动 API / Worker / Temporal
- 能创建一个空 `StudyWorkflow`
- 有统一配置、日志和错误模型

### Card R02：Domain Schema 与 Contracts

**目标**

先把 Runtime 的业务对象和版本关系固化。

**依赖**

- Card R01

**负责目录**

- `packages/domain-models`
- `packages/contracts`
- `infra/sql`

**必须完成**

- 定义核心对象模型
- 落最小数据库 schema
- 建立 migration 机制
- 建立前后端共享 contracts

**Batch 1 必须覆盖的对象**

- `study`
- `study_plan`
- `study_plan_version`
- `study_run`
- `run_step`
- `approval_gate`
- `artifact`
- `consumer_twin`
- `twin_version`

**禁止事项**

- 不要把所有东西塞进一个万能 JSON 表
- 不要省略 version 对象
- 不要让 `study_run` 脱离 `study_plan_version`

**完成标准**

- 核心对象可落库
- 版本关系清晰
- contracts 可供前端和 workflow 共享

### Card R03：Study Planning Skeleton

**目标**

让 study plan 成为真正可审批、可版本化的运行时对象。

**依赖**

- Card R02

**负责目录**

- `apps/api` 中的 planning 模块
- `packages/contracts`
- `packages/domain-models`

**必须完成**

- 创建 `study`
- 创建 `study_plan_version`
- 支持 draft 状态
- 支持 approval 状态
- 保留版本历史

**至少要能表达的字段**

- business goal
- selected twins
- selected stimuli
- qual config
- quant config
- estimated runtime
- approval required

**禁止事项**

- 不要把 plan 做成对话文本
- 不要用单条 message 代替结构化 plan version
- 不要允许直接覆盖已存在版本

**完成标准**

- API 可以创建和查询 `study_plan_version`
- 批准动作会改变审批状态
- 关键字段修改会产生新版本

### Card R04：Study Runtime Workflow Skeleton

**目标**

把研究执行生命周期做成真实状态机，而不是页面假状态。

**依赖**

- Card R01
- Card R02
- Card R03

**负责目录**

- `apps/worker`
- `apps/api`
- `packages/contracts`

**必须完成**

- 定义 `StudyWorkflow`
- 启动一个 `study_run`
- 写回 `run_step`
- 支持以下状态：
  - `planning`
  - `awaiting_approval`
  - `running`
  - `awaiting_midrun_review`
  - `completed`
- 预留 `resume` 和 `rerun` 接口

**禁止事项**

- 不要把状态只放前端 store
- 不要把“审批”做成前端按钮假切换
- 不要把运行历史丢在日志里不入库

**完成标准**

- 可以从已批准 plan 启动空 run
- 可以查询 run status
- 可以写回至少一条 `run_step`
- 可以从 mid-run review 状态恢复执行

## 4. Batch 1 完成后的业务意义

完成这四张卡后，项目会第一次真正具备以下能力：

- 前端不再是孤立 Demo
- Runtime-first 有实际代码支撑
- 后续 qual / quant / replay / calibration 都有真实挂载点
- 客户看到的状态，不再只是页面演出，而是未来可落地的产品路径

一句话收口：

`Batch 1 的任务不是把 Agent 做聪明，而是先把 Agent 放进一个成立的运行时里。`
