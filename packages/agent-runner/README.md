# agent-runner

`agent-runner` 是业务层和模型 SDK 之间的运行时边界层。

## 这个包负责什么

- 统一封装模型调用、tool calling、重试、超时、trace、审计和结果回写
- 把“调用哪个模型、怎么拼 prompt、怎么处理失败”从业务服务里抽出去
- 为后续接入 Temporal workflow、MCP tools 和评测闭环预留稳定接口

## 这个包不负责什么

- 不直接承载业务页面逻辑
- 不在业务 service 里散落 OpenAI、Anthropic 或其他模型 SDK 调用
- 不替代 domain models、contracts 或 workflow 状态机

## 原则

业务层只依赖这个包暴露的运行时抽象，不直接直连模型 SDK。

这样做的原因很简单：

1. 模型供应商和 SDK 会变，业务边界不应该跟着抖
2. runtime 能统一做状态持久化、恢复、工具回写和人工审批
3. 后续想换模型、换工具层、换编排方式时，不需要改业务代码

## 预期接口形状

后续这里大概率会出现这些概念：

- `AgentRunner`
- `RunRequest`
- `RunResult`
- `ToolCall`
- `RunTrace`
- `ApprovalGate`

当前阶段只锁定职责边界，不提前写具体实现。

