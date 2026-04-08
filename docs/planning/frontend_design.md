# 达能 AI Consumer Runtime 演示环境前端详细设计

文档版本：v1  
日期：2026-04-02  
状态：前端详细设计  
适用范围：达能比稿演示环境 / vendor-hosted 单租户演示版  
上位文档：

- `danone_ai_consumer_system_design_2026-04-02.md`
- `danone_ai_consumer_mvp_prd_2026-04-02.md`
- `danone_ai_consumer_demo_content_playbook_2026-04-02.md`

## 1. 文档目标

本文档用于定义达能演示环境的前端详细设计，回答以下问题：

- 演示环境的主舞台应该长什么样
- Demo script 应该如何组织，才能贴合达能真实需求
- 哪些能力必须前台强展示，哪些能力只作为证据层露出
- 哪些组件必须做得像真产品，哪些组件只需要演示级
- 视觉语言、信息架构、交互结构和状态表现如何统一

本文档不讨论后端实现细节，重点服务于：

- 前端原型搭建
- AI 员工并行开发
- 演示内容准备
- 设计评审与范围控制

## 2. 对达能需求的前端解读

### 2.1 达能真正要看的不是“UI 漂不漂亮”

根据 [invite.md](/Users/dingcheng/Desktop/danone_ai_consumer/invite.md) 和 [research_brief.docx](/Users/dingcheng/Desktop/danone_ai_consumer/research_brief.docx)，达能这次真正采购的是：

- 一套能支持 `qualitative learning + quantitative testing` 的工作台
- 一套属于 Danone 的 `consumer twins / AI persona` 资产
- 一套能更快回答营销问题、筛选刺激物、输出可靠洞察的平台

因此前端必须优先回答三件事：

1. 达能团队如何发起一项研究
2. AI 如何帮助完成 qual + quant 的研究执行与推荐
3. 这些推荐为什么可信，以及背后用到了哪些 Danone-owned 资产

### 2.2 前端最容易犯的错

本项目的前端最容易偏向两个错误方向：

- `错误一：做成普通 dashboard`
  - 页面很多，但主叙事不清楚
  - 看起来像 BI 或研究后台
  - 没有 Agent-first 的感知

- `错误二：做成纯 chat 演示`
  - 看起来像会研究的聊天机器人
  - 缺少结构化结果、审批、版本和证据链
  - 无法体现达能最看重的“可靠性”和“资产归属”

因此，正确方向必须是：

`前台 Agent-first，底层 Runtime-first，结果呈现结构化`

## 3. 前端北极星定义

### 3.1 主舞台

演示环境只有一个真正的主舞台：

`AI Consumer Workbench`

这是洞察团队完成一次研究工作的主界面，必须承载完整研究链路：

- 输入业务问题
- 选择 target groups
- 选择 stimulus
- Agent 生成 study plan
- 审批与调整
- qual + quant 研究执行
- recommendation / evidence / next step

### 3.2 证据层

以下能力必须存在，但不应抢主舞台：

- persona / twin provenance
- input sources
- benchmark / calibration / confidence
- future connectors such as CDP / VOC
- deeper config and lineage details

这些能力统一以 `drawer / side panel / modal / drill-down` 的方式服务主舞台。

### 3.3 总体产品气质

演示环境应呈现为：

`一个可信、精密、克制的研究工作台`

而不是：

- 一个营销型 landing page
- 一个普通 AI chat 产品
- 一个传统 BI 系统

## 4. Demo Script

### 4.1 产品逻辑顺序与比稿演示顺序

这里必须区分两层：

- `产品逻辑顺序`
  - 真实用户如何完成研究
- `比稿演示顺序`
  - 决策者如何最快看到价值并建立信任

#### 4.1.1 产品逻辑顺序

真实产品中的顺序仍然是：

1. 进入 `AI Consumer Workbench`
2. 展示业务问题、target groups 和 stimulus scope
3. 展示 Agent 如何生成研究计划并发起执行
4. 展示 qual + quant 结果以及 recommendation
5. 在用户追问“这些 twins 从哪来”“为什么能信”时，再展开证据层

#### 4.1.2 比稿推荐顺序

比稿现场建议采用 `结论优先的反向演示`：

