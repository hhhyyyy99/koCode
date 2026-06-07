import React from "react";
import { Box, Text } from "ink";
import { useTheme } from "./theme.js";

interface Props {
  content: string;
  focused: boolean;
  expanded: boolean;
}

export const THINKING_PREVIEW_LENGTH = 80;

export function thinkingToggleHint(expanded: boolean): string {
  return `ctrl+o to ${expanded ? "collapse" : "expand"}`;
}

export function formatThinkingPreview(content: string): string {
  const normalized = content.replace(/\s+/g, " ").trim();
  if (normalized.length <= THINKING_PREVIEW_LENGTH) return normalized;
  return `${normalized.slice(0, THINKING_PREVIEW_LENGTH - 3)}...`;
}

export function thinkingCollapsedLine(content: string, focused: boolean): string {
  const prefix = focused ? "❯" : "💭";
  return `${prefix} ${formatThinkingPreview(content)} (${thinkingToggleHint(false)})`;
}

export function thinkingExpandedHeader(focused: boolean): string {
  const prefix = focused ? "❯" : "💭";
  return `${prefix} Thinking (${thinkingToggleHint(true)})`;
}

export function ThinkingBlock({ content, focused, expanded }: Props) {
  const { theme } = useTheme();
  if (!content) return null;
  const headerColor = focused ? theme.colors.secondary : theme.colors.dimmed;

  return (
    <Box flexDirection="column" paddingX={2}>
      {expanded ? (
        <Box flexDirection="column">
          <Text color={headerColor} bold={focused}>{thinkingExpandedHeader(focused)}</Text>
          <Text color={theme.colors.dimmed}>{content}</Text>
        </Box>
      ) : (
        <Text color={headerColor} bold={focused}>
          {thinkingCollapsedLine(content, focused)}
        </Text>
      )}
    </Box>
  );
}
