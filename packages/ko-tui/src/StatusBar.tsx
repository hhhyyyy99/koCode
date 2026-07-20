import React from "react";
import { Box, Text } from "ink";
import type { PermissionMode } from "@kocode/ko-agent";
import { useTheme } from "./theme.js";

export interface StatusBarProps {
  running: boolean;
  permissionMode: PermissionMode;
  width?: number;
  /** Context usage pressure, e.g. "42%" or "12k/200k" */
  contextPressure?: string;
  /** Abbreviated session cost, e.g. "$0.12" */
  costLabel?: string;
  /** Git branch if available */
  gitBranch?: string;
  /** When true (e.g. permission open), footer MAY yield/hide */
  yieldChrome?: boolean;
  /** Override shortcuts hint */
  shortcutsHint?: string;
}

const MODE_LABELS: Record<PermissionMode, { long: string; short: string }> = {
  default: { long: "Default", short: "Def" },
  accept_edits: { long: "Accept Edits", short: "Edit" },
  auto: { long: "Auto", short: "Auto" },
};

export function formatContextPressure(usedTokens: number, contextWindow: number): string {
  if (contextWindow <= 0) return "";
  const pct = Math.min(100, Math.max(0, Math.round((usedTokens / contextWindow) * 100)));
  return `${pct}%`;
}

export function formatCostAbbrev(total: number): string {
  if (!Number.isFinite(total) || total <= 0) return "$0";
  if (total < 0.01) return `$${total.toFixed(3)}`;
  if (total < 10) return `$${total.toFixed(2)}`;
  return `$${total.toFixed(1)}`;
}

export interface StatusBarFieldSet {
  shortcuts: string;
  mode: string;
  running: string | null;
  context: string | null;
  cost: string | null;
  git: string | null;
}

export function buildStatusBarFields(input: {
  running: boolean;
  permissionMode: PermissionMode;
  contextPressure?: string;
  costLabel?: string;
  gitBranch?: string;
  shortcutsHint?: string;
  compactMode?: boolean;
  compactShortcuts?: boolean;
}): StatusBarFieldSet {
  const modeInfo = MODE_LABELS[input.permissionMode] ?? MODE_LABELS.default;
  return {
    shortcuts: input.compactShortcuts
      ? "?"
      : (input.shortcutsHint ?? "? for shortcuts"),
    mode: input.compactMode ? modeInfo.short : modeInfo.long,
    running: input.running ? "Running" : null,
    context: input.contextPressure?.trim() || null,
    cost: input.costLabel?.trim() || null,
    git: input.gitBranch?.trim() || null,
  };
}

/**
 * Narrow drop priority (first dropped → last):
 * git → cost → context long→short (handled by caller form) → shortcuts long→? → mode long→short → running last.
 * Never drop both running and mode.
 */
export function layoutStatusBarLine(fields: StatusBarFieldSet, width: number): string {
  const w = Math.max(20, width);

  type Piece = { id: string; text: string; priority: number };
  const rightPieces: Piece[] = [];
  if (fields.git) rightPieces.push({ id: "git", text: fields.git, priority: 1 });
  if (fields.cost) rightPieces.push({ id: "cost", text: fields.cost, priority: 2 });
  if (fields.context) rightPieces.push({ id: "context", text: fields.context, priority: 3 });
  if (fields.mode) rightPieces.push({ id: "mode", text: fields.mode, priority: 5 });
  if (fields.running) rightPieces.push({ id: "running", text: fields.running, priority: 6 });

  let left = fields.shortcuts;
  let right = [...rightPieces];

  const joinRight = (parts: Piece[]) => parts.map((p) => p.text).join(" · ");
  const fits = (l: string, r: string) => l.length + 1 + r.length <= w;

  // Drop by ascending priority until fits; never drop both running and mode
  while (!fits(left, joinRight(right)) && right.length > 0) {
    const droppable = right
      .filter((p) => {
        if (p.id === "running" && right.some((x) => x.id === "mode")) return false;
        if (p.id === "mode" && right.some((x) => x.id === "running")) return false;
        return true;
      })
      .sort((a, b) => a.priority - b.priority);
    if (droppable.length === 0) break;
    const dropId = droppable[0]!.id;
    right = right.filter((p) => p.id !== dropId);
  }

  // Compress shortcuts if still tight
  if (!fits(left, joinRight(right)) && left.length > 1) {
    left = "?";
  }

  // Compress mode label if still tight and mode present without running-only conflict
  if (!fits(left, joinRight(right))) {
    right = right.map((p) =>
      p.id === "mode" && p.text.length > 4
        ? { ...p, text: p.text.slice(0, 3) }
        : p,
    );
  }

  const rightText = joinRight(right);
  const pad = Math.max(1, w - left.length - rightText.length);
  return `${left}${" ".repeat(pad)}${rightText}`;
}

export function StatusBar({
  running,
  permissionMode,
  width = 60,
  contextPressure,
  costLabel,
  gitBranch,
  yieldChrome = false,
  shortcutsHint,
}: StatusBarProps) {
  const { theme } = useTheme();

  if (yieldChrome) {
    return <Box paddingX={0}><Text color={theme.colors.dimmed}> </Text></Box>;
  }

  // Prefer compact forms when narrow
  const narrow = width < 60;
  const fields = buildStatusBarFields({
    running,
    permissionMode,
    contextPressure,
    costLabel,
    gitBranch,
    shortcutsHint,
    compactMode: narrow,
    compactShortcuts: width < 40,
  });

  const line = layoutStatusBarLine(fields, width);
  const leftLen = fields.shortcuts.length;
  // Color running segment: split roughly by finding Running
  const runningIdx = line.lastIndexOf("Running");
  const modeColor = running ? theme.colors.warning : theme.colors.primary;

  if (runningIdx >= 0) {
    return (
      <Box paddingX={0}>
        <Text color={theme.colors.dimmed}>{line.slice(0, runningIdx)}</Text>
        <Text color={theme.colors.warning}>{line.slice(runningIdx)}</Text>
      </Box>
    );
  }

  // Dim left (shortcuts), primary right
  const padMatch = line.match(/^(.*?)(\s{2,})(.*)$/);
  if (padMatch) {
    return (
      <Box paddingX={0}>
        <Text color={theme.colors.dimmed}>{padMatch[1]}</Text>
        <Text>{padMatch[2]}</Text>
        <Text color={modeColor}>{padMatch[3]}</Text>
      </Box>
    );
  }

  return (
    <Box paddingX={0}>
      <Text color={theme.colors.dimmed}>{line.slice(0, leftLen)}</Text>
      <Text color={modeColor}>{line.slice(leftLen)}</Text>
    </Box>
  );
}
