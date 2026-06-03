import React from "react";
import { Box, Text } from "ink";
import { useTheme } from "./theme.js";

interface Props {
  content: string;
  images?: { data: string; mimeType: string }[];
}

export function UserBubble({ content, images }: Props) {
  const { theme } = useTheme();

  return (
    <Box flexDirection="column" paddingY={0}>
      <Box>
        <Text bold color={theme.colors.success}>
          {"❯"} {content}
        </Text>
      </Box>
      {images && images.length > 0 && (
        <Box paddingLeft={2}>
          <Text color={theme.colors.dimmed}>
            [{images.length} image{images.length > 1 ? "s" : ""} attached]
          </Text>
        </Box>
      )}
    </Box>
  );
}
