import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import { useTheme } from "./theme.js";
import type { AgentSession } from "@kocode/ko-agent";
import { formatUsageReport } from "./commands.js";

interface Props {
  session: AgentSession;
  onClose: () => void;
  active?: boolean;
}

const TABS = ["Settings", "Status", "Usage"] as const;
type Tab = (typeof TABS)[number];

export function StatusPanel({ session, onClose, active = true }: Props) {
  const { theme } = useTheme();
  const [tab, setTab] = useState<Tab>("Settings");
  const m = session.getModel();
  const usageLines = formatUsageReport(session).split("\n");

  useInput((_input, key) => {
    if (!active) return;
    if (key.leftArrow) {
      setTab(TABS[(TABS.indexOf(tab) + TABS.length - 1) % TABS.length]!);
    } else if (key.rightArrow) {
      setTab(TABS[(TABS.indexOf(tab) + 1) % TABS.length]!);
    } else if (key.escape) {
      onClose();
    }
  });

  return (
    <Box flexDirection="column" borderStyle="round" paddingX={1} marginY={1}>
      <Box>
        {TABS.map((t) => (
          <Text key={t} bold={t === tab} color={t === tab ? theme.colors.secondary : theme.colors.primary}>
            {` ${t} `}
          </Text>
        ))}
      </Box>

      <Box><Text color={theme.colors.dimmed}>{"─".repeat(50)}</Text></Box>

      {tab === "Settings" && (
        <Box flexDirection="column">
          <Text>Auto-compact:            true</Text>
          <Text>Thinking mode:           {session.getThinkingLevel() !== "off" ? "true" : "false"}</Text>
          <Text>Fast mode:               false</Text>
          <Text>Default permission mode: {session.getPermissionMode()}</Text>
          <Text>Theme:                   dark</Text>
        </Box>
      )}

      {tab === "Status" && (
        <Box flexDirection="column">
          <Text>Version:         koCode v0.1.0</Text>
          <Text>Session name:    {session.getSessionId().slice(0, 8)}</Text>
          <Text>Session ID:      {session.getSessionId()}</Text>
          <Text>cwd:             {session.getCwd()}</Text>
          <Text>Model:           {m.provider}/{m.id}</Text>
          <Text>API base URL:    {m.baseUrl ?? "N/A"}</Text>
          <Text>Context window:  {m.contextWindow ? `${Math.round(m.contextWindow / 1000)}k` : "N/A"}</Text>
          <Text>Permission:      {session.getPermissionMode()}</Text>
          <Text>Running:         {session.isRunning() ? "Yes" : "No"}</Text>
        </Box>
      )}

      {tab === "Usage" && (
        <Box flexDirection="column">
          {usageLines.map((line, index) => (
            <Text key={index}>{line}</Text>
          ))}
        </Box>
      )}

      <Box marginTop={1}>
        <Text color={theme.colors.dimmed}>{"←/→"} to switch tabs · Esc to close</Text>
      </Box>
    </Box>
  );
}
