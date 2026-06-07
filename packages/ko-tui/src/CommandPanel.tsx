import React from "react";
import { Box, Text } from "ink";
import type { CommandDef } from "./commands.js";
import { useTheme } from "./theme.js";

interface Props {
  commands: CommandDef[];
  selectedIndex: number;
  width?: number;
}

const WINDOW_SIZE = 6;
const COMMAND_COLUMN_WIDTH = 30;
const PREFIX_WIDTH = 2;

export interface FormattedCommandRow {
  key: string;
  selected: boolean;
  commandLine: string;
  metadataLine?: string;
}

export function wrapText(text: string, width: number): string[] {
  if (width <= 0 || text.length <= width) return [text];

  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    if (word.length > width) {
      if (current) {
        lines.push(current);
        current = "";
      }
      for (let i = 0; i < word.length; i += width) {
        lines.push(word.slice(i, i + width));
      }
      continue;
    }

    const next = current ? `${current} ${word}` : word;
    if (next.length > width) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }

  if (current) lines.push(current);
  return lines.length > 0 ? lines : [""];
}

export function formatCommandRows(
  commands: CommandDef[],
  selectedIndex: number,
  width = 80,
): FormattedCommandRow[] {
  const descriptionWidth = Math.max(20, width - PREFIX_WIDTH - COMMAND_COLUMN_WIDTH);

  return commands.map((cmd, index) => {
    const selected = index === selectedIndex;
    const prefix = selected ? "❯ " : "  ";
    const command = cmd.name.padEnd(COMMAND_COLUMN_WIDTH);
    const descriptionLines = wrapText(cmd.description, descriptionWidth);
    const continuationPrefix = " ".repeat(PREFIX_WIDTH + COMMAND_COLUMN_WIDTH);
    const commandLine = [
      `${prefix}${command}${descriptionLines[0] ?? ""}`,
      ...descriptionLines.slice(1).map((line) => `${continuationPrefix}${line}`),
    ].join("\n");

    return {
      key: cmd.name,
      selected,
      commandLine,
      metadataLine: cmd.source ? `${continuationPrefix}(${cmd.source})` : undefined,
    };
  });
}

export function CommandPanel({ commands, selectedIndex, width = 80 }: Props) {
  const { theme } = useTheme();
  if (commands.length === 0) {
    return (
      <Box>
        <Text color={theme.colors.dimmed}>No matching commands</Text>
      </Box>
    );
  }

  // Sliding window: keep selectedIndex visible within a fixed-height window
  const total = commands.length;
  let start = Math.max(0, selectedIndex - Math.floor(WINDOW_SIZE / 2));
  const end = Math.min(total, start + WINDOW_SIZE);
  // Adjust start if we're near the end
  if (end === total) {
    start = Math.max(0, total - WINDOW_SIZE);
  }

  const visible = commands.slice(start, end);
  const showUp = start > 0;
  const showDown = end < total;
  const rows = formatCommandRows(visible, selectedIndex - start, width);

  return (
    <Box flexDirection="column">
      {showUp && (
        <Box>
          <Text color={theme.colors.dimmed}>{"  ↑"} {start} more above</Text>
        </Box>
      )}

      {rows.map((row) => {
        return (
          <Box key={row.key} flexDirection="column">
            {row.selected ? (
              <Text color={theme.colors.secondary} bold>
                {row.commandLine}
              </Text>
            ) : (
              <Text>
                {row.commandLine}
              </Text>
            )}
            {row.metadataLine && <Text color={theme.colors.dimmed}>{row.metadataLine}</Text>}
          </Box>
        );
      })}

      {showDown && (
        <Box>
          <Text color={theme.colors.dimmed}>{"  ↓"} {total - end} more below</Text>
        </Box>
      )}
    </Box>
  );
}
