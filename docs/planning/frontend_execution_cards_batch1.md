# AI Consumer Demo Frontend Execution Cards Batch 1

文档版本：v1  
日期：2026-04-02  
状态：首批执行卡片  
适用范围：`AIpersona-demo` 前端首轮开发编排

## 1. 使用方式

这份文档不是方案说明，而是给后续 AI 员工的执行卡。

每张卡片都明确：

- 做什么
- 负责哪些文件
- 依赖什么
- 什么算完成
- 什么不能动

执行原则：

1. 先读 [handoff.md](/Users/dingcheng/Desktop/aipersona_demo/handoff.md)
2. 再读 [frontend_implementation_plan.md](/Users/dingcheng/Desktop/aipersona_demo/docs/planning/frontend_implementation_plan.md)
3. 再读 [frontend_mock_data_spec.md](/Users/dingcheng/Desktop/aipersona_demo/docs/planning/frontend_mock_data_spec.md)
4. 最后按卡片执行

## 2. Batch 1 目标

Batch 1 不追求全量完成，而是先把这条主路径做出来：

`可启动项目 -> 有 Workbench 骨架 -> 有统一 mock -> 有 completed state 主路径 -> 可展开 evidence -> 可跳 Compare / Twins`

## 3. 卡片列表

### Card 01: 项目骨架与视觉底座

**目标**

把前端项目跑起来，并先立住 `Precision Laboratory` 的工作台气质。

**依赖**

- 无

**负责文件**

- `package.json`
- `tsconfig.json`
- `vite.config.ts`
- `src/main.tsx`
- `src/app/App.tsx`
- `src/app/routes.tsx`
- `src/app/providers.tsx`
- `src/app/layout/app-shell.tsx`
- `src/app/layout/global-rail.tsx`
- `src/styles/globals.css`
- `src/styles/tokens.css`

**必须完成**

- 前端工程可启动
- `Workbench / Compare / Twins` 三个路由能切换
- 左侧 Global Rail 样式成立
- tokens 已定义，不允许用默认系统样式直接堆页面

**禁止事项**

- 不要写业务文案
- 不要写 mock 分数
- 不要抢先实现具体业务卡片

**完成标准**

- `npm run dev` 可启动
- 页面切换不报错
- 主布局不是脚手架空白页

### Card 02: 统一类型与 Mock 真源

**目标**

把所有前端页面会用到的 demo 数据统一成一套 typed mock layer。

**依赖**

- Card 01 完成基础工程

**负责文件**

- `src/types/demo.ts`
- `src/mocks/scenario-meta.ts`
- `src/mocks/studies/completed-recommendation.ts`
- `src/mocks/studies/awaiting-midrun-review.ts`
- `src/mocks/studies/rerun-suggested.ts`
- `src/mocks/compare/concept-compare.ts`
- `src/mocks/twins/twin-catalog.ts`
- `src/mocks/trust/trust-panel.ts`
- `src/mocks/replay/study-replay.ts`
- `src/mocks/library/library-records.ts`
- `src/mocks/index.ts`

**必须完成**

- 所有主业务文案从 mock layer 输出
- `清泉+ / 初元优养 / 安纯`
- `74 / 61 / 52`
- `Confidence 82 / High`
- `Completed with Recommendation`
- `Awaiting Mid-run Review`
- `Rerun Suggested`

**禁止事项**

- 不要把文案写回组件
- 不要另起第二套 scenario 数据
- 不要把 `Concept A/B/C` 带回来

**完成标准**

- 任何页面都能只依赖 `src/mocks` 取数
- 用类型系统锁住核心字段

### Card 03: Workbench 外壳与 Header / Setup Bar

**目标**

把主舞台首屏做成立。

**依赖**

- Card 01
- Card 02

**负责文件**

- `src/features/workbench/pages/workbench-page.tsx`
- `src/features/workbench/components/workbench-header.tsx`
- `src/features/workbench/components/study-setup-bar.tsx`

**必须完成**

- `study name`
- `status chip`
- `Run Timeline Quick Jump`
- `business question`
- `stimulus scope`
- `Consumer Twins / Built from / Benchmark Pack / Last updated`

**禁止事项**

- 不要把 twins 资产信息藏到 drawer 里才出现
- 不要让 header 只是一个页面标题条

**完成标准**

- 打开 Workbench 第一屏就能讲清：
  - 这是什么研究
  - 对谁研究
  - 测什么
  - 现在处于哪个阶段

### Card 04: Conversation Thread 主路径卡片

**目标**

让中区真正有 `Agent-first` 研究工作台感。

**依赖**

- Card 02
- Card 03

