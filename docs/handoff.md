# AIpersona Demo Handoff

文档版本：v1  
日期：2026-04-02  
状态：开发交接真源

## 1. 这份 handoff 的作用

这份文档只做一件事：

`把达能 AI Consumer Demo 的开发起点、边界、文档入口和执行顺序一次性讲清楚，让后续 AI 员工在这个文件夹里直接开工，而不是重新发散。`

## 2. 当前开发主目录

后续开发统一在本目录进行：

- `AIpersona-demo`

规划文档统一存放在：

- `docs/planning/`

建议优先使用这个纯 ASCII、无空格短路径入口：

- `/Users/dingcheng/Desktop/aipersona_demo`

## 3. 已迁入的开发类规划文档

以下文档已经迁入 `docs/planning/`，并作为当前项目的正式开发母文档：

- `docs/planning/project_blueprint.md`
- `docs/planning/system_design.md`
- `docs/planning/mvp_prd.md`
- `docs/planning/frontend_design.md`
- `docs/planning/demo_content_playbook.md`
- `docs/planning/implementation_tasks.md`
- `docs/planning/frontend_implementation_plan.md`
- `docs/planning/frontend_mock_data_spec.md`
- `docs/planning/frontend_execution_cards_batch1.md`

说明：

- 原桌面项目中的旧路径已保留兼容软链，不会断开。
- 从现在开始，`AIpersona-demo/docs/planning/` 是唯一主入口。

## 4. 项目一句话定义

这是一个面向达能用户研究团队的 `AI Consumer Demo Environment`：

- 前台交互采用 `Agent-first`
- 底层系统必须坚持 `Runtime-first`
- 主价值不是展示“会聊天”，而是展示：
  - 能发起研究
  - 能生成研究计划
  - 能执行 qual / quant
  - 能给出推荐结果
  - 能证明 twin 资产来源与结果可信度

## 5. 当前已经锁定的核心判断

这些判断已经在多轮评审后稳定，不要在实现阶段擅自推翻：

1. 主舞台只有一个：`AI Consumer Workbench`
2. 前台是 `Agent-first`，但底层仍然必须是 `Runtime-first`
3. 主叙事顺序是：
   - 业务问题
   - 研究计划
   - qual / quant 执行
   - recommendation
   - evidence / trust / provenance
4. Persona / Twin / Input / Trust 都是证据层，不是并列主舞台
5. `Qual + Quant` 必须并列成立，不能做成只有排序没有解释
6. `Danone-owned consumer twins` 必须在主界面上有感知，而不是藏在后台
7. 所有演示数据必须以 `demo_content_playbook.md` 为真源，不能各写各的

## 6. 文档阅读顺序

如果是新的 AI 员工接手，按这个顺序读：

1. `docs/handoff.md` 或根目录 `handoff.md`
   目的：先理解边界、路径和执行方式
2. `docs/planning/frontend_design.md`
   目的：理解前端结构、主页面、P0/P1/P2 分层、演示脚本
3. `docs/planning/demo_content_playbook.md`
   目的：锁定所有 P0 卡片、分数、主题、摘录、推荐动作的统一口径
4. `docs/planning/frontend_implementation_plan.md`
   目的：锁定前端首版的开发顺序、目录、组件范围和验收口径
5. `docs/planning/frontend_mock_data_spec.md`
   目的：锁定 mock data 结构，避免页面各写各的数据
6. `docs/planning/frontend_execution_cards_batch1.md`
   目的：直接给 AI 员工派发第一批开发任务
7. `docs/planning/mvp_prd.md`
   目的：理解 MVP 范围、非目标、验收标准
8. `docs/planning/system_design.md`
   目的：理解 runtime、对象模型、状态机、双引擎与信任闭环
9. `docs/planning/implementation_tasks.md`
   目的：按模块拆分任务并安排执行顺序
10. `docs/planning/project_blueprint.md`
   目的：回看更上位的业务蓝图与演进路径

## 7. 当前最重要的页面与状态

### 7.1 必做页面

- `Workbench`
- `Compare`
- `Twins`

### 7.2 必做交互结构