1. 直接打开 `Completed with Recommendation` 状态的 Workbench
2. 先展示 winner、confidence、recommended next action
3. 再回溯展示 qual themes、quant ranking、approval gates
4. 再回到计划阶段，解释 study plan 如何生成
5. 最后展开 twin provenance / trust / input sources drawers

原因：

- 决策者在第一分钟就能看到结果价值
- 后续所有步骤都变成“这个结论为什么可信”的解释链
- 比从空白工作台顺序跑到结论更适合比稿场景

### 4.2 演示重点

在主线演示中必须清楚讲出的点：

- 研究问题是什么
- 刺激物是什么
- 测的是哪些 target groups
- Agent 如何帮助计划和执行研究
- qual 和 quant 如何一起支持推荐
- 结果如何进入下一步营销决策

补充要求：

- qual 执行过程必须可见，不能只有结果摘要
- 审批门必须在主路径中显性出现
- replay 必须在主路径中可见，不能只作为次级入口存在

### 4.3 证据层的正确露出时机

以下问题出现时，再打开对应证据层：

- “这些 persona / twins 从哪来？”
- “这些结果为什么值得信？”
- “未来是否能接 Danone 内部数据？”

对应证据层：

- `Twin & Persona Provenance Drawer`
- `Trust & Calibration Drawer`
- `Input Sources & Connectors Drawer`

## 5. 信息架构

### 5.1 一级导航

演示环境一级导航建议保留 4 个入口：

- `Workbench`
- `Insight Compare`
- `Twins`
- `Library`

说明：

- `Workbench` 是主舞台
- `Insight Compare` 是决策视图
- `Twins` 和 `Library` 用于证明资产与输入能力
- `Calibration` 不做一级主页面，统一并入证据层

### 5.2 页面角色

#### `Workbench`

主舞台。承担 70% 以上的演示时长。

#### `Insight Compare`

辅助主舞台。承担营销筛选与决策表达。

#### `Twins`

资产证明页。用于回答“Danone-owned consumer twins”如何成立。

#### `Library`

输入与刺激物证明页。用于展示 current inputs、stimulus scope，以及跨品类 / 跨研究类型能力。

## 6. 主舞台：AI Consumer Workbench

## 6.1 页面目标

这个页面必须同时成立三件事：

- 看起来像一个真实工作台
- 一眼能感知到 Agent-first
- 能完整承载一次研究工作流

### 6.2 页面结构

Workbench 采用 `三段式结构`：

- 左侧：Global Rail
- 中区：Agent Conversation Workspace
- 右侧：Structured Result Panel

其中：

- 左侧负责全局导航
- 中区负责研究协作过程
- 右侧负责结构化结论与状态判断

### 6.3 左侧：Global Rail

职责：

- 工作区导航
- Workbench / Compare / Twins / Library 切换
- 当前模块定位

设计要求：

- 宽度窄，功能克制
- 不承载正文信息
- 颜色比内容区更深，形成工作台骨架

### 6.4 中区：Agent Conversation Workspace

这是 Agent-first 感知的核心来源。

中区由 4 个部分组成：

1. `Workbench Header`
2. `Study Setup Bar`
3. `Conversation Thread`
4. `Prompt Composer`

#### 6.4.1 Workbench Header

必须展示：

- 当前 study 名称
- category / study type
- 当前状态
- 关键标签，如 `Plan Approved / Twin Set Linked / Stimuli 3`
- `Run Timeline Quick Jump`

可有但不必深实现：

- 分享
- 导出
- 切换 run

补充要求：

- Header 区域必须提供一个可点击的 `Run Timeline Quick Jump`
- 视觉上应接近阶段导航条，例如：
  - `Plan -> Approval -> Qual -> Mid-run Review -> Quant -> Recommendation`
- 该组件的主要目的不是运行控制，而是支持 `结论优先的反向演示`
- 演示者应能直接点击跳到任一阶段，而不是靠手动滚动对话线程

#### 6.4.2 Study Setup Bar

这是演示环境里必须做真的区域之一。

必须包含 3 个高价值模块：

- `Business Question`
- `Stimulus Scope`
- `Study Inputs Snapshot`

这三个模块必须让达能看到：

- 这项研究测什么
- 对哪些人测
- 刺激物是哪些
- 当前挂接了哪些研究资产 / twin / benchmark

说明：

