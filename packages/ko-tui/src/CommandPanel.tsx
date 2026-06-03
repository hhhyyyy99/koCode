import React from "react";
import { Box, Text } from "ink";
import type { CommandDef } from "./commands.js";
import { useTheme } from "./theme.js";

interface Props {
  commands: CommandDef[];
  selectedIndex: number;
}

const WINDOW_SIZE = 6;

export function CommandPanel({ commands, selectedIndex }: Props) {
  const { theme } = useTheme();
  if (commands.length === 0) {
    return (
      <Box borderStyle="round" paddingX={1}>
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

  return (
    <Box flexDirection="column" borderStyle="round" paddingX={1}>
      {showUp && (
        <Box>
          <Text color={theme.colors.dimmed}>{"  ↑"} {start} more above</Text>
        </Box>
      )}

      {visible.map((cmd, i) => {
        const absoluteIndex = start + i;
        const isSelected = absoluteIndex === selectedIndex;
        return (
          <Box key={cmd.name}>
            {isSelected ? (
              <Text color={theme.colors.secondary} bold>
                ❯ {cmd.name.padEnd(26)}
                <Text color={theme.colors.dimmed}>{cmd.description}</Text>
              </Text>
            ) : (
              <Text>
                {"  "}{cmd.name.padEnd(26)}
                <Text color={theme.colors.dimmed}>{cmd.description}</Text>
              </Text>
            )}
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