- 左侧导航 Rail
- Workbench Header
- Agent 对话线程
- 结构化结果面板
- Trust / Twin Provenance / Input Sources Drawers
- Replay Full-screen Modal

### 7.3 必做状态

- `Draft`
- `Planning`
- `Awaiting Approval`
- `Running`
- `Awaiting Mid-run Review`
- `Completed with Recommendation`
- `Rerun Suggested`

## 8. Demo 内容真源

这次 demo 的业务故事已经锁定，必须统一：

### 8.1 主演示研究

- Study Name: `孕期饮品概念筛选 · Beverage TA v2.1 · 2025-Q4`
- Category: `Beverage`
- Study Type: `Concept Screening`

### 8.2 Target Groups

- `孕期女性 / Tier-1 / 25-35 岁`
- `0-3 岁宝宝妈妈 / Tier-1&2 / 26-38 岁`

### 8.3 Stimuli

- `清泉+`
- `初元优养`
- `安纯`

### 8.4 统一 Quant 结果

- `清泉+`: `74`
- `初元优养`: `61`
- `安纯`: `52`
- `Confidence: 82 / High`

### 8.5 统一结论

- Winner: `清泉+`
- Primary reason:
  - 更强的安全感
  - 更好的日常饮用适配度
  - 更少的医疗化压迫感
- Next action:
  - 进入下一轮真实消费者验证
  - 继续验证“清 / 泉”命名边界

所有具体卡片文案、qual themes、twin excerpts、rerun reason，都必须从：

- `docs/planning/demo_content_playbook.md`

读取，不允许自行改写。

## 9. 推荐的开发切入顺序

这里不讨论人力，只讨论 AI 开发执行顺序。

### Phase 1：项目骨架

- 初始化前端项目结构
- 建立页面路由
- 建立设计 token 与基础布局
- 先跑通 `Workbench / Compare / Twins`

### Phase 2：静态数据层

- 把 `demo_content_playbook.md` 转成前端假数据源
- 所有页面先接统一 mock data
- 先解决内容一致性，再做动效和高级交互

### Phase 3：P0 主路径

- Workbench Header
- Study Setup Bar
- Conversation Thread
- Plan Approval Card
- Qual Session Card
- Mid-run Review Card
- Recommendation Summary
- Quant Ranking
- Study Complete Card
- Rerun Suggestion Card

### Phase 4：证据层

- Trust Drawer
- Twin Provenance Drawer
- Input Sources Drawer
- Replay Full-screen Modal

### Phase 5：配套页面

- Compare 页面
- Twins 页面
- Library 轻量入口

### Phase 6：演示打磨

- 内容一致性复核
- 时间线跳转与演示顺序优化
- 中英文混排统一
- 截图与比稿视角下的真实性打磨

## 10. 对后续 AI 员工的硬约束

后续任何 AI 员工进入开发前，都必须遵守：

1. 不要把系统退化成 `Prompt-first Chat UI`
2. 不要把 Persona / Inputs / Trust 抬成主舞台
3. 不要自行改写 `清泉+ / 初元优养 / 安纯` 这套研究故事
4. 不要自行修改 quant 分数、winner、confidence
5. 不要省略 `Qual Session Card`、`Mid-run Review`、`Replay`、`Rerun Suggested`
6. 不要把证据层全部铺到主界面，保持工作台主叙事清晰
7. 不要脱离 `docs/planning/` 单独发挥

## 11. 背景资料位置

如果后续开发需要回看达能原始背景文件，入口仍然是：

- `/Users/dingcheng/Desktop/达能-AI 消费者/invite.md`
- `/Users/dingcheng/Desktop/达能-AI 消费者/research_brief.docx`

如果后续需要，我可以再把背景资料也镜像进当前项目目录。

## 12. 下一步建议

从这里开始，最合理的动作不是继续写方案，而是直接进入：

1. 前端实现计划
2. 统一 mock data 结构输出
3. 页面与组件任务拆分
4. 第一版演示环境落地

一句话收口：

`规划阶段已经结束，AIpersona-demo 现在应该进入实现编排阶段。`
