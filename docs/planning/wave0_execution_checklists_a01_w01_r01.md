# Wave 0 / Wave 1 Execution Checklist (A01 / W01 / R01) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `subagent-driven-development`（推荐）或 `executing-plans` 按任务逐项执行。步骤使用 checkbox（`- [ ]`）语法跟踪，不允许跳步。

**Goal:** 把 `AIpersona-demo` 从文档仓库推进到可开发状态，并完成第一批三项基础工作：仓库初始化、Web 前端骨架启动、Runtime 后台底座启动。

**Architecture:** 先完成 `A01`，把仓库和 Monorepo 外壳立住；然后并行推进 `W01` 与 `R01`。`W01` 只负责达能演示前台的空壳和视觉底座，不触碰业务内容；`R01` 只负责 API / Worker / Temporal 的运行时外壳，不触碰业务对象 schema。

**Tech Stack:** Git、pnpm workspace、Turborepo、React、TypeScript、Vite、React Router、Tailwind CSS、Framer Motion、Zustand、FastAPI、Temporal、Python workspace tooling。

---

## 0. 执行前统一要求

- [ ] **Step 1: 阅读交接入口**

Read:
- `docs/handoff.md`
- `docs/planning/project_takeover_development_plan.md`
- `docs/planning/detailed_work_packages.md`

Expected:
- 明确 `A01 -> W01/R01` 的依赖关系

- [ ] **Step 2: 确认当前工作目录**

Run:
```bash
pwd
```

Expected:
- 输出项目根目录 `AIpersona-demo`

- [ ] **Step 3: 确认当前尚未有应用代码骨架**

Run:
```bash
find . -maxdepth 2 -type f | sort
```

Expected:
- 看到当前以 `docs/` 为主，没有成熟 `apps/web`、`apps/api`、`apps/worker` 代码

---

## Task A01: 仓库初始化与 Monorepo 外壳

**Files:**
- Create: `.gitignore`
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `turbo.json`
- Create: `README.md`
- Create: `apps/web/.gitkeep`
- Create: `apps/api/.gitkeep`
- Create: `apps/worker/.gitkeep`
- Create: `packages/contracts/.gitkeep`
- Create: `packages/domain-models/.gitkeep`
- Create: `packages/agent-runner/.gitkeep`
- Create: `packages/replay-builder/.gitkeep`
- Create: `infra/temporal/.gitkeep`
- Create: `infra/sql/.gitkeep`
- Create: `infra/observability/.gitkeep`

- [ ] **Step 1: 初始化 git 仓库**

Run:
```bash
git init
```

Expected:
- 输出初始化成功信息
- 后续 `git status` 可用

- [ ] **Step 2: 立即验证 git 状态可读**

Run:
```bash
git status --short
```

Expected:
- 不报 `not a git repository`

- [ ] **Step 3: 创建 Monorepo 目录外壳**

Create directories:
```text
apps/web
apps/api
apps/worker
packages/contracts
packages/domain-models
packages/agent-runner
packages/replay-builder
infra/temporal
infra/sql
infra/observability
```

Expected:
- 目录结构与 `project_takeover_development_plan.md` 一致

- [ ] **Step 4: 写根级 `.gitignore`**

Must include:
- `node_modules/`
- `dist/`
- `.turbo/`
- `.DS_Store`
- `.venv/`
- `__pycache__/`
- `.pytest_cache/`
- `.env`
- `.env.*`

Expected:
- Node 与 Python 常见产物都被忽略

- [ ] **Step 5: 写根级 `package.json`**

Must include:
- `private: true`
- workspace 根描述
- `packageManager`
- scripts:
  - `dev:web`
  - `dev:api`
  - `dev:worker`
  - `build`
  - `lint`
  - `test`

Expected:
- 可以作为 pnpm workspace 根入口

- [ ] **Step 6: 写 `pnpm-workspace.yaml`**

Must include:
- `apps/*`
- `packages/*`

Expected:
- `apps/web`、`apps/api`、`apps/worker` 可被识别为 workspace 成员

- [ ] **Step 7: 写 `turbo.json`**

Must include minimal pipelines:
- `build`
- `dev`
- `lint`
- `test`

Expected:
- 后续各应用可统一挂到 turbo task graph

- [ ] **Step 8: 写根级 `README.md`**

