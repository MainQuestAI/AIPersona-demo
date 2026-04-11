# AIpersona Demo — 对话式 Agent 改造迭代计划

## Context

**为什么做这个改造**：当前的"对话线程"是预制卡片的播放器，不是真正的对话。AI 不主动引导，不实时汇报，流程转换靠硬编码的按钮触发。这直接导致 3 个 Critical 流程断裂（draft 无法提交审批、审批后无法启动、执行期间 5-8 分钟空白）。Atypica 的竞品分析验证了对话式交互才是正确方向。

**交付目标**：用 seed 数据（2 twins × 3 stimuli）完成一次端到端的对话式 AI 调研演示。全程由 AI Agent 实时引导对话，不出现流程断裂、空白等待或 mock 痕迹。

**改造范围**：前后端一起改。后端从固定 3-activity workflow 改为 agent-driven 的细粒度 activity 链，每步完成即推送消息。前端从卡片播放器改为消费实时消息流的对话界面。

---

## 核心架构变化

### 当前架构

```
前端 → POST /studies (创建) → POST /approve → POST /runs (启动 Temporal)
       → Temporal: mark_running → advance_to_midrun_review(整块执行) → wait_signal → complete_study_run(整块执行)
前端 ← 轮询 projection → buildConversationEventsFromArtifacts → 一次性渲染全部卡片
```

### 目标架构

```
前端 → POST /studies/{id}/agent/start (启动 agent 对话)
       → 后端 agent loop: 每执行一步就写一条 agent_message 到 DB
       → 需要用户决策时，写一条带 actions 的 message 等待回复
前端 ← GET /studies/{id}/agent/messages?after={last_id} (轮询新消息)
前端 → POST /studies/{id}/agent/reply (用户回复 agent 的提问)
```

关键差异：
1. **消息存 DB**：不再从 artifacts 临时构建 conversation events，而是 agent 每步写入 `study_message` 表
2. **Agent 主导流程**：agent 决定何时做 IDI、何时请求审批、何时评分，不再是固定的 3-activity 硬编码
3. **增量推送**：每完成一次 IDI 就写一条消息，用户能实时看到进度
4. **用户回复驱动**：审批、确认、追问统一通过 `agent/reply` 端点

---

## WP-1：DB Schema — study_message 表

**新建 migration**: `infra/sql/migrations/004_study_messages.up.sql`

```sql
CREATE TABLE IF NOT EXISTS study_message (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  study_id   uuid NOT NULL REFERENCES study(id),
  role       text NOT NULL CHECK (role IN ('agent', 'user', 'system')),
  content    text NOT NULL DEFAULT '',
  message_type text NOT NULL DEFAULT 'text'
    CHECK (message_type IN (
      'text',              -- 普通文本消息
      'action_request',    -- agent 请求用户操作（含 actions JSON）
      'action_response',   -- 用户对 action_request 的回复
      'progress',          -- 进度更新（如 "访谈 3/6 完成"）
      'card',              -- 结构化卡片（qual_session / recommendation / etc）
      'error'              -- 错误消息
    )),
  metadata_json jsonb DEFAULT '{}',
  -- metadata 存放结构化数据：
  --   action_request: {"actions": ["批准", "修改"], "action_id": "xxx"}
  --   card: {"card_type": "qual_session", "data": {...}}
  --   progress: {"phase": "qual", "current": 3, "total": 6}
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_study_message_study_id ON study_message(study_id, created_at);
```

不改现有表。`study_message` 是独立的消息流，与 `artifact`（研究产物）、`study_run`（执行记录）并存。

---

## WP-2：后端 — Agent Orchestrator

**新文件**: `apps/worker/src/worker/agent.py`

Agent 不是 LLM agent（不用 function calling 框架），是一个**确定性的状态机 + LLM 调用**。每一步做什么是确定的，但每一步的输出和对话内容由 LLM 生成。

