# Findings & Decisions

## Requirements
- 接手 `AIpersona-demo` 项目，并准备后续开发计划。
- 输出必须面向业务效果、产品竞争力和执行顺序，而不是停留在技术概念。
- 后续所有 Agent 系统设计默认遵循 Runtime-first Agent 架构。
- 所有输出使用中文。

## Research Findings
- 当前仓库顶层只有 `docs/` 和 `handoff.md` 软链，尚未看到应用代码、`package.json`、路由、前端构建配置或运行脚本。
- `docs/handoff.md` 明确说明：规划阶段已经结束，项目应进入“实现编排阶段”。
- 交接文档已锁定主舞台、叙事顺序、必做页面、必做状态、演示数据真源和推荐开发切入顺序。
- 项目推荐的纯 ASCII 入口为 `/Users/dingcheng/Desktop/aipersona_demo`，适合后续给你或其他 AI 员工使用。
- `frontend_design.md` 已锁定前端北极星：唯一主舞台是 `AI Consumer Workbench`，前台必须体现 Agent-first，证据层通过 drawer / modal 服务主路径。
- 比稿演示顺序采用“结论优先的反向演示”：先展示 `Completed with Recommendation`，再回溯 plan / approval / qual / quant，最后打开 trust / provenance / input sources。
- `frontend_implementation_plan.md` 已直接给出建议技术栈、推荐目录和 5 大任务方向，且明确当前仓库是空目录，首版目标是先用统一 mock data 跑通 `Workbench / Compare / Twins / Evidence`。
- `frontend_mock_data_spec.md` 明确 mock 层必须是 `Runtime-shaped`，数据对象围绕 `study / studyPlanVersion / studyRun / conversationEvents / replay / trust` 建模，不能退化成页面拼文案。
- `system_design.md` 明确系统最小产品单元是 `Study Runtime`，不是 prompt、不是聊天窗口；任何 AI 执行都必须挂靠显式业务对象，并具备可运行、可恢复、可审批、可评测、可治理能力。
- `demo_content_playbook.md` 已把主演示故事、business question、target groups、stimuli、quant 分数、confidence、winner、风险点、next action 和 twin 摘录全部锁定，后续实现不应再讨论业务内容。
- `implementation_tasks.md` 已给出完整 Runtime-first 后端实施顺序：`Runtime Foundation -> Domain Schema -> Asset Ingestion -> Twin Center -> Study Planning -> Study Runtime -> Qual Engine -> Quant Engine -> Replay / Report -> Calibration Lite`。
- `mvp_prd.md` 明确 MVP 不是 AI persona 展示工具，而是 `AI Consumer Learning Workbench`，首版价值闭环是“快速测试 + 资产沉淀”。
- `frontend_execution_cards_batch1.md` 已经具备直接派工价值，Batch 1 的业务目标非常具体：先让客户看到 `Workbench completed state + evidence + compare + twins` 这条主路径成立。
- 当前目录不是 git 仓库，这不是小问题，而是正式进入开发前必须先补的协作底座。
- 已新增 `project_takeover_development_plan.md`，把接手结论、双轨策略、阶段划分、阻塞项和起手动作正式固定。
- 已新增 `runtime_execution_cards_batch1.md`，补齐 Runtime 侧首批可直接派工的执行卡。
- 已新增 `detailed_work_packages.md`，把项目进一步拆成 `A / W / R` 三类详细分工包，并明确波次、依赖、文件所有权、交接关系和派工顺序。
- 已新增 `wave0_execution_checklists_a01_w01_r01.md`，将 `A01 / W01 / R01` 进一步细化到底层操作顺序、命令、验收与提交点。
- `A01` 已实际落地：仓库已初始化 git，Monorepo 外壳、根级 workspace 文件与目录骨架已创建。
- `W01` 已实际落地：`apps/web` 已具备 React + TypeScript + Vite + Router + Tailwind + Zustand + Framer Motion 的可运行骨架，`Workbench / Compare / Twins` 三路由已打通。
- `R01` 已实际落地：`apps/api` 有 FastAPI 健康检查入口，`apps/worker` 有最小 Worker 与 `StudyWorkflow` skeleton，`infra/temporal` 有 docker compose 和说明文档。
- `pnpm install` 已在根目录跑通，前端 `pnpm --filter web build` 与 `pnpm --filter web lint` 已通过。
- Runtime 侧已通过 `python3 -m compileall apps/api/src apps/worker/src` 和 `StudyWorkflow().run()` 返回值检查。
- 当前唯一未完成的环境级验证是 Temporal 真启动，因为本机没有 `docker` 命令。
- 已确认远程开发服务器入口：`100.75.231.2`，推荐 SSH key 为 `~/.ssh/id_ed25519_deploy`。
- 已确认远端本机 `127.0.0.1:5432` 与 `127.0.0.1:2375` 正在监听；其中 `5432` 可作为远端 PostgreSQL，`2375` 可作为远端 Docker daemon API。
- 已确认远端机器可 SSH 登录，但远端机器本身没有 `docker` CLI，因此不能依赖“登录远端后执行 docker 命令”的模式，而应改走 Docker Remote API。
- 已通过 SSH 隧道实测打通：
  - 本地 `127.0.0.1:15432` -> 远端 `127.0.0.1:5432`
  - 本地 `127.0.0.1:12375` -> 远端 `127.0.0.1:2375`
