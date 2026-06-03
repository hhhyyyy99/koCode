## Config Management

### Config file format (YAML)
Location: `~/.kocode/config.yaml` (global), `./.kocode/config.yaml` (project, takes priority)

### Schema
```typescript
interface KoCodeConfig {
  providers?: Record<string, {
    apiKey: string;            // required
    baseUrl?: string;           // optional, falls back to provider default
    models?: Record<string, {   // custom model overrides
      api?: string;
      baseUrl?: string;
      reasoning?: boolean;
      input?: ("text"|"image")[];
      cost?: { input: number; output: number; cacheRead: number; cacheWrite: number };
      contextWindow?: number;
      maxTokens?: number;
      compat?: Record<string, any>;
      headers?: Record<string, string>;
    }>;
  }>;
  default?: {
    provider: string;           // must match a provider key
    model: string;              // must match a known model
  };
}
```

### Config commands (git-config style)
```bash
kocode config [show]           # list all (mask apiKey)
kocode config get <key>        # e.g., "providers.anthropic.apiKey"
kocode config set <key> <val>  # write to config file
kocode config unset <key>      # remove key
kocode config open             # $EDITOR or vi
kocode config path             # print file path
kocode config init             # generate default template
```

## TUI Enhancements

### Markdown: ink-markdown
- Import `Markdown` from `ink-markdown`
- Replace `<Text>` in Conversation message_delta handler

### Diff preview: DiffView component
- Parse old_string/new_string from Edit tool input
- Green for additions, red for removals
- Simple line-by-line rendering

### Multi-line input: Alt+Enter
- Override default Enter behavior in ink-text-input
- Enter → submit
- Alt+Enter → append "\n" to buffer
