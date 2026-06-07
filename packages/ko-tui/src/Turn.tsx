import React from "react";
import { Box, Text } from "ink";
import type { Turn as TurnType } from "./types.js";
import { UserBubble } from "./UserBubble.js";
import { AssistantBlock } from "./AssistantBlock.js";
import { ToolCallCard } from "./ToolCallCard.js";
import { ThinkingBlock } from "./ThinkingBlock.js";
import { useTheme } from "./theme.js";

interface Props {
  turn: TurnType;
  streaming?: boolean;
  toolFocusKey?: string | null;
  expandedToolIds?: Set<string>;
}

function completionVerb(durationMs: number): string {
  const s = durationMs / 1000;
  if (s < 5) return "Cooked";
  if (s < 20) return "Baked";
  if (s < 60) return "Crunched";
  return "Stewed";
}

function formatDuration(ms: number): string {
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rs = s % 60;
  return rs > 0 ? `${m}m ${rs}s` : `${m}m`;
}

export function Turn({ turn, streaming, toolFocusKey, expandedToolIds }: Props) {
  const { theme } = useTheme();
  const hasAssistant = turn.assistant.items.length > 0;

  return (
    <Box flexDirection="column" paddingY={0}>
      <UserBubble
        content={turn.userMessage.content}
        images={turn.userMessage.images}
      />

      {hasAssistant && (
        <Box>
          <Text color={theme.colors.dimmed}>{"─".repeat(40)}</Text>
        </Box>
      )}

      {turn.assistant.items.map((item) => {
        if (item.type === "thinking") {
          return (
            <ThinkingBlock
              key={item.key}
              content={item.content}
              focused={false}
            />
          );
        }

        if (item.type === "text") {
          return <AssistantBlock key={item.key} text={item.content} />;
        }

        const key = item.toolCall.key;
        return (
          <ToolCallCard
            key={key}
            toolCall={item.toolCall}
            focused={toolFocusKey === key}
            expanded={expandedToolIds?.has(key) ?? false}
          />
        );
      })}

      {streaming && turn.status === "streaming" && (
        <Box paddingY={0}>
          <Text color={theme.colors.warning}>●</Text>
        </Box>
      )}

      {turn.errorMessage && (
        <Box paddingY={0}>
          <Text color={theme.colors.error}>Error: {turn.errorMessage}</Text>
        </Box>
      )}

      {turn.status === "complete" && turn.startedAt && turn.completedAt && (
        <Box paddingY={0}>
          <Text color={theme.colors.success}>{"✻"} {completionVerb(turn.completedAt - turn.startedAt)} for {formatDuration(turn.completedAt - turn.startedAt)}</Text>
        </Box>
      )}
    </Box>
  );
}
