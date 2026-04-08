# contracts

这里放前后端和 workflow 共用的共享契约。

## 约定

- 只放可序列化的数据形状
- 不放业务行为、不放 service 逻辑
- 和 domain-models 保持同构，但命名更偏传输层

## 当前覆盖

- `StudyRecord`
- `StudyPlanRecord`
- `StudyPlanVersionRecord`
- `StudyRunRecord`
- `RunStepRecord`
- `ApprovalGateRecord`
- `ArtifactRecord`
- `ConsumerTwinRecord`
- `TwinVersionRecord`
