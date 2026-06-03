import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import type { AgentSession, PermissionRequestToolType } from "@kocode/ko-agent";

interface Props {
  session: AgentSession;
  requestId: string;
  toolType: PermissionRequestToolType;
  toolName: string;
  params: Record<string, any>;
  description: string;
  active?: boolean;
  onResolve: () => void;
}

export function splitDisplayLines(text: string): string[] {
  if (text === "") return [];
  return text.replace(/\n$/, "").split("\n");
}

function renderLinesWithNumbers(text: string): React.ReactNode[] {
  const lines = splitDisplayLines(text);
  const width = Math.max(2, String(lines.length).length);
  return lines.map((line, i) => (
    <Text key={i}>{String(i + 1).padStart(width)} {line}</Text>
  ));
}

const SEP = "╌".repeat(60);

export function permissionDialogTitle(toolType: PermissionRequestToolType): string {
  switch (toolType) {
    case "bash": return "Bash command";
    case "edit": return "Edit file";
    case "write": return "Create file";
    case "unknown": return "Tool permission";
  }
}

export function permissionDialogOptions(
  toolType: PermissionRequestToolType,
  command: string | undefined,
  dir: string,
  toolName: string,
): string[] {
  if (toolType === "bash") {
    return ["Yes", `Yes, and always allow ${command?.split(" ")[0] ?? "this command"} in this project`, "No"];
  }
  if (toolType === "write" || toolType === "edit") {
    return ["Yes", "Yes, allow all edits during this session", "No"];
  }
  return ["Yes", `Yes, allow ${toolName} during this session`, "No"];
}

export function permissionPreviewLines(
  toolType: PermissionRequestToolType,
  params: Record<string, any>,
): string[] {
  if (toolType === "bash" && typeof params.command === "string") {
    return [params.command];
  }
  if (toolType === "write" && typeof params.content === "string") {
    return splitDisplayLines(params.content);
  }
  if ((toolType === "write" || toolType === "edit") && typeof params.new_string === "string") {
    return splitDisplayLines(params.new_string);
  }
  if ((toolType === "write" || toolType === "edit") && typeof params.old_string === "string") {
    return splitDisplayLines(params.old_string);
  }
  return [];
}

export function PermissionDialog({ session, requestId, toolType, toolName, params, description, active = true, onResolve }: Props) {
  const [selected, setSelected] = useState(0);

  const filePath = params?.file_path as string | undefined;
  const command = params?.command as string | undefined;

  useInput((_input, key) => {
    if (!active) return;
    const numeric = _input === "1" ? 0 : _input === "2" ? 1 : _input === "3" ? 2 : null;
    if (numeric !== null) {
      setSelected(numeric);
      resolve(numeric);
      return;
    }
    if (key.upArrow) {
      setSelected((prev) => (prev > 0 ? prev - 1 : 2));
    } else if (key.downArrow) {
      setSelected((prev) => (prev < 2 ? prev + 1 : 0));
    } else if (key.return) {
      resolve(selected);
    } else if (key.escape) {
      resolve(2);
    }
  });


  function resolve(index: number): void {
    switch (index) {
      case 0:
        session.resolvePermission(requestId, "approve");
        break;
      case 1:
        session.resolvePermission(requestId, "approve_all");
        break;
      case 2:
      default:
        session.resolvePermission(requestId, "deny");
        break;
    }
    onResolve();
  }

  const title = permissionDialogTitle(toolType);

  const dir = filePath ? filePath.split("/").slice(0, -1).join("/") || "/" : "";

  const options = permissionDialogOptions(toolType, command, dir, toolName);

  return (
    <Box flexDirection="column" borderStyle="round" paddingX={1} marginY={1}>
      <Box marginBottom={1}>
        <Text bold>{title}</Text>
      </Box>

      {filePath && (
        <Box>
          <Text dimColor>{filePath}</Text>
        </Box>
      )}

      {command && (
        <Box paddingLeft={2}>
          <Text>{command}</Text>
        </Box>
      )}

      {(toolType === "write" || toolType === "edit") && permissionPreviewLines(toolType, params).length > 0 && (
        <>
          <Box><Text dimColor>{SEP}</Text></Box>
          <Box flexDirection="column" paddingLeft={1}>
            {renderLinesWithNumbers(permissionPreviewLines(toolType, params).join("\n"))}
          </Box>
        </>
      )}

      <Box><Text dimColor>{SEP}</Text></Box>

      <Box>
        <Text>{toolType === "write" && filePath ? `Do you want to create ${filePath.replace(/^.*\//, "")}?` : "Do you want to proceed?"}</Text>
      </Box>

      {options.map((opt, i) => (
        <Box key={i}>
          <Text color={selected === i ? "cyan" : undefined} bold={selected === i}>
            {selected === i ? "❯" : " "} {i + 1}. {opt}
          </Text>
        </Box>
      ))}

      <Box marginTop={1}>
        <Text dimColor>Esc to cancel · Enter to confirm</Text>
      </Box>
    </Box>
  );
}
