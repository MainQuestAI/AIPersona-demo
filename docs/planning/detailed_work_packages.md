# AIpersona Demo 详细分工包

> **For agentic workers:** REQUIRED SUB-SKILL: Use `subagent-driven-development`（推荐）或 `executing-plans` 按任务逐包执行。所有步骤使用 checkbox 语法跟踪，不允许跳步。

**Goal:** 把 `AIpersona-demo` 从“已有规划文档”推进到“可直接派给 AI 员工并行执行”的详细分工状态，确保前端主舞台和 Runtime-first 底座可以双轨落地。

**Architecture:** 采用 `Demo Frontstage + Runtime Foundation` 双轨并行策略。前台优先交付达能比稿主路径，底层同步建立 `study / study_plan_version / study_run / run_step` 的最小运行时骨架，避免项目退化成纯演示壳。

**Tech Stack:** Web 侧采用 React、TypeScript、Vite、React Router、Tailwind CSS、Framer Motion、Zustand、Vitest、Playwright；Runtime 侧采用 FastAPI、PostgreSQL、Temporal、Object Storage、共享 contracts/domain models。

---

## 1. 分工原则

### 1.1 这次拆包的目标

不是把任务写得更多，而是把任务写得更可执行。

每个包必须回答清楚：

- 谁来做
- 做到哪里算完成
- 依赖谁
- 不能碰什么
- 完成后交给谁继续接

### 1.2 分包方法

本次分包按三类组织：

- `A 类：启动与工程底座`
- `W 类：Web 前台演示环境`
- `R 类：Runtime-first 后台底座`

### 1.3 并行规则

允许并行，但只允许按依赖并行：

- `A01` 完成后，`W01` 与 `R01` 可以并行
- `W02` 必须依赖 `W01`
- `W03 / W04 / W05` 依赖 `W02`
- `W06` 依赖 `W04 + W05`
- `W07` 依赖 `W02`
- `W08` 依赖 `W03 ~ W07`
- `R02` 依赖 `R01`
- `R03` 依赖 `R02`
- `R04` 依赖 `R01 + R02 + R03`
- `R05` 依赖 `R04`
- 最终联调依赖 `W08 + R05`

---

## 2. 建议的执行波次

### Wave 0：先把仓库变成可开发仓库

- `A01`

### Wave 1：双轨起跑

- `W01`
- `R01`

### Wave 2：把内容真源和对象真源立住

- `W02`
- `R02`

### Wave 3：把主舞台和计划对象立住

- `W03`
- `W04`
- `W05`
- `R03`

### Wave 4：补齐证据层和执行生命周期

- `W06`
- `W07`
- `R04`

### Wave 5：打磨到可演示、可联调

- `W08`
- `R05`

---

## 3. 详细分工包

## A 类：启动与工程底座

### Package A01：仓库初始化与 Monorepo 外壳

**业务目标**

把项目从文档目录升级成正式开发仓库，为后续所有 AI 员工建立统一入口。

**适合派给**

- 基础设施型 AI 员工
- 擅长工程初始化和目录治理的 AI 员工

**依赖**

- 无

**负责范围**

- 初始化 git 仓库
- 建立 Monorepo 根结构
- 选择包管理器并固化脚本
- 预创建 `apps/`、`packages/`、`infra/` 目录

**文件所有权**

- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `turbo.json`
- Create: `.gitignore`
- Create: `README.md`
- Create: `apps/web/`
- Create: `apps/api/`
- Create: `apps/worker/`
- Create: `packages/contracts/`
- Create: `packages/domain-models/`
- Create: `packages/agent-runner/`
- Create: `packages/replay-builder/`
- Create: `infra/temporal/`
- Create: `infra/sql/`
- Create: `infra/observability/`

**必须完成**

- 仓库进入 git 管理
- 根级 workspace 可识别
- `apps/web`、`apps/api`、`apps/worker` 路径可被后续包直接使用

**禁止事项**

- 不要在这个包里写业务页面
- 不要在这个包里写数据库 schema
- 不要自行改写 `docs/planning/` 中的业务定义

**完成标准**

- 根目录能跑 `git status`
- workspace 配置可被包管理器识别
- 目录结构与接手主计划一致

