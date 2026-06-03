import { render } from "ink";
import React from "react";
import type { AgentSession } from "@kocode/ko-agent";
import { App } from "./App.js";
import { ThemeProvider, type ThemeName } from "./theme.js";

export interface TuiConfig {
  theme?: ThemeName;
  onThemeChange?: (name: ThemeName) => void;
}

export function run(session: AgentSession, config?: TuiConfig): void {
  const theme = config?.theme ?? "dark";
  render(
    React.createElement(ThemeProvider, { initialTheme: theme },
      React.createElement(App, { session, onThemeChange: config?.onThemeChange })
    ),
    {
      exitOnCtrlC: true,
      patchConsole: false,
    },
  );
}
