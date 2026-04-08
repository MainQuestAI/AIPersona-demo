# AIpersona Demo 接手后的开发主计划

文档版本：v1  
日期：2026-04-02  
状态：接手后正式执行计划  
适用范围：`AIpersona-demo` 后续所有 AI 开发编排

## 1. 这份文档解决什么问题

这不是新方案，也不是重复写 PRD。

这份文档只解决一件事：

`在现有规划已基本完整的前提下，把 AIpersona-demo 从“文档齐备”推进到“可演示、可扩展、可继续实现”的实际开发阶段。`

---

## 2. 接手结论

### 2.1 当前项目真实状态

当前项目已经完成了以下高价值规划：

- 前端主舞台和演示顺序已经锁定
- 演示业务故事和所有 P0 文案已经锁定
- 前端 mock data 的 Runtime-shaped 结构已经锁定
- Runtime-first 系统设计已经锁定
- MVP 业务边界和后端实施顺序已经锁定
- 前端 Batch 1 执行卡已经可直接派工

但当前项目仍然存在三个现实缺口：

1. 仓库还没有前端工程骨架
2. 仓库还没有 Runtime MVP 的代码底座
3. 当前目录甚至还不是一个 git 仓库

结论：

`这个项目现在不缺方案，缺的是第一版工程载体和执行编排。`

### 2.2 业务上最重要的判断

接下来不应该平均推进所有模块，而应该按业务价值分成两条线：

- `主线 A：前端演示环境`
  目标是尽快把比稿主路径跑通，形成可截图、可演示、可讲故事的产品前台
- `主线 B：Runtime MVP 基础底座`
  目标是避免项目退化成“只有前台，没有运行时”的伪 Agent 产品

优先级判断：

`短期先让前台成立，中期同步把 Runtime 底座立住。`

原因很简单：

- 没有前台，就没有对外可见价值
- 没有 Runtime 底座，后面所有 Agent 都会退化成演示壳

---

## 3. 后续开发总策略

### 3.1 总体策略：双轨并行，前台先落，运行时不缺席

建议后续开发按以下方式推进：

#### Track A：Demo Frontstage

目标：

- 先交付 `Workbench / Compare / Twins / Evidence` 主路径
- 先让客户看到：
  - 研究是怎么发起的
  - qual + quant 是怎么形成结论的
  - recommendation 为什么可信

这一轨的价值是：

- 直接支持比稿
- 直接支持截图和演示脚本
- 直接形成“产品感”和“可信度感知”

#### Track B：Runtime Foundation

目标：

- 从第一天开始保留 Runtime-first 落地路径
- 先定义并实现最小运行时骨架
- 避免后面从单页 Demo 反向重构成真正系统

这一轨的价值是：

- 保证后续能接审批、恢复、回放、重跑、评测
- 保证对象模型、状态机和 Agent 调用链不失真
- 保证未来能从 mock adapter 平滑切真实 API

### 3.2 工程策略：建议直接采用 Monorepo 外壳

虽然现有前端文档建议从根目录 `src/` 起步，但基于 Runtime-first 原则，接手后建议直接采用下面的外壳：

```text
AIpersona-demo/
  docs/
  apps/
    web/
    api/
    worker/
  packages/
    domain-models/
    contracts/
    agent-runner/
    replay-builder/
  infra/
    temporal/
    sql/
    observability/
```

说明：

- `apps/web` 内部仍然可以继续沿用现有前端规划文档中的组件结构
- 这样几乎不影响前端首版速度
- 但可以避免后面再做一次“目录级重构”

这是本次接手后唯一建议调整的地方。

原因不是技术洁癖，而是业务效率：

`现在多花 5% 的结构成本，可以避免后面 30% 的迁移成本。`

---

## 4. 正式开发阶段划分

## Phase 0：启动准备

### 目标

把项目从“文档仓库”变成“可执行仓库”。

### 必须产出

- 初始化 git 仓库
- 建立 Monorepo 外壳
- 确定包管理器与基础脚本
- 建立 `apps/web` 最小可启动结构
- 预留 `apps/api`、`apps/worker`、`packages/contracts`、`packages/domain-models`

### 完成标准

- 仓库可被正常版本化
- 前端和后端不再共享一个混乱根目录
- 后续 AI 员工可以按模块独立工作

### 业务价值

- 正式进入可开发状态
- 避免一开始就把结构做死

## Phase 1：前端骨架与视觉底座

### 目标

让 Workbench 有真实产品外观，而不是脚手架页面。

### 范围

- `apps/web` 初始化
- React + TypeScript + Vite
- Router / Tailwind / Motion / Zustand 等接入
- App Shell
- Global Rail
- Workbench / Compare / Twins 三个一级路由
- 全局 tokens

### 验收标准

- 本地可启动
- 页面能切换
- 左侧导航和工作台气质成立

### 对业务的意义

- 第一眼就能判断这不是普通聊天工具
- 为后续所有截图和演示提供底座

## Phase 2：统一类型与 Mock 真源

### 目标

把所有页面统一喂到同一个研究故事上。

### 范围

- `src/types/demo.ts`
- `src/mocks/*`
- 三个场景：
  - `completed-recommendation`
  - `awaiting-midrun-review`
  - `rerun-suggested`

### 验收标准