**交接给**

- `W01`
- `R01`

---

## W 类：Web 前台演示环境

### Package W01：Web 项目骨架与视觉底座

**业务目标**

让达能比稿前台先出现“真实产品感”，避免一上来就是脚手架空白页。

**适合派给**

- 前端骨架型 AI 员工
- 擅长 React/Vite/设计 token 初始化的 AI 员工

**依赖**

- `A01`

**文件所有权**

- Create: `apps/web/package.json`
- Create: `apps/web/tsconfig.json`
- Create: `apps/web/vite.config.ts`
- Create: `apps/web/index.html`
- Create: `apps/web/src/main.tsx`
- Create: `apps/web/src/app/App.tsx`
- Create: `apps/web/src/app/routes.tsx`
- Create: `apps/web/src/app/providers.tsx`
- Create: `apps/web/src/app/layout/app-shell.tsx`
- Create: `apps/web/src/app/layout/global-rail.tsx`
- Create: `apps/web/src/styles/globals.css`
- Create: `apps/web/src/styles/tokens.css`

**必须完成**

- React + TypeScript + Vite 启动
- Router 接入
- Global Rail 出现
- `Workbench / Compare / Twins` 三个路由可切换
- tokens 建立，页面不是默认系统样式

**禁止事项**

- 不要写具体业务卡片
- 不要在组件里写演示文案
- 不要抢做 mock 数据

**完成标准**

- `apps/web` 可本地启动
- 三个一级路由无报错
- 布局风格明显不是默认脚手架

**交接给**

- `W02`

### Package W02：统一类型系统与 Mock 真源层

**业务目标**

把整个前端演示环境锁定到同一个研究故事，避免页面内容彼此打架。

**适合派给**

- 数据建模型前端 AI 员工
- 擅长 TypeScript 类型设计和 mock adapter 的 AI 员工

**依赖**

- `W01`

**文件所有权**

- Create: `apps/web/src/types/demo.ts`
- Create: `apps/web/src/mocks/scenario-meta.ts`
- Create: `apps/web/src/mocks/studies/completed-recommendation.ts`
- Create: `apps/web/src/mocks/studies/awaiting-midrun-review.ts`
- Create: `apps/web/src/mocks/studies/rerun-suggested.ts`
- Create: `apps/web/src/mocks/compare/concept-compare.ts`
- Create: `apps/web/src/mocks/twins/twin-catalog.ts`
- Create: `apps/web/src/mocks/trust/trust-panel.ts`
- Create: `apps/web/src/mocks/replay/study-replay.ts`
- Create: `apps/web/src/mocks/library/library-records.ts`
- Create: `apps/web/src/mocks/index.ts`
- Create: `apps/web/src/mocks/selectors/`

**必须完成**

- 所有业务核心文案从 mock 层输出
- 三个状态场景可切换
- 结构遵循 Runtime-shaped 数据模型
- selector-ready 数据可直接喂页面

**必须锁死的内容**

- `清泉+ / 初元优养 / 安纯`
- `74 / 61 / 52`
- `Confidence 82 / High`
- `清泉+` 为 winner
- `Proceed to consumer validation`

**禁止事项**

- 不要让页面组件自己拼业务文案
- 不要再创建第二套 scenario
- 不要把数据结构做成纯展示 JSON

**完成标准**

- 任意页面都可只依赖 `src/mocks` 取数
- 类型系统能约束关键字段不被误改

**交接给**

- `W03`
- `W04`
- `W05`
- `W07`

### Package W03：Workbench 首屏外壳

**业务目标**

让客户一进 Workbench，就知道这是什么研究、测谁、测什么、处于什么阶段。

**适合派给**

- 擅长布局和信息架构落地的前端 AI 员工

**依赖**

- `W02`

**文件所有权**

- Create: `apps/web/src/features/workbench/pages/workbench-page.tsx`
- Create: `apps/web/src/features/workbench/components/workbench-header.tsx`
- Create: `apps/web/src/features/workbench/components/study-setup-bar.tsx`

**必须完成**

- Study Name
- Status Chip
- Run Timeline Quick Jump
- Business Question
- Stimulus Scope
- Consumer Twins / Built from / Benchmark Pack / Last updated

