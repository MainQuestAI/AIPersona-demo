# AIpersona — 竞品对标迭代方案 v2

日期：2026-04-12
对标竞品：Atypica.ai
范围：前后端全栈

---

## 一、核心判断

**我们不是"差很远"，而是"基础设施更厚、产品表达没跟上"。**

| 层次 | 我们的状态 | 判断 |
|------|----------|------|
| Runtime 基础设施 | Temporal + Agent + approval_gate + artifact + study_message | 比 Atypica 公开信号更完整 |
| 数据治理模型 | twin_version + persona_profile + source_lineage + benchmark_status | 比 Atypica 更企业级 |
| AI 研究能力 | 多轮 5-step IDI + 主题提取 + Replica Scoring + 推荐引擎 | 端到端真实可运行 |
| 产品表达层 | 审批流、版本链、成本透明、Persona 溯源全部藏在 DB 里 | **这是当前最大 gap** |

**下一步最高 ROI**：不是补新功能，而是**把已有能力表达出来**，同时补上 3 个 Atypica 有但我们缺的关键差异。

---

## 二、能力对比总表

| 维度 | Atypica | AIpersona（当前） | Gap 级别 |
|------|---------|------------------|----------|
| 研究执行闭环 | Plan → Execute → Deliver | 完整（Temporal + Agent + Artifact） | 无 gap |
| AI 定性访谈 | AI-Led Interviews | 多轮 5-step IDI（更深） | **我们更强** |
| 计划透明 / Plan Mode | 用户可查看/修改/确认 | auto-approve，用户跳过 | **P0 gap** |
| Persona 资产建设 | 上传访谈→生成→复用→对话 | 预制 seed data，无创建流程 | **P0 gap** |
| 执行过程可观测 | execution timeline + replay URL | agent messages 有进度但无持久时间线 | **P0 gap** |
| 成本透明 | 未公开 | DB 有 estimated/actual cost，前端未展示 | **P1 gap** |
| 审批治理 | Plan Mode 确认 | 三级 approval_gate（plan/midrun/artifact） | **我们更强，但没展示** |
| 版本治理 | 公开几乎未见 | study_plan_version 多版本链 | **我们更强，但没展示** |
| 多产物输出 | Report + Podcast + Share URL | HTML 报告有，无分享链接和音频 | **P1 gap** |
| Memory 系统 | Personal + Team + Automatic | 无 | **P2** |
| MCP / 外部接入 | 8 工具 MCP Server | 无 | **P2** |
| 团队协作 | Team seat + 共享记忆 | 单用户 demo | **P2** |

---

## 三、迭代分期

### 第一期：P0 — 表达层补齐 + 核心差异

**目标**：让 demo 从"有雏形"跳到"比 Atypica 更可信、更可治理"。
**工期**：3-4 天

| WP | 名称 | 工作量 | 核心改动 |
|----|------|--------|----------|
| WP-A | Agent Plan Review 环节 | 2h | 后端 start_agent 不再 auto-approve，先展示计划 |
| WP-B | Persona 创建轻流程 | 7h | 新端点 + LLM 提取 + 前端表单 |
| WP-C | 真实 Replay + 时间线 | 4h | Replay 读真实 artifact，ResultPanel 增加步骤耗时 |
| — | 端到端验证 | 2h | 完整跑通 11 步 demo 流程 |

### 第二期：P1 — 说服力增强

**目标**：展示治理优势 + 多产物交付能力。
**工期**：2-3 天

| WP | 名称 | 工作量 | 核心改动 |
|----|------|--------|----------|
| WP-D | 成本面板前置 | 1h | ResultPanel 完成态增加成本对比卡 |
| WP-E | 分享链接（只读视图） | 3h | 新端点返回精简 HTML，微信/邮件可直开 |
| WP-F | 报告样式增强 | 2h | `_build_report_html` 增加内联 CSS |
| WP-G | 审批链可视化 | 3h | 前端展示 approval_gate 记录 |

### 第三期：P2 — 平台能力（中期规划）

| WP | 名称 | 描述 |
|----|------|------|
| WP-H | Memory 系统 | 跨研究上下文沉淀 + 自动提取 |
| WP-I | MCP Server | 包装现有 API 为 MCP tools |
| WP-J | 团队协作 | User/Team 模型 + 鉴权 + 共享 |

---

## 四、第一期详细设计

### WP-A：Agent Plan Review 环节

#### 问题

当前 `POST /studies/{id}/agent/start`（routes.py:506-555）内部做了三件事：
1. 如果 plan_version 未审批 → auto-submit + auto-approve（跳过用户）
2. start_run(workflow_type="agent") → 直接启动 Temporal workflow
3. 写一条 agent message："正在准备研究执行环境..."

