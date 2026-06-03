import React from "react";
import { Box, Text } from "ink";
import type { Model } from "@kocode/ko-ai";

interface Props {
  model: Model;
  cwd: string;
}

export function formatWelcomeLines(model: Model, cwd: string): string[] {
  const modelInfo = `${model.provider}/${model.id}`;
  const contextInfo = model.contextWindow
    ? ` · ${Math.round(model.contextWindow / 1000)}k context`
    : "";

  return [
    "▐▛███▜▌",
    "▝▜█████▛▘",
    "  ▘▘ ▝▝",
    "Welcome to koCode!",
    `${modelInfo}${contextInfo}`,
    cwd,
    "Tips for getting started:",
    "  /help   — Show available commands",
    "  /model  — Switch model (/model <provider/id>)",
    "  /clear  — Clear conversation",
    "  !ls     — Run shell commands directly",
    "  #note   — Save a memory to CLAUDE.md",
  ];
}

export function Welcome({ model, cwd }: Props) {
  const lines = formatWelcomeLines(model, cwd);

  return (
    <Box flexDirection="column" paddingY={1}>
      <Box flexDirection="column">
        <Text dimColor>{lines[0]}</Text>
        <Text dimColor>{lines[1]}</Text>
        <Text dimColor>{lines[2]}</Text>
      </Box>
      <Box marginTop={1}>
        <Text bold>{lines[3]}</Text>
      </Box>
      <Box marginTop={1}>
        <Text dimColor>
          {lines[4]}
        </Text>
      </Box>
      <Box>
        <Text dimColor>{lines[5]}</Text>
      </Box>
      <Box marginTop={1} flexDirection="column">
        <Text dimColor>{lines[6]}</Text>
        <Text dimColor>{lines[7]}</Text>
        <Text dimColor>  /model  — Switch model (/model {"<provider/id>"})</Text>
        <Text dimColor>{lines[9]}</Text>
        <Text dimColor>{lines[10]}</Text>
        <Text dimColor>{lines[11]}</Text>
      </Box>
    </Box>
  );
}
