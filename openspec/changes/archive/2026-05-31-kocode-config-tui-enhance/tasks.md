## 1. 配置校验 + config 命令

- [x] 1.1 实现 config schema 校验函数 (validateConfig)
- [x] 1.2 实现 config show 命令 (列出所有配置, 遮蔽 apiKey)
- [x] 1.3 实现 config get <key> 命令 (点号路径取值)
- [x] 1.4 实现 config set <key> <value> 命令 (写入配置文件)
- [x] 1.5 实现 config unset <key> 命令 (删除配置项)
- [x] 1.6 实现 config open 命令 ($EDITOR 打开配置文件)
- [x] 1.7 实现 config path 命令 (打印配置文件路径)
- [x] 1.8 实现 config init 命令 (生成默认配置模板)

## 2. 自定义模型定义完善

- [x] 2.1 自定义模型在 /models 命令中可见 (合并内置+自定义)
- [x] 2.2 resolveModel 的 compat 字段完整传递到 Provider 适配器
- [x] 2.3 自定义模型支持 headers 配置 (API key 透传)

## 3. TUI Markdown 渲染

- [x] 3.1 安装 ink-markdown 依赖
- [x] 3.2 AssistantMessage 组件替换为 Markdown 渲染
- [x] 3.3 确保代码块、粗体、链接、列表正确显示

## 4. TUI diff 预览

- [x] 4.1 实现 DiffView 组件 (绿色+/红色-)
- [x] 4.2 Edit 工具结果以 diff 风格展示

## 5. TUI 多行输入

- [x] 5.1 InputBox 支持 Alt+Enter 换行
- [x] 5.2 Enter 提交不变

## 6. 验收

- [x] 6.1 pnpm build 通过
- [x] 6.2 pnpm typecheck 通过
- [x] 6.3 pnpm test 通过 (28 tests)
- [x] 6.4 config 命令功能验证 (show/get/set/unset/init)
- [x] 6.5 TUI 组件渲染验证