用户不知道 AI 准备做什么就开始跑了。这是与 Atypica Plan Mode 最大的差距。

#### 改造

**后端 `start_agent`**：
- 不再 auto-approve，不启动 workflow
- 读取 plan_version 配置信息（twins, stimuli, cost）
- 写一条 `action_request` 消息展示计划详情

```python
# start_agent 改为只展示计划
twin_versions = service.repository.get_twin_versions(twin_ids)
stimuli = service.repository.get_stimuli_by_ids(stimulus_ids)
twin_labels = ", ".join(tv["persona_profile_snapshot_json"].get("name", "?") for tv in twin_versions)
stimuli_names = ", ".join(s["name"] for s in stimuli)

service.repository.create_study_message(
    study_id, "agent",
    f"## 研究计划\n\n"
    f"**研究问题**：{bq}\n"
    f"**目标人群**：{len(twin_versions)} 个（{twin_labels}）\n"
    f"**刺激物**：{len(stimuli)} 个（{stimuli_names}）\n"
    f"**研究方法**：AI 深度访谈 ({len(twin_versions) * len(stimuli)} 场) + 多轮评分\n"
    f"**预计**：{est_calls} 次 AI 调用，约 {est_minutes} 分钟\n"
    f"**预算**：{estimated_cost} 元\n\n"
    f"请确认后开始执行。",
    message_type="action_request",
    metadata={"actions": ["开始执行", "调整配置"], "action_id": "confirm_plan"},
)
```

**后端 `reply_to_agent`**：增加 `confirm_plan` 处理分支
```python
if payload.action_id == "confirm_plan":
    # 走完整审批链
    service.submit_plan_for_approval(...)
    service.approve_plan(...)
    # 启动 workflow
    run = service.start_run(StartRunCommand(...), workflow_type="agent")
    return {"status": "started", "run_id": str(run["id"])}
```

**前端无需改动**：`AgentConversation` 已能渲染 `action_request` + 按钮。

#### 关键文件
- `apps/api/src/app/study_runtime/routes.py` — start_agent (L506), reply_to_agent (L410)
- `apps/api/src/app/study_runtime/service.py` — start_run, approve_plan
- `apps/api/src/app/study_runtime/repository.py` — get_twin_versions, get_stimuli_by_ids

---

### WP-B：Persona 创建轻流程

#### 问题

所有 twin/persona 来自预制 `seed_pack.py`。Atypica 的核心卖点是"上传访谈 PDF → 生成 Persona → 复用"。

#### 改造

**后端新端点** `POST /persona-profiles/generate`：
```python
class GeneratePersonaRequest(BaseModel):
    text: str = Field(min_length=50, max_length=50000)
    audience_label: str = Field(min_length=2, max_length=100)

@router.post("/persona-profiles/generate")
async def generate_persona(request: Request, payload: GeneratePersonaRequest, service = Depends(...)):
    # 1. 调用 LLM 提取 persona 维度
    profile_json = await _extract_persona_from_text(settings, payload.text, payload.audience_label)
    # 2. 创建 persona_profile → consumer_twin → twin_version
    result = service.repository.create_persona_chain(payload.audience_label, profile_json)
    return result
```

**LLM 提取**（复用 worker/llm.py 的 `chat_json_with_metadata`）：
```python
async def _extract_persona_from_text(settings, text, audience_label):
    prompt = f"""你是消费者研究专家。从以下访谈文本提取 {audience_label} 的消费者画像。
    
    访谈文本：
    {text[:8000]}
    
    返回 JSON：
    {{
      "name": "画像名称",
      "age_range": "年龄区间",
      "demographics": "人口统计",
      "behavioral": "行为特征",
      "psychological": "心理特征", 
      "needs_pain_points": "需求与痛点",
      "system_prompt": "用于模拟该消费者的 system prompt（第一人称，200字以内）"
    }}"""
    # 调用 DashScope
```

**Repository 新方法** `create_persona_chain`：
```sql
INSERT INTO target_audience (...) VALUES (...) RETURNING id;
INSERT INTO persona_profile (...) VALUES (...) RETURNING id;
INSERT INTO consumer_twin (...) VALUES (...) RETURNING id;
INSERT INTO twin_version (...) VALUES (...) RETURNING id;
```

**前端 consumer-twins-page.tsx**：
- 新增"创建孪生"按钮（glass-panel 展开表单）
- textarea（访谈文本）+ input（人群标签）+ submit 按钮
- POST `/persona-profiles/generate` → 刷新列表

