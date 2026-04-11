# AIpersona Demo — 用户旅程审计 + 全量问题清单

> 审计日期：2026-04-11
> 审计范围：从代码层面追踪完整的用户操作路径，标记每个环节的实际状态和体验断裂点

---

## 第一部分：当前用户旅程（代码实际路径）

### 旅程 A：首次使用（无历史数据）

```
用户打开 / → 重定向到 /dashboard → DashboardPage
```

**Step 1: Dashboard**
- 4 个 API 并行调用（listStudies / listConsumerTwins / listStimuli / listIngestionJobs）
- 显示 4 个统计卡片（Studies: 0 / Twins: 0 / Stimuli: 0 / Jobs: 0）
- 无 latestStudy → 不显示"最新研究"入口
- 用户需要主动点击 Rail 的 "Studies" 进入研究列表

**Step 2: Studies 列表**
- `listStudies` 返回空列表
- 用户看到"正式研究项目入口"标题 + "创建 Demo Study" 按钮
- ⚠️ **问题 J-01**：点击"创建 Demo Study"直接调用 `createDemoStudy()` 无参数 → 用户没有机会输入问题或选择配置
- 创建成功后跳转到 `/studies/{id}/workbench`

**Step 3: Workbench 空状态（替代路径）**
- 如果用户直接访问 `/workbench`（无 studyId）→ `SearchStudyRedirect` 重定向到 `/studies`
- 如果从 `/studies` 创建后跳转，进入 `WorkbenchPlaceholder` → 检测到 studyId → 加载 projection
- ⚠️ **问题 J-02**：Studies 页创建和 Workbench 空状态创建是两条完全不同的体验路径。Studies 页跳过配置，Workbench 空状态有完整的问题输入 + twin/stimulus 选择。用户可能从未见到配置界面。

**Step 4: Workbench Playback**
- `navigate('/workbench/{id}?playback=1')` → `WorkbenchPlaceholder` 检测 `searchParams.get('playback')`
- 传递 `playback={playbackParam === '1'}` 给 `WorkbenchPage`
- playback 从 0 开始，每 1.8s 展示一个 conversation event
- 在 `plan_approval_card` 处暂停 → 等待用户操作
- ⚠️ **问题 J-03**：首次创建的研究处于 `draft` 状态，plan_version.approval_status = `draft`。但 playback 的 baseEvents 来自 `buildConversationEventsForProjection`，在 draft 阶段只返回前 2 个事件（plan_ready + plan_approval_card）。playback 在 plan_approval_card 暂停后，用户需要点击"提交审批"（不是"批准计划"）—— 但 plan_approval_card 的 actions 写的是 `['批准计划', '请求修改', '查看计划详情']`，缺少"提交审批"按钮。

### 旅程 B：审批 → 启动 → 执行

**Step 5: 提交审批**
- 用户在 Workbench 中找不到"提交审批"按钮（plan_approval_card 没有这个 action）
- ⚠️ **问题 J-04**：实际触发"提交审批"的逻辑在 `handleCardAction` 中，条件是 `action === '提交审批' && latestPlanVersion?.approval_status === 'draft'`。但 artifact-based 的 plan_approval_card 的 actions 是硬编码 `['批准计划', '请求修改', '查看计划详情']`，其中没有"提交审批"。这是一个流程断裂——draft 状态的 study 无法通过对话中的卡片操作进入审批流程。
- 解决路径：用户需要依赖 result-panel 右侧面板中的某个按钮（但 plan phase 的 result-panel 也没有"提交审批"按钮）
- ⚠️ **实际断裂**：draft 状态下用户无法通过任何可见的 UI 元素提交审批。

**Step 5b: 假设用户设法提交了审批（比如 API 已提前自动提交）**
- 审批状态变为 `pending_approval`
- plan_approval_card 显示 `['批准计划', '请求修改', '查看计划详情']`
- 用户点击"批准计划" → 二次确认 → `approvePlan` API 调用
- 状态变为 `approved`

**Step 6: 启动研究**
- `handleCardAction` 中 `action === '启动研究'` 的条件：`latestPlanVersion?.approval_status === 'approved' && !currentRun`
- ⚠️ **问题 J-05**：但 conversation events 中没有任何卡片包含"启动研究"这个 action。`plan_approval_card` 审批通过后不会自动出现新卡片。用户如何触发"启动研究"？
- 目前没有 artifact-based 的"启动卡"event type。启动研究只能通过 playback 的 mock 场景流或者某个尚未实现的 UI 入口。
- ⚠️ **实际断裂**：审批通过后，用户在对话线程中看不到启动按钮。

**Step 6b: 假设研究已启动**
- `startRun` API 调用 → Temporal workflow 启动
- `runStatus` 变为 `queued` → `running`
- 轮询每 5 秒刷新 projection

