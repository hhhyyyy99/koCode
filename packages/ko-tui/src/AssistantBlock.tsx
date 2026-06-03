import React from "react";
import { Box } from "ink";
import { Markdown } from "./Markdown.js";

interface Props {
  text: string;
}

export function AssistantBlock({ text }: Props) {
  if (!text) return null;

  return (
    <Box paddingY={0}>
      <Markdown>{text}</Markdown>
    </Box>
  );
}
