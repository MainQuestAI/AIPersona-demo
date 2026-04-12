# 前端全面盘点 — 2026-04-12

> 从路由到组件，逐层梳理当前前端的真实状态，标记所有结构性问题

---

## 一、文件清单与职责

### 源文件总量：49 个 .ts/.tsx（不含 test），总 7744 行

| 层 | 文件数 | 行数 | 说明 |
|---|---|---|---|
| 路由+壳 | 4 | 550 | routes.tsx, app-shell, global-rail, toast-container |
| 页面 | 9 | 2500 | dashboard, studies, study-detail-layout, workbench-placeholder, compare, twins, consumer-twins, stimulus-library, calibration-center |
| Workbench 组件 | 9 | 1060 | workbench-page, agent-conversation, conversation-thread, prompt-composer, 6 张 card |
| 结果组件 | 5 | 530 | result-panel, quant-ranking, qual-themes, recommendation-summary, segment-differences |
| 证据组件 | 6 | 560 | drawer-shell, trust-drawer, input-sources, twin-provenance, replay-modal, use-dialog-accessibility |
| 服务层 | 4 | 2320 | studyRuntime(549), workbenchRuntimeBridge(1004), studyRuntimeViews(166), studySession |
| Mock 数据 | 8 | 850 | 3 个 scenario + meta + selectors + trust/twins/library/compare |
| 类型 | 2 | 480 | demo.ts(370), route.ts(113) |

---

## 二、路由结构

```
/                          → Navigate to /dashboard
/dashboard                 → DashboardPage
/studies                   → StudiesPage
/studies/:studyId          → StudyDetailLayout (wrapper)
  /studies/:studyId/workbench  → WorkbenchPlaceholder → WorkbenchPage
  /studies/:studyId/compare    → ComparePlaceholder
  /studies/:studyId/twins      → TwinsPlaceholder
/consumer-twins            → ConsumerTwinsPage
/stimulus-library          → StimulusLibraryPage
/calibration-center        → CalibrationCenterPage
/workbench                 → redirect to /studies
/workbench/:studyId        → redirect to /studies/:studyId/workbench
/compare                   → redirect (需要 ?studyId=)
/twins                     → redirect (需要 ?studyId=)
/*                         → redirect to /dashboard
```

### 路由问题

| ID | 问题 | 严重度 |
|---|---|---|
| **RT-01** | `StudyDetailLayout` 既是路由容器又渲染了一大块内容面板（170 行），导致 workbench 被压扁 | Critical |
| **RT-02** | 旧兼容路由（/workbench, /workbench/:studyId, /compare, /twins）仍在，增加维护成本 | Low |

---

## 三、页面级壳层：3 层嵌套问题

当前 workbench 的渲染路径：

```
AppShell (header + rail + main)
  └── StudyDetailLayout (研究概览面板 + Outlet)
        └── WorkbenchPlaceholder (数据加载 + 状态管理)
              └── WorkbenchPage (对话 + 结果三栏)
```

**4 层嵌套，每层都渲染了自己的 header/状态信息**：

| 层 | 渲染了什么 | 问题 |
|---|---|---|
| AppShell header | "AI Consumer" + "Study Detail" + Workbench/Compare/Twins tabs + "研究进行中" badge | 英文标题、重复导航 |
| StudyDetailLayout | "Study Detail" eyebrow + "建议推进 清泉+" 标题 + 置信度 badge + UUID badge + 下一步建议/运行消耗/证据覆盖 3 卡 + Workbench/Compare/Twins tabs + 4 个 evidence chain cards | 重复导航、UUID 暴露、信息过载 |
| WorkbenchPlaceholder | 错误/loading 状态 + action state | 纯逻辑层，无视觉问题 |
| WorkbenchPage header | 研究问题标题 + 状态 badge + 进度段 + 研究详情折叠 | 和 StudyDetailLayout 内容重复 |

**核心问题**：StudyDetailLayout 不应该渲染内容。它应该只是一个路由容器（加载 projection + 传给 Outlet）。

---

## 四、数据流混乱：3 套并行系统

