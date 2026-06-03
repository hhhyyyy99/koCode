import React from "react";
import { Box, Text } from "ink";
import type { Model } from "@kocode/ko-ai";
import { useTheme } from "./theme.js";

interface Props {
  model: Model;
  cwd: string;
  version?: string;
  hasContent?: boolean;
}

const VERSION = "0.1.0";

export function formatHeaderLines(model: Model, cwd: string, version = VERSION, hasContent = false): string[] {
  const modelInfo = `${model.provider}/${model.id}`;
  const contextInfo = model.contextWindow
    ? `${Math.round(model.contextWindow / 1000)}k context`
    : "";

  if (hasContent) {
    return [
      `koCode v${version} · ${modelInfo}${contextInfo ? ` · ${contextInfo}` : ""}`,
      cwd,
    ];
  }

  return [
    `koCode v${version}`,
    `${modelInfo}${contextInfo ? ` · ${contextInfo}` : ""}`,
    cwd,
  ];
}

export function Header({ model, cwd, version = VERSION, hasContent = false }: Props) {
  const { theme } = useTheme();
  const lines = formatHeaderLines(model, cwd, version, hasContent);

  if (hasContent) {
    return (
      <Box flexDirection="column" paddingX={0}>
        <Box>
          <Text bold color={theme.colors.primary}>koCode v{version}</Text>
          <Text color={theme.colors.dimmed}>{lines[0]!.replace(`koCode v${version}`, "")}</Text>
        </Box>
        <Box>
          <Text color={theme.colors.dimmed}>{lines[1]}</Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" paddingX={0}>
      <Box>
        <Text bold color={theme.colors.primary}>
          {lines[0]}
        </Text>
      </Box>
      <Box>
        <Text color={theme.colors.dimmed}>
          {lines[1]}
        </Text>
      </Box>
      <Box>
        <Text color={theme.colors.dimmed}>{lines[2]}</Text>
      </Box>
    </Box>
  );
}
