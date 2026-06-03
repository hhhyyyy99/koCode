import React, { useState } from "react";
import { Box, Text, useInput } from "ink";

interface Props {
  content: string;
  focused: boolean;
}

export function ThinkingBlock({ content, focused }: Props) {
  const [expanded, setExpanded] = useState(false);

  useInput((_input, key) => {
    if (focused && key.return) {
      setExpanded((prev) => !prev);
    }
  });

  if (!content) return null;

  return (
    <Box flexDirection="column" paddingX={2}>
      {expanded ? (
        <Box flexDirection="column">
          <Text dimColor>💭 Thinking:</Text>
          <Text dimColor>{content.slice(0, 1000)}</Text>
        </Box>
      ) : (
        <Text dimColor>
          💭 {content.slice(0, 80).replace(/\n/g, " ")}...
        </Text>
      )}
    </Box>
  );
}