Must include:
- 项目一句话定义
- 目录结构说明
- 启动顺序说明
- 指向 `docs/handoff.md`

Expected:
- 新 AI 员工从根目录即可建立上下文

- [ ] **Step 9: 为空目录写 `.gitkeep`**

Expected:
- `apps/`、`packages/`、`infra/` 空目录可被版本化

- [ ] **Step 10: 验证 workspace 文件存在**

Run:
```bash
find . -maxdepth 2 \( -name 'package.json' -o -name 'pnpm-workspace.yaml' -o -name 'turbo.json' -o -name '.gitignore' \) | sort
```

Expected:
- 至少看到根级四个关键文件

- [ ] **Step 11: 再次验证目录外壳**

Run:
```bash
find apps packages infra -maxdepth 2 -type d | sort
```

Expected:
- 所有计划中的一级目录都存在

- [ ] **Step 12: 做 A01 自检**

Checklist:
- [ ] `git status` 可用
- [ ] workspace 根文件已创建
- [ ] `apps/web`、`apps/api`、`apps/worker` 已创建
- [ ] 未提前写入业务代码

- [ ] **Step 13: 提交 A01**

Run:
```bash
git add .gitignore package.json pnpm-workspace.yaml turbo.json README.md apps packages infra
git commit -m "chore: initialize monorepo workspace shell"
```

Expected:
- 成功生成首个提交

---

## Task W01: Web 项目骨架与视觉底座

**Files:**
- Create: `apps/web/package.json`
- Create: `apps/web/tsconfig.json`
- Create: `apps/web/vite.config.ts`
- Create: `apps/web/postcss.config.js`
- Create: `apps/web/tailwind.config.ts`
- Create: `apps/web/index.html`
- Create: `apps/web/src/main.tsx`
- Create: `apps/web/src/app/App.tsx`
- Create: `apps/web/src/app/routes.tsx`
- Create: `apps/web/src/app/providers.tsx`
- Create: `apps/web/src/app/layout/app-shell.tsx`
- Create: `apps/web/src/app/layout/global-rail.tsx`
- Create: `apps/web/src/app/pages/workbench-placeholder.tsx`
- Create: `apps/web/src/app/pages/compare-placeholder.tsx`
- Create: `apps/web/src/app/pages/twins-placeholder.tsx`
- Create: `apps/web/src/styles/globals.css`
- Create: `apps/web/src/styles/tokens.css`
- Create: `apps/web/src/types/route.ts`

- [ ] **Step 1: 进入 `apps/web`，初始化前端包定义**

Must include dependencies:
- `react`
- `react-dom`
- `react-router-dom`
- `zustand`
- `framer-motion`
- `lucide-react`

Must include devDependencies:
- `typescript`
- `vite`
- `@vitejs/plugin-react`
- `tailwindcss`
- `postcss`
- `autoprefixer`
- `vitest`

Expected:
- `apps/web/package.json` 完整可装依赖

- [ ] **Step 2: 写 `tsconfig.json` 与 `vite.config.ts`**

Must include:
- TS path alias（如 `@/`）
- React 插件
- 基础 dev server 配置

Expected:
- Vite + TS 的最小工程骨架成立

- [ ] **Step 3: 接入 Tailwind 基础配置**

Create:
- `postcss.config.js`
- `tailwind.config.ts`

Expected:
- CSS utility 能在 `src/` 下生效

- [ ] **Step 4: 写 `index.html` 与 `src/main.tsx`**

Must include:
- 根挂载节点
- React 应用入口
- 全局样式导入

Expected:
- 应用有单一挂载入口

- [ ] **Step 5: 写 `App.tsx` 与 `providers.tsx`**

Must include:
- RouterProvider 或 BrowserRouter
- 全局 provider 占位

Expected:
- 后续状态管理和主题能力有统一挂点

- [ ] **Step 6: 写 `routes.tsx`**

Must include:
- `/` -> `Workbench`
- `/compare`
- `/twins`

Expected:
- 三个一级路由可切换

- [ ] **Step 7: 写 `app-shell.tsx`**

Must include:
- 左侧 rail 区
- 主内容区
- 清晰布局骨架

Expected:
- 页面已经像工作台，不是默认白板

- [ ] **Step 8: 写 `global-rail.tsx`**

