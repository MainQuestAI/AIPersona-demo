# AIpersona vs Atypica — 功能差距清单

日期：2026-04-12（第一期 + 第二期完成后）
目的：全面列出 Atypica 公开具备但我们明确缺失的功能点

---

## 评估方法

基于 `atypica_competitor_research_2026-04-02.md` 逐项核对。
每项标注：缺失程度（完全缺失 / 部分缺失 / 有基础未表达）+ 业务杀伤力（对演示/签约的直接影响）。

---

## A. Persona 资产体系

Atypica 最核心的资产故事。他们宣称 30 万合成 + 1 万真实消费者 agent。

| # | Atypica 功能 | 我们的状态 | 缺失程度 | 杀伤力 |
|---|-------------|-----------|---------|--------|
| A1 | 上传访谈 PDF → 自动解析生成 Persona | 只有粘贴文本 → LLM 提取 | 部分缺失 | 高 |
| A2 | 7 维度画像分析（Demographic/Geographic/Psychological/Behavioral/Needs/Tech Acceptance/Social） | LLM 提取 6 维度（缺 Geographic、Tech Acceptance、Social Relations） | 部分缺失 | 中 |
| A3 | Persona 追访（对已有 Persona 做补充访谈） | 无 | 完全缺失 | 中 |
| A4 | 与 Persona 独立对话（脱离研究场景） | 无。只在研究执行中有 IDI | 完全缺失 | 高 |
| A5 | Persona 搜索和浏览（按维度筛选） | 只有列表页，无搜索/筛选 | 部分缺失 | 中 |
| A6 | Persona 跨研究复用 | DB 支持（twin_version 可绑定多个 study），但前端无选择 UI | 有基础未表达 | 高 |
| A7 | 大规模 Persona 库（"30 万 + 1 万"规模叙事） | 2 个 seed + 可自建 | 完全缺失 | 高（叙事层面） |
| A8 | 从社媒数据（小红书/抖音/Instagram）批量生成 Persona | 无 | 完全缺失 | 中 |

---

## B. 研究执行能力

| # | Atypica 功能 | 我们的状态 | 缺失程度 | 杀伤力 |
|---|-------------|-----------|---------|--------|
| B1 | Plan Mode：用户可修改计划（调整人群/刺激物/方法） | 只能确认或不确认，不能编辑 | 部分缺失 | 中 |
| B2 | Plan Mode：团队可协作审阅计划 | 单用户，无团队审阅 | 完全缺失 | 低（demo 阶段） |
| B3 | Human Interviews 支持（真人访谈接入） | 纯 AI 访谈 | 完全缺失 | 低 |
| B4 | Smart Analytics（自动分析上传的访谈数据） | 无独立分析能力 | 完全缺失 | 中 |

---

## C. 输出物与分发

| # | Atypica 功能 | 我们的状态 | 缺失程度 | 杀伤力 |
|---|-------------|-----------|---------|--------|
| C1 | AI Podcast（把研究结论转成音频） | 无 | 完全缺失 | 高（差异化亮点） |
| C2 | Replay URL（公开可访问的回放链接） | 有 replay modal 但不是独立 URL | 部分缺失 | 中 |
| C3 | Share URL（公开结论页） | 已实现 `GET /studies/{id}/share` | ✅ 已补齐 | — |
| C4 | Report（HTML 报告） | 已实现（MQDS 暗色风格） | ✅ 已补齐 | — |

---

## D. Memory 系统

Atypica 的长期粘性引擎。完全空白。

| # | Atypica 功能 | 我们的状态 | 缺失程度 | 杀伤力 |
|---|-------------|-----------|---------|--------|
| D1 | User Profile 记忆（自动记住用户偏好） | 无 | 完全缺失 | 中 |
| D2 | Research Preferences 记忆（偏好的研究方法/人群） | 无 | 完全缺失 | 中 |
| D3 | Research History 记忆（跨研究上下文关联） | study 之间完全隔离 | 完全缺失 | 高 |
| D4 | Recurring Themes 记忆（自动识别反复出现的主题） | 无 | 完全缺失 | 高 |
| D5 | Brand and Product Positioning 记忆 | 无 | 完全缺失 | 中 |
| D6 | Automatic Extraction（研究完成后自动提取记忆） | 无 | 完全缺失 | 高 |
| D7 | Version Management（记忆版本控制） | 无 | 完全缺失 | 低 |
| D8 | Team-Level Memory（团队共享记忆） | 无 | 完全缺失 | 低（demo 阶段） |

---

## E. 平台与集成

| # | Atypica 功能 | 我们的状态 | 缺失程度 | 杀伤力 |
|---|-------------|-----------|---------|--------|
| E1 | MCP Server（8 个研究工具可被外部 Agent 调用） | 无 | 完全缺失 | 高（平台叙事） |
| E2 | REST API（team account 可用） | 有完整 API，但无鉴权 | 有基础未表达 | 中 |
| E3 | 企业内部数据接入（Jupyter/私有 API/内网 DB） | 无 | 完全缺失 | 中 |
| E4 | Custom Skills / Tool 扩展 | 无 | 完全缺失 | 低 |

---

## F. 团队与企业化

| # | Atypica 功能 | 我们的状态 | 缺失程度 | 杀伤力 |
|---|-------------|-----------|---------|--------|
| F1 | Team seat（多人协作） | 单用户 | 完全缺失 | 中 |
| F2 | Team API keys | 无鉴权 | 完全缺失 | 低 |
| F3 | Identity switch / Impersonation | 无 | 完全缺失 | 低 |
| F4 | Verified domain whitelist | 无 | 完全缺失 | 低 |
| F5 | 成员管理（创建/邀请用户） | 无 | 完全缺失 | 低 |

