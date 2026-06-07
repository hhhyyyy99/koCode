# Agent、工具、权限与会话规范

修改 `packages/ko-agent` 时遵守本文件。

## AgentSession

`AgentSession` 是核心运行时：prompt -> stream -> tool execute -> repeat。

修改时检查：

- 并发 prompt 是否仍被拒绝。
- cancel 是否能停止运行状态。
- abort signal 是否在循环和工具执行前检查。
- context overflow 和 compaction 是否仍可触发。
- usage/cost 是否在累计前完成归一化。

## 工具执行

工具包括 read、edit、write、bash、grep、find、ls。

规则：

- 工具参数必须校验。
- 文件路径必须受 cwd/sandbox 限制。
- edit 必须确保匹配唯一或按既有策略失败。
- write/edit/bash 必须走权限判断。
- bash 命令必须尊重 allow/deny policy。
- 重复 tool call 不能重复执行。

## 权限模式

权限模式：

- `default`
- `accept_edits`
- `auto`

规则：

- `default` 下危险写入或 bash 应请求确认。
- `accept_edits` 只能自动批准编辑类行为，不能无条件批准 bash。
- `auto` 仍要尊重硬性 deny 规则。
- 权限请求必须 emit 事件并等待响应。
- 拒绝权限应作为工具结果反馈给模型，而不是让循环静默断掉。

## 会话存储

会话由 `session-store.ts` 管理，默认位置是 `~/.kocode/sessions`。

规则：

- 测试必须通过 `KOCODE_SESSIONS_DIR` 或临时目录隔离。
- 不要在业务代码里硬编码真实用户目录。
- create/load/list/branch/delete/rename 走 session-store 公共函数。
- session id 到 path 的转换集中在 session-store，不散落到调用方。

## Checkpoint 和 Rewind

修改文件工具或回退逻辑时检查：

- 修改前是否保存快照。
- checkpoint 是否绑定到当前 turn。
- rewind 是否只恢复本轮相关文件。
- 用户已有内容不能被错误覆盖。
- 失败时要给出明确错误事件或结果。

## 测试重点

优先覆盖：

- tool loop
- tool permission
- duplicate tool call dedup
- JSONL session store
- branch/resume
- rewind/checkpoint
- usage normalization

至少运行：

```bash
pnpm --filter @kocode/ko-agent test
pnpm test
```