```python
class StudyAgent:
    """Orchestrates a study run as a conversation."""
    
    def __init__(self, study_id: str, run_id: str):
        self.study_id = study_id
        self.run_id = run_id
    
    def post_message(self, role, content, message_type='text', metadata=None):
        """Write a message to study_message table."""
        # INSERT INTO study_message ...
    
    def run_study(self):
        """Main agent loop — called by Temporal activity."""
        context = self._load_context()
        twins = self._load_twins(context)
        stimuli = self._load_stimuli(context)
        
        # Phase 1: Greet + confirm plan
        self.post_message('agent',
            f'我已准备好研究计划：{len(twins)} 个目标人群 × {len(stimuli)} 个刺激物概念。\n'
            f'研究问题：{context["business_question"]}\n'
            f'预计 {len(twins) * len(stimuli) * 5 + 10} 次 AI 调用，约 {估算分钟} 分钟。',
            message_type='action_request',
            metadata={'actions': ['开始执行', '调整配置'], 'action_id': 'confirm_plan'}
        )
        # → wait for user reply (via Temporal signal)
        
        # Phase 2: IDI interviews (incremental)
        for i, (twin, stimulus) in enumerate(product(twins, stimuli)):
            self.post_message('agent',
                f'正在访谈：{twin["name"]} × {stimulus["name"]}',
                message_type='progress',
                metadata={'phase': 'qual', 'current': i+1, 'total': len(twins)*len(stimuli)}
            )
            interview = self._run_idi_interview(twin, stimulus, context)
            self.post_message('agent',
                f'**{twin["name"]}** 对 **{stimulus["name"]}** 的看法：\n> {interview["response"][:200]}...',
                message_type='text'
            )
        
        # Phase 3: Theme extraction
        self.post_message('agent', '正在提取定性主题...', message_type='progress', ...)
        themes = self._extract_themes(interviews, context)
        self.post_message('agent',
            f'定性阶段完成。发现 {len(themes["themes"])} 个核心主题：{", ".join(themes["themes"])}',
            message_type='card',
            metadata={'card_type': 'qual_summary', 'data': themes}
        )
        # Write qual_transcript artifact (for result panel)
        self._write_artifact('qual_transcript', {...})
        
        # Phase 4: Midrun review
        self.post_message('agent',
            '定性探索已完成。以下是关键发现：\n'
            + theme_summary + '\n\n'
            '是否继续进入 AI 综合评估？',
            message_type='action_request',
            metadata={'actions': ['继续评估', '暂停调整'], 'action_id': 'midrun_review'}
        )
        # → wait for user reply
        
        # Phase 5: Replica scoring (incremental)
        for round_no in range(replicas):
            self.post_message('agent', f'评分轮次 {round_no+1}/{replicas}...',
                message_type='progress', ...)
            # ... run scoring
        
        # Phase 6: Recommendation
        recommendation = self._generate_recommendation(...)
        self.post_message('agent',
            f'## 推荐结论\n\n'
            f'**{recommendation["winner"]}** 是当前最值得推进的方案。\n\n'
            f'{recommendation["supporting_text"]}\n\n'
            f'置信度：{recommendation["confidence_label"]}',
            message_type='card',
            metadata={'card_type': 'recommendation', 'data': recommendation}
        )
        self._write_artifact('recommendation', recommendation)
        
        # Phase 7: Wrap up
        self.post_message('agent',
            '研究已完成。你可以：',
            message_type='action_request',
            metadata={'actions': ['下载报告', '查看详细对比', '继续追问'], 'action_id': 'post_study'}
        )
```

### Temporal Workflow 改造

**文件**: `apps/worker/src/worker/workflows/study_workflow.py`

Workflow 改为只有一个主 activity `run_study_agent`，内部由 agent 状态机驱动：

