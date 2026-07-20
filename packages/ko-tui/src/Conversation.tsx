import React, { useEffect, useMemo } from "react";
import { Box, Text } from "ink";
import type { AgentSessionEvent } from "@kocode/ko-agent";
import { useTurns } from "./useTurns.js";
import { Turn } from "./Turn.js";
import { Welcome } from "./Welcome.js";
import type { Model } from "@kocode/ko-ai";
import { turnExpandableBlockKeys } from "./types.js";

interface Props {
  events: AgentSessionEvent[];
  model: Model;
  cwd: string;
  focusedBlockKey?: string | null;
  expandedBlockIds?: Set<string>;
  onExpandableBlockKeysChange?: (keys: string[]) => void;
}

export function Conversation({ events, model, cwd, focusedBlockKey, expandedBlockIds, onExpandableBlockKeysChange }: Props) {
  const { completedTurns, activeTurn, pendingNotices } = useTurns(events);
  const turns = useMemo(
    () => (activeTurn ? [...completedTurns, activeTurn] : completedTurns),
    [completedTurns, activeTurn],
  );
  const expandableBlockKeys = useMemo(
    () => turns.flatMap((turn) => turnExpandableBlockKeys(turn)),
    [turns],
  );

  useEffect(() => {
    if (!onExpandableBlockKeysChange) return;
    onExpandableBlockKeysChange(expandableBlockKeys);
  }, [onExpandableBlockKeysChange, expandableBlockKeys]);

  const hasContent = completedTurns.length > 0 || activeTurn !== null;

  if (!hasContent) {
    return <Welcome model={model} cwd={cwd} />;
  }

  return (
    <Box flexDirection="column" paddingY={0}>
      {pendingNotices.map((notice) => (
        <Box key={notice.key} paddingY={0}>
          <Text dimColor>▸ {notice.summary}</Text>
        </Box>
      ))}
      {completedTurns.map((turn) => (
        <Turn
          key={turn.id}
          turn={turn}
          focusedBlockKey={focusedBlockKey}
          expandedBlockIds={expandedBlockIds}
        />
      ))}
      {activeTurn && (
        <Turn
          turn={activeTurn}
          streaming
          focusedBlockKey={focusedBlockKey}
          expandedBlockIds={expandedBlockIds}
        />
      )}
    </Box>
  );
}
