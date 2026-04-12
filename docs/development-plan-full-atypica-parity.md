# AIpersona — 全面对标 Atypica 开发计划

## Context

**来源**：`docs/gap-checklist-vs-atypica.md` 列出了 37 个功能差距项（24 完全缺失 / 8 部分缺失 / 2 有基础未表达 / 2 已补齐），其中 11 个高杀伤力。本计划将这些差距转化为可执行的开发工作包，按 ROI 分 5 个阶段。

**目标**：从当前 55-60% 的功能对标度，经过 Phase 1-3 达到 85%+，形成"比 Atypica 更可信、更可治理"的差异化叙事。

**约束**：后端在远程服务器（100.75.231.2），前端本地开发。Temporal workflow + PostgreSQL + DashScope LLM 已部署。

---

## Phase 1: Persona 资产闭环（补齐 A1/A4/A5/A6/A7）

**做完能回答**："你的消费者从哪来？"
**预计工期**：5-7 天
**对标提升**：55% → 70%

### WP-1A: PDF 上传 → Persona 生成（补 A1）

当前只有粘贴文本的 `POST /persona-profiles/generate`。需要支持文件上传。

**后端改动**：
- `routes.py` — 新增 `POST /persona-profiles/upload` 端点
  - 接受 `multipart/form-data`（PDF 文件 + audience_label）
  - 用 `PyPDF2` 或 `pdfplumber` 提取文本
  - 复用现有 `generate_persona` 的 LLM 提取逻辑
  - 依赖：`pip install pdfplumber`（轻量级，比 PyPDF2 对中文支持更好）

**前端改动**：
- `consumer-twins-page.tsx` — 在现有创建表单中增加文件上传区
  - 两种输入模式：粘贴文本 / 上传 PDF（tab 切换）
  - 上传后显示提取中 spinner，完成后刷新列表
- `studyRuntime.ts` — 新增 `uploadPersonaPDF(file, audienceLabel)` 函数（FormData）

**关键文件**：
- `apps/api/src/app/study_runtime/routes.py`
- `apps/web/src/app/pages/consumer-twins-page.tsx`
- `apps/web/src/app/services/studyRuntime.ts`

### WP-1B: 与 Persona 独立对话（补 A4）

Atypica 允许脱离研究场景与 Persona 聊天。我们的 IDI 只在研究执行中运行。

**后端改动**：
- `routes.py` — 新增 `POST /persona-profiles/{profile_id}/chat` 端点
  - 读取 persona_profile.profile_json.system_prompt
  - 使用 DashScope 调用 LLM，system prompt 设为该 persona 的 system_prompt
  - 支持 history 多轮对话（复用 `chat_with_study` 的模式）

**前端改动**：
- 新增 `apps/web/src/app/pages/persona-chat-page.tsx`
  - 路由 `/persona/:profileId/chat`
  - 简单对话 UI：左侧 persona 卡片（头像+标签），右侧聊天气泡
  - PromptComposer 复用
- `consumer-twins-page.tsx` — 每个 twin 卡片增加"与孪生对话"按钮，跳转到 chat 页
- `routes.tsx` — 新增路由

**关键文件**：
- `apps/api/src/app/study_runtime/routes.py`
- `apps/web/src/app/pages/persona-chat-page.tsx`（新建）
- `apps/web/src/app/pages/consumer-twins-page.tsx`
- `apps/web/src/app/routes.tsx`

### WP-1C: Persona 浏览器 + 搜索（补 A5）

当前 consumer-twins-page 只有平铺列表，无搜索/筛选。

**前端改动**：
- `consumer-twins-page.tsx` — 增强为完整 Persona 浏览器
  - 顶部搜索框（按名称/人群标签过滤）
  - 维度标签筛选（研究类型：概念筛选/命名测试/...）
  - 卡片展开详情（demographics, behavioral, psychological 等维度）
  - 视觉增强：persona 头像（已有 hue-based avatar），维度标签
- `studyRuntime.ts` — `listConsumerTwins` 已存在，搜索在前端做（数据量小）

### WP-1D: 跨研究复用 + Twin 选择器（补 A6）

DB 已支持 twin 绑定多个 study，但前端 `createDemoStudy` 硬编码使用所有 seed twins。

**前端改动**：
- 新增 `apps/web/src/features/workbench/components/twin-selector-modal.tsx`
  - 弹窗列出所有可用 twins（含搜索）
  - checkbox 多选
  - 确认后传入 `createDemoStudy` 的 `twinVersionIds` 参数
- `dashboard-page.tsx` — "新建研究"流程改为：先选 twins → 再创建
- `studies-page.tsx` — 同上