- 已实测：
  - `nc -vz 127.0.0.1 15432` 成功
  - `curl http://127.0.0.1:12375/_ping` 返回 `OK`
- 已在仓库补齐远程开发接入资产：
  - `.env.example`
  - `scripts/remote-dev-bootstrap.sh`
  - `scripts/remote-dev-stop.sh`
  - `docs/setup/remote_dev_environment.md`

## Technical Decisions
| Decision | Rationale |
|----------|-----------|
| 先做文档级接手盘点，再输出开发计划 | 当前仓库看起来以规划文档为主，需要先判断“是否能直接开工” |
| 后续计划同时覆盖前端演示层与运行时能力边界 | 该项目不是普通页面 Demo，必须证明 Agent 运行时可信与可恢复 |
| 以 `demo_content_playbook.md` 作为内容真源前提 | 交接文档明确禁止各页面自行改写故事与数据 |
| 首版开发的真正起点应是“前端工程骨架 + typed mock layer” | 规划已足够完整，当前最大缺口不是需求，而是可运行载体 |
| 前端计划必须服务“比稿主路径”，而不是平均铺开所有页面 | Workbench 承担 70%+ 演示时长，业务价值应先在主舞台成立 |
| 后续开发应拆成“两条并行线” | 一条是前端演示环境尽快落地，一条是 Runtime MVP 的基础底座设计与排期 |
| 演示环境优先级高于完整运行时编码 | 当前对外价值首先来自可演示、可截图、可比稿的前台环境 |
| 接手后建议升级为 Monorepo 外壳 | 在当前“零代码起步”阶段改结构成本最低，也最符合 Runtime-first |
| 详细派工要细到文件所有权级别 | 否则多个 AI 员工并行时很容易互相覆盖和返工 |
| 第一批执行清单要写到命令级别 | 因为当前仓库还没有代码骨架，启动成本主要来自“怎么开始”而不是“怎么优化” |
| 第一轮开发完成后先做集成验证而不是立刻扩任务 | 先确认骨架是真可运行，再推进 W02/R02，返工成本最低 |
| 远程开发环境统一走“SSH 隧道 + 远端 DB + 远端 Docker API” | 本机和远端都缺少 Docker CLI，但远端 Docker API 已存在，这条链路最稳 |

## Issues Encountered
| Issue | Resolution |
|-------|------------|
| 规划技能文档中的脚本路径与本机实际安装路径不一致 | 已确认实际技能目录在 `~/.agents/skills/planning-with-files/` |

## Resources
- 项目交接真源: `docs/handoff.md`
- 规划文档目录: `docs/planning/`
- 纯 ASCII 项目入口: `/Users/dingcheng/Desktop/aipersona_demo`
- 前端主设计: `docs/planning/frontend_design.md`
- 前端实施计划: `docs/planning/frontend_implementation_plan.md`
- 前端数据真源: `docs/planning/frontend_mock_data_spec.md`
- Runtime 设计: `docs/planning/system_design.md`
- 演示内容真源: `docs/planning/demo_content_playbook.md`
- MVP 范围: `docs/planning/mvp_prd.md`
- Runtime 实施拆解: `docs/planning/implementation_tasks.md`
- 前端执行卡: `docs/planning/frontend_execution_cards_batch1.md`
- 接手主计划: `docs/planning/project_takeover_development_plan.md`
- Runtime 执行卡: `docs/planning/runtime_execution_cards_batch1.md`
- 详细分工包: `docs/planning/detailed_work_packages.md`
- 首批执行清单: `docs/planning/wave0_execution_checklists_a01_w01_r01.md`

## Visual/Browser Findings
- 当前未进行浏览器或视觉检查。

## 2026-04-22 软著申报预填稿
- 已基于 `AIpersona-demo` 当前产品形态输出中国大陆软件著作权申请预填稿：`docs/softcopyright_application_draft_2026-04-22.md`。
- 当前产品更适合以“对外品牌 + 功能名”方式申报，推荐名称为 `MirrorWorld AI消费者研究工作台软件 V0.1.0`，备选为 `AIpersona AI消费者研究工作台软件 V0.1.0`。
- 预填稿已覆盖产品定位、主要功能、技术特点、开发/运行环境、源程序量和待人工确认字段。
- 其中 `开发完成日期` 暂按当前仓库最后一轮完整功能合并时间 `2026-04-21` 建议填写；`首次发表日期` 暂按“未发表”处理。

---
*Update this file after every 2 view/browser/search operations*
*This prevents visual information from being lost*
