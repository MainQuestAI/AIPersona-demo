# 远程开发环境配置

文档版本：v1  
日期：2026-04-03  
状态：已验证可接入  
适用范围：`AIpersona-demo` 后续开发统一远程环境入口

## 1. 当前已确认的事实

我已经在本机完成以下验证：

- 可通过 SSH 直连远程开发机 `100.75.231.2`
- 推荐 SSH key：`~/.ssh/id_ed25519_deploy`
- 远端本机 `127.0.0.1:5432` 在监听
- 远端本机 `127.0.0.1:2375` 在监听
- 远端本机 `127.0.0.1:7233` 默认未监听，需要由项目脚本通过远端 Docker API 拉起 Temporal

补充判断：

- 这说明远端已经有 PostgreSQL
- 这说明远端已经有 Docker daemon API
- 但远端机器本身没有 `docker` CLI

所以后续开发不应该继续依赖本机 Docker Desktop，而应该统一改成：

`SSH 隧道 + 远端 PostgreSQL + 远端 Docker API + 远端 Temporal`

## 2. 推荐开发方式

### 数据库

通过 SSH 隧道把远端 Postgres 映射到本机：

- 本地：`127.0.0.1:15432`
- 远端：`127.0.0.1:5432`

然后应用统一读取：

- `DATABASE_URL`

### Docker

通过 SSH 隧道把远端 Docker API 映射到本机：

- 本地：`127.0.0.1:12375`
- 远端：`127.0.0.1:2375`

然后工具统一读取：

- `DOCKER_HOST=tcp://127.0.0.1:12375`
- `REMOTE_DOCKER_API=http://127.0.0.1:12375`

### Temporal

通过远端 Docker API 拉起 Temporal 开发容器，再通过 SSH 隧道映射回本机：

- 本地 gRPC：`127.0.0.1:7233`
- 远端 gRPC：`127.0.0.1:7233`
- 本地 UI：`127.0.0.1:8233`
- 远端 UI：`127.0.0.1:8233`

然后运行时统一读取：

- `TEMPORAL_ADDRESS=127.0.0.1:7233`
- `TEMPORAL_UI_URL=http://127.0.0.1:8233`

## 3. 为什么不用本机 Docker

因为当前机器已经确认：

- 本机没有 `docker` 命令
- 项目里的 Temporal / PostgreSQL / 其他运行容器未来都需要容器环境

继续强行按本机 Docker 路线推进，只会反复被环境卡住。

## 4. 本仓库已提供的文件

- 环境模板：`.env.example`
- 启动脚本：`scripts/remote-dev-bootstrap.sh`
- 停止脚本：`scripts/remote-dev-stop.sh`
- Temporal 启动脚本：`scripts/remote-temporal-up.sh`
- Temporal 停止脚本：`scripts/remote-temporal-down.sh`

## 5. 使用方式

### 第一步：准备本地 `.env`

复制 `.env.example` 为 `.env`，只填写真实数据库凭据，不要提交 git。

至少要有：

- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`

### 第二步：建立隧道

运行：

```bash
pnpm run remote:bootstrap
```

脚本会：

- 检查 SSH key
- 复用或建立 PostgreSQL 隧道
- 复用或建立 Docker API 隧道
- 复用或建立 Temporal gRPC / UI 隧道
- 输出需要导出的 `DATABASE_URL` / `DOCKER_HOST` / `TEMPORAL_ADDRESS`

### 第三步：拉起远端 Temporal

运行：

```bash
pnpm run remote:temporal:up
```

### 第三步半：执行数据库迁移

运行：

```bash
pnpm run db:migrate
```

这一步会：

- 自动识别已存在的基础 schema
- 补记迁移状态，避免重复执行 `001` 时撞上已有约束
- 应用后续 migration，例如 artifact 扩展和资产目录表

### 第四步：验证

```bash
nc -vz 127.0.0.1 15432
curl -s http://127.0.0.1:12375/_ping
nc -vz 127.0.0.1 7233
```

如果你希望在 Study Detail 中看到“实际成本估算”，还需要在 `.env` 中填写：

- `DASHSCOPE_INPUT_COST_PER_1K`
- `DASHSCOPE_OUTPUT_COST_PER_1K`

不填时，系统仍会记录 token usage，但 `actual_cost` 会保持为空。

## 6. 当前风险与边界

### 已确认可用

- SSH
- 远端 PostgreSQL 监听
- 远端 Docker API 监听

### 尚未在本项目内写死的内容

- AIpersona-demo 专属数据库名
- AIpersona-demo 专属数据库用户
- 是否需要为 Temporal 单独开远端运行实例

### 当前建议

在 `R03 / R04` 启动前，先保证下面两条命令已经能稳定通过：

```bash
pnpm run remote:bootstrap
pnpm run remote:temporal:up
```

一句话收口：

`后续开发环境已经不需要继续卡在本机 Docker 上，统一切到“SSH 隧道 + 远端 DB + 远端 Docker API + 远端 Temporal”即可。`