**已有基础**：`createDemoStudy` 已接受 `options.twinVersionIds` 参数（studyRuntime.ts:391），只需前端传入。

### WP-1E: 预置 Demo Persona 库（补 A7）

当前只有 2 个 seed persona。需要扩展到 20+ 个。

**后端改动**：
- `seed_pack.py` — 扩展 `SEED_PERSONA_PROFILES` / `SEED_CONSUMER_TWINS` / `SEED_TWIN_VERSIONS`
  - 新增 18 个 persona（覆盖不同人群：孕期女性/新手妈妈/职场宝妈/95后妈妈/二胎妈妈/高知妈妈/...）
  - 每个包含完整 profile_json（name, age_range, demographics, behavioral, psychological, system_prompt）
  - 对应的 target_audience + consumer_twin + twin_version
- `repository.py` — `bootstrap_seed_assets` 已有 upsert 逻辑，扩展数据即可

---

## Phase 2: Memory 系统（补齐 D3/D4/D6）

**做完能回答**："下次研究能记住上次的发现吗？"
**预计工期**：3-4 天
**对标提升**：70% → 78%

### WP-2A: Memory DB Schema

**新建 migration**：`infra/sql/migrations/005_memory.up.sql`

```sql
CREATE TABLE IF NOT EXISTS study_memory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  study_id uuid NOT NULL REFERENCES study(id),
  memory_type text NOT NULL CHECK (memory_type IN (
    'theme', 'preference', 'insight', 'brand_positioning', 'segment_finding'
  )),
  key text NOT NULL,
  value text NOT NULL,
  confidence numeric(3,2) DEFAULT 0.8,
  extracted_at timestamptz NOT NULL DEFAULT now(),
  superseded_by uuid NULL REFERENCES study_memory(id)
);
CREATE INDEX idx_study_memory_type ON study_memory(memory_type, extracted_at DESC);
```

### WP-2B: 自动提取 Memory（补 D6）

Agent 研究完成后自动从 artifacts 提取记忆。

**后端改动**：
- `agent.py` — 在 `run_midrun_to_complete` 的 wrap-up 阶段（line 323-332 之后）增加 memory extraction
  - 调用 LLM：输入 qual_themes + recommendation + ranking → 提取 key findings
  - 写入 study_memory 表（types: theme, insight, segment_finding）
  - Post agent message："已自动提取 N 条研究记忆"

### WP-2C: 记忆注入新研究（补 D3/D4）

新研究启动时，agent 自动引用历史记忆。

**后端改动**：
- `routes.py` `start_agent` — 在发送 plan review 消息前，查询 study_memory 表
  - 按 memory_type 分组，取最近 10 条
  - 如果有历史记忆，在计划消息中追加"历史发现"段落
- `agent.py` `run_plan_to_midrun` — IDI 访谈的 system prompt 中注入相关 memory

### WP-2D: Memory 前端面板

**前端改动**：
- `studyRuntime.ts` — 新增 `listStudyMemories()` API 函数
- `routes.py` — 新增 `GET /memories` 端点
- Workbench 详情面板 — 在审批链下方增加"研究记忆"折叠区
- Dashboard — 显示"已积累 N 条研究记忆"统计

---

## Phase 3: 产品完成度 + 差异化亮点（补齐 B1/C1/C2/H6-H8）

**做完后**：演示路径无死角，差异化亮点可感知。
**预计工期**：5-6 天
**对标提升**：78% → 88%

### WP-3A: Plan Mode 可编辑（补 B1）

当前 Plan Review 只能确认，不能调整。

**后端改动**：
- `routes.py` `reply_to_agent` — 增加 `action_id == "edit_plan"` 分支
  - 接受 payload: `{twin_version_ids: string[], stimulus_ids: string[]}`
  - 创建新的 study_plan_version（version_no + 1）
  - 重新发送 plan review 消息
- `start_agent` — plan review 消息增加"调整配置"按钮

**前端改动**：
- `agent-conversation.tsx` — `action_request` 中如果 `action_id == "confirm_plan"`，渲染一个"调整配置"链接
  - 点击打开 twin-selector-modal（复用 WP-1D）+ stimulus 选择器
  - 确认后 postAgentReply 带新 ids

### WP-3B: Insight Radio / AI Podcast（补 C1/G2）

Atypica 的差异化亮点。

**后端改动**：
- `routes.py` — 新增 `POST /studies/{id}/podcast` 端点
  - 从 recommendation + qual_themes 生成播客脚本（LLM）
  - 调用 TTS API 生成音频（DashScope TTS 或 OpenAI TTS）
  - 存储为 artifact（type: podcast, format: audio/mp3）
  - 返回音频 URL
- `agent.py` — 研究完成后 post_study actions 增加"生成播客"