**负责文件**

- `src/features/workbench/components/conversation-thread.tsx`
- `src/features/workbench/components/prompt-composer.tsx`
- `src/features/workbench/components/cards/plan-approval-card.tsx`
- `src/features/workbench/components/cards/qual-session-card.tsx`
- `src/features/workbench/components/cards/midrun-review-card.tsx`
- `src/features/workbench/components/cards/recommendation-card.tsx`
- `src/features/workbench/components/cards/study-complete-card.tsx`
- `src/features/workbench/components/cards/rerun-suggestion-card.tsx`

**必须完成**

- typed event renderer
- `Qual Session Card` 露出 excerpt
- `Plan Approval` 和 `Mid-run Review` 可见
- `Prompt Composer` 有状态化快捷建议
- `Study Complete Card` 有 `View Replay / Download Report / Archive to Library`

**禁止事项**

- 不要把线程做成普通聊天气泡
- 不要省掉审批门
- 不要让 qual 只有标签没有来源摘录

**完成标准**

- 演示者可以顺着线程讲完整个研究过程

### Card 05: Structured Result Panel

**目标**

把右侧做成真正的结构化判断区，而不是静态摘要板。

**依赖**

- Card 02
- Card 03

**负责文件**

- `src/features/results/components/result-panel.tsx`
- `src/features/results/components/recommendation-summary.tsx`
- `src/features/results/components/quant-ranking.tsx`
- `src/features/results/components/qual-themes-summary.tsx`
- `src/features/results/components/segment-difference-panel.tsx`

**必须完成**

- `Winner`
- `Confidence`
- `Next Action`
- `Quant Ranking`
- `Qual Themes`
- `Segment Differences`
- `View Full Comparison`

**禁止事项**

- 不要只做排行榜
- 不要把 qual 埋进 drawer
- 不要让 ranking 不带 confidence

**完成标准**

- 客户只看右侧，也能知道谁赢了、为什么赢、下一步做什么

### Card 06: Evidence Drawers + Replay Modal

**目标**

把“可信、可追溯、可回放”做成后台证据层。

**依赖**

- Card 02
- Card 04
- Card 05

**负责文件**

- `src/app/store/ui-store.ts`
- `src/features/evidence/components/trust-drawer.tsx`
- `src/features/evidence/components/twin-provenance-drawer.tsx`
- `src/features/evidence/components/input-sources-drawer.tsx`
- `src/features/evidence/components/replay-modal.tsx`

**必须完成**

- `Trust Drawer`
- `Twin Provenance Drawer`
- `Input Sources Drawer`
- `Replay Full-screen Modal`

**禁止事项**

- 不要把 replay 做成 audit log
- 不要把 evidence 层铺回主界面

**完成标准**

- 点击后能展开完整证据链
- 主舞台仍然保持清爽

### Card 07: Compare 页面

**目标**

让 Compare 成为真正的决策页，而不是单独一张排行榜。

**依赖**

- Card 02
- Card 05

**负责文件**

- `src/features/compare/pages/compare-page.tsx`

**必须完成**

- stimuli compare grid
- quant ranking
- qual themes compare
- target group differences
- recommended next action

**禁止事项**

- 不要做成空白模板页
- 不要与 Workbench 使用不同分数或不同结论

**完成标准**

- 从 `View Full Comparison` 进入后，页面能自然承接 Workbench 的结论

### Card 08: Twins 页面

**目标**

把 Danone-owned twin assets 做成一个可信的资产页面。

**依赖**

- Card 02

**负责文件**

- `src/features/twins/pages/twins-page.tsx`

**必须完成**

- 两个 twin profile
- `Built from`
- `Age range`
- `Research readiness`
- `Version notes`

**禁止事项**

- 不要只写 placeholder
- 不要把 twin 当作 prompt 文本块展示

**完成标准**

- 页面单独截图时，也能看出这是企业资产而不是即时生成内容

## 4. 推荐并行方式

### 第一组

- Card 01

### 第二组

Card 01 完成后可并行：

- Card 02
- Card 03

### 第三组

Card 02 与 Card 03 完成后可并行：

- Card 04
- Card 05
- Card 08

### 第四组

Card 04 与 Card 05 完成后：

- Card 06
- Card 07

## 5. Batch 1 完成标准

Batch 1 完成时，应该能做到：

1. 打开 Workbench 默认就是 `Completed with Recommendation`
2. 能跳转 Compare
3. 能打开 Twins
4. 能展开 Trust / Provenance / Replay
5. 整个系统从文案到分数都前后一致

做到这一步，第一版演示环境就已经能进入联调和打磨。
