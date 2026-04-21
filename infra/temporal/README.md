# Temporal 本地启动

当前默认开发方案下，Temporal 不再是必开组件。

如果你只是跑现在的主开发链路：

`web + api + worker + postgres`

可以先不启动 Temporal。

## 启动

```bash
pnpm run dev:temporal
```

## 停止

```bash
pnpm run dev:down
```

## 访问

- Temporal gRPC: `localhost:7233`
- Temporal UI: `http://localhost:8233`

## 说明

这里只保留 Runtime-first 演进预留。
当前项目主执行链已经切到 `LangGraph + Postgres checkpointer`，所以 Temporal 是可选开发组件，不是默认开发前置。
