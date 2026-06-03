import React, { useMemo, useState } from "react";
import { Box, Text, useInput } from "ink";
import { getBuiltinThemes, getTheme, useTheme, type ThemeName } from "./theme.js";

interface ThemeOption {
  name: ThemeName;
  label: string;
}

const OPTIONS: ThemeOption[] = [
  { name: "auto", label: "Auto (match terminal)" },
  { name: "dark", label: "Dark mode" },
  { name: "light", label: "Light mode" },
  { name: "dark-colorblind", label: "Dark mode (colorblind-friendly)" },
  { name: "light-colorblind", label: "Light mode (colorblind-friendly)" },
  { name: "ansi-dark", label: "Dark mode (ANSI colors only)" },
  { name: "ansi-light", label: "Light mode (ANSI colors only)" },
];

export function getThemeOptions(): ThemeOption[] {
  return OPTIONS;
}

interface Props {
  active: boolean;
  onClose: () => void;
  onSelect: (name: ThemeName) => void;
}

export function ThemePanel({ active, onClose, onSelect }: Props) {
  const { theme } = useTheme();
  const initialIndex = Math.max(0, OPTIONS.findIndex((option) => option.name === theme.name));
  const [selected, setSelected] = useState(initialIndex);
  const previewTheme = useMemo(() => getTheme(OPTIONS[selected]?.name ?? theme.name) ?? theme, [selected, theme]);

  useInput((_input, key) => {
    if (!active) return;
    if (key.escape) {
      onClose();
      return;
    }
    if (key.downArrow || key.tab) {
      setSelected((prev) => (prev + 1) % OPTIONS.length);
      return;
    }
    if (key.upArrow) {
      setSelected((prev) => (prev > 0 ? prev - 1 : OPTIONS.length - 1));
      return;
    }
    if (key.return) {
      onSelect(OPTIONS[selected]!.name);
    }
  });

  return (
    <Box borderStyle="round" paddingX={1} flexDirection="column">
      <Text bold color={theme.colors.primary}>Theme</Text>
      <Text color={theme.colors.dimmed}>↑/↓ select · Enter apply · Esc close</Text>
      <Box><Text color={theme.colors.dimmed}>{"─".repeat(48)}</Text></Box>
      {OPTIONS.map((option, index) => {
        const isSelected = index === selected;
        const isCurrent = option.name === theme.name;
        return (
          <Text key={option.name} color={isSelected ? theme.colors.secondary : theme.colors.primary} bold={isSelected}>
            {isSelected ? "❯" : " "} {isCurrent ? "✔" : " "} {option.label}
          </Text>
        );
      })}
      <Box marginTop={1} flexDirection="column">
        <Text color={theme.colors.dimmed}>Preview</Text>
        <Text color={previewTheme.colors.secondary}>function greet(name: string) {"{"}</Text>
        <Text color={previewTheme.colors.dimmed}>  // selected theme preview</Text>
        <Text>  return <Text color={previewTheme.colors.success}>{"`hello ${name}`"}</Text>;</Text>
        <Text color={previewTheme.colors.secondary}>{"}"}</Text>
        <Text color={previewTheme.colors.warning}>● Running tool</Text>
        <Text color={previewTheme.colors.error}>✗ Error state</Text>
      </Box>
    </Box>
  );
}