- `Stimulus Scope` 不能被藏在次级层
- 必须显式露出 `concept / name / flavor / KV / copy / slogan / tagline`
- `Study Inputs Snapshot` 只展示摘要，并提供打开来源抽屉的入口

补充要求：

- `Study Inputs Snapshot` 必须在主界面建立 `Danone-owned twins` 的资产感知
- 建议直接显示：
  - 当前使用的 twin set / twin version
  - built from 几份 qual reports 与 transcripts
  - last updated 时间

建议摘要形态：

- `Consumer Twins: Beverage TA v2.1 / IMF TA v1.3`
- `Built from: 5 qual reports, 12 transcripts`
- `Last updated: 2025-12-15`

#### 6.4.3 Conversation Thread

这是第二个必须做真的区域。

对话线程不是普通聊天记录，而是 `研究协作流`。

必须出现的消息类型：

- 用户业务请求消息
- Agent 解释性消息
- `Plan Card`
- `Plan Approval Card`
- `Qual Session Card`
- `Mid-run Review Card`
- `Recommendation Card`
- `Study Complete Card`
- `Rerun Suggestion Card`（在 `Rerun Suggested` 状态下出现）

可出现的消息类型（P1）：

- `Evidence / Replay Card`

说明：

- 这些卡片必须像系统对象，而不是普通气泡
- 用户必须能感知：Agent 不只是说话，而是在操作 study runtime

补充定义：

- `Plan Approval Card`
  - 展示研究计划摘要
  - 提供 `Approve / Modify` 入口
  - 允许人工修改后再继续
- `Qual Session Card`
  - 展示 qual 执行过程，不直接暴露完整 transcript
  - 必须展示：
    - 正在运行哪些 target groups / twin versions
    - 已完成多少个 sessions
    - 已抽取出的主要 themes 摘要
    - 1-2 条 `twin response excerpt`
- `Mid-run Review Card`
  - 在 qual 完成后出现
  - 展示 qual themes 摘要
  - 让用户决定是否继续 quant run
- `Study Complete Card`
  - 在 `Completed with Recommendation` 状态出现
  - 必须明确提供：
    - `View Replay`
    - `Download Report`
    - `Archive to Library`
- `Rerun Suggestion Card`
  - 在 `Rerun Suggested` 状态出现，详见 `12.1`
  - 展示 rerun reason、建议动作和版本变化摘要

excerpt 展示建议：

- 每个 `Qual Session Card` 至少露出 1-2 条短摘录
- 形态示例：
  - `Twin [Pregnant Mom, Tier-1, 28岁]: "这个名字让我觉得很干净，喝起来不会有负担。但我还是想知道成分细节，比如 DHA 含量到底是多少。"`
- 目的不是展示完整对话，而是让客户感知 theme 确实来自 twin responses，而不是 AI 直接打标签

#### 6.4.4 Prompt Composer

这是第三个必须做真的区域。

必须包含：

- 输入框
- 快捷建议
- 发送按钮

设计要求：

- 像真实产品输入区
- 不能只是一条空白线
- 可以弱化高级附件功能，但基础输入区必须成熟

快捷建议要求：

- 快捷建议必须随 `study state` 动态变化，不允许使用通用无上下文建议
- 建议按状态提供不同建议集：
  - `Study Planning`
    - `Compare by target group`
    - `Refine stimulus scope`
    - `Adjust qual depth`
  - `Qual Complete / Awaiting Mid-run Review`
    - `Review qual themes`
    - `Continue to quant`
    - `Ask for follow-up qual`
  - `Completed with Recommendation`
    - `View full comparison`
    - `Run follow-up qual on weaker concept`
    - `Export to strategy deck`

### 6.5 右侧：Structured Result Panel

右侧面板必须与中区同等重要，不是附属侧栏。

它负责回答：

- 哪个刺激物更值得推进
- 为什么值得推进
- 对不同 target group 的差异在哪里
- 结果是否可信

右侧建议分为 4 个模块：

1. `Recommendation Summary`
2. `Quant Ranking`
3. `Qual Themes & Segment Differences`
4. `Approval / Artifact / Lineage Snapshot`

#### 6.5.1 Recommendation Summary

必须直接给出：

- Winner
- confidence
- recommended next action
- `View Full Comparison` CTA

设计要求：

