# 本地 Docker 开发环境

文档版本：v1  
日期：2026-04-13  
状态：当前默认开发方案

补充说明：

- 本文档只覆盖本地开发入口。
- stage 联调请改用 `docker-compose.stage.yml`，见 `docs/setup/stage_docker_environment.md`。

## 1. 目标

把项目开发环境从：

`SSH 隧道 + 远程 PostgreSQL + 远程 Docker + 按需远程 Temporal`

切换为：

`本地 Docker Compose + 本地代码挂载 + 本地 .env.compose`

这样做的价值很直接：

- 不再依赖远程开发机
- 新 AI 员工不需要理解 SSH 隧道
- 环境一致性更高
- 本地启动、停止、重建都统一走一套命令

## 2. 当前默认栈

默认启动以下服务：

- `postgres`
- `api`
- `worker`
- `web`

可选服务：

- `temporal`

外部仍然保留：

- `DashScope API`

说明：

- 当前代码主执行链已经是 `LangGraph + Postgres checkpointer`
- 所以 `Temporal` 不再是默认必开组件
- 但为了后续 Runtime-first 演进，仍保留为可选 profile

## 3. 新增文件

- `docker-compose.yml`
- `docker/python-dev.Dockerfile`
- `docker/node-dev.Dockerfile`
- `.env.compose.example`
- `scripts/docker-compose.sh`
- `scripts/docker-db-migrate.sh`

## 4. 首次使用

### 第一步：安装 Docker

本机需要先安装并启动：

- `Docker Desktop`

如果命令 `docker --version` 无法执行，先不要继续。

### 第二步：准备 Compose 环境文件

执行：

```bash
cp .env.compose.example .env.compose
```

至少要填写：

- `DASHSCOPE_API_KEY`
- 如需走正式联调，还要补齐 `OAUTH_SERVER_URL / OAUTH_CLIENT_ID / OAUTH_CLIENT_SECRET / SESSION_COOKIE_SECRET`

其他本地开发默认值已经预填。

### 第三步：启动开发栈

前台启动：

```bash
pnpm run dev:up
```

后台启动：

```bash
pnpm run dev:up:detached
```

### 第四步：执行数据库迁移

```bash
pnpm run db:migrate:docker
```

## 5. 常用命令

查看服务状态：

```bash
pnpm run dev:ps
```

查看日志：

```bash
pnpm run dev:logs
```

停止开发栈：

```bash
pnpm run dev:down
```

按需启动 Temporal：

```bash
pnpm run dev:temporal
```

## 6. 访问地址

- Web：`http://localhost:5174`
- API：`http://localhost:8000`
- API 健康检查：`http://localhost:8000/healthz`
- MainQuest Auth Portal：`http://localhost:5173`
- PostgreSQL：`localhost:5432`
- Temporal gRPC（可选）：`localhost:7233`
- Temporal UI（可选）：`http://localhost:8233`

## 7. 环境文件说明

### `.env.compose`

这是 Docker Compose 默认使用的开发环境文件。

用途：

- 提供 Postgres 本地凭据
- 提供 DashScope API Key
- 提供 OAuth / Dev Auth 开关
- 提供本地共享 demo team 配置

### `.env`

这是保留给“非 Docker 本地直跑”时使用的宿主机环境文件。

当前默认方案里：

`不是主入口。`

## 8. 业务判断

这次调整的重点不是“容器化本身”，而是把开发路径收敛为一个单一入口。

以后默认只需要记住这三步：

1. `cp .env.compose.example .env.compose`
2. `pnpm run dev:up:detached`
3. `pnpm run db:migrate:docker`

一句话收口：

`AIpersona-demo 的默认开发环境已经改为本地 Docker Compose，不再以远程开发机为前提。`