### 系统 1：Mock Scenario Bundle（旧）
- **入口**：`workbenchRuntimeBridge.ts` → `getScenarioBundle()` → `mocks/selectors`
- **用途**：构建 DemoScenarioBundle，包含 conversationEvents、resultPanel、compareView、twinCatalog、trustPanel、replay 等全部 UI 数据
- **当前状态**：仍被 `getPitchScenarioBundle` 作为 fallback 使用；`buildConversationEventsForProjection` 仍在文件中但不再被 WorkbenchPage 调用

### 系统 2：Artifact Bridge（中间态）
- **入口**：`workbenchRuntimeBridge.ts` → `buildArtifactScenarioBundle()` → 从 projection.artifacts 构建
- **用途**：用真实 artifact 数据替换 mock scenario 的字段
- **当前状态**：仍被 ResultPanel、Compare、Twins 页面通过 `getPitchScenarioBundle` 消费

### 系统 3：Agent Messages（新）
- **入口**：`studyRuntime.ts` → `fetchAgentMessages()` → `GET /agent/messages`
- **用途**：WorkbenchPage 的 AgentConversation 组件消费
- **当前状态**：只有新创建并启动了 agent 的 study 才有数据；旧 study 的 agent messages 为空

### 问题

| ID | 问题 | 严重度 |
|---|---|---|
| **DF-01** | 3 套系统并存，没有统一的数据源优先级 | Critical |
| **DF-02** | WorkbenchPage 只消费 Agent Messages，不 fallback 到 Artifact Bridge | Critical |
| **DF-03** | conversation-thread.tsx（旧组件）仍在文件中但不再被使用——死代码 | Medium |
| **DF-04** | workbenchRuntimeBridge.ts 有 1004 行，但核心函数 `buildConversationEventsForProjection` 已不被调用 | Medium |
| **DF-05** | 6 张 card 组件（midrun-review-card 等）只被旧 ConversationThread 使用，AgentConversation 不用它们 | Medium |

---

## 五、逐页面问题

### 5.1 DashboardPage

| ID | 问题 | 文件:行 |
|---|---|---|
| D-01 | 4 个统计卡标签仍为英文（Studies / Consumer Twins / Stimulus Library / Ingestion Jobs） | dashboard-page.tsx:103 |
| D-02 | "进入 Study Detail" 按钮英文 | dashboard-page.tsx:128 |

### 5.2 StudiesPage

| ID | 问题 | 文件:行 |
|---|---|---|
| S-01 | "创建 Demo Study" 按钮调用无参数 `createDemoStudy()`，跳过配置，不启动 agent | studies-page.tsx:43-55 |
| S-02 | Study 卡片 `当前状态：{status}` 英文状态值直接显示（如 "succeeded"） | studies-page.tsx:120 |

### 5.3 StudyDetailLayout

| ID | 问题 | 文件:行 |
|---|---|---|
| **SDL-01** | 整个文件应该被精简为纯路由容器 | study-detail-layout.tsx 全文 |
| SDL-02 | "Study Detail" eyebrow 英文 | :86 |
| SDL-03 | UUID badge | :107-109 |
| SDL-04 | "预算 120.00" 含义不明 | :102 |
| SDL-05 | Workbench/Compare/Twins tabs 与 header 重复 | :133-149 |
| SDL-06 | Evidence chain cards 占屏过大 | :151-166 |
| SDL-07 | `buildDecisionSnapshotForProjection` 和 `buildEvidenceChainCardsForProjection` 在这里调用一次，workbench 内部又通过 scenario 获取相同数据 | :54-66 |

### 5.4 WorkbenchPlaceholder

| ID | 问题 | 文件:行 |
|---|---|---|
| WP-01 | `handleCreateDemoStudy` 成功后 navigate 到 `/workbench/{id}?playback=1` 但 playback 不再存在 | :374 |
| WP-02 | 没有调用 `startAgent()` 启动 agent 对话 | :357-381 |
| WP-03 | `handleCardAction` 中大量 if-else 处理旧的卡片 action（"批准计划"、"继续定量排序"等），但新的 AgentConversation 通过 `postAgentReply` 处理 action，两套逻辑并存 | :448-505 |
| WP-04 | `startRun` import 存在但只在旧流程中使用 | :14 |

### 5.5 WorkbenchPage