- 一眼可读
- 不能藏在滚动深处
- 是整个页面最像“结论交付”的区域

连接要求：

- `Recommendation Summary` 右上角必须有明确的 `View Full Comparison` 按钮
- 点击后直接进入 `Insight Compare`
- 不能只依赖左侧 rail 导航，否则 Compare 页面在演示中会变成死页

#### 6.5.2 Quant Ranking

这是达能比稿中的核心采购理由之一，必须做强。

必须展示：

- 各候选刺激物的排序
- 相对强弱
- 最好能有 segment 维度提示
- research-level confidence badge

设计要求：

- 可比
- 不做装饰性图表
- 重点是“哪个更强”而不是“图很复杂”

补充要求：

- `Quant Ranking` 主面板里必须显式露出 confidence 基础
- 可采用研究级统一 badge，而不是为每个候选分别计算一套 confidence
- 点击 confidence badge 后，打开 `Trust & Calibration Drawer`

建议展示形式：

- `清泉+      74   [Confidence: 82 / High]`
- `初元优养   61   [Confidence: 82 / High]`
- `安纯       52   [Confidence: 82 / High]`

#### 6.5.3 Qual Themes & Segment Differences

这块必须与 Quant 并列，不可下沉到抽屉。

原因：

- 达能明确要求 `qualitative learning + quantitative testing`
- 如果 Qual 被埋掉，前端就会看起来像量化报表工具

必须展示：

- 关键 qual themes
- 对不同 target groups 的主要差异
- 为什么某个刺激物更有吸引力或更有风险

#### 6.5.4 Approval / Artifact / Lineage Snapshot

这块只需要做到 `P1 真实`。

必须存在：

- approval 状态摘要
- report / replay / summary 入口
- twin / anchor / plan version 摘要

但不需要：

- 把全部 lineage 细节直接铺在主面板上

补充要求：

- replay 不应只停留在这个模块里作为隐性入口
- `Study Complete Card` 中必须再次显式露出 `View Replay`
- 这样 replay 才会进入主演示路径，而不只是证据层里的一个链接

## 7. 辅助主页面：Insight Compare

### 7.1 页面目标

如果 `Workbench` 负责“做研究”，那么 `Insight Compare` 就负责“做决策”。

这页必须把聊天流里分散的信息重新拉平成明确的对比视图。

### 7.2 页面必须展示的内容

- stimuli compare grid
- quant ranking
- qual themes compare
- target group differences
- recommended next action

### 7.3 为什么这页必要

即使 `Workbench` 已经有右侧结果面板，仍然需要一个 `Compare` 页面，原因是：

- 达能最终买的是营销决策支持
- 刺激物比较是核心业务问题
- 工作台里的对话更适合过程，比较页更适合决策表达

### 7.4 与 Workbench 的导航连接

`Insight Compare` 不能只作为左侧一级导航存在。

必须有两条自然入口：

- 从 `Recommendation Summary` 的 `View Full Comparison` 进入
- 从 `Completed with Recommendation` 状态下的快捷建议进入

这样 Compare 页面才会成为演示主路径中的自然延伸，而不是演示者额外想起来才会点击的页面

## 7.5 Replay View

`Replay` 是核心业务资产，不能只有一个入口，没有内容定义。

Replay 的最小可行展示形态必须满足：

- 分阶段结构：
  - `Plan`
  - `Qual`
  - `Quant`
  - `Synthesis`
- 每个阶段都有：
  - 输入摘要
  - 输出摘要
  - 关键决策
- 可查看：
  - 哪个 twin 对哪个 stimulus 给出了哪些典型响应
  - qual themes 如何形成
  - quant ranking 如何得出
- 尾部必须有：
  - approval trail
  - exported artifacts summary

说明：

- Replay 不是 audit log，也不是原始 workflow history
- Replay 是业务可读、结构化、可复用的研究回放视图

渲染模式建议：

- 演示环境首版推荐采用 `Full-screen Modal`
- 后续如果需要沉淀成更强资产页，可升级为独立路由页面
- 不建议用 drawer 承载 Replay，因为信息量不足、沉浸感不够

## 8. 证据层设计

### 8.1 原则

Persona / Inputs / Trust 这些能力都很重要，但它们不应该成为 demo 开场。

它们的正确存在方式是：

