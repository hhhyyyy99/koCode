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
  const hasThinking = turn.assistant.thinkingBlocks.length > 0;
  const hasText = turn.assistant.textContent.length > 0;
  const hasTools = turn.assistant.toolCalls.length > 0;
  const hasAssistant = hasThinking || hasText || hasTools;

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

      {hasThinking &&
        turn.assistant.thinkingBlocks.map((tb, i) => (
          <ThinkingBlock
            key={`think-${turn.id}-${i}`}
            content={tb.content}
            focused={false}
          />
        ))}

      {hasText && <AssistantBlock text={turn.assistant.textContent} />}

      {hasTools &&
        turn.assistant.toolCalls.map((tc) => {
          const key = tc.key;
          return (
            <ToolCallCard
              key={key}
              toolCall={tc}
              focused={toolFocusKey === key}
              expanded={expandedToolIds?.has(tc.key) ?? false}
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