**前端改动**：
- 新增 `apps/web/src/features/results/components/podcast-player.tsx`
  - 简单的音频播放器（进度条 + 播放/暂停 + 下载）
- ResultPanel 完成态 — 增加 podcast 入口
- Workbench — agent "生成播客" action 触发后，显示播放器

### WP-3C: Replay URL 公开化（补 C2）

当前 replay 只有 modal。

**后端改动**：
- `routes.py` — 新增 `GET /studies/{id}/replay` 端点
  - 类似 share，返回独立 HTML 页面（暗色风格）
  - 展示 replay stages 的输入/输出/决策
  - 无需登录

### WP-3D: CTA 占位修复（补 H6/H7）

**前端改动**：
- `compare-placeholder.tsx` — "查看详情"按钮改为跳转到 workbench + focus=trust
  - "导出"按钮改为下载 CSV（从 ranking 数据生成）
- `twins-placeholder.tsx` — "与孪生对话"按钮改为跳转到 persona chat 页（WP-1B）
  - "配置参数"移除或改为展开详情
- `stimulus-library-page.tsx` — "导入"按钮改为触发文件上传（可接 asset_manifest 表）

### WP-3E: Mock Fallback 清理（补 H8）

**前端改动**：
- `workbenchRuntimeBridge.ts` — `getPitchScenarioBundle` (line 985-991)
  - 当 `buildArtifactScenarioBundle` 返回 null 时，不再 fallback 到 mock scenario
  - 改为返回一个 empty/skeleton DemoScenarioBundle
  - 所有引用 scenario 的地方已经有 fallback 处理
- 可删除 `mocks/` 目录下的文件（或保留仅供测试用）

---

## Phase 4: 平台接入（补齐 E1/E2）

**做完能回答**："能接入我们的系统吗？"
**预计工期**：3-4 天
**对标提升**：88% → 92%

### WP-4A: MCP Server（补 E1）

**新建**：`apps/mcp/` 目录

- 基于 `fastmcp` 框架创建 MCP Server
- 包装 6 个核心 API 为 MCP tools：
  - `aipersona_study_create` — 创建研究
  - `aipersona_study_messages` — 获取 agent 对话
  - `aipersona_study_reply` — 回复 agent
  - `aipersona_persona_search` — 搜索 persona
  - `aipersona_persona_chat` — 与 persona 对话
  - `aipersona_study_report` — 获取研究报告
- MCP endpoint: `/mcp/study`

### WP-4B: API Key 鉴权（补 E2/F2）

**后端改动**：
- 新建 migration `006_api_keys.up.sql`：api_key 表（key_hash, owner, scope, created_at）
- `routes.py` — 增加 API key 中间件（读 `X-API-Key` header）
- 分两个 scope：`public`（share/replay 页面无需 key）和 `api`（所有其他端点需要 key）
- 提供一个 admin 端点生成 key

---

## Phase 5: 企业化（签约后，补齐 F1/F3-F5/D7-D8/G1/A8/E3-E4）

**预计工期**：按需
**对标提升**：92% → 95%+

### WP-5A: Team 模型
- 新增 `user` / `team` / `team_member` 表
- 登录/注册流程
- approval_gate.approved_by 关联真实 user
- 共享 twin 库 + 共享研究

### WP-5B: Team Memory（补 D7/D8）
- study_memory 增加 team_id 字段
- 团队级记忆跨 study 共享

### WP-5C: AI Sage 专家 Agent（补 G1）
- 新产品入口：知识导入 → 分析 → 咨询
- 复用 persona chat 模式，system_prompt 换成专家知识

### WP-5D: 社媒数据接入（补 A8）
- 小红书/抖音公开数据抓取（需要评估合规性）
- 从社媒文本批量生成 persona

### WP-5E: 企业数据接入（补 E3/E4）
- Jupyter notebook 集成
- 私有 API 连接器
- Custom skill 框架

---

## 实施时间线

```
Phase 1 — Persona 资产闭环（5-7 天）
  WP-1E  预置 20+ demo persona        后端 3h
  WP-1C  Persona 浏览器 + 搜索        前端 4h
  WP-1A  PDF 上传 → 生成              后端 3h + 前端 2h
  WP-1B  与 Persona 独立对话          后端 2h + 前端 4h
  WP-1D  跨研究复用 Twin 选择器       前端 3h
  验证                                2h

Phase 2 — Memory 系统（3-4 天）
  WP-2A  Memory DB Schema             后端 0.5h
  WP-2B  自动提取 Memory              后端 3h
  WP-2C  记忆注入新研究               后端 2h
  WP-2D  Memory 前端面板              前端 3h
  验证                                1.5h

Phase 3 — 产品完成度 + 亮点（5-6 天）
  WP-3A  Plan Mode 可编辑             后端 2h + 前端 3h
  WP-3B  Insight Radio / Podcast      后端 4h + 前端 3h
  WP-3C  Replay URL 公开化            后端 2h
  WP-3D  CTA 占位修复                 前端 3h
  WP-3E  Mock Fallback 清理           前端 2h
  验证                                2h

Phase 4 — 平台接入（3-4 天）
  WP-4A  MCP Server                   后端 5h
  WP-4B  API Key 鉴权                 后端 3h
  验证                                2h

Phase 5 — 企业化（按需）
  WP-5A-5E  各项按签约后排期
```