`由主舞台触发的证据层`

### 8.2 Twin & Persona Provenance Drawer

职责：

- 展示 target audience、persona profile、consumer twin 的关系
- 展示 twin 来源于哪些 qual / transcript / quant 资产
- 展示 twin version、适用研究类型和最近更新时间

必须表达清楚：

- twins 是 Danone-owned 资产
- twins 不是一段 prompt
- twins 有来源、有版本、有适用边界

### 8.3 Input Sources & Connectors Drawer

职责：

- 展示当前输入源：
  - qual reports
  - transcripts
  - quant datasets
- 展示可扩展输入源：
  - CDP
  - VOC
  - CRM / membership / campaign feedback

表达原则：

- 当前必备输入与未来扩展输入必须分层
- 不夸大当前依赖
- 重点表达“未来可以持续增强 persona 构建”

### 8.4 Trust & Calibration Drawer

职责：

- 展示 benchmark
- 展示 confidence
- 展示 drift / calibration 摘要
- 展示 approval trail

设计原则：

- 让人感觉“这套系统考虑了可靠性”
- 但不要把主舞台变成校准控制台

与主舞台的连接要求：

- `Recommendation Summary` 中的 confidence 区块必须可点击打开该 drawer
- `Quant Ranking` 中的 confidence badge 也必须可点击打开该 drawer

## 9. 视觉设计系统

### 9.1 总方向

视觉方向采用：

`Precision Laboratory`

关键词：

- 明亮
- 精密
- 冷静
- 研究机构感
- 高完成度

### 9.2 为什么不用深色 chat 风格

原因很直接：

- 深色 AI chat 风格太像通用 LLM 产品
- 容易削弱研究与判断的严肃感
- 不符合达能用户研究团队的专业气质

### 9.3 色彩系统

建议使用以下主色：

- `Primary Navy`: `#113453`
- `Deep Text`: `#163D5E`
- `Canvas`: `#F6F7F4`
- `Mist`: `#EEF3F6`
- `Warm Gold`: `#D39A42`
- `Gold Soft`: `#FBF2DF`
- `Border`: `#D6DFE5`

颜色分工：

- 深蓝用于骨架与标题
- 雾灰与米白用于工作台背景
- 暖金只用于高价值强调：
  - confidence
  - recommendation
  - approval emphasis

### 9.4 字体建议

演示环境不要使用通用默认感太强的字型组合。

建议：

- 中文主字体：`Source Han Sans SC`
- 英文与数字强调：`IBM Plex Sans`
- 数据与版本标识：`IBM Plex Mono`

原则：

- 主界面以无衬线为主，强调研究工具的精密感
- 少量数据、版本、confidence 可使用 monospace 提升“系统对象感”

### 9.5 材质感

材质不做玻璃炫技，不做强霓虹，不做过度渐变。

推荐材质语言：

- 大面积纸质浅底
- 精准边框
- 少量柔和阴影
- 金色只做点睛

## 10. 组件优先级

### 10.1 P0：必须做得像真产品

这些组件决定整套 demo 是否成立：

- Study Setup Bar
- Conversation Thread
- Plan Card
- Plan Approval Card
- Qual Session Card
- Mid-run Review Card
- Recommendation Card
- Study Complete Card
- Prompt Composer
- Recommendation Summary
- Quant Ranking
- Qual Themes Panel

要求：

- 有真实信息结构
- 有真实层级关系
- 有真实状态
- 有接近可用产品的完成度

### 10.2 P1：要结构完整，但不必深实现

- Input Snapshot
- Replay / Evidence Card
- Approval / Artifact / Lineage Snapshot
- Compare View 次级筛选区

要求：

- 看起来成立
- 逻辑完整
- 可支持讲解

### 10.3 P2：只需以证据层方式露出

- CDP / VOC connector details
- deep provenance graph
- full calibration controls
- admin-grade config views

要求：

- 有入口
- 有基本结构
- 不抢主戏

## 11. 真实感设计要求

### 11.1 不允许出现的假感

- 只有标题，没有真实字段
- 看起来像模板占位的“卡片墙”
- 只有聊天，没有结构化对象
- 只有数据块，没有业务问题和刺激物上下文
- Persona / Trust 被做成孤立的“说明页”

### 11.2 必须出现的真实信号

