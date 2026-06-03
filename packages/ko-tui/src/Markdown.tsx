import React from "react";
import { Box, Text } from "ink";
import { tokenize } from "./syntaxHighlight.js";
import type { Theme } from "./theme.js";
import { useTheme } from "./theme.js";

interface Props {
  children: string;
}

function renderCodeLine(line: string, lang: string, key: number, theme: Theme): React.ReactNode {
  const tokens = tokenize(line, lang);
  if (tokens.length === 1 && tokens[0]!.type === "plain") {
    return <Text key={key} color={theme.colors.dimmed}>{line}</Text>;
  }
  return (
    <Text key={key}>
      {tokens.map((t, ti) => {
        switch (t.type) {
          case "keyword": return <Text key={ti} color={theme.colors.secondary}>{t.text}</Text>;
          case "string": return <Text key={ti} color={theme.colors.success}>{t.text}</Text>;
          case "comment": return <Text key={ti} color={theme.colors.dimmed}>{t.text}</Text>;
          case "number": return <Text key={ti} color={theme.colors.warning}>{t.text}</Text>;
          default: return <Text key={ti} color={theme.colors.dimmed}>{t.text}</Text>;
        }
      })}
    </Text>
  );
}

/** Simple Markdown renderer for terminal output */
export function Markdown({ children }: Props) {
  const { theme } = useTheme();
  if (!children) return null;

  const lines = children.split("\n");
  const elements: React.ReactNode[] = [];

  let inCodeBlock = false;
  let codeLines: string[] = [];
  let codeLang = "";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;

    // Code block fences
    if (line.startsWith("```")) {
      if (inCodeBlock) {
        // End code block
        elements.push(
          <Box key={`code-${i}`} flexDirection="column" paddingX={2} marginY={0}>
            {codeLines.map((cl, ci) => renderCodeLine(cl, codeLang, ci, theme))}
          </Box>
        );
        codeLines = [];
        inCodeBlock = false;
        codeLang = "";
      } else {
        // Start code block
        inCodeBlock = true;
        codeLang = line.slice(3).trim();
      }
      continue;
    }

    if (inCodeBlock) {
      codeLines.push(line);
      continue;
    }

    // Inline code
    if (line.startsWith("`") && line.endsWith("`") && line.length > 2) {
      elements.push(
        <Box key={i}>
          <Text backgroundColor="gray">{line.slice(1, -1)}</Text>
        </Box>
      );
      continue;
    }

    // Headers
    if (line.startsWith("### ")) {
      elements.push(<Text key={i} bold>{line.slice(4)}</Text>);
      continue;
    }
    if (line.startsWith("## ")) {
      elements.push(<Text key={i} bold underline>{line.slice(3)}</Text>);
      continue;
    }
    if (line.startsWith("# ")) {
      elements.push(<Text key={i} bold underline>{line.slice(2)}</Text>);
      continue;
    }

    // List items
    if (/^[\s]*[-*]\s/.test(line)) {
      elements.push(
        <Box key={i} paddingLeft={2}>
          <Text>• {line.replace(/^[\s]*[-*]\s/, "")}</Text>
        </Box>
      );
      continue;
    }

    // Bold text (inline **text**)
    const boldRegex = /\*\*(.+?)\*\*/g;
    if (boldRegex.test(line)) {
      const parts = line.split(boldRegex);
      elements.push(
        <Box key={i}>
          {parts.map((part, pi) =>
            pi % 2 === 1 ? <Text key={pi} bold>{part}</Text> : <Text key={pi}>{part}</Text>
          )}
        </Box>
      );
      continue;
    }

    // Empty line
    if (line.trim() === "") {
      elements.push(<Text key={i}> </Text>);
      continue;
    }

    // Regular text
    elements.push(<Text key={i}>{line}</Text>);
  }

  // Unclosed code block
  if (inCodeBlock && codeLines.length > 0) {
    elements.push(
      <Box key="unclosed-code" flexDirection="column" paddingX={2} marginY={0}>
        {codeLines.map((cl, ci) => renderCodeLine(cl, codeLang, ci, theme))}
      </Box>
    );
  }

  return <Box flexDirection="column">{elements}</Box>;
}
