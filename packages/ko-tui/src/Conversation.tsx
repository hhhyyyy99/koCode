import React, { useEffect, useMemo } from "react";
import { Box, Text } from "ink";
import type { AgentSessionEvent } from "@kocode/ko-agent";
import { useTurns } from "./useTurns.js";
import { Turn } from "./Turn.js";
import { Welcome } from "./Welcome.js";
import type { Model } from "@kocode/ko-ai";
import { turnToolCalls } from "./types.js";

interface Props {
  events: AgentSessionEvent[];
  model: Model;
  cwd: string;
  toolFocusKey?: string | null;
  expandedToolIds?: Set<string>;
  onToolKeysChange?: (keys: string[]) => void;
}

export function Conversation({ events, model, cwd, toolFocusKey, expandedToolIds, onToolKeysChange }: Props) {
  const { completedTurns, activeTurn } = useTurns(events);
  const turns = useMemo(
    () => (activeTurn ? [...completedTurns, activeTurn] : completedTurns),
    [completedTurns, activeTurn],
  );
  const toolKeyList = useMemo(
    () => turns.flatMap((turn) => turnToolCalls(turn).map((tc) => tc.key)),
    [turns],
  );

  useEffect(() => {
    if (!onToolKeysChange) return;
    onToolKeysChange(toolKeyList);
  }, [onToolKeysChange, toolKeyList]);

  const hasContent = completedTurns.length > 0 || activeTurn !== null;

  if (!hasContent) {
    return <Welcome model={model} cwd={cwd} />;
  }

  return (
    <Box flexDirection="column" paddingY={0}>
      {completedTurns.map((turn) => (
        <Turn
          key={turn.id}
          turn={turn}
          toolFocusKey={toolFocusKey}
          expandedToolIds={expandedToolIds}
        />
      ))}
      {activeTurn && (
        <Turn
          turn={activeTurn}
          streaming
          toolFocusKey={toolFocusKey}
          expandedToolIds={expandedToolIds}
        />
      )}
    </Box>
  );
}