- 明确的 business question
- 明确的 target groups
- 明确的 stimulus names
- 明确的 qual / quant 区分
- 明确的 winner / next action
- 明确的 version / confidence / approval 痕迹

## 12. 页面状态要求

演示环境至少准备以下状态：

- `Study Planning`
- `Awaiting Approval`
- `Qual Complete / Awaiting Mid-run Review`
- `Completed with Recommendation`
- `Rerun Suggested`

说明：

- 不同状态下，中区和右侧都要有相应变化
- 这会让工作台显得更真实，而不是单一静态页

### 12.1 `Rerun Suggested` 状态定义

这个状态不能只是列表中的一个名字，必须有前台载体。

触发语义：

- 上一次研究已完成
- 系统发现：
  - twin 有轻微漂移
  - 或 benchmark freshness 不足
  - 或 qual / quant 结果存在需要复核的矛盾点
- 因此建议基于更新后的 twin version 或配置，重新发起一次 quant 或完整 rerun

前台表现：

- 在 `Recommendation Summary` 区域显示明确提示：
  - `Rerun Suggested`
  - `Reason: Twin set updated / confidence dropped / drift detected`
- 在对话线程中出现 `Rerun Suggestion Card`
- 提供明确动作：
  - `Review changes`
  - `Launch rerun`
  - `Keep current result`

演示意义：

- 这是“系统会随着时间变强”的前台证据
- 也是 Runtime-first 设计优于一次性 AI 报告生成器的关键区别

## 13. 响应式策略

演示环境的主目标是桌面端，但仍需保证笔记本和较窄屏幕可用。

### 13.1 Desktop

主形态，采用三段式。

### 13.2 Narrow Desktop / Laptop

允许右侧结果面板下沉为第二屏块，但顺序必须仍然是：

- Header
- Setup
- Conversation
- Result Panel

### 13.3 Mobile

不是 demo 主目标，不必优先做深，但应避免完全崩坏。

## 14. 演示数据建议

为了让界面真实，演示环境必须使用接近真实研究语境的数据。

建议使用统一 demo 场景：

- Category: Beverage
- Study Type: Concept Screening
- Target Groups:
  - Pregnant women
  - Moms with kids aged 0-3
- Stimuli:
  - `清泉+`
  - `初元优养`
  - `安纯`

建议在内容层明确写出：

- 哪个 concept 更强
- 为什么更强
- 哪个人群差异最大
- 下一步应该做什么

命名原则：

- 避免 `Concept A / B / C` 这类强 placeholder 感标签
- 使用接近真实营销语境的半虚构名称
- 保持可读，但不要碰真实品牌资产

Library 建议额外预置以下历史记录：

- `Beverage Concept Screening / 清泉+`
- `IMF Naming Screening / 星护优启`
- `Communication Asset Test / 晨护时刻`

这样可以在不打断主演示的情况下，证明平台覆盖多品类和多研究类型。

## 15. 开发建议

### 15.1 开发顺序

前端实现顺序建议：

1. Workbench layout shell
2. Study Setup Bar
3. Conversation Thread + cards
4. Result Panel
5. Demo states:
   - `Awaiting Approval`
   - `Qual Complete / Awaiting Mid-run Review`
   - `Completed with Recommendation`
6. Compare View
7. Evidence Drawers
8. Twins / Library supporting pages

### 15.2 开发原则

- 先做 P0
- 先做状态切换，再做装饰细节
- 先做真实内容结构，再做动画
- 所有 demo 内容都围绕同一个 study 场景

## 16. 非目标

这版前端详细设计不追求：

- 完整后台管理系统
- 完整 calibration 控制台
- 全量 connector 配置界面
- 多租户能力展示
- 全设备极致适配

## 17. 设计结论

这套前端设计的核心判断是：

- 主舞台只有一个：`AI Consumer Workbench`
- 主叙事只有一条：`业务问题 -> 研究计划 -> qual/quant 执行 -> 推荐结果`
- Persona、Inputs、Trust 都必须存在，但只能以证据层服务主舞台
- 演示环境的真实感，取决于 P0 组件是否像真产品，而不是页面数量多少

如果后续实现严格按这份文档推进，前端 demo 才会同时满足三件事：

- 逻辑清楚
- 功能完善
- 呈现真实
