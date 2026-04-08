# Task Plan: AIpersona Demo 项目接手、开发计划、详细分工包与首批执行清单

## Goal
在不改动既有业务叙事和 Runtime-first 架构边界的前提下，完成 AIpersona Demo 项目接手，明确当前真实起点、后续开发顺序、执行卡片，并进一步拆解出可直接派工的详细分工包与首批执行 checklist。

## Current Phase
Phase 9

## Phases

### Phase 1: 项目接手与现状确认
- [x] 理解老板的协作偏好与输出要求
- [x] 读取项目交接文档与目录结构
- [x] 提炼当前项目真实状态、约束和缺口
- **Status:** complete

### Phase 2: 规划文档梳理与关键判断固化
- [x] 读取前端、系统、MVP 与任务拆解文档
- [x] 固化必须执行的 P0 主路径和运行时边界
- [x] 标记存在冲突、缺失或需补齐的部分
- **Status:** complete

### Phase 3: 输出后续开发主计划
- [x] 形成面向业务结果的后续开发计划
- [x] 明确阶段目标、验收口径、执行顺序
- [x] 形成适合派发给 AI 员工的任务框架
- **Status:** complete

### Phase 4: 风险与启动准备
- [x] 识别实现前阻塞项
- [x] 判断是否需要补运行时设计文档或项目骨架
- [x] 给出启动建议与优先动作
- **Status:** complete

### Phase 5: 交付与接手说明
- [x] 交付接手结论
- [x] 交付下一步执行建议
- [x] 提供关键文件入口
- **Status:** complete

### Phase 6: 详细分工包拆解
- [x] 输出总览级详细分工包
- [x] 明确各包依赖、文件所有权和交接关系
- [x] 给出波次执行顺序和老板视角派工建议
- **Status:** complete

### Phase 7: 首批执行清单细化
- [x] 细化 `A01 / W01 / R01`
- [x] 补齐到底层步骤、命令、验收和提交点
- [x] 形成首批 AI 员工可直接执行的 checklist 文档
- **Status:** complete

### Phase 8: SubAgent 开发启动
- [x] 本地完成 `A01` 核心工程底座
- [x] 并行完成 `W01 / R01`
- [x] 完成第一轮集成验证
- **Status:** complete

### Phase 9: 远程开发环境接入与 W02/R02 收口
- [x] 补齐项目级远程开发环境模板与启动脚本
- [x] 审计 `W02 / R02` 实际完成度，避免重复开发
- [x] 将前端 selector 测试与 contracts/domain-models 校验接入 workspace
- **Status:** complete

### Phase 10: R03/R04 Runtime 闭环
- [x] 建立 `study / study_plan_version / approval` API 与服务层
- [x] 建立 `study_run / run_step / midrun review / resume` 最小状态机
- [x] 用真实远端 PostgreSQL + Temporal 完成一轮端到端验证
- **Status:** complete

## Key Questions
1. 当前仓库是否已有可运行代码骨架，还是仍处于“文档已齐、实现未起”的状态？
2. 前端演示层、统一 mock data 层、Runtime-first 运行时模型之间，当前缺口分别在哪里？
3. 哪些规划已经锁死不能改，哪些部分仍需要补充才能正式开工？

## Decisions Made
| Decision | Rationale |
|----------|-----------|
| 先按“项目接手”而非“直接编码”推进 | 你的目标是后续开发计划与任务编排，不是立刻写实现 |
| 以 `docs/handoff.md` 作为真交接入口 | 该文件已明确阅读顺序、业务边界、页面范围和执行顺序 |
| 全程按 Runtime-first 视角审视方案 | 这是项目级硬约束，不能退化成 Prompt-first Demo |
| 接手后主计划采用“双轨并行” | 前台价值必须尽快落地，同时 Runtime 底座不能缺席 |
| 建议采用 Monorepo 外壳而不是根目录单体前端 | 当前仓库尚无代码，正是最低成本调整结构的时点 |
| 详细分工按 `A / W / R` 三类组织 | 有利于先分清底座、前台和运行时三类责任，不会在派工时混包 |
| 派工顺序采用 Wave 制 | 便于控制并行度和依赖，不让多个 AI 员工互相阻塞 |
| 第一批 checklist 先覆盖 `A01 / W01 / R01` | 这是项目从 0 到可启动的关键跃迁点，最值得先细化 |
| 当前执行策略是“本地先打通 A01，再并行派 W01 / R01” | 这是最短关键路径，能最快让 subAgent 真正开始产出代码 |
| Node 侧依赖管理统一切回 `pnpm` | 这与根级 workspace 约束一致，避免不同包管理器污染工作区 |
| 远程开发环境统一走“SSH 隧道 + 远端 PostgreSQL + 远端 Docker API” | 本机无 Docker CLI，远端 Docker API 已验证可用，这是最稳的开发链路 |
| W02 / R02 当前采取“收口优先”而不是“重做一遍” | 现有 typed mock、contracts、domain models、SQL 骨架已成型，更高价值的是补验证和统一入口 |

## Errors Encountered
| Error | Attempt | Resolution |
|-------|---------|------------|
| `~/.codex/skills/planning-with-files/scripts/session-catchup.py` 路径不存在 | 1 | 发现当前技能实际安装在 `~/.agents/skills/planning-with-files/`，后续改用真实路径 |
| 当前目录不是 git 仓库 | 1 | 记录为启动前阻塞项，纳入 Phase 0 首要动作 |

## Notes
- 当前仓库顶层尚未发现应用代码、包管理配置或前端工程入口。
- `docs/planning/` 很可能是当前最重要资产，需继续系统阅读。
- 已新增接手主计划与 Runtime Batch 1 执行卡，可直接作为后续 AI 员工派工入口。
- 已新增详细分工包文档，可作为后续派工主入口。
- 已新增 Wave 0 / Wave 1 首批执行 checklist，可直接给第一批 AI 员工使用。
- 已补齐远程开发环境入口，后续应默认使用远端数据库和远端 Docker API 推进。
- `W02 / R02` 已从“只有文件”推进到“已纳入真实校验”，根级 `pnpm lint` / `pnpm test` 会覆盖 web、contracts、domain-models。
- `R03 / R04` 已具备最小闭环：可以创建 study、提交/批准 plan、启动 run、进入 midrun review、resume 并完成 run。
