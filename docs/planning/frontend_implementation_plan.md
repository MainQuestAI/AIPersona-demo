# AI Consumer Demo Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `subagent-driven-development`（推荐）或 `executing-plans` 按任务逐项执行。所有步骤使用 checkbox 语法跟踪，不允许跳步。

**Goal:** 在 `AIpersona-demo` 中交付一个可演示、可截图、可沿着达能比稿脚本顺畅演示的前端环境，先基于统一 mock data 跑通 `Workbench / Compare / Twins / Evidence` 主路径。

**Architecture:** 前端采用 `Agent-first frontstage + Runtime-shaped UI model`。也就是前台让用户感知到 Agent 在协商、执行、审批和解释，底层数据结构仍然围绕 `study / study_plan_version / study_run / conversation_event / recommendation / twin / replay` 建模，而不是把页面做成纯 chat 壳。

**Tech Stack:** React、TypeScript、Vite、React Router、Tailwind CSS、Framer Motion、Zustand、Lucide、Vitest、Playwright

---

## 1. 计划边界

这份计划只覆盖 `前端演示环境首版`，不覆盖：

- 真实后端接口
- 真实认证
- 真实数据库
- 真正的 Temporal / Agent Runtime 接线

首版的目标不是“把系统全做完”，而是：

- 先把 `达能比稿主舞台` 做真实
- 先把 `内容一致性` 锁死
- 先把 `交互路径` 跑顺
- 后续再把 mock adapter 换成真实 API adapter

## 2. 交付完成标准

满足以下条件才算首版前端成立：

1. 能从 `Workbench` 直接进入 `Completed with Recommendation` 状态
2. 能通过 `Run Timeline Quick Jump` 回溯到 Plan / Approval / Qual / Quant 阶段
3. `Qual Session Card`、`Mid-run Review Card`、`Recommendation Summary`、`Study Complete Card`、`Rerun Suggestion Card` 全部可见
4. `Compare` 页面能完整展示对比逻辑，而不是单一排行榜
5. `Twins` 页面能证明 `Danone-owned twins`
6. `Trust Drawer`、`Twin Provenance Drawer`、`Input Sources Drawer`、`Replay Full-screen Modal` 可打开
7. 所有文案、分数、主题、摘录均来自 `demo_content_playbook.md`

## 3. 推荐代码结构

由于当前仓库还是空目录，建议直接按下面的结构起步：

```text
AIpersona-demo/
  docs/
    handoff.md
    planning/
      frontend_design.md
      demo_content_playbook.md
      frontend_implementation_plan.md
      frontend_mock_data_spec.md
      frontend_execution_cards_batch1.md
  src/
    main.tsx
    app/
      App.tsx
      routes.tsx
      providers.tsx
      store/
        ui-store.ts
      layout/
        app-shell.tsx
        global-rail.tsx
    styles/
      globals.css
      tokens.css
    types/
      demo.ts
    mocks/
      scenario-meta.ts
      studies/
        completed-recommendation.ts
        awaiting-midrun-review.ts
        rerun-suggested.ts
      compare/
        concept-compare.ts
      twins/
        twin-catalog.ts
      trust/
        trust-panel.ts
      replay/
        study-replay.ts
      library/
        library-records.ts
      index.ts
    features/
      workbench/
        components/
          workbench-header.tsx
          study-setup-bar.tsx
          conversation-thread.tsx
          prompt-composer.tsx
          cards/
            plan-approval-card.tsx
            qual-session-card.tsx
            midrun-review-card.tsx
            recommendation-card.tsx
            study-complete-card.tsx
            rerun-suggestion-card.tsx
        pages/
          workbench-page.tsx
      results/
        components/
          result-panel.tsx
          quant-ranking.tsx
          qual-themes-summary.tsx
          segment-difference-panel.tsx
          recommendation-summary.tsx
      evidence/
        components/
          trust-drawer.tsx
          twin-provenance-drawer.tsx
          input-sources-drawer.tsx
          replay-modal.tsx
      compare/
        pages/
          compare-page.tsx
      twins/
        pages/
          twins-page.tsx
    tests/
      smoke/
        workbench.spec.ts
        compare.spec.ts
        twins.spec.ts
```

## 4. 实施策略

### 4.1 先 mock，后 adapter

第一版不要一上来就接后端。

正确顺序是：

1. 用 `demo_content_playbook.md` 生成统一 mock data
2. 让所有页面只读 mock layer
3. 通过 typed selector / adapter 给组件喂数据
4. 后面若接真实接口，只替换 adapter，不重写页面

### 4.2 先骨架，后细节

优先级顺序固定为：

1. `App Shell`
2. `Workbench 主路径`
3. `Evidence surfaces`
4. `Compare / Twins`
5. `动画与演示打磨`

### 4.3 先 P0，后 P1

P0 是这次比稿真正会被看到的东西：

- Workbench Header
- Study Setup Bar
- Conversation Thread
- Prompt Composer
- Result Panel
- Drawers
- Replay Modal
- Compare
- Twins

P1 才是：

- 更深的 hover 细节
- 更复杂的交互动效
- 更完整的 Library

