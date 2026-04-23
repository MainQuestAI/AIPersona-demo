# Stage Docker 联调环境

文档版本：v1  
日期：2026-04-23  
状态：stage 默认入口

## 1. 目标

把 stage 联调环境与本地开发环境彻底拆开：

- 不再复用 `docker-compose.yml`
- 不再挂载源码目录
- API 默认 `APP_ENV=stage`
- API 默认 `API_RELOAD=false`
- API 默认 `ENABLE_DEV_AUTH=false`
- Web 使用构建后的静态产物，不再运行 Vite dev server

## 2. 新增文件

- `docker-compose.stage.yml`
- `.env.stage.example`
- `docker/python-stage.Dockerfile`
- `docker/node-stage.Dockerfile`
- `docker/nginx-stage.conf`

## 3. 首次使用

### 第一步：准备 stage 环境文件

```bash
cp .env.stage.example .env.stage
```

至少补齐：

- `DASHSCOPE_API_KEY`
- `OAUTH_SERVER_URL`
- `OAUTH_CLIENT_ID`
- `OAUTH_CLIENT_SECRET`
- `SESSION_COOKIE_SECRET`
- `VITE_OAUTH_PORTAL_URL`
- `VITE_OAUTH_CLIENT_ID`
- 如需对外访问，按实际情况调整 `STAGE_WEB_API_URL` 与 `WEB_APP_ORIGINS`

### 第二步：启动 stage 联调栈

前台启动：

```bash
pnpm run stage:up
```

后台启动：

```bash
pnpm run stage:up:detached
```

### 第三步：执行数据库迁移

stage compose 启动后，仍需在宿主机执行：

```bash
DATABASE_URL=postgresql://aipersona:aipersona_stage@127.0.0.1:5433/aipersona_stage pnpm run db:migrate
```

如果你改了 `.env.stage` 里的数据库账号或端口，这里也要同步调整。

## 4. 常用命令

```bash
pnpm run stage:ps
pnpm run stage:logs
pnpm run stage:down
```

## 5. 默认访问地址

- Web: `http://localhost:4173`
- API: `http://localhost:8001`
- API 健康检查: `http://localhost:8001/healthz`
- PostgreSQL: `localhost:5433`

## 6. 发布口径

判断 stage 入口是否正确，至少看这三点：

- API 容器环境里 `APP_ENV=stage`
- API 容器环境里 `ENABLE_DEV_AUTH=false` 且 `API_RELOAD=false`
- Web 容器不再执行 `pnpm --filter web dev`，而是直接提供构建产物