Must include:
- `Workbench`
- `Compare`
- `Twins`

Expected:
- 左侧导航有明确 active 态

- [ ] **Step 9: 写三个 placeholder 页面**

Pages:
- `workbench-placeholder.tsx`
- `compare-placeholder.tsx`
- `twins-placeholder.tsx`

Must include:
- 页面标题
- 一句产品化占位说明
- 不包含业务故事文案

Expected:
- 路由落地，但未提前进入业务内容实现

- [ ] **Step 10: 写 `tokens.css`**

Must include design tokens for:
- 背景层级
- 文本层级
- 边框
- 阴影
- 圆角
- spacing

Expected:
- 已有 `Precision Laboratory` 风格底子

- [ ] **Step 11: 写 `globals.css`**

Must include:
- CSS reset / base
- 字体与基础背景
- 应用全屏布局

Expected:
- 页面不出现默认浏览器风格

- [ ] **Step 12: 安装依赖**

Run:
```bash
pnpm install
```

Expected:
- 根 workspace 和 `apps/web` 依赖安装成功

- [ ] **Step 13: 启动 Web 本地开发环境**

Run:
```bash
pnpm --filter web dev
```

Expected:
- Vite dev server 启动成功

- [ ] **Step 14: 验证三路由切换**

Manual check:
- 打开 `/`
- 打开 `/compare`
- 打开 `/twins`

Expected:
- 三页均可访问，无白屏、无控制台报错

- [ ] **Step 15: 做 W01 自检**

Checklist:
- [ ] `apps/web` 可启动
- [ ] 三个一级路由可见
- [ ] 左侧 Global Rail 已成立
- [ ] 尚未写具体业务卡片
- [ ] 尚未写 mock 文案

- [ ] **Step 16: 提交 W01**

Run:
```bash
git add apps/web
git commit -m "feat: scaffold web app shell and visual foundation"
```

Expected:
- 生成独立的 Web 骨架提交

---

## Task R01: API / Worker / Temporal 启动底座

**Files:**
- Create: `apps/api/pyproject.toml`
- Create: `apps/api/src/app/main.py`
- Create: `apps/api/src/app/api/router.py`
- Create: `apps/api/src/app/core/config.py`
- Create: `apps/api/src/app/core/logging.py`
- Create: `apps/api/src/app/core/errors.py`
- Create: `apps/api/src/app/api/health.py`
- Create: `apps/worker/pyproject.toml`
- Create: `apps/worker/src/worker/main.py`
- Create: `apps/worker/src/worker/config.py`
- Create: `apps/worker/src/worker/workflows/__init__.py`
- Create: `apps/worker/src/worker/workflows/study_workflow.py`
- Create: `packages/agent-runner/README.md`
- Create: `packages/agent-runner/src/agent_runner/`
- Create: `infra/temporal/docker-compose.yml`
- Create: `infra/temporal/README.md`

- [ ] **Step 1: 选择并固化 Python 包管理方式**

Choose one:
- `uv`
- `poetry`

Must be consistent across:
- `apps/api`
- `apps/worker`

Expected:
- 后续 Python 依赖管理方式统一

- [ ] **Step 2: 写 `apps/api/pyproject.toml`**

Must include:
- `fastapi`
- `uvicorn`
- 配置与日志相关依赖

Expected:
- API 应用可独立安装与运行

- [ ] **Step 3: 写 `apps/api/src/app/main.py`**

Must include:
- FastAPI app factory 或最小 app
- 健康检查路由挂载
- 基础 lifespan 或启动入口占位

Expected:
- API 具备最小启动能力

- [ ] **Step 4: 写 API 核心模块**

Create:
- `core/config.py`
- `core/logging.py`
- `core/errors.py`
- `api/router.py`
- `api/health.py`

Expected:
- 配置、日志、错误、路由分层清晰

- [ ] **Step 5: 写 `apps/worker/pyproject.toml`**

Must include:
- Temporal worker 所需依赖
- 与 API 一致的基础配置方式

Expected:
- Worker 应用可独立安装与运行

- [ ] **Step 6: 写 `apps/worker/src/worker/main.py` 与 `config.py`**

Must include:
- Worker 启动入口
- 配置加载
- Temporal client/worker 初始化占位

Expected:
- Worker 有清晰主入口

