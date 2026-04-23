# AIpersona Demo

`AIpersona-demo` 是面向达能比稿与后续交付的 `AI Consumer Workbench` 演示仓库。

## 当前目标

- 先交付可演示的 `Workbench / Compare / Twins / Evidence` 主路径
- 同步保留 `Runtime-first` 的后端落地路径

## 目录结构

```text
apps/
  web/        Web 前端演示环境
  api/        Runtime API
  worker/     Runtime Worker / Workflow
packages/
  contracts/      前后端共享契约
  domain-models/  核心对象模型
  agent-runner/   Agent 调用抽象层
  replay-builder/ Replay 构建模块
infra/
  temporal/       Temporal 本地运行配置
  sql/            数据库 schema 与 migration
  observability/  监控与日志预留
docs/
  handoff.md
  planning/
```

## 启动顺序

1. 先读 `docs/handoff.md`
2. 再读 `docs/planning/detailed_work_packages.md`
3. Wave 0 先完成 `A01`
4. Wave 1 并行推进 `W01` 与 `R01`

## 参考入口

- `docs/handoff.md`
- `docs/setup/local_docker_environment.md`
- `docs/setup/stage_docker_environment.md`
- `docs/planning/project_takeover_development_plan.md`
- `docs/planning/detailed_work_packages.md`
- `docs/planning/wave0_execution_checklists_a01_w01_r01.md`

## 部署入口说明

- `docker-compose.yml` 只用于本地开发，保留源码挂载、热重载和开发鉴权兜底。
- `docker-compose.stage.yml` 才是 stage 联调用入口，默认关闭 `ENABLE_DEV_AUTH` 与 `API_RELOAD`，Web 也改为静态构建产物服务。

## 认证集成口径

- `MainQuest-Auth` 是唯一正式登录入口，AIpersona-demo 不再维护本地密码登录。
- 本地 Web 默认端口为 `http://localhost:5174`，避免与 `MainQuest-Auth portal` 的 `http://localhost:5173` 冲突。
- API OAuth 回调固定为 `http://localhost:8000/api/oauth/callback`。
- 本地仅保留 `localhost-only Dev Auth`，正式联调和 stage 默认走 OAuth。
