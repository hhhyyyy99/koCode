import React from "react";
import { Box, Text } from "ink";
import type { ToolCallState } from "./types.js";
import { useTheme, type ThemeColors } from "./theme.js";

interface Props {
  toolCall: ToolCallState;
  focused: boolean;
  expanded: boolean;
}

export const MAX_COLLAPSED_LINES = 10;

export function splitDisplayLines(text: string): string[] {
  if (text === "") return [];
  return text.replace(/\n$/, "").split("\n");
}

export function formatToolParams(input: Record<string, any>): string {
  const entries = Object.entries(input);
  if (entries.length === 0) return "";
  // Show key params inline: file_path, command, old_string (truncated), pattern
  const key = entries.find(([k]) => ["file_path", "command", "pattern"].includes(k));
  if (key) {
    const raw = typeof key[1] === "string" ? key[1] : JSON.stringify(key[1]);
    const val = key[0] === "file_path" ? raw.replace(/^\.\//, "") : raw;
    return val.length > 60 ? val.slice(0, 57) + "..." : val;
  }
  const first = entries[0]!;
  const val = typeof first[1] === "string" ? first[1] : JSON.stringify(first[1]);
  return val.length > 60 ? val.slice(0, 57) + "..." : val;
}

function renderLinesWithNumbers(text: string): React.ReactNode[] {
  const lines = splitDisplayLines(text);
  const width = Math.max(2, String(lines.length).length);
  return lines.map((line, i) => (
    <Text key={i}>
      {String(i + 1).padStart(width)} {line}
    </Text>
  ));
}

function renderDiff(oldStr: string, newStr: string, colors: ThemeColors): React.ReactNode[] {
  const oldLines = splitDisplayLines(oldStr);
  const newLines = splitDisplayLines(newStr);
  const maxLen = Math.max(oldLines.length, newLines.length);
  const width = Math.max(2, String(maxLen).length);
  const rows: React.ReactNode[] = [];

  for (let i = 0; i < maxLen; i++) {
    const oldLine = oldLines[i];
    const newLine = newLines[i];
    const num = String(i + 1).padStart(width);
    if (oldLine !== undefined && newLine !== undefined && oldLine !== newLine) {
      rows.push(
        <Box key={i} flexDirection="column">
          <Text color={colors.error}>{num} - {oldLine}</Text>
          <Text color={colors.success}>{num} + {newLine}</Text>
        </Box>,
      );
    } else if (oldLine !== undefined) {
      rows.push(<Text key={i} color={colors.error}>{num} - {oldLine}</Text>);
    } else if (newLine !== undefined) {
      rows.push(<Text key={i} color={colors.success}>{num} + {newLine}</Text>);
    }
  }
  return rows;
}

export function toolOverflowHint(extraLines: number, expanded: boolean): string {
  return `… +${extraLines} lines (ctrl+o to ${expanded ? "collapse" : "expand"})`;
}

export function displayToolName(name: string): string {
  switch (name) {
    case "bash": return "Bash";
    case "edit": return "Edit";
    case "write": return "Write";
    case "read": return "Read";
    case "grep": return "Grep";
    case "find": return "Find";
    case "ls": return "Ls";
    default: return name.charAt(0).toUpperCase() + name.slice(1);
  }
}

function lineCount(text: string): number {
  return splitDisplayLines(text).length;
}

export function toolSummary(toolCall: ToolCallState): string {
  const resultText = toolCall.result?.content ?? "";
  const resultLines = splitDisplayLines(resultText);
  const filePath = toolCall.input?.file_path as string | undefined;

  if (toolCall.status !== "done" && toolCall.status !== "error") return "";
  if (toolCall.status === "error") {
    return resultText ? `Error: ${resultText.slice(0, 80)}` : "Error";
  }
  if (toolCall.name === "read" && resultText) {
    const lineCount = resultLines.length;
    return `Read ${lineCount} line${lineCount > 1 ? "s" : ""}`;
  }
  if (toolCall.name === "bash" && resultText) {
    return resultText.length > 80 ? resultText.slice(0, 77) + "..." : resultText;
  }
  if (toolCall.name === "write" && filePath) {
    const count = lineCount(String(toolCall.input?.content ?? ""));
    return `Wrote ${count} line${count === 1 ? "" : "s"} to ${filePath.replace(/^\.\//, "")}`;
  }
  if (toolCall.name === "edit" && filePath) {
    return `Edited ${filePath.replace(/^\.\//, "")}`;
  }
  if (filePath && resultText) {
    return resultText.length > 80 ? resultText.slice(0, 77) + "..." : resultText;
  }
  return "";
}

export function toolTitle(toolCall: ToolCallState, focused: boolean): string {
  const params = formatToolParams(toolCall.input);
  const name = displayToolName(toolCall.name);
  const title = params ? `${name}(${params})` : name;
  const symbol = toolCall.status === "running" ? "●"
    : toolCall.status === "done" ? "✓"
    : toolCall.status === "error" ? "✗"
    : "●";
  return `${focused ? "❯" : symbol} ${title}`;
}

export function ToolCallCard({ toolCall, focused, expanded }: Props) {
  const { theme } = useTheme();

  const isEdit = toolCall.name === "edit";
  const isWrite = toolCall.name === "write";
  const hasDiff = isEdit && toolCall.input?.old_string !== undefined && toolCall.input?.new_string !== undefined;
  // Claude Code-style title: ● ToolName(params)
  const titleText = toolTitle(toolCall, focused);


  const symbolColor = toolCall.status === "running" ? theme.colors.warning
    : toolCall.status === "done" ? theme.colors.success
    : toolCall.status === "error" ? theme.colors.error
    : theme.colors.warning;

  // Result summary for collapsed view
  const resultText = toolCall.result?.content ?? "";
  const resultLines = splitDisplayLines(resultText);
  const isTruncated = !expanded && resultLines.length > MAX_COLLAPSED_LINES;
  const displayLines = isTruncated ? resultLines.slice(0, MAX_COLLAPSED_LINES) : resultLines;

  const summary = toolSummary(toolCall);

  return (
    <Box flexDirection="column" paddingX={0} marginTop={1}>
      {/* ● ToolName(params) — yellow/green/red */}
      <Box>
        <Text color={focused ? theme.colors.secondary : symbolColor} bold>{titleText}</Text>
      </Box>

      {/* Running state */}
      {toolCall.status === "running" && (
        <Box paddingLeft={2}>
          <Text color={theme.colors.warning}>Running...</Text>
        </Box>
      )}

      {/* ⎿ Result summary */}
      {summary && !expanded && (
        <Box paddingLeft={2}>
          <Text color={symbolColor}>{"⎿"} {summary}</Text>
        </Box>
      )}

      {/* Expanded: line-numbered output */}
      {expanded && toolCall.status !== "running" && (
        <Box flexDirection="column" paddingLeft={2}>
          {hasDiff ? (
            <Box flexDirection="column">
              {renderDiff(
                toolCall.input!.old_string as string,
                toolCall.input!.new_string as string,
                theme.colors,
              )}
            </Box>
          ) : isWrite && typeof toolCall.input?.content === "string" ? (
            <Box flexDirection="column">
              {renderLinesWithNumbers(toolCall.input.content)}
              <Text color={theme.colors.dimmed}>ctrl+o to collapse</Text>
            </Box>
          ) : (
            <Box flexDirection="column">
              {displayLines.map((line, i) => (
                <Text key={i}>{String(i + 1).padStart(2)} {line}</Text>
              ))}
              <Text color={theme.colors.dimmed}>ctrl+o to collapse</Text>
            </Box>
          )}
        </Box>
      )}

      {/* Truncation hint when collapsed and has output */}
      {!expanded && toolCall.status !== "running" && resultLines.length > MAX_COLLAPSED_LINES && (
        <Box paddingLeft={2}>
          <Text color={theme.colors.dimmed}>
            {toolOverflowHint(resultLines.length - MAX_COLLAPSED_LINES, false)}
          </Text>
        </Box>
      )}
    </Box>
  );
}