---

## G. 产品形态与入口

| # | Atypica 功能 | 我们的状态 | 缺失程度 | 杀伤力 |
|---|-------------|-----------|---------|--------|
| G1 | AI Sage（专家型 Agent：知识导入→分析→咨询） | 无 | 完全缺失 | 中 |
| G2 | Insight Radio（研究结论 → 音频播客） | 无 | 完全缺失 | 高 |
| G3 | Interview 独立产品入口（创建项目→选参与者→AI 访谈→报告） | 我们的 IDI 内嵌在研究流程中，无独立入口 | 部分缺失 | 中 |
| G4 | Persona 独立产品入口 | 我们有 Consumer Twins 页但功能单薄 | 部分缺失 | 中 |
| G5 | Featured Studies / 公开案例展示 | 无 | 完全缺失 | 中（营销层面） |

---

## 汇总统计

### Atypica 功能对标（A-G）

| 缺失程度 | 数量 | 占比 |
|---------|------|------|
| 完全缺失 | 24 | 65% |
| 部分缺失 | 8 | 22% |
| 有基础未表达 | 2 | 5% |
| 已补齐 | 2 | 5% |
| 不适用 | 1 | 3% |
| **总计** | **37** | |

按杀伤力：

| 杀伤力 | 数量 | 关键项 |
|--------|------|--------|
| 高 | 11 | A4 与 Persona 对话, A6 跨研究复用, A7 规模叙事, C1 Podcast, D3 跨研究记忆, D4 反复主题, D6 自动提取, E1 MCP, G2 Insight Radio, A1 PDF上传 |
| 中 | 17 | B1 计划可编辑, B4 Smart Analytics, A2/A3/A5/A8, D1/D2/D5, E2/E3, F1, G1/G3/G4/G5 |
| 低 | 7 | B2/B3, D7/D8, E4, F2/F3/F4/F5 |

### 工程稳定性（H）

| 类型 | 数量 | 状态 |
|------|------|------|
| 后端主链 bug（P0） | 3 | 已修复 |
| 后端兜底/CI（P1） | 2 | 1 已修复 / 1 待做 |
| 产品完成度问题 | 4 | 未修复（H6-H9）|

---

## H. 工程稳定性（内审发现，2026-04-12 已修复）

代码审查发现的后端主链 bug，均已在本轮修复。记录在此作为回归防线。

| # | 问题 | 严重度 | 状态 |
|---|------|--------|------|
| H1 | `service.repository` / `service.gateway` 访问私有属性 → AttributeError | P0 | **已修复**（增加 @property 暴露） |
| H2 | `bundle.get("study_plan_versions")` 字段名不匹配（应为 `plan_versions`）| P0 | **已修复** |
| H3 | `versions[0]` 取最老版本而非最新（升序查询） | P0 | **已修复**（改为 `versions[-1]`）|
| H4 | routes.py 未定义 `logger` → except 分支 NameError → 500 | P1 | **已修复**（增加 `logging.getLogger`）|
| H5 | Python 测试不在默认 CI 闸门（pnpm test 只跑前端） | P1 | **未修复**（需要配置 CI pipeline） |

### 仍存在的产品完成度问题（非 Atypica 对标，但影响演示）

| # | 问题 | 位置 | 影响 |
|---|------|------|------|
| H6 | Compare / Twins 页关键 CTA 仍是 toast 占位 | compare-placeholder.tsx, twins-placeholder.tsx | "查看详情""导出"点了没反应 |
| H7 | Stimulus Library "导入"是演示按钮，非真上传 | stimulus-library-page.tsx | 无法演示资产导入 |
| H8 | 前端仍有 mock fallback 路径 | workbenchRuntimeBridge.ts:966-985 | 无真实数据时渲染 mock 而非空状态 |
| H9 | Calibration Center API 直接返回空数组 | routes.py calibration 端点 | 页面已标"即将上线"，可接受 |

---

## 建议优先级（按 ROI 排序）

### 第一梯队：做完能回答 "你的消费者从哪来"

| 项 | 做什么 | 工期 | 补齐项 |
|----|--------|------|--------|
| Persona 资产增强 | PDF 上传解析 + Persona 浏览器 + 预置 20 个 demo persona + 与 Persona 独立对话 | 5-7 天 | A1, A4, A5, A6, A7 |

### 第二梯队：做完能回答 "下次研究能记住上次吗"

| 项 | 做什么 | 工期 | 补齐项 |
|----|--------|------|--------|
| Memory v1 | 研究完成自动提取记忆 + 下次研究注入历史主题 + 前端记忆面板 | 3-4 天 | D3, D4, D6 |

### 第三梯队：做完能回答 "能接我们的系统吗"

| 项 | 做什么 | 工期 | 补齐项 |
|----|--------|------|--------|
| MCP Server | 包装 6 个核心 API 为 MCP tools + 公开 endpoint | 2-3 天 | E1 |
| API 鉴权 | API key 机制 + 基础 rate limit | 1-2 天 | E2, F2 |

### 第四梯队：差异化亮点

| 项 | 做什么 | 工期 | 补齐项 |
|----|--------|------|--------|
| Insight Radio | TTS 生成音频摘要 + 播放器 UI | 3-4 天 | C1, G2 |
| Plan Mode 可编辑 | Agent Plan Review 阶段可调整人群/刺激物选择 | 2-3 天 | B1 |

### 第五梯队：企业化（签约后再做）

| 项 | 补齐项 |
|----|--------|
| Team 模型 + 鉴权 | F1, F3, F4, F5 |
| Team Memory | D7, D8 |
| AI Sage 专家 Agent | G1 |
| 社媒数据接入 | A8 |
| 企业数据源接入 | E3, E4 |
