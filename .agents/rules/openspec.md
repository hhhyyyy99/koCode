# OpenSpec 规范

当任务涉及新功能、公开行为变化、架构决策或验收标准时，使用 OpenSpec。

## 开始前

先运行：

```bash
openspec status
```

- 有 active change：优先进入该 change，不另起炉灶。
- 没有 active change：如果是公开行为变化，先创建/补充变更提案。
- 小型内部修复、测试隔离、文档微调可以不新建 change。

## 变更内容

OpenSpec change 通常包含：

- `proposal.md`：为什么要做、做什么、不做什么
- `design.md`：关键设计、权衡、边界
- `tasks.md`：可验证任务清单
- `specs/*/spec.md`：能力规格 delta

任务不要写成泛泛的“实现功能”。每一项要能被代码、测试或手动验收证明。

## 实施规则

- 不要在实现前把任务标成完成。
- 如果实现发现方案需要变，先更新 design/tasks/spec，再继续。
- 新增或修改 MUST/SHOULD 行为时，要有对应 Scenario。
- 归档前确保实现、测试、验证记录完整。

## 验证

实现后至少运行：

```bash
openspec validate --all --strict
```

如果某个 change 已完成并归档，`openspec status` 应显示没有 active changes，或只显示仍在进行的其他 change。