```python
class StudyWorkflow:
    async def run(self, payload):
        # Phase 1: run until first user decision point
        await execute_activity(run_study_agent_phase, {"phase": "plan_to_midrun", ...})
        
        # Wait for midrun approval signal
        await wait_condition(lambda: self._resume_requested)
        
        # Phase 2: run from midrun to completion
        await execute_activity(run_study_agent_phase, {"phase": "midrun_to_complete", ...})
```

实际上可以更简单——把 workflow 拆成 2 个 activity（midrun 之前 + 之后），agent 在每个 activity 内部自己发消息。Signal 机制不变。

---

## WP-3：后端 — Agent API 端点

**文件**: `apps/api/src/app/study_runtime/routes.py`

新增 3 个端点：

```python
@router.get("/studies/{study_id}/agent/messages")
async def get_agent_messages(
    study_id: str,
    after: str | None = None,  # 上次拿到的最后一条 message id
    service = Depends(get_service),
):
    """Poll for new agent messages."""
    messages = service.get_study_messages(study_id, after_id=after)
    return {"messages": messages}

@router.post("/studies/{study_id}/agent/reply")
async def reply_to_agent(
    study_id: str,
    payload: AgentReplyRequest,  # {action_id: str, action: str, comment?: str}
    service = Depends(get_service),
):
    """User replies to an agent action_request."""
    # 1. Write user message to study_message
    # 2. If action triggers run start → start Temporal workflow
    # 3. If action triggers midrun resume → send Temporal signal
    # 4. If action is chat → call LLM with message history from study_message
    return {"status": "ok"}

@router.post("/studies/{study_id}/agent/start")
async def start_agent(
    study_id: str,
    service = Depends(get_service),
):
    """Initialize agent conversation for a study."""
    # Agent posts initial greeting message
    # Then waits for user to confirm plan
    return {"status": "started"}
```

### Chat 统一到 agent/reply

当前独立的 `POST /studies/{id}/chat` 端点合并到 `agent/reply` 中。当 `action_id` 为空时，视为自由追问。

---

## WP-4：前端 — 对话式 Workbench

**核心改造**：`WorkbenchPage` 不再从 `buildConversationEventsFromArtifacts` 构建事件，而是从 `GET /agent/messages` 拉取真实消息。

### 新的消息渲染

**文件**: `apps/web/src/features/workbench/pages/workbench-page.tsx`

```typescript
// 替换 baseEvents + extraEvents + playback 机制
const [messages, setMessages] = useState<AgentMessage[]>([]);

// 轮询新消息
useEffect(() => {
  const lastId = messages[messages.length - 1]?.id;
  const interval = setInterval(async () => {
    const { messages: newMsgs } = await fetchAgentMessages(studyId, lastId);
    if (newMsgs.length > 0) {
      setMessages(prev => [...prev, ...newMsgs]);
    }
  }, 2000);
  return () => clearInterval(interval);
}, [studyId, messages.length]);
```

### 消息类型渲染

| message_type | 渲染方式 |
|---|---|
| `text` | agent: 左侧 glass-panel 文本卡片；user: 右侧紫色气泡 |
| `action_request` | glass-panel + 底部按钮行（从 metadata.actions 渲染） |
| `action_response` | 右侧气泡，显示用户选择的 action |
| `progress` | 紧凑的进度条 + 当前步骤文字 |
| `card` | 根据 metadata.card_type 渲染专用卡片（qual_summary / recommendation 等） |
| `error` | danger 样式的 glass-panel |

### 用户交互

```typescript
// 点击 action 按钮
async function handleAction(actionId: string, action: string) {
  await postAgentReply(studyId, { action_id: actionId, action });
}

// 自由输入
async function handleSend(message: string) {
  await postAgentReply(studyId, { action_id: '', action: message });
}
```

### 移除的东西

- `buildConversationEventsFromArtifacts` → 不再需要
- `buildConversationEventsForProjection` → 不再需要
- playback 机制（visibleCount / isPaused / PAUSE_EVENT_TYPES）→ 消息自然流入
- mock scenario 的 conversationEvents → 不再需要

