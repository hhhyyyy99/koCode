export type ToolPermissionCategory = "read" | "write" | "edit" | "bash" | "unknown";
export type PermissionRequestToolType = Exclude<ToolPermissionCategory, "read">;

const READ_ONLY_TOOLS = new Set(["ls", "read", "grep", "find"]);

export function classifyToolPermission(toolName: string): ToolPermissionCategory {
  if (READ_ONLY_TOOLS.has(toolName)) return "read";
  if (toolName === "write") return "write";
  if (toolName === "edit") return "edit";
  if (toolName === "bash") return "bash";
  return "unknown";
}

export function permissionRequestToolType(category: ToolPermissionCategory): PermissionRequestToolType | null {
  return category === "read" ? null : category;
}

export function shouldRequestToolPermission(
  category: ToolPermissionCategory,
  mode: "default" | "accept_edits" | "auto",
): boolean {
  if (mode === "auto") return false;
  if (category === "read") return false;
  if (mode === "accept_edits" && (category === "edit" || category === "write")) return false;
  return true;
}

export function describeToolPermission(category: ToolPermissionCategory, input: Record<string, any>): string {
  if (category === "bash") return String(input.command ?? JSON.stringify(input));
  if (category === "write" || category === "edit") return String(input.file_path ?? JSON.stringify(input));
  return JSON.stringify(input);
}

export interface ToolPermissionDecision {
  category: ToolPermissionCategory;
  needsPermission: boolean;
  requestToolType: PermissionRequestToolType | null;
  description: string;
}

export function permissionDecisionForTool(
  toolName: string,
  input: Record<string, any>,
  mode: "default" | "accept_edits" | "auto",
): ToolPermissionDecision {
  const category = classifyToolPermission(toolName);
  const needsPermission = shouldRequestToolPermission(category, mode);
  return {
    category,
    needsPermission,
    requestToolType: needsPermission ? permissionRequestToolType(category) ?? "unknown" : null,
    description: describeToolPermission(category, input),
  };
}