- 所有业务文案都从 mock layer 输出
- `清泉+ / 初元优养 / 安纯`
- `74 / 61 / 52`
- `Confidence 82 / High`
- `winner / next action / twin excerpts`
  在所有页面保持一致

### 对业务的意义

- 解决“每个页面都讲不同故事”的演示灾难
- 让前台从第一版开始就具备可信度

## Phase 3：Workbench P0 主路径

### 目标

让客户在主舞台上看到完整研究链路。

### 范围

- Workbench Header
- Study Setup Bar
- Conversation Thread
- 6 张主路径卡片
- Prompt Composer
- Result Panel

### 必须成立的感知

- 这是哪项研究
- 对谁研究
- 测什么刺激物
- 当前处于哪个阶段
- 谁赢了
- 为什么赢
- 下一步做什么

### 验收标准

- 可直接打开 `Completed with Recommendation`
- 可通过 timeline 回溯到 `Plan / Approval / Qual / Quant`
- `Qual Session Card` 能看到摘录
- `Plan Approval` 和 `Mid-run Review` 显性存在

### 对业务的意义

- 这是比稿最核心的价值页面
- 70% 以上的演示时长都会落在这里

## Phase 4：Evidence Layer + Compare + Twins

### 目标

把“可信、可解释、可追溯”补齐，让推荐结果成立。

### 范围

- Trust Drawer
- Twin Provenance Drawer
- Input Sources Drawer
- Replay Modal
- Compare 页面
- Twins 页面

### 验收标准

- 结果不仅能看，还能解释
- 客户追问“为什么可信”时，有明确证据层入口
- Compare 页面不是单一排行榜
- Twins 页面能证明 `Danone-owned consumer twins`

### 对业务的意义

- 从“好看 Demo”升级到“可信产品”
- 直接回应采购时最敏感的问题

## Phase 5：Runtime Foundation Batch 1

### 目标

在不影响前端演示速度的前提下，立住最小运行时底座。

### 范围

- `apps/api`
- `apps/worker`
- `packages/contracts`
- `packages/domain-models`
- `packages/agent-runner`
- `infra/temporal`
- `infra/sql`

### Batch 1 必须成立

- 能创建 `Study`
- 能创建 `StudyPlanVersion`
- 能启动一个空的 `StudyWorkflow`
- 能写回 `study_run`
- 能表示 `awaiting_approval / running / awaiting_midrun_review / completed`

### 验收标准

- 运行时对象不是口头设计，而是有真实代码结构
- 后续前端不需要重新发明 API 形状
- 后续 qual / quant / replay 可以继续接上

### 对业务的意义

- 保证这个产品未来能从 Demo 变成可交付系统
- 不会在比稿后重新推倒重来

## Phase 6：演示打磨与交付准备

### 目标

把第一版产品从“可用”推进到“可比稿”。

### 范围

- 内容一致性复核
- 演示脚本顺序优化
- 状态切换体验
- 截图视角和录像路径优化
- 中英文混排、微文案统一

### 验收标准

- 可以按 3 到 5 分钟主线顺畅演示
- 能用截图直接做提案材料
- 不出现违和的默认样式或脚手架痕迹

---

## 5. AI 员工编排建议

### 5.1 可立即派发的任务

当前可以直接派发给 AI 员工的任务分成两组：

#### 组 A：前端直开

- Card 01：项目骨架与视觉底座
- Card 02：统一类型与 Mock 真源
- Card 03：Workbench 外壳与 Header / Setup Bar
- Card 04：Conversation Thread 主路径卡片
- Card 05：Structured Result Panel
- Card 06：Evidence Drawers + Replay Modal

这些卡片已经在：

- `docs/planning/frontend_execution_cards_batch1.md`

#### 组 B：Runtime 基础批次

建议新增一批 Runtime 执行卡，至少包含：

1. Runtime Foundation
2. Domain Schema
3. Study Planning Contracts
4. Study Runtime Workflow Skeleton

这部分当前已有系统级拆解，但还缺面向 AI 员工的“执行卡格式”。

### 5.2 并行原则

可以并行，但不能乱并：

- 前端 Card 01 与 Runtime Foundation 可以并行
- Card 02 必须依赖 Card 01
- Card 03、04、05 可以在 Card 02 之后分工并行
- Card 06 依赖 04 和 05
- Runtime Domain Schema 必须跟在 Runtime Foundation 之后

---

## 6. 当前阻塞项

### 阻塞 1：仓库未初始化

当前目录不是 git 仓库。

这会直接影响：

- 分支管理
- AI 员工并行协作
- 版本回滚
- PR 式审阅

### 阻塞 2：前端工程尚未起步

现有文档已足够支持前端开工，但代码仍为零。

### 阻塞 3：Runtime 仍停留在设计层

如果只推进前端而不补 Runtime Batch 1，项目后面容易回退成演示壳。

---

## 7. 接手后的建议起手动作

如果从现在开始正式推进，我建议按下面顺序启动：

1. 先做 `Phase 0`
2. 立即派发前端 `Card 01 + Card 02`
3. 同步派发 Runtime `Foundation + Domain Schema` 两张新卡
4. 前端进入 `Workbench completed state` 主路径
5. 再补 evidence、compare、twins

一句话收口：

`这个项目已经具备进入开发的全部规划条件，下一步不是继续讨论，而是立即把“前端主舞台 + Runtime 底座”双轨启动。`