### 保留的东西

- ResultPanel（右侧结果面板）→ 继续从 projection.artifacts 读取
- Compare / Twins / Trust / Replay 页面 → 不变
- DrawerShell / ModalShell → 不变
- PromptComposer → 不变，但 onSend 改为 postAgentReply

---

## WP-5：前端 — 视觉 + 布局修复

把之前记录的所有 P0/P1 问题一并修掉。

### P0（必修）

| ID | 修复 |
|----|------|
| L-01+L-02 | `route.ts` 的 label 改为中文；`app-shell.tsx` header 用中文 label |
| L-05 | Dashboard 文案改为"欢迎回来，这是您的研究工作台概览" |
| L-07+V-09 | Study 卡片去掉 `Study #UUID`，直接用 business_question 做标题 |
| V-04 | `.eyebrow` 中文模式去掉 `text-transform: uppercase`，letter-spacing 收紧到 `0.06em` |
| L-03 | Header sub-bar 去掉 UUID monospace 显示 |

### P1（建议修）

| ID | 修复 |
|----|------|
| L-04 | 非 study 页面时 header sub-bar 不重复 Rail 导航 |
| L-06 | Studies 页"创建"改为打开配置面板或跳转到空状态 |
| L-11 | Calibration Center 加"即将上线"友好占位 |
| V-05 | `btn-accent` 改为 ghost 轮廓样式（区分 btn-primary 实心） |
| V-06 | QuantRanking 的 confidenceLabel 文字颜色跟随 ScoreBar |
| V-08 | Dashboard 4 个统计改为紧凑 stat-row |
| V-11 | Drawer 内减少 inner-card 嵌套（methodology/evidence 改为 flat list） |
| J-06 | `_build_report_html` 增加内联 CSS 样式 |

---

## WP-6：Persona 可视化增强

受 Atypica 启发，增强 twin persona 的展示。

### QualSessionCard 改造

当前 excerpts 只有 `speakerLabel` + `lines`。改为：
- 显示 persona 头像占位（首字母圆形 + 颜色）
- 显示年龄/职业标签
- 多轮 transcript 按 interviewer/respondent 交替渲染

### 访谈观点对比

在 Compare 页面增加"按问题分组"的观点对比视图：
- 同一个问题下，不同 persona 的回答并排展示
- 底部显示关键词标签

数据来源：`qual_transcript` artifact 的 `interviews[].transcript` 数组。

---

## 实现顺序

```
WP-1  DB migration（study_message 表）           30 分钟
  ↓
WP-2  后端 Agent Orchestrator                     4-6 小时
  ↓
WP-3  后端 Agent API 端点                         1-2 小时
  ↓
WP-4  前端对话式 Workbench                        4-6 小时
  ↓
WP-5  视觉 + 布局修复（P0 + P1 全部）             2-3 小时
  ↓
WP-6  Persona 可视化增强                          2-3 小时
  ↓
端到端验证 + 修复                                  2-3 小时
```

**总计约 3-4 天**

---

## 关键文件清单

