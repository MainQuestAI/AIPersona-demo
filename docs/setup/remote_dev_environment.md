# 远程开发环境配置

文档状态：已废弃
替代方案：`docs/setup/local_docker_environment.md`

## 当前结论

本项目默认开发环境已经切换为：

`本地 Docker Compose`

不再默认依赖：

- 远程 PostgreSQL
- 远程 Docker API
- SSH 隧道
- 远程 Temporal

## 为什么废弃

旧方案虽然能跑，但问题很明显：

- 新人接手成本高
- SSH 隧道不稳定
- 本地与远端环境容易漂移
- 排查问题时要同时看本机和远端

## 现在应该看哪里

请直接阅读：

- `docs/setup/local_docker_environment.md`

并使用：

- `pnpm run dev:up`
- `pnpm run dev:up:detached`
- `pnpm run db:migrate`

一句话收口：

`远程开发方案保留为历史记录，不再作为 AIpersona-demo 的默认入口。`