**禁止事项**

- 不要把 twin 资产信息藏到二级抽屉
- 不要只做一个页面标题栏

**完成标准**

- 首屏能独立支撑演示开场
- `Danone-owned twins` 感知已在首屏出现

**交接给**

- `W08`

### Package W04：Conversation Thread 与主路径卡片

**业务目标**

把 Agent-first 的研究协作感真正建立起来，而不是普通聊天气泡。

**适合派给**

- 擅长组件建模和事件渲染的前端 AI 员工

**依赖**

- `W02`

**文件所有权**

- Create: `apps/web/src/features/workbench/components/conversation-thread.tsx`
- Create: `apps/web/src/features/workbench/components/prompt-composer.tsx`
- Create: `apps/web/src/features/workbench/components/cards/plan-approval-card.tsx`
- Create: `apps/web/src/features/workbench/components/cards/qual-session-card.tsx`
- Create: `apps/web/src/features/workbench/components/cards/midrun-review-card.tsx`
- Create: `apps/web/src/features/workbench/components/cards/recommendation-card.tsx`
- Create: `apps/web/src/features/workbench/components/cards/study-complete-card.tsx`
- Create: `apps/web/src/features/workbench/components/cards/rerun-suggestion-card.tsx`

**必须完成**

- typed event renderer
- 6 张主路径卡片
- `Qual Session Card` 显示 twin excerpts
- `Plan Approval` 与 `Mid-run Review` 有显性动作
- `Prompt Composer` 按状态切换快捷建议

**禁止事项**

- 不要把线程做成纯聊天记录
- 不要省略审批门
- 不要只显示 qual 标签不显示摘录

**完成标准**

- 演示者可顺着线程完整讲完研究过程

**交接给**

- `W06`
- `W08`

### Package W05：Structured Result Panel

**业务目标**

让客户不看线程，也能快速知道谁赢了、为什么赢、下一步做什么。

**适合派给**

- 擅长结构化信息表达的前端 AI 员工

**依赖**

- `W02`

**文件所有权**

- Create: `apps/web/src/features/results/components/result-panel.tsx`
- Create: `apps/web/src/features/results/components/recommendation-summary.tsx`
- Create: `apps/web/src/features/results/components/quant-ranking.tsx`
- Create: `apps/web/src/features/results/components/qual-themes-summary.tsx`
- Create: `apps/web/src/features/results/components/segment-difference-panel.tsx`

**必须完成**

- Winner
- Confidence
- Next Action
- Quant Ranking
- Qual Themes
- Segment Differences
- View Full Comparison CTA

**禁止事项**

- 不要只做排行榜
- 不要把 qual 全部埋到 drawer
- 不要把 confidence 从 ranking 中去掉

**完成标准**

- 右侧单独存在也可以支撑“结果解释”

**交接给**

- `W06`
- `W08`

### Package W06：Evidence Layer 与 Replay

**业务目标**

把“为什么可信”变成可以打开、可以回放、可以追溯的证据层。

**适合派给**

- 擅长浮层、状态管理和证据视图的前端 AI 员工

**依赖**

- `W04`
- `W05`

**文件所有权**

- Create: `apps/web/src/app/store/ui-store.ts`
- Create: `apps/web/src/features/evidence/components/trust-drawer.tsx`
- Create: `apps/web/src/features/evidence/components/twin-provenance-drawer.tsx`
- Create: `apps/web/src/features/evidence/components/input-sources-drawer.tsx`
- Create: `apps/web/src/features/evidence/components/replay-modal.tsx`

**必须完成**

- Trust Drawer
- Twin Provenance Drawer
- Input Sources Drawer
- Replay Full-screen Modal
- 基础打开/关闭状态管理

**禁止事项**

- 不要把证据层铺满主舞台
- 不要把 provenance 简化成几行静态文本

**完成标准**

- 客户追问可信度时，有明确可打开入口
- Replay 可作为主路径中的关键证据

**交接给**

- `W08`

### Package W07：Compare 与 Twins 页面

**业务目标**

把“决策比较”和“资产归属”两张辅助页面做成立。

**适合派给**