- [ ] **Step 7: 写最小 `StudyWorkflow` 骨架**

Create:
- `workflows/study_workflow.py`

Must include:
- 工作流类或函数定义
- 空执行逻辑
- 明确注释：当前仅为 skeleton，不含真实业务步骤

Expected:
- `R04` 后续可直接扩展，不需重建入口

- [ ] **Step 8: 写 `packages/agent-runner` 最小抽象说明**

Must include:
- 这个包负责什么
- 为什么不让业务层直连模型 SDK
- 预期接口形状说明

Expected:
- 后续 Agent 接线方向被锁住

- [ ] **Step 9: 写 `infra/temporal/docker-compose.yml`**

Must include:
- Temporal 本地运行所需基础服务

Expected:
- 可本地拉起 Temporal 开发环境

- [ ] **Step 10: 写 `infra/temporal/README.md`**

Must include:
- 启动命令
- 停止命令
- 本地访问说明

Expected:
- 新 AI 员工不需要重新摸索 Temporal 启动方式

- [ ] **Step 11: 安装 API / Worker 依赖**

Run example:
```bash
cd apps/api && <chosen-package-manager-install-command>
cd ../worker && <chosen-package-manager-install-command>
```

Expected:
- 两个 Python 应用都能完成依赖解析

- [ ] **Step 12: 启动 API**

Run example:
```bash
cd apps/api && <chosen-package-manager-run-command> uvicorn app.main:app --reload
```

Expected:
- API 成功启动
- 健康检查接口可访问

- [ ] **Step 13: 启动 Temporal**

Run:
```bash
docker compose -f infra/temporal/docker-compose.yml up -d
```

Expected:
- Temporal 相关容器启动成功

- [ ] **Step 14: 启动 Worker**

Run example:
```bash
cd apps/worker && <chosen-package-manager-run-command> python -m worker.main
```

Expected:
- Worker 进程启动
- 不因缺少真实业务逻辑而崩溃

- [ ] **Step 15: 做 R01 自检**

Checklist:
- [ ] API 可启动
- [ ] Worker 可启动
- [ ] Temporal 可启动
- [ ] `StudyWorkflow` 文件存在
- [ ] 未开始写业务 schema
- [ ] 未开始写 chat endpoint

- [ ] **Step 16: 提交 R01**

Run:
```bash
git add apps/api apps/worker packages/agent-runner infra/temporal
git commit -m "feat: scaffold runtime api worker and temporal foundation"
```

Expected:
- 生成独立的 Runtime Foundation 提交

---

## 4. 三包完成后的联合验收

- [ ] **Step 1: 运行仓库级状态检查**

Run:
```bash
git status --short
```

Expected:
- 工作区干净，或只有预期内未提交改动

- [ ] **Step 2: 验证目录结构**

Run:
```bash
find apps packages infra -maxdepth 2 -type d | sort
```

Expected:
- `apps/web`、`apps/api`、`apps/worker`、`packages/*`、`infra/*` 全部存在

- [ ] **Step 3: 验证 Web 可启动**

Run:
```bash
pnpm --filter web dev
```

Expected:
- Web 正常启动

- [ ] **Step 4: 验证 API 可启动**

Run example:
```bash
cd apps/api && <chosen-package-manager-run-command> uvicorn app.main:app --reload
```

Expected:
- API 正常启动

- [ ] **Step 5: 验证 Temporal + Worker 可启动**

Run:
```bash
docker compose -f infra/temporal/docker-compose.yml up -d
cd apps/worker && <chosen-package-manager-run-command> python -m worker.main
```

Expected:
- Worker 能连接 Temporal 或至少以可诊断方式启动

- [ ] **Step 6: 输出交接备注**

Must include:
- `W02` 可直接接手的文件入口
- `R02` 可直接接手的文件入口
- 当前未完成但已预留的地方

---

## 5. 给老板的派工方式

建议你这样发第一批任务：

1. 一个 AI 员工负责 `A01`
2. 一个 AI 员工负责 `W01`
3. 一个 AI 员工负责 `R01`

但节奏上要这样控：

- `A01` 先完成
- `W01` 和 `R01` 再并行启动

一句话收口：

`这份 checklist 的目标不是让 AI 员工自己思考怎么开始，而是直接规定它们第一步、第二步、第三步该做什么。`
