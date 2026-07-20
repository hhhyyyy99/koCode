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

function truncate(text: string, max = 60): string {
  return text.length > max ? text.slice(0, max - 3) + "..." : text;
}

function firstShortStringField(input: Record<string, any>): string | undefined {
  for (const value of Object.values(input)) {
    if (typeof value === "string" && value.trim()) {
      return truncate(value.replace(/\s+/g, " ").trim(), 60);
    }
  }
  return undefined;
}

/** Pick a human-readable key parameter for the title line (not a full JSON dump). */
export function formatToolParams(input: Record<string, any>): string {
  const entries = Object.entries(input ?? {});
  if (entries.length === 0) return "";

  const preferredKeys = [
    "file_path",
    "path",
    "command",
    "pattern",
    "query",
    "glob",
    "include",
    "target",
  ];
  const key = preferredKeys
    .map((name) => entries.find(([k]) => k === name))
    .find(Boolean);

  if (key) {
    const raw = typeof key[1] === "string" ? key[1] : String(key[1]);
    const val =
      key[0] === "file_path" || key[0] === "path"
        ? raw.replace(/^\.\//, "")
        : raw;
    return truncate(val, 60);
  }

  const short = firstShortStringField(input);
  return short ?? "";
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

function pathLabel(filePath: string | undefined): string {
  return (filePath ?? "").replace(/^\.\//, "") || "file";
}

function countMatches(resultText: string): { matches: number; files: number } {
  const lines = splitDisplayLines(resultText).filter((l) => l.trim());
  if (lines.length === 0) return { matches: 0, files: 0 };
  // Heuristic: lines that look like "path:line:..." or plain paths
  const fileSet = new Set<string>();
  let matches = 0;
  for (const line of lines) {
    const m = line.match(/^([^:]+\.[^:]+):/);
    if (m) fileSet.add(m[1]!);
    matches += 1;
  }
  return { matches, files: fileSet.size || (matches > 0 ? 1 : 0) };
}

export function editChangeScale(oldStr: string, newStr: string): string {
  const removed = lineCount(oldStr);
  const added = lineCount(newStr);
  if (removed === 0 && added === 0) return "0 lines changed";
  if (removed === added) return `${added} line${added === 1 ? "" : "s"} changed`;
  return `-${removed}/+${added}`;
}

/** Collapsed human-readable summary. Status `done` means success. */
export function toolSummary(toolCall: ToolCallState): string {
  const resultText = toolCall.result?.content ?? "";
  const resultLines = splitDisplayLines(resultText);
  const filePath = toolCall.input?.file_path as string | undefined;
  const path = (toolCall.input?.path as string | undefined) ?? filePath;

  if (toolCall.status !== "done" && toolCall.status !== "error") return "";
  if (toolCall.status === "error") {
    return resultText ? `Error: ${resultText.slice(0, 80)}` : "Error";
  }

  switch (toolCall.name) {
    case "read": {
      if (!resultText) return path ? `Read ${pathLabel(path)}` : "Read 0 lines";
      const n = resultLines.length;
      return `Read ${n} line${n === 1 ? "" : "s"}`;
    }
    case "write": {
      const count = lineCount(String(toolCall.input?.content ?? ""));
      return `Wrote ${count} line${count === 1 ? "" : "s"} to ${pathLabel(filePath)}`;
    }
    case "edit": {
      const oldStr = String(toolCall.input?.old_string ?? "");
      const newStr = String(toolCall.input?.new_string ?? "");
      const scale = editChangeScale(oldStr, newStr);
      return `Edited ${pathLabel(filePath)} (${scale})`;
    }
    case "bash": {
      if (!resultText) return "Done";
      // Short gist only — never dump full stdout as primary summary
      const firstLine = resultLines[0] ?? "";
      const gist = firstLine.replace(/\s+/g, " ").trim() || resultText.replace(/\s+/g, " ").trim();
      return truncate(gist, 80);
    }
    case "grep": {
      const pattern = String(toolCall.input?.pattern ?? "");
      const { matches, files } = countMatches(resultText);
      if (matches === 0) {
        return pattern ? `No matches for ${truncate(pattern, 40)}` : "No matches";
      }
      const scale = files > 1 ? `${matches} hits in ${files} files` : `${matches} match${matches === 1 ? "" : "es"}`;
      return pattern ? `${truncate(pattern, 30)} · ${scale}` : scale;
    }
    case "find": {
      const query =
        (toolCall.input?.pattern as string | undefined) ??
        (toolCall.input?.query as string | undefined) ??
        (toolCall.input?.glob as string | undefined) ??
        "";
      const n = resultLines.filter((l) => l.trim()).length;
      const scale = `${n} result${n === 1 ? "" : "s"}`;
      return query ? `${truncate(query, 30)} · ${scale}` : scale;
    }
    case "ls": {
      const target = pathLabel(path ?? (toolCall.input?.target as string | undefined) ?? ".");
      const n = resultLines.filter((l) => l.trim()).length;
      return `${target} · ${n} entr${n === 1 ? "y" : "ies"}`;
    }
    default: {
      // Unknown / MCP: human name context is in title; summary is short result or key field
      if (resultText) {
        const gist = resultLines[0]?.replace(/\s+/g, " ").trim() || resultText.replace(/\s+/g, " ").trim();
        return truncate(gist, 80);
      }
      const short = firstShortStringField(toolCall.input ?? {});
      return short ?? "Done";
    }
  }
}

export function toolTitle(toolCall: ToolCallState, focused: boolean): string {
  const params = formatToolParams(toolCall.input ?? {});
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
  const titleText = toolTitle(toolCall, focused);

  const symbolColor = toolCall.status === "running" ? theme.colors.warning
    : toolCall.status === "done" ? theme.colors.success
    : toolCall.status === "error" ? theme.colors.error
    : theme.colors.warning;

  const resultText = toolCall.result?.content ?? "";
  const resultLines = splitDisplayLines(resultText);
  const isTruncated = !expanded && resultLines.length > MAX_COLLAPSED_LINES;
  const displayLines = isTruncated ? resultLines.slice(0, MAX_COLLAPSED_LINES) : resultLines;

  const summary = toolSummary(toolCall);

  return (
    <Box flexDirection="column" paddingX={0} marginTop={1}>
      <Box>
        <Text color={focused ? theme.colors.secondary : symbolColor} bold>{titleText}</Text>
      </Box>

      {toolCall.status === "running" && (
        <Box paddingLeft={2}>
          <Text color={theme.colors.warning}>Running...</Text>
        </Box>
      )}

      {summary && !expanded && (
        <Box paddingLeft={2}>
          <Text color={symbolColor}>{"⎿"} {summary}</Text>
        </Box>
      )}

      {expanded && toolCall.status !== "running" && (
        <Box flexDirection="column" paddingLeft={2}>
          {hasDiff ? (
            <Box flexDirection="column">
              {renderDiff(
                toolCall.input!.old_string as string,
                toolCall.input!.new_string as string,
                theme.colors,
              )}
              <Text color={theme.colors.dimmed}>ctrl+o to collapse</Text>
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
