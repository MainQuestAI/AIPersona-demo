# 达能 AI Consumer Runtime MVP PRD

文档版本：v1  
日期：2026-04-02  
状态：可进入实施拆解  
适用范围：达能单租户单行业交付版 MVP  
上位文档：`danone_ai_consumer_system_design_2026-04-02.md`

## 1. 文档目的

本文档用于把系统设计收敛成首版可交付产品范围，回答四个问题：

- MVP 到底要交付什么
- 哪些能力必须首版成立
- 哪些能力暂时不做
- 达能侧如何判断这版产品“值不值得继续投入”

本文档不讨论长期平台想象，而聚焦首版业务价值闭环。

## 2. 产品定位

MVP 的定位不是“AI persona 展示工具”，而是一个面向达能市场与洞察团队的 `AI Consumer Learning Workbench`。

它需要在首版就同时成立三件事：

- 把达能过去 3 年研究资产转成 `Danone-owned consumer twins`
- 支持 `新品 / 概念 / 命名 / 口味 / 沟通素材` 的快速 qual + quant 测试
- 让研究过程、结论和可信度以可回放、可审批、可校准的方式被沉淀

一句话定义：

`一个帮助达能在小时级完成消费者学习与刺激物筛选的研究运行平台`

## 3. 商业目标

### 3.1 首版业务目标

- 将一次常规概念测试的准备和初步洞察产出时间，从“天级”压缩到“小时级”
- 让市场团队可在一次研究中并行比较多个刺激物候选
- 让洞察团队把历史研究资产复用为可持续更新的 twins 资产，而不是一次性报告
- 让每次研究结果都能留下计划、执行、证据链、评分和回放

### 3.2 首版成功信号

- 达能业务方能独立创建 study、上传 stimulus、选择人群并发起运行
- 系统能稳定输出 qual 洞察、quant 排序和 segment differences
- 报告不再是黑箱结论，而是附带 replay 与 evidence chain
- 历史 benchmark 与 calibration 结果能被用来解释“这次结果为什么可信”

## 4. 目标用户

### 4.1 市场用户

职责：

- 发起概念、命名、口味、KV、文案测试
- 快速比较候选方案
- 使用研究结果指导下一轮创意与筛选

关心：

- 速度
- 结论是否清楚
- 哪个方案更值得推进

### 4.2 洞察用户

职责：

- 管理历史研究资产
- 维护 twins、benchmark、anchor sets
- 审阅研究计划和结果
- 判断系统结果是否可用

关心：

- 方法论是否稳
- 结果是否可追溯
- 偏差能否解释和校准

### 4.3 管理员

职责：

- 管理用户、权限、数据策略、模型策略、导出策略

关心：

- 安全
- 审批
- 审计
- 交付稳定性

## 5. MVP 业务范围

### 5.1 首版必须支持的品类与场景

- 品类：
  - Beverage
  - Infant Milk Formula
- 人群：
  - 饮料用户
  - 孕妇
  - 0-3 岁孩子的妈妈
- 决策场景：
  - innovation concept test
  - naming / flavor screening
  - communication asset test
  - target audience learning

### 5.2 首版必须支持的刺激物类型

- concept
- name
- flavor
- kv
- copy
- slogan
- tagline

### 5.3 首版必须支持的输入资产

- qual reports
- historical transcripts
- quant datasets
- stimulus files

## 6. MVP 非目标

首版不做以下内容：

- 通用 CDP / CRM 替代
- 媒体投放执行与优化
- 全渠道经营决策中台
- 多租户 SaaS 产品化能力
- 全量 on-prem 部署
- 自动生成所有 benchmark 与 anchor，无人工确认环节
- 完整企业级 BI 和报表体系

## 7. 核心价值主线

MVP 只围绕两条价值主线组织产品能力：

### 7.1 主线 A：快速测试

用户能对多个候选刺激物发起一次 study，并在一次运行中拿到：

- qual 洞察
- quant 排序
- 人群差异
- 推荐推进方案

### 7.2 主线 B：资产沉淀

用户不是一次性“问 AI”，而是在每次运行后都积累：

- twin versions
- approved study plans
- replay
- benchmark pack
- confidence snapshots

## 8. MVP 核心用户流程

### 8.1 资产准备流程

1. 洞察用户导入历史 qual / quant / transcript 资产
2. 系统完成 ingestion 和结构化抽取
3. 洞察用户确认 mapping、benchmark pack 和 anchor set
4. Twin Factory 生成或更新 consumer twins

### 8.2 研究执行流程

1. 市场用户创建 study
2. 上传并选择 stimulus
3. 选择 target audience / twin versions
4. Planner Agent 生成 study plan
5. 洞察用户审批计划
6. Runtime 执行 qual + quant
7. 洞察用户审阅结果，可选择 rerun
8. 系统生成报告与 replay

### 8.3 校准流程

1. 洞察用户导入历史或新增真实研究结果
2. Calibration Service 对照 benchmark
3. 系统更新 confidence snapshot 与 drift alert
4. 洞察用户决定是否升级 twin / anchor / template 版本

## 9. MVP 功能范围

### 9.1 Workspace 与权限

必须支持：

- 单租户 workspace
- 用户登录与角色管理
- RBAC
- 审批策略
- 导出策略
- 模型调用策略

### 9.2 Asset Ingestion

必须支持：

- 导入 qual report
- 导入 transcript
- 导入 quant dataset
- 导入 stimulus 文件
- 查看 ingestion job 状态
- dataset schema mapping 人工确认
- benchmark pack build 与发布

不要求首版支持：

- 自动处理所有非标准文件格式
- 无人工干预的 quant 数据标准化

### 9.3 Twin Center

必须支持：

