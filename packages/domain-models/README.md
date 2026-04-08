# domain-models

这里放 AIpersona 的核心领域对象定义。

## 边界

- `study` / `study_plan` 是研究主对象和计划头对象
- `study_plan_version` 是不可变版本对象，后续审批与执行都只认这个版本
- `study_run` 显式绑定 `study_plan_version`
- `consumer_twin` 是逻辑身份，`twin_version` 是可执行快照

## 约束

- 不把对象塞进万能 JSON 表
- 版本对象不可原地修改
- 运行态对象必须保留可追溯的外键/引用字段

## 输出

- 领域实体类型
- 版本与状态枚举
- 供 contracts 复用的基础 JSON/ID 类型