- 擅长独立页面落地的前端 AI 员工

**依赖**

- `W02`

**文件所有权**

- Create: `apps/web/src/features/compare/pages/compare-page.tsx`
- Create: `apps/web/src/features/twins/pages/twins-page.tsx`
- Create: `apps/web/src/features/library/pages/library-page.tsx`

**必须完成**

- Compare 页面能展示多刺激物对比逻辑
- Twins 页面能展示 twin catalog、version、lineage
- Library 页面至少保留轻量入口占位

**禁止事项**

- 不要让 Compare 只剩排行榜
- 不要让 Twins 变成空资料页

**完成标准**

- Workbench 外，客户还有两张能继续证明价值的页面

**交接给**

- `W08`

### Package W08：前端联调、演示打磨与冒烟测试

**业务目标**

把前台从“能看”推进到“能比稿”。

**适合派给**

- 擅长收口、联调和质量保障的前端 AI 员工

**依赖**

- `W03`
- `W04`
- `W05`
- `W06`
- `W07`

**文件所有权**

- Create: `apps/web/src/tests/smoke/workbench.spec.ts`
- Create: `apps/web/src/tests/smoke/compare.spec.ts`
- Create: `apps/web/src/tests/smoke/twins.spec.ts`
- Modify: `apps/web/src/app/routes.tsx`
- Modify: `apps/web/src/app/layout/app-shell.tsx`

**必须完成**

- 主路径联调
- 样式统一
- 路由切换验证
- drawer / modal 可打开
- 关键页面 smoke tests

**禁止事项**

- 不要在这个包里大改业务故事
- 不要新增第二套演示路径

**完成标准**

- 可按 3-5 分钟顺畅演示
- 可截图
- 关键路径无明显断点

**交接给**

- 最终演示验收

---

## R 类：Runtime-first 后台底座

### Package R01：API / Worker / Temporal 启动底座

**业务目标**

给 Runtime-first 真正建一个能运行、能扩展的后台外壳。

**适合派给**

- 后端基础设施型 AI 员工

**依赖**

- `A01`

**文件所有权**

- Create: `apps/api/pyproject.toml`
- Create: `apps/api/src/app/main.py`
- Create: `apps/api/src/app/core/config.py`
- Create: `apps/api/src/app/core/logging.py`
- Create: `apps/worker/pyproject.toml`
- Create: `apps/worker/src/worker/main.py`
- Create: `packages/agent-runner/README.md`
- Create: `packages/agent-runner/src/`
- Create: `infra/temporal/docker-compose.yml`

**必须完成**

- API 可启动
- Worker 可启动
- Temporal 可本地启动
- 配置、日志、错误模型有基础骨架

**禁止事项**

- 不要直连模型 SDK 到业务服务
- 不要先写 chat endpoint

**完成标准**

- 三个核心进程可跑起来
- 后续 workflow 有挂载点

**交接给**

- `R02`
- `R04`

### Package R02：Domain Models 与 Shared Contracts

**业务目标**

把系统最关键的业务对象与版本约束固化，防止后续越做越散。

**适合派给**

- 擅长对象模型与 schema 设计的后端 AI 员工

**依赖**

- `R01`

**文件所有权**

- Create: `packages/domain-models/src/`
- Create: `packages/contracts/src/`
- Create: `infra/sql/migrations/`
- Create: `infra/sql/schema/`

**Batch 1 必须覆盖对象**

- `study`
- `study_plan`
- `study_plan_version`
- `study_run`
- `run_step`
- `approval_gate`
- `artifact`
- `consumer_twin`
- `twin_version`

**必须完成**

- 最小 schema
- migration 机制
- 前后端共享 contracts
- `study_run` 显式绑定 `study_plan_version`

**禁止事项**

- 不要用单一万能 JSON 表偷懒
- 不要省略 version 对象

**完成标准**

- 关键对象可入库
- contracts 可被 API 与 workflow 共用

**交接给**

- `R03`
- `R04`

### Package R03：Study Planning API Skeleton

**业务目标**

把“研究计划”从说明文档变成真实业务对象。

**适合派给**

- 擅长 REST API 和业务对象服务层的后端 AI 员工

**依赖**

- `R02`