**Step 7: AI 执行期间**
- Result panel 显示 running 状态（阶段进度列表）
- Conversation thread 根据 artifacts 构建事件：
  - 当 `qual_transcript` artifact 出现 → 构建 `qual_session_card`
  - 但实际上 artifact 是在 `advance_to_midrun_review` activity 完成后一次性写入的，不是逐步产生的
  - ⚠️ **问题 J-06**：用户在等待期间（5-8 分钟），conversation thread 不会增量更新——因为 artifact 在 activity 结束时才写入 DB，轮询期间 artifacts 列表一直为空。用户看到的是空的 conversation + running 态的 result panel，直到 activity 完成才一次性出现所有内容。

**Step 8: 中途审核**
- `runStatus` 变为 `awaiting_midrun_approval`
- Conversation thread 出现 `midrun_review_card`（含 metrics + themes + decision summary）
- Result panel 切换到 midrun review 面板
- 用户点击"继续定量排序" → `resumeRun` API 发送 Temporal signal

**Step 9: 定量评分 + 推荐**
- Temporal workflow resume → `complete_study_run` activity 执行
- 多 replica 评分 + 推荐生成
- `runStatus` 变为 `succeeded`
- 轮询检测到状态变化 → 刷新 projection
- Conversation thread 出现 `recommendation_card` + `study_complete_card`
- Result panel 切换到 Tab 视图（研究结论 / 证据链 / 研究回放）

### 旅程 C：结果消费

**Step 10: 查看结果**
- Result panel "研究结论" tab：RecommendationSummary + QuantRanking + QualThemesSummary + SegmentDifferences
- 全部数据来自真实 artifact
- 用户可以切换到"证据链" tab → 4 个跳转入口（可信度/孪生溯源/输入源/刺激物对比）
- 用户可以切换到"研究回放" tab → 内联 replay stages

**Step 11: 对比视图**
- 点击"刺激物对比"或 header sub-nav 的 "Compare" → `/studies/{id}/compare`
- ComparePlaceholder 从 projection 构建对比数据
- ⚠️ **问题 J-07**：Compare 页面没有返回 Workbench 的直接按钮（靠 header sub-nav 的 "Workbench" tab）

**Step 12: 下载报告**
- 点击 `study_complete_card` 的"下载报告" → 检查 artifact 存在 → `window.open` 打开 HTML
- ⚠️ **问题 J-08**：下载的 HTML 报告没有内联样式，打开后是纯文本排版。（_build_report_html 只有基础 article/h1/h2/ul 标签）

**Step 13: 追问对话**
- 用户在 PromptComposer 输入问题 → "正在思考..." 占位 → AI 回复
- 支持多轮记忆（chatHistoryRef 维护历史）
- ⚠️ **问题 J-09**：suggestion chips 在研究完成后仍显示通用建议（"查看推荐结论..."），不反映当前研究的具体内容。比如应该显示"为什么推荐清泉+？"而非泛化文案。

### 旅程 D：资产浏览（辅助路径）

**Step 14: Consumer Twins**
- Rail → Consumer Twins → 只读列表（来自 seed 数据）
- 显示 twin name / target_audience_label / version_no / business_purpose
- ⚠️ **问题 J-10**：无任何操作按钮。用户只能看不能做任何事。

**Step 15: Stimulus Library**
- Rail → Stimulus Library → 列表 + "导入概念资产"按钮
- 导入调用真实 API 但内容是硬编码的（名称="新导入概念卡"）
- ⚠️ **问题 J-11**：导入的 stimulus 会出现在列表中，但无法编辑或删除。且新导入的 stimulus 不会自动进入下一次研究的可选范围（需要手动在创建研究时勾选）。

**Step 16: Calibration Center**
- Rail → Calibration Center → 4 个计数器全为 0，无实质内容
- ⚠️ **问题 J-12**：空壳页面，演示时点进去会尴尬。

---

## 第二部分：用户旅程问题清单

### Critical（流程断裂 — 用户无法继续）

| ID | 问题 | 环节 | 根因 |
|----|------|------|------|
| **J-03** | Draft 状态下 plan_approval_card 缺少"提交审批"action | Step 4→5 | `buildConversationEventsFromArtifacts` 中 plan_approval_card 的 actions 硬编码为 `['批准计划', '请求修改', '查看计划详情']`，缺少 draft 态的"提交审批" |
| **J-04** | 审批通过后无"启动研究"入口 | Step 6 | 没有 artifact-based 的"启动卡"event type；conversation events 在 `ready_to_run` 阶段只展示 plan 相关的 2 个事件，不含启动按钮 |
| **J-05** | 执行等待期间 conversation 无增量更新 | Step 7 | Artifact 在 activity 完成时一次性写入，轮询期间 artifacts 为空 → conversation events 构建不出任何新卡片 |

### Important（体验断裂 — 可以绕过但损害叙事）