- target audience 列表与详情
- persona profile 查看
- consumer twin 列表与详情
- twin version 查看
- twin 来源 lineage
- twin 适用场景说明

不要求首版支持：

- fully autonomous twin self-maintenance
- 高自由度 twin 编辑器

### 9.4 Study Planning

必须支持：

- 创建 study
- 生成 `study_plan_version`
- 显示 twin 选择、stimulus 范围、qual / quant 配置、预计成本
- 计划审批
- 保留 plan 版本历史

### 9.5 Study Runtime

必须支持：

- 启动 run
- 显示 run status
- mid-run approval
- resume
- rerun
- run step timeline
- 失败重试

必须满足：

- state persistence
- durable execution
- idempotent write-back
- explicit approval gates

### 9.6 Qual Engine

必须支持：

- AI IDI
- AI mini FGD
- 输出 `qual_transcript`
- 输出 `qual_theme_set`
- 输出 `qual_theme_item`

### 9.7 Quant Engine

必须支持：

- twin open-text response generation
- SSR scoring
- score distribution
- candidate ranking
- segment comparison

必须满足：

- anchor set selectable
- multi-twin execution
- replica-based sampling
- confidence 标记

### 9.8 Report 与 Replay

必须支持：

- 研究报告
- 管理层摘要
- replay 视图
- evidence chain
- 结构化 artifact 存储

### 9.9 Calibration Lite

必须支持：

- benchmark pack 导入与构建
- calibration run 发起
- confidence snapshot 计算
- drift alert 展示

首版不要求：

- 自动闭环更新 twin / anchor
- fully continuous online calibration

## 10. 关键页面

MVP 只做 6 个一级页面：

- Dashboard
- Studies
- Study Detail
- Consumer Twins
- Stimulus Library
- Calibration Center

其中 `Study Detail` 必须是核心页面，至少包含：

- Plan
- Timeline
- Qual
- Quant
- Replay
- Approval
- Artifacts

## 11. Runtime-first 要求

以下能力不是可选项，而是 MVP 成立条件：

- study、plan、run、step、artifact、calibration_run 必须为显式对象
- run 状态必须可持久化
- 中断后必须可恢复
- 工具结果必须结构化回写
- 人工审批必须可插入且可追溯
- 每次运行必须绑定 plan version、twin version、anchor set、agent config
- replay 不能依赖底层 workflow history 裸暴露
- confidence 计算必须有确定性服务负责

## 12. 数据依赖与前置条件

MVP 成立依赖以下输入：

- 达能可提供过去 3 年的 qual reports
- 达能可提供过去 3 年的 transcript 或可替代访谈文本
- 达能可提供过去 3 年的 quant datasets 或结构化结论
- 首版可以选定若干品牌和若干 study type 做优先试点
- 洞察侧愿意参与 mapping、benchmark 和 anchor 的人工 review

## 13. 核心体验要求

### 13.1 对市场用户

- 创建一个新 study 不超过 10 分钟
- 结果页不要求看懂系统设计，但必须能直接回答“哪个更值得推进”
- 每次结果都必须带推荐、风险点和人群差异

### 13.2 对洞察用户

- 能看到 plan version、run timeline、approval records、evidence chain
- 能追溯本次研究用的是哪版 twin、anchor、agent config
- 能决定是否 rerun、是否发布、是否进入 calibration

## 14. 成功指标

### 14.1 业务指标

- 单次概念测试从创建到首轮输出的时间
- 每次 study 可比较的候选刺激物数量
- 市场团队对推荐结果的采纳率
- 下一轮真实研究前的筛选效率提升

### 14.2 产品指标

- study completion rate
- rerun rate
- replay usage rate
- approval turnaround time
- ingestion success rate

### 14.3 可靠性指标

- ranking hit rate
- score alignment
- confidence coverage
- drift alert resolution rate

## 15. MVP 验收标准

首版上线前，至少满足以下验收条件：

- 可导入至少一批 qual 报告、transcript、quant 数据和 stimulus
- 可生成并查看不少于 1 组 target audience 下的多个 twin versions
- 可完成一次完整 study 流程：create plan -> approve -> run -> review -> report -> replay
- 可对同一组刺激物输出 qual 洞察和 quant 排序
- 可触发一次 rerun，且保留原 run
- 可构建至少一个 benchmark pack 并完成一次 calibration run
- 可在界面上查看 confidence snapshot 与 drift alert

## 16. 版本边界与发布建议

### 16.1 Alpha

目标：

- 跑通端到端最小闭环
- 先验证 system/runtime 是否稳定

范围：

- 单品牌
- 单一 study type
- 少量 stimulus
- 少量 twins

### 16.2 Beta

目标：

- 让业务方开始真实使用
- 验证结果表达与可信度管理

范围：

- Beverage + IMF
- 至少两类 study type
- 完整 replay 和 calibration lite

### 16.3 Pilot

目标：

- 用真实业务节奏评估平台价值

范围：

- 覆盖真实比稿场景
- 允许多轮 rerun 和 benchmark 更新

## 17. 主要风险

- quant 数据标准化难度高于预期
- benchmark pack 建设依赖洞察侧人工 review
- anchor set 质量直接影响 SSR 结果可信度
- twin 质量在首版可能呈现“部分 study_type 强、部分弱”的不均匀性
- 市场用户更关注结论而不是方法，结果表达必须足够清楚

## 18. 产品结论

这版 MVP 的本质不是“做一个 AI 研究 demo”，而是先把达能项目最关键的三条链路跑通：

- 资产链：历史研究 -> twin / benchmark / anchor
- 运行链：study -> plan -> run -> replay -> report
- 可信度链：benchmark -> calibration -> confidence / drift

只要这三条链路成立，这个项目就不是一次性比稿工具，而是一个可持续积累的 Danone AI Consumer Runtime。
