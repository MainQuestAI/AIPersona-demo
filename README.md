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
- `docs/planning/project_takeover_development_plan.md`
- `docs/planning/detailed_work_packages.md`
- `docs/planning/wave0_execution_checklists_a01_w01_r01.md`
- `docs/deployment/resource-inventory-2026-04-13.md`