---

## Gap 覆盖映射

| Gap ID | 描述 | WP | Phase |
|--------|------|-----|-------|
| A1 | PDF 上传生成 Persona | WP-1A | 1 |
| A2 | 7 维度画像（补 3 维度） | WP-1E（扩展 profile_json） | 1 |
| A3 | Persona 追访 | WP-1B（对话即追访） | 1 |
| A4 | 与 Persona 独立对话 | WP-1B | 1 |
| A5 | Persona 搜索和浏览 | WP-1C | 1 |
| A6 | 跨研究复用 | WP-1D | 1 |
| A7 | 大规模 Persona 库 | WP-1E | 1 |
| A8 | 社媒数据生成 Persona | WP-5D | 5 |
| B1 | Plan Mode 可编辑 | WP-3A | 3 |
| B2 | 团队协作审阅 | WP-5A | 5 |
| B3 | Human Interviews | 不做（AI 是差异化） | — |
| B4 | Smart Analytics | WP-1A（PDF 解析）+ WP-2B（memory 提取） | 1+2 |
| C1 | AI Podcast | WP-3B | 3 |
| C2 | Replay URL | WP-3C | 3 |
| D1 | User Profile 记忆 | WP-2B/2C | 2 |
| D2 | Research Preferences | WP-2B/2C | 2 |
| D3 | 跨研究上下文关联 | WP-2C | 2 |
| D4 | Recurring Themes | WP-2B | 2 |
| D5 | Brand Positioning | WP-2B | 2 |
| D6 | Automatic Extraction | WP-2B | 2 |
| D7 | Memory 版本控制 | WP-5B | 5 |
| D8 | Team Memory | WP-5B | 5 |
| E1 | MCP Server | WP-4A | 4 |
| E2 | API 鉴权 | WP-4B | 4 |
| E3 | 企业数据接入 | WP-5E | 5 |
| E4 | Custom Skills | WP-5E | 5 |
| F1-F5 | Team 模型 | WP-5A | 5 |
| G1 | AI Sage | WP-5C | 5 |
| G2 | Insight Radio | WP-3B | 3 |
| G3 | Interview 独立入口 | WP-1B（persona chat 即 interview） | 1 |
| G4 | Persona 独立入口 | WP-1C | 1 |
| G5 | Featured Studies | WP-3D（可在 dashboard 增加） | 3 |
| H5 | Python CI 闸门 | Phase 1 开始时顺手配 | 1 |
| H6 | CTA 占位修复 | WP-3D | 3 |
| H7 | 导入功能真实化 | WP-3D | 3 |
| H8 | Mock Fallback 清理 | WP-3E | 3 |

**覆盖率**：37 个 gap 中，Phase 1-4 覆盖 31 个（84%），Phase 5 覆盖 6 个（16%）。B3（Human Interviews）明确不做。

---

## 验证标准

### Phase 1 完成后验证
1. Consumer Twins 页显示 20+ persona，可搜索/筛选
2. 上传 PDF → 自动生成新 persona → 出现在列表中
3. 点击"与孪生对话" → 进入独立对话页 → persona 按 system_prompt 回答
4. 新建研究时可选择任意 twins 组合
5. TypeScript 0 错误 + vitest 全通过

### Phase 2 完成后验证
1. 完成一次研究后 → agent 发出"已提取 N 条记忆"
2. 创建第二个研究 → plan review 消息包含"历史发现"段落
3. Workbench 详情面板可展开看到研究记忆列表

### Phase 3 完成后验证
1. Plan Review 可点"调整配置" → 选择不同 twins → 重新生成计划
2. 研究完成后可生成 AI 播客 → 播放器可播放
3. `/studies/{id}/replay` 可在浏览器直接打开
4. Compare/Twins 页的 CTA 不再是 toast
5. 无 mock fallback 数据渲染

### Phase 4 完成后验证
1. MCP endpoint 可被 Claude Code 调用
2. 无 API key 的请求被拒绝（share/replay 页面除外）
