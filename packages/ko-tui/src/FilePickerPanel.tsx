import React from "react";
import { Box, Text } from "ink";
import type { FileCandidate } from "./file-picker.js";
import { useTheme } from "./theme.js";

interface Props {
  candidates: FileCandidate[];
  selectedIndex: number;
}

const WINDOW_SIZE = 6;

export interface FormattedFileRow {
  key: string;
  selected: boolean;
  line: string;
}

export function formatFileRows(candidates: FileCandidate[], selectedIndex: number): FormattedFileRow[] {
  return candidates.map((candidate, index) => {
    const selected = index === selectedIndex;
    const prefix = selected ? "❯ " : "  ";
    return {
      key: candidate.path,
      selected,
      line: `${prefix}${candidate.path}`,
    };
  });
}

export function filePickerWindow(total: number, selectedIndex: number): { start: number; end: number } {
  let start = Math.max(0, selectedIndex - Math.floor(WINDOW_SIZE / 2));
  const end = Math.min(total, start + WINDOW_SIZE);
  if (end === total) {
    start = Math.max(0, total - WINDOW_SIZE);
  }
  return { start, end };
}

export function FilePickerPanel({ candidates, selectedIndex }: Props) {
  const { theme } = useTheme();
  if (candidates.length === 0) {
    return (
      <Box>
        <Text color={theme.colors.dimmed}>No matching files</Text>
      </Box>
    );
  }

  const total = candidates.length;
  const { start, end } = filePickerWindow(total, selectedIndex);
  const rows = formatFileRows(candidates.slice(start, end), selectedIndex - start);

  return (
    <Box flexDirection="column">
      {start > 0 && (
        <Box>
          <Text color={theme.colors.dimmed}>{"  ↑"} {start} more above</Text>
        </Box>
      )}

      {rows.map((row) => (
        <Box key={row.key}>
          {row.selected ? (
            <Text color={theme.colors.secondary} bold>{row.line}</Text>
          ) : (
            <Text>{row.line}</Text>
          )}
        </Box>
      ))}

      {end < total && (
        <Box>
          <Text color={theme.colors.dimmed}>{"  ↓"} {total - end} more below</Text>
        </Box>
      )}
    </Box>
  );
}