| 文件 | WP | 操作 |
|------|-----|------|
| `infra/sql/migrations/004_study_messages.up.sql` | WP-1 | **新建** |
| `apps/worker/src/worker/agent.py` | WP-2 | **新建** |
| `apps/worker/src/worker/activities/study_runtime.py` | WP-2 | 修改（agent 调用现有 _run_idi_interview 等函数） |
| `apps/worker/src/worker/workflows/study_workflow.py` | WP-2 | 修改（简化为 2 activity + signal） |
| `apps/api/src/app/study_runtime/routes.py` | WP-3 | 修改（新增 3 个 agent 端点） |
| `apps/api/src/app/study_runtime/repository.py` | WP-3 | 修改（新增 message CRUD） |
| `apps/web/src/app/services/studyRuntime.ts` | WP-4 | 修改（新增 fetchAgentMessages / postAgentReply） |
| `apps/web/src/features/workbench/pages/workbench-page.tsx` | WP-4 | **重写核心逻辑** |
| `apps/web/src/app/services/workbenchRuntimeBridge.ts` | WP-4 | 修改（移除 conversation event 构建逻辑） |
| `apps/web/src/features/workbench/components/conversation-thread.tsx` | WP-4 | 修改（适配 AgentMessage 类型） |
| `apps/web/src/types/route.ts` | WP-5 | 修改（label 改中文） |
| `apps/web/src/app/layout/app-shell.tsx` | WP-5 | 修改（header 修复） |
| `apps/web/src/app/pages/dashboard-page.tsx` | WP-5 | 修改（文案 + 布局） |
| `apps/web/src/app/pages/studies-page.tsx` | WP-5 | 修改（去 UUID + 创建流程） |
| `apps/web/src/styles/globals.css` | WP-5 | 修改（eyebrow + btn-accent） |
| `apps/web/src/features/workbench/components/cards/qual-session-card.tsx` | WP-6 | 修改（persona 头像 + 标签） |
| `apps/web/src/app/pages/compare-placeholder.tsx` | WP-6 | 修改（按问题分组对比视图） |

---

## 验证：端到端演示脚本

| 步骤 | 用户操作 | Agent 响应 | 验证点 |
|------|---------|-----------|--------|
| 1 | 打开 /studies → 创建研究 | 跳转到 workbench | 创建流程有配置面板 |
| 2 | （自动）| Agent: "我已准备好研究计划：2 个人群 × 3 个概念。开始执行？" | Agent 主动打招呼 |
| 3 | 点击"开始执行" | Agent: "正在访谈 孕期女性 × 清泉+..." | 实时进度更新 |
| 4 | （等待）| Agent 每完成一次 IDI 发一条消息 + 摘录 | 不再 5 分钟空白 |
| 5 | （自动）| Agent: "定性阶段完成。发现 3 个核心主题：..." + 卡片 | 主题卡片从 agent 消息渲染 |
| 6 | （自动）| Agent: "继续 AI 综合评估？" + 按钮 | 中途审核由 agent 对话驱动 |
| 7 | 点击"继续评估" | Agent: "评分轮次 1/3..." → "评分轮次 2/3..." | 增量进度 |
| 8 | （自动）| Agent: "推荐清泉+，置信度 75 ± 3.2 / 高" + 推荐卡片 | 推荐结论从 agent 消息渲染 |
| 9 | （自动）| Agent: "研究完成。下载报告？查看对比？继续追问？" | 研究完成引导 |
| 10 | 输入"为什么推荐清泉+" | Agent: "根据访谈数据，清泉+在两个人群中..." | 基于 artifact 上下文的多轮对话 |
| 11 | 点击"下载报告" | 浏览器下载 HTML 文件 | 有样式的报告 |
| 12 | 右侧 ResultPanel | 排名 + 主题 + 分群差异 | 全部来自真实 artifact |

---

## 风险与降级

| 风险 | 降级方案 |
|------|----------|
| Agent 消息写入频繁，轮询压力 | 前端轮询间隔从 2s 调到 3s；message 表加 study_id+created_at 索引 |
| Temporal activity 超时 | agent 每步消息入库是独立事务，不受 activity 超时影响 |
| 前端重写工作量超预期 | 分两步：先保留现有 conversation-thread 组件，只改数据源；再优化渲染 |
| LLM 调用失败 | agent post_message('error', ...) 通知用户，workflow retry 兜底 |

## 不在本轮范围

- 资产导入管线（文件上传、解析）
- Twin/Stimulus CRUD 管理
- RBAC、审计日志
- Calibration 引擎
- SSE/WebSocket（本轮用轮询，后续可升级）