#### 关键文件
- `apps/api/src/app/study_runtime/routes.py` — 新端点
- `apps/api/src/app/study_runtime/repository.py` — create_persona_chain
- `apps/web/src/app/pages/consumer-twins-page.tsx` — 创建表单
- `apps/web/src/app/services/studyRuntime.ts` — generatePersona 函数

---

### WP-C：真实 Replay + 执行时间线

#### 问题

1. ReplayModal 数据来自 `scenario.replay`（可能是 mock）
2. ResultPanel running 状态只有静态 4 点指示器，无实时耗时

#### 改造

**Replay 端到端验证**：
- 后端 `_build_replay_manifest` 已生成符合 `ReplayData` 类型的 manifest
- 确认 `buildArtifactScenarioBundle` 在 replay artifact 存在时正确映射
- 如有不匹配则修复映射逻辑

**ResultPanel running 态增强**（result-panel.tsx:146-180）：
```tsx
// 从 projection.current_run.steps 读取真实时间戳
const steps = projection.current_run?.steps ?? [];
// 已有 STAGE_ORDER，增加耗时计算
const stepData = steps.find(s => s.step_type === stage.type);
const elapsed = stepData?.started_at && stepData?.ended_at
  ? formatDuration(stepData.started_at, stepData.ended_at)
  : stepData?.started_at ? '进行中...' : null;
// 渲染：阶段名 · 耗时
```

**RunStepSummary 类型扩展**（studyRuntime.ts:34-37）：
```typescript
export type RunStepSummary = {
  step_type?: string | null;
  status?: string | null;
  started_at?: string | null;  // 新增
  ended_at?: string | null;    // 新增
};
```

#### 关键文件
- `apps/web/src/features/results/components/result-panel.tsx` — running 状态 (L146-180)
- `apps/web/src/app/services/workbenchRuntimeBridge.ts` — buildArtifactScenarioBundle
- `apps/web/src/app/services/studyRuntime.ts` — RunStepSummary type
- `apps/api/src/app/study_runtime/projections.py` — workbench projection 是否包含 step timestamps

---

## 五、第二期设计摘要

### WP-D：成本面板
- ResultPanel 完成态增加 `CostSummaryCard`
- 数据：`projection.cost_summary.{estimated_cost, actual_cost, total_prompt_tokens, total_completion_tokens}`
- 格式："预算 ¥88.50 / 实际 ¥23.10 · 5,098 tokens"

### WP-E：分享链接
- `GET /studies/{id}/share` → 精简 HTML 页面（结论+排名+置信度）
- 无需鉴权，静态渲染
- 前端在 agent post_study action 中增加"复制分享链接"

### WP-F：报告样式
- `_build_report_html` 增加内联 CSS
- MQDS 暗色风格 + 表格 + 成本摘要

### WP-G：审批链可视化
- Workbench 详情面板展示 approval_gate 时间线
- "计划审批 → 中途审核 → 研究完成"三节点

---

## 六、端到端验证脚本

完成第一期后，应能跑通：

| # | 操作 | 预期 | WP |
|---|------|------|-----|
| 1 | Consumer Twins 页粘贴访谈文本 | LLM 生成 → Twin 出现 | B |
| 2 | Dashboard → 新建研究 | 跳转 Workbench | A |
| 3 | 看到 agent 发来的计划卡片 | 人群/刺激物/预算/时间 | A |
| 4 | 点击"开始执行" | approval_gate → workflow 启动 | A |
| 5 | agent 发 IDI 进度 | 实时更新 | 已实现 |
| 6 | 每完成 IDI → 发摘录 | ResultPanel 显示步骤耗时 | C |
| 7 | 定性完成 → "继续评估？" | 中途审核 | 已实现 |
| 8 | 点击"继续评估" | quant 开始 | 已实现 |
| 9 | 推荐结论卡片 | card 渲染 | 已实现 |
| 10 | "查看研究回放" | 真实 stages | C |
| 11 | ResultPanel 完成态 | 排名+主题 | 已实现 |

---

## 七、我们的竞争定位

完成第一期后，我们相对 Atypica 的差异化叙事：

> **Atypica 做的是"AI 研究 Agent 模拟消费者"。我们做的是"可审批、可追踪、可治理的企业级 AI 消费者研究运行时"。**

具体优势：
1. **更强审批**：三级 approval_gate + 中途审核 + 预算锁定
2. **更深访谈**：多轮 5-step IDI（不是单轮问答）
3. **更透明成本**：每个 artifact 独立追踪 token 消耗
4. **更可信资产**：twin_version + source_lineage + benchmark_status
5. **更可控过程**：Plan Review → 确认 → 执行 → 中途审核 → 完成，每步用户都知情