## 5. 任务拆解

### Task 1: Project Scaffold & Visual Foundation

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vite.config.ts`
- Create: `src/main.tsx`
- Create: `src/app/App.tsx`
- Create: `src/app/routes.tsx`
- Create: `src/app/providers.tsx`
- Create: `src/app/layout/app-shell.tsx`
- Create: `src/app/layout/global-rail.tsx`
- Create: `src/styles/globals.css`
- Create: `src/styles/tokens.css`

- [ ] **Step 1: 初始化 React + TypeScript + Vite 项目骨架**
- [ ] **Step 2: 接入 Tailwind、Framer Motion、React Router、Zustand、Lucide**
- [ ] **Step 3: 写 `tokens.css`，先把 `Precision Laboratory` 的颜色、字重、阴影、边框、圆角、spacing 变量定死**
- [ ] **Step 4: 写 `App Shell` 和左侧 `Global Rail`，先跑通 `Workbench / Compare / Twins` 三个路由**
- [ ] **Step 5: 建立全局布局与响应式断点**
- [ ] **Step 6: 启动本地开发环境并验证基础路由可见**

**完成标准：**
- 有稳定可启动的前端工程
- 三个一级页面能切换
- 左侧导航风格已经成立，不是默认脚手架外观

### Task 2: Demo Domain Types & Mock Data Layer

**Files:**
- Create: `src/types/demo.ts`
- Create: `src/mocks/scenario-meta.ts`
- Create: `src/mocks/studies/completed-recommendation.ts`
- Create: `src/mocks/studies/awaiting-midrun-review.ts`
- Create: `src/mocks/studies/rerun-suggested.ts`
- Create: `src/mocks/compare/concept-compare.ts`
- Create: `src/mocks/twins/twin-catalog.ts`
- Create: `src/mocks/trust/trust-panel.ts`
- Create: `src/mocks/replay/study-replay.ts`
- Create: `src/mocks/library/library-records.ts`
- Create: `src/mocks/index.ts`

- [ ] **Step 1: 先根据 `frontend_mock_data_spec.md` 建 `src/types/demo.ts`**
- [ ] **Step 2: 把 `demo_content_playbook.md` 转成结构化 mock modules**
- [ ] **Step 3: 建立 `completed-recommendation`、`awaiting-midrun-review`、`rerun-suggested` 三个场景**
- [ ] **Step 4: 建立统一导出层，禁止组件直接写死文案**
- [ ] **Step 5: 写最小单测，确保 winner、ranking、confidence、study name 不会被误改**

**完成标准：**
- 所有 P0 页面都能从同一个 mock layer 取数
- 不同页面展示的是同一研究故事
- 没有组件内硬编码主业务文案

### Task 3: Workbench Header & Study Setup Bar

**Files:**
- Create: `src/features/workbench/components/workbench-header.tsx`
- Create: `src/features/workbench/components/study-setup-bar.tsx`
- Create: `src/features/workbench/pages/workbench-page.tsx`

- [ ] **Step 1: 实现 `Workbench Header`，包含 study name、status chip、run timeline quick jump**
- [ ] **Step 2: 实现 `Study Setup Bar`，展示 business question、stimuli scope、study inputs snapshot**
- [ ] **Step 3: 明确露出 twin version、built from、benchmark pack、last updated**
- [ ] **Step 4: 接 completed 场景数据并验证反向演示入口成立**

**完成标准：**
- 客户一打开页面就知道这是哪项研究、在什么状态、研究对象是谁
- `Danone-owned twins` 资产感知在首屏就出现

### Task 4: Conversation Thread & Prompt Composer

**Files:**
- Create: `src/features/workbench/components/conversation-thread.tsx`
- Create: `src/features/workbench/components/prompt-composer.tsx`
- Create: `src/features/workbench/components/cards/plan-approval-card.tsx`
- Create: `src/features/workbench/components/cards/qual-session-card.tsx`
- Create: `src/features/workbench/components/cards/midrun-review-card.tsx`
- Create: `src/features/workbench/components/cards/recommendation-card.tsx`
- Create: `src/features/workbench/components/cards/study-complete-card.tsx`
- Create: `src/features/workbench/components/cards/rerun-suggestion-card.tsx`

- [ ] **Step 1: 把对话线程实现为 typed event renderer，而不是手写一堆 if-else 文本块**
- [ ] **Step 2: 先跑通 6 张核心卡片**
- [ ] **Step 3: `Qual Session Card` 必须露出 twin excerpt**
- [ ] **Step 4: `Plan Approval Card` 和 `Mid-run Review Card` 必须都有显性动作按钮**
- [ ] **Step 5: `Prompt Composer` 的快捷建议按状态动态切换**
- [ ] **Step 6: 加入最小滚动与定位逻辑，支持从 quick jump 跳到对应阶段**

**完成标准：**
- 中区真正有 `Agent-first` 感知
- Qual 不是黑箱
- 审批门清楚可见

### Task 5: Structured Result Panel

**Files:**
- Create: `src/features/results/components/result-panel.tsx`
- Create: `src/features/results/components/recommendation-summary.tsx`
- Create: `src/features/results/components/quant-ranking.tsx`
- Create: `src/features/results/components/qual-themes-summary.tsx`
- Create: `src/features/results/components/segment-difference-panel.tsx`

- [ ] **Step 1: 实现 `Recommendation Summary`**
- [ ] **Step 2: 实现 `Quant Ranking`，必须显示 confidence badge**
- [ ] **Step 3: 实现 `Qual Themes Summary`，与 ranking 并列**
- [ ] **Step 4: 实现 `Segment Difference` 摘要**
- [ ] **Step 5: 从 `Recommendation Summary` 提供 `View Full Comparison` CTA**

**完成标准：**
- 右侧看起来像真实决策面板，而不是静态卡片拼接
- qual + quant 同时成立

### Task 6: Evidence Drawers & Replay Modal

**Files:**
- Create: `src/features/evidence/components/trust-drawer.tsx`
- Create: `src/features/evidence/components/twin-provenance-drawer.tsx`
- Create: `src/features/evidence/components/input-sources-drawer.tsx`
- Create: `src/features/evidence/components/replay-modal.tsx`
- Modify: `src/app/store/ui-store.ts`

- [ ] **Step 1: 建立 drawer / modal 状态管理**
- [ ] **Step 2: 实现 `Trust Drawer`**
- [ ] **Step 3: 实现 `Twin Provenance Drawer`**
- [ ] **Step 4: 实现 `Input Sources Drawer`**
- [ ] **Step 5: 实现 `Replay Full-screen Modal`，分阶段展示 Plan / Qual / Quant / Synthesis**

**完成标准：**
- 证据层可用，但不抢主舞台
- `Replay` 看起来是完整研究回放，不是 audit log

### Task 7: Compare Page

**Files:**
- Create: `src/features/compare/pages/compare-page.tsx`

- [ ] **Step 1: 按 playbook 实现 stimuli compare grid**
- [ ] **Step 2: 实现 quant ranking 模块**
- [ ] **Step 3: 实现 qual themes compare 模块**
- [ ] **Step 4: 实现 target group differences 模块**
- [ ] **Step 5: 实现 recommended next action 区域**

**完成标准：**
- Compare 页面不是死页
- 能自然承接 Workbench 的 `View Full Comparison`

### Task 8: Twins Page

**Files:**
- Create: `src/features/twins/pages/twins-page.tsx`

- [ ] **Step 1: 按 playbook 建两个 twin profile 卡片**
- [ ] **Step 2: 露出 built from、age range、research readiness、version notes**
- [ ] **Step 3: 明确这是 Danone-owned twin assets，而不是即时生成文本**

**完成标准：**
- Twins 页面能单独成立为“资产证明页”

### Task 9: Demo Controls & State Switching

**Files:**
- Create: `src/features/workbench/components/demo-state-switcher.tsx`
- Modify: `src/app/store/ui-store.ts`
- Modify: `src/features/workbench/pages/workbench-page.tsx`

- [ ] **Step 1: 实现 `Completed with Recommendation`、`Awaiting Mid-run Review`、`Rerun Suggested` 三种场景切换**
- [ ] **Step 2: 保证切换后 Thread、Result Panel、Drawers、Replay 数据同步**
- [ ] **Step 3: 不允许场景切换导致核心业务口径错乱**

**完成标准：**
- 演示者可快速切到任意关键状态

### Task 10: Verification & Demo Hardening

**Files:**
- Create: `tests/smoke/workbench.spec.ts`
- Create: `tests/smoke/compare.spec.ts`
- Create: `tests/smoke/twins.spec.ts`

- [ ] **Step 1: 写 smoke tests，覆盖路由打开、关键组件可见、drawer / modal 可开**
- [ ] **Step 2: 校验所有主卡片内容和 playbook 一致**
- [ ] **Step 3: 校验移动宽度不崩**
- [ ] **Step 4: 输出一份截图检查清单**

**完成标准：**
- 有最小自动验证
- 演示状态稳定，不会现场翻车

## 6. 推荐实施顺序

严格按这个顺序推进：

1. Task 1
2. Task 2
3. Task 3 + Task 5
4. Task 4
5. Task 6
6. Task 7 + Task 8
7. Task 9
8. Task 10

## 7. 不允许的实现偏差

- 不要把 `Workbench` 做成普通 dashboard
- 不要把左侧线程做成纯聊天气泡
- 不要把证据层内容全部铺到主界面
- 不要让组件自己写主文案
- 不要改 `清泉+ / 初元优养 / 安纯`、`74 / 61 / 52`、`Confidence 82`
- 不要删掉 `Mid-run Review`、`Replay`、`Rerun Suggested`

## 8. 验收口径

如果演示者能在 5 分钟内顺滑完成以下动作，这一版就成立：

1. 从 `Workbench` 打开已完成研究
2. 讲清 winner、confidence、next action
3. 回溯到 qual / approval / planning
4. 展开 trust / twin provenance / replay
5. 跳到 compare
6. 跳到 twins

这说明前端已经具备比稿演示价值。