**文件所有权**

- Create: `apps/api/src/app/modules/studies/`
- Create: `apps/api/src/app/modules/planning/`
- Create: `apps/api/src/app/modules/approval/`
- Modify: `packages/contracts/src/`
- Modify: `packages/domain-models/src/`

**必须完成**

- 创建 `study`
- 创建 `study_plan_version`
- 查询 plan version
- plan approval
- plan version history

**必须表达字段**

- business goal
- selected twins
- selected stimuli
- qual config
- quant config
- estimated runtime
- approval required

**禁止事项**

- 不要把 plan 退化成一段聊天文本
- 不要允许覆盖既有版本

**完成标准**

- API 可创建并查询 plan version
- 修改关键字段时产生新版本

**交接给**

- `R04`
- `R05`

### Package R04：Study Runtime Workflow Skeleton

**业务目标**

把研究执行过程做成真正可恢复、可审批、可追踪的生命周期。

**适合派给**

- 擅长 workflow / Temporal / 状态机的后端 AI 员工

**依赖**

- `R01`
- `R02`
- `R03`

**文件所有权**

- Create: `apps/worker/src/worker/workflows/study_workflow.py`
- Create: `apps/worker/src/worker/activities/`
- Modify: `apps/api/src/app/modules/studies/`
- Modify: `packages/contracts/src/`

**必须完成**

- `StudyWorkflow`
- 创建 `study_run`
- 写回 `run_step`
- run status 查询
- mid-run review 状态
- `resume` / `rerun` 接口骨架

**必须支持状态**

- `planning`
- `awaiting_approval`
- `running`
- `awaiting_midrun_review`
- `completed`

**禁止事项**

- 不要把状态只放前端
- 不要把审批做成页面假切换
- 不要让 workflow 历史不落库

**完成标准**

- 可从 approved plan 启动空 run
- 可查询 run status
- 可从 mid-run review 恢复

**交接给**

- `R05`

### Package R05：前后端 Runtime 契约与联调占位

**业务目标**

让前端未来从 mock 切到真实 API 时，不需要推倒重做。

**适合派给**

- 擅长 API contract 设计与前后端接口握手的 AI 员工

**依赖**

- `R03`
- `R04`

**文件所有权**

- Modify: `packages/contracts/src/`
- Create: `apps/api/src/app/modules/runtime-status/`
- Create: `docs/planning/runtime_web_contract_map.md`

**必须完成**

- 输出前端状态字段与 Runtime 对象字段的映射
- 输出 mock selector 与未来 API response 的对齐表
- 提供最小状态查询接口

**禁止事项**

- 不要在这个包里急着接真实 qual/quant 引擎
- 不要让前端重新发明状态字段

**完成标准**

- 前端知道未来如何替换 adapter
- API 和前端不会在命名与状态语义上跑偏

**交接给**

- 后续真实 API 接线批次

---

## 4. 老板视角的派工建议

### 第一批立刻派

- `A01`
- `W01`
- `R01`

这批的目标不是功能完整，而是把项目从 0 拉到“可启动”。

### 第二批紧跟着派

- `W02`
- `R02`

这批的目标是把“内容真源”和“对象真源”同时锁死。

### 第三批开始体现产品价值

- `W03`
- `W04`
- `W05`
- `R03`

这批完成后，你就会第一次看到：

- 前端主舞台开始成立
- Runtime 里的 study plan 开始成立

### 第四批补齐可信与生命周期

- `W06`
- `W07`
- `R04`

### 第五批收口

- `W08`
- `R05`

---

## 5. 这份分工包的使用方式

如果你要把任务发给其他 AI 员工，建议每次只发：

- 1 个分工包
- 1 个上位文档入口
- 1 个完成标准

不要一次把 5 个包糊给同一个 AI 员工，否则质量会掉。

最小派工模板建议：

1. 阅读 `handoff.md`
2. 阅读对应分工包
3. 只负责你自己的文件所有权范围
4. 不得改动业务故事和主数据口径
5. 完成后按“完成标准”自检并交付

一句话收口：

`这份文档的作用，不是让项目看起来更专业，而是让后续 AI 开发真正能并行、能控边界、能持续推进。`