| ID | 问题 | 文件:行 |
|---|---|---|
| **WK-01** | 只从 `/agent/messages` 拉取数据，旧 study 无 agent messages 时对话区完全空白 | :60-79 |
| WK-02 | 仍依赖 `getPitchScenarioBundle` 构建 scenario 给 drawers 和 result panel，mix agent + mock 两套 | :48 |
| WK-03 | compact header bar 和 StudyDetailLayout 的信息重复 | :131-185 |
| WK-04 | `handleAction` 中一些 action（"下载报告"、"查看详细对比"）直接处理，另一些通过 `onCardAction` 冒泡给 WorkbenchPlaceholder——责任链不清晰 | :93-115 |

### 5.6 ComparePlaceholder + TwinsPlaceholder

| ID | 问题 | 文件 |
|---|---|---|
| CP-01 | 这两个页面各 500/450 行，内部各自维护 projection 加载逻辑，和 WorkbenchPlaceholder 完全重复 | compare-placeholder.tsx, twins-placeholder.tsx |
| CP-02 | 其实 StudyDetailLayout 已经加载了 projection，但没有传给 child routes | study-detail-layout.tsx |

### 5.7 ConsumerTwinsPage / StimulusLibraryPage / CalibrationCenterPage

| ID | 问题 | 文件 |
|---|---|---|
| AT-01 | ConsumerTwinsPage 只读列表，无交互 | consumer-twins-page.tsx |
| AT-02 | CalibrationCenterPage 的文案已改但 4 个统计标签仍英文 | calibration-center-page.tsx:94-97 |

---

## 六、组件级问题

### 6.1 两套对话组件并存

| 组件 | 消费的数据 | 当前使用者 |
|---|---|---|
| `ConversationThread` | `ConversationEvent[]`（demo.ts 类型） | **无人使用**——WorkbenchPage 已换成 AgentConversation |
| `AgentConversation` | `AgentMessage[]`（studyRuntime.ts 类型） | WorkbenchPage |

ConversationThread + 6 张 card 组件 = ~500 行死代码。

### 6.2 workbenchRuntimeBridge.ts（1004 行）

这个文件是所有混乱的根源。它做了太多事：

| 函数 | 行数 | 当前调用者 | 状态 |
|---|---|---|---|
| `getRuntimePhase` | 20 | 多个 export 函数 | 活跃 |
| `getLatestArtifact` | 8 | buildArtifactScenarioBundle | 活跃 |
| `buildMidrunReviewSupport` | 60 | enrichScenarioForProjection | 活跃 |
| `enrichScenarioForProjection` | 25 | getPitchScenarioBundle | 活跃 |
| `buildArtifactScenarioBundle` | 180 | getPitchScenarioBundle | 活跃 |
| `buildConversationEventsFromArtifacts` | 110 | buildConversationEventsForProjection | **只被 buildConversationEventsForProjection 调用** |
| `buildConversationEventsForProjection` | 20 | **无人调用**（WorkbenchPage 已换成 agent messages） | **死代码** |
| `buildStageCopy` | 120 | buildStudySessionBoard | 活跃（header 进度条） |
| `selectScenarioIdForProjection` | 12 | 多处 | 活跃 |
| `getSurfaceCtaLabels` | 12 | 测试文件 | 准死代码 |
| `buildSetupBarData` | 12 | WorkbenchPage | 活跃 |
| `buildPromptSuggestions` | 50 | WorkbenchPage | 活跃 |
| `buildStudySessionBoard` | 12 | WorkbenchPage | 活跃 |
| `buildExecutiveSummaryForProjection` | 40 | WorkbenchPage | 活跃 |
| `buildDecisionSnapshotForProjection` | 20 | StudyDetailLayout | 活跃 |
| `buildEvidenceChainCardsForProjection` | 40 | StudyDetailLayout | 活跃 |
| `buildTimelineStepsForProjection` | 30 | buildStudySessionBoard | 活跃 |
| `getPitchScenarioBundle` | 5 | WorkbenchPage（drawers/result panel） | 活跃 |

**~130 行是死代码**（buildConversationEventsFromArtifacts + buildConversationEventsForProjection + formatCountLabel）。

