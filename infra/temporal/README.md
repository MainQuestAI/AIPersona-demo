# Temporal 本地启动

这个目录提供 AIpersona demo 的本地 Temporal 开发环境。

## 启动

```bash
docker compose -f infra/temporal/docker-compose.yml up -d
```

## 停止

```bash
docker compose -f infra/temporal/docker-compose.yml down
```

## 访问

- Temporal gRPC: `localhost:7233`
- Temporal UI: `http://localhost:8233`

## 说明

这里使用的是 Temporal 的开发模式，目标只有一个：让 API 和 Worker 在本地有稳定的运行时底座可接。