| ID | 问题 | 环节 | 根因 |
|----|------|------|------|
| **J-01** | Studies 页创建跳过配置 | Step 2 | `handleCreate` 调用 `createDemoStudy()` 无参数 |
| **J-02** | 两条创建路径体验不一致 | Step 2 vs Step 3 | Studies 页 vs Workbench 空状态走不同逻辑 |
| **J-06** | 报告 HTML 无样式 | Step 12 | `_build_report_html` 只有裸 HTML 标签 |
| **J-07** | Compare/Twins 页缺少返回 Workbench 的直接入口 | Step 11 | 只靠 header sub-nav 的 tab |
| **J-08** | 追问 suggestion chips 不反映当前研究内容 | Step 13 | `buildPromptSuggestions` 按 phase 生成泛化文案 |
| **J-09** | 资产页面（Twins/Stimuli）纯只读 | Step 14-15 | 无 CRUD 端点和 UI |
| **J-10** | Calibration Center 空壳 | Step 16 | 4 个 stub 端点返回空 |

---

## 第三部分：设计走查问题清单（功能布局 + 视觉）

### 功能布局

| ID | 问题 | 文件/位置 | 优先级 |
|----|------|-----------|--------|
| L-01 | Rail label 英上中下，语言不一致 | `route.ts` label vs railLabel | P0 |
| L-02 | Header 标题显示英文，与 Rail 中文不对齐 | `app-shell.tsx:81` | P0 |
| L-03 | Header sub-bar 显示 UUID monospace | `app-shell.tsx:140` | P0 |
| L-04 | Header 非 study 页时重复 Rail 导航 | `app-shell.tsx:114-129` | P1 |
| L-05 | Dashboard 文案是开发者语言 | `dashboard-page.tsx:94-98` | P0 |
| L-06 | Studies 页创建跳过配置 | `studies-page.tsx:43-55` | P1 |
| L-07 | Study 卡片标题 `Study #UUID` | `studies-page.tsx:117` | P0 |
| L-08 | ResultPanel 固定 380px 不响应内容量 | `workbench-page.tsx:309` | P2 |
| L-09 | Compare/Twins 无返回 Workbench 快捷方式 | 路由层面 | P1 |
| L-10 | 研究完成态信息重复（左右同时显示推荐） | workbench-page 布局 | P2 |
| L-11 | 空壳页面无"即将上线"友好占位 | calibration-center-page | P1 |

### 视觉设计

| ID | 问题 | 文件/位置 | 优先级 |
|----|------|-----------|--------|
| V-01 | Ambient orb 用内联 rgba 而非 CSS 变量 | `app-shell.tsx:67` | P2 |
| V-02 | display 和 sans 字体完全相同（都是 Inter） | `tokens.css:47-48` | P2 |
| V-03 | 中英文混排 baseline 不对齐 | 全局 | P2 |
| V-04 | eyebrow 的 uppercase + 过大 letter-spacing 不适合中文 | `globals.css` eyebrow | P0 |
| V-05 | btn-primary 和 btn-accent 视觉完全相同 | `globals.css` | P1 |
| V-06 | ScoreBar 颜色信号与文字不一致 | `quant-ranking.tsx` | P1 |
| V-07 | 同一 stimulus 在推荐区和排名区视觉权重差距过大 | 跨组件 | P2 |
| V-08 | Dashboard 统计卡片信息密度低 | `dashboard-page.tsx:101-113` | P1 |
| V-09 | Studies 列表 Study ID 无信息量 | `studies-page.tsx:117` | P0 |
| V-10 | Conversation thread 紧凑和宽松矛盾 | `conversation-thread.tsx` | P2 |
| V-11 | Drawer 内 inner-card 嵌套过深 | trust/inputs drawer | P1 |
| V-12 | 无 font-display: swap | 全局 | P2 |
| V-13 | glass-panel border-top 用内联值而非 token | `globals.css` | P2 |

---

## 第四部分：修复优先级建议

### 必须立即修复（流程断裂）

1. **J-03 + J-04**：`buildConversationEventsFromArtifacts` 需要根据 `phase` 动态调整 plan_approval_card 的 actions（draft→"提交审批"，pending_approval→"批准计划"，approved→"启动研究"）
2. **J-05**：在 `_advance_to_midrun_review` 中考虑分阶段写入 artifact（IDI 完成时先写 partial artifact），或在 running 态显示非 artifact 依赖的进度提示

### 演示前修复

3. **L-01 + L-02 + L-05 + L-07 + V-04 + V-09**：全部是文案/标签/语言问题，15-30 分钟可全部修完
4. **J-01 + J-02**：Studies 页创建接入配置流程（复用 EmptyWorkbenchState 的逻辑）
5. **J-06**：`_build_report_html` 加内联 CSS 样式
6. **L-11**：Calibration Center 加友好占位

### 后续迭代

7. L-04（Header 导航去重）、V-05（按钮颜色区分）、V-08（Dashboard 紧凑化）
8. V-02（Display 字体区分）、V-12（font-display）、L-08（ResultPanel 响应式）
