import React from "react";
import { Box, Text } from "ink";
import type { PermissionMode } from "@kocode/ko-agent";
import { useTheme } from "./theme.js";

interface Props {
  running: boolean;
  permissionMode: PermissionMode;
  width?: number;
}

const MODE_LABELS: Record<PermissionMode, string> = {
  default: "◉ Default",
  accept_edits: "◉ Accept Edits",
  auto: "◉ Auto",
};

export function StatusBar({ running, permissionMode, width = 60 }: Props) {
  const { theme } = useTheme();
  const left = "  ? for shortcuts";
  const right = running ? "● Running..." : MODE_LABELS[permissionMode] ?? "◉ Default";
  const padding = Math.max(1, width - left.length - right.length);

  return (
    <Box paddingX={0}>
      <Text color={theme.colors.dimmed}>{left}</Text>
      <Text>{" ".repeat(padding)}</Text>
      <Text color={running ? theme.colors.warning : theme.colors.primary}>{right}</Text>
    </Box>
  );
}