### 6.3 Mock 数据（8 个文件，~850 行）

只被 `workbenchRuntimeBridge.ts` 的 `getScenarioBundle` fallback 使用。如果 artifact bridge 的 fallback 仍需保留（旧 study 回访），mock 数据暂时不能删。但如果 study-detail-layout 不再渲染内容面板，mock 的消费范围会大幅缩小。

### 6.4 studyRuntimeViews.ts（166 行）

| 函数 | 使用者 | 问题 |
|---|---|---|
| `formatDemoTwinLabel` / `formatDemoStimulusLabel` | 多处 | 硬编码 UUID → 名字映射，与 seed 数据耦合 |
| `buildStudyRoute` | 多处 | 正常工具函数 |
| `buildCompareViewModel` | ComparePlaceholder | 输出包含英文（"stimuli"/"twins"/"Plan"） |
| `buildTwinRegistryModel` | TwinsPlaceholder | 输出 chips 包含英文（"Provenance"）和 study UUID |

---

## 七、语言一致性问题汇总

| 位置 | 当前文案 | 应改为 |
|---|---|---|
| app-shell.tsx:79 | "AI Consumer" | "AIpersona" 或去掉 |
| app-shell.tsx:14 | `label: 'Study Detail'` | `'研究详情'` |
| route.ts:92-106 | Workbench / Compare / Twins | 研究工作台 / 概念对比 / 孪生溯源 |
| global-rail.tsx:72 | railLabel（英文 Dashboard/Studies 等） | 去掉或改为中文副标题 |
| study-detail-layout.tsx:86 | "Study Detail" | "研究详情" |
| dashboard-page.tsx:103 | Studies / Consumer Twins / Stimulus Library / Ingestion Jobs | 研究项目 / 数字孪生 / 刺激物 / 导入任务 |
| dashboard-page.tsx:128 | "进入 Study Detail" | "进入研究详情" |
| studies-page.tsx:120 | 状态值直接显示英文 | 加 STATUS_LABELS 映射 |
| calibration-center.tsx:94-97 | Benchmark Packs / Calibration Runs 等 | 基准包 / 校准运行 / 置信度快照 / 漂移预警 |
| studyRuntimeViews.ts:97-98 | "stimuli" / "twins" | "刺激物" / "孪生" |
| studyRuntimeViews.ts:161 | "Provenance" | "来源追溯" |

---

## 八、推荐重构方向

### 8.1 StudyDetailLayout → 纯路由容器

```tsx
export function StudyDetailLayout() {
  return <Outlet />;
}
```

所有研究概览信息移入 WorkbenchPage 的 compact header。evidence chain cards 移入 result panel 的"证据链" tab（已有）。

### 8.2 数据流统一

```
WorkbenchPage
  ├── 对话区：agent messages（有数据）→ AgentConversation
  │           agent messages 为空 → fallback 到 artifact-based events → ConversationThread（保留）
  └── 结果区：projection.artifacts → ResultPanel（不变）
```

### 8.3 删除死代码

- `conversation-thread.tsx` + 6 张 card 组件：如果 fallback 不需要卡片形式，可删
- `workbenchRuntimeBridge.ts` 中 `buildConversationEventsFromArtifacts` 和 `buildConversationEventsForProjection`：如果确认不做 fallback，可删
- mock 数据 8 个文件：如果 result panel 不再需要 mock fallback，可删

### 8.4 页面整合

ComparePlaceholder 和 TwinsPlaceholder 各自独立加载 projection。应该由 StudyDetailLayout 加载一次，通过 React context 或 outlet context 传给子路由。

---

## 九、优先级

### P0：影响演示的结构问题
1. StudyDetailLayout 精简为纯路由容器
2. WorkbenchPage 加 agent messages 空时的 fallback
3. 创建研究后调用 startAgent
4. 全部英文文案改中文

### P1：代码健康
5. 删除死代码（ConversationThread + cards + bridge 死函数）
6. ComparePlaceholder/TwinsPlaceholder 共享 projection 加载
7. workbenchRuntimeBridge.ts 精简

### P2：后续迭代
8. Mock 数据文件清理
9. studyRuntimeViews.ts 的硬编码 UUID 映射清理
