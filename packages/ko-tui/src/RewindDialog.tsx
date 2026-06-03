import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import { useTheme } from "./theme.js";

interface Props {
  active?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function rewindDialogOptions(): string[] {
  return ["Yes", "No"];
}

export function RewindDialog({ active = true, onConfirm, onCancel }: Props) {
  const { theme } = useTheme();
  const [selected, setSelected] = useState(0);
  const options = rewindDialogOptions();

  useInput((_input, key) => {
    if (!active) return;
    if (_input === "1") {
      onConfirm();
      return;
    }
    if (_input === "2") {
      onCancel();
      return;
    }
    if (key.upArrow || key.downArrow || key.tab) {
      setSelected((prev) => (prev === 0 ? 1 : 0));
      return;
    }
    if (key.return) {
      if (selected === 0) onConfirm();
      else onCancel();
      return;
    }
    if (key.escape) onCancel();
  });

  return (
    <Box flexDirection="column" borderStyle="round" paddingX={1} marginY={1}>
      <Text bold color={theme.colors.primary}>Rewind checkpoint</Text>
      <Box marginTop={1}>
        <Text>Rewind to before the last change?</Text>
      </Box>
      {options.map((option, index) => (
        <Text key={option} color={selected === index ? theme.colors.secondary : theme.colors.primary} bold={selected === index}>
          {selected === index ? "❯" : " "} {index + 1}. {option}
        </Text>
      ))}
      <Box marginTop={1}>
        <Text color={theme.colors.dimmed}>Esc to cancel · Enter to confirm</Text>
      </Box>
    </Box>
  );
}
