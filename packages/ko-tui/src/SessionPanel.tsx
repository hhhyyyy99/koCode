import React, { useMemo, useState } from "react";
import { Box, Text, useInput } from "ink";
import type { BranchInfo, SessionSummary } from "@kocode/ko-agent";
import { useTheme } from "./theme.js";

interface BranchProps {
  mode: "branch";
  branches: BranchInfo[];
  active?: boolean;
  onClose: () => void;
}

interface ResumeProps {
  mode: "resume";
  sessions: SessionSummary[];
  active?: boolean;
  onClose: () => void;
  onSelect: (session: SessionSummary) => void;
}

type Props = BranchProps | ResumeProps;

const WINDOW_SIZE = 8;

export function SessionPanel(props: Props) {
  const { theme } = useTheme();
  const [selected, setSelected] = useState(0);
  const items = props.mode === "branch" ? props.branches : props.sessions;
  const title = props.mode === "branch" ? "Branches" : "Resume Session";

  useInput((_input, key) => {
    if (!props.active) return;
    if (key.escape) {
      props.onClose();
      return;
    }
    if (items.length === 0) return;
    if (key.downArrow) {
      setSelected((prev) => (prev + 1) % items.length);
      return;
    }
    if (key.upArrow) {
      setSelected((prev) => (prev - 1 + items.length) % items.length);
      return;
    }
    if (props.mode === "resume" && key.return) {
      props.onSelect(props.sessions[selected]!);
    }
  });

  const windowed = useMemo(() => {
    const start = Math.max(0, Math.min(selected - Math.floor(WINDOW_SIZE / 2), Math.max(0, items.length - WINDOW_SIZE)));
    return { start, visible: items.slice(start, start + WINDOW_SIZE) };
  }, [items, selected]);

  return (
    <Box flexDirection="column" borderStyle="round" paddingX={1} marginY={1}>
      <Text bold color={theme.colors.primary}>{title}</Text>
      <Text color={theme.colors.dimmed}>{props.mode === "branch" ? "Current branch is marked with *" : "↑/↓ select · Enter resume · Esc close"}</Text>
      <Box><Text color={theme.colors.dimmed}>{"─".repeat(56)}</Text></Box>
      {items.length === 0 ? (
        <Text color={theme.colors.dimmed}>{props.mode === "branch" ? "No branches" : "No saved sessions"}</Text>
      ) : windowed.visible.map((item, offset) => {
        const absoluteIndex = windowed.start + offset;
        const active = absoluteIndex === selected;
        return props.mode === "branch" ? (
          <BranchRow key={`${(item as BranchInfo).sessionId}-${absoluteIndex}`} branch={item as BranchInfo} active={active} />
        ) : (
          <SessionRow key={(item as SessionSummary).id} session={item as SessionSummary} active={active} />
        );
      })}
    </Box>
  );
}

function BranchRow({ branch, active }: { branch: BranchInfo; active: boolean }) {
  const { theme } = useTheme();
  const marker = active ? "❯" : " ";
  const current = branch.current ? "*" : " ";
  return (
    <Text color={active ? theme.colors.secondary : theme.colors.primary} bold={active}>
      {marker} {current} {branch.name.padEnd(22)} {branch.sessionId.slice(0, 8)}
    </Text>
  );
}

function SessionRow({ session, active }: { session: SessionSummary; active: boolean }) {
  const { theme } = useTheme();
  const marker = active ? "❯" : " ";
  const date = new Date(session.lastAccessTime).toLocaleString();
  return (
    <Text color={active ? theme.colors.secondary : theme.colors.primary} bold={active}>
      {marker} {session.name.padEnd(14)} {session.model.padEnd(24)} turns {String(session.turnCount).padStart(2)}  {date}
    </Text>
  );
}
