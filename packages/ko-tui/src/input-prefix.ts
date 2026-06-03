export type InputRoute =
  | { type: "empty" }
  | { type: "shell"; command: string }
  | { type: "memory"; content: string }
  | { type: "slash"; command: string; args: string }
  | { type: "file_reference"; path: string; message: string; content: string }
  | { type: "prompt"; content: string };

export function parseInputRoute(input: string): InputRoute {
  const text = input.trim();
  if (!text) return { type: "empty" };

  const firstChar = text[0];
  if (firstChar === "!") {
    return { type: "shell", command: text.slice(1).trim() };
  }
  if (firstChar === "#") {
    return { type: "memory", content: text.slice(1).trim() };
  }
  if (text.startsWith("/")) {
    const parts = text.split(/\s+/);
    return { type: "slash", command: parts[0]!, args: parts.slice(1).join(" ") };
  }
  if (firstChar === "@") {
    const body = text.slice(1).trim();
    const [path = "", ...messageParts] = body.split(/\s+/);
    const message = messageParts.join(" " );
    const content = message ? `Referenced file: ${path}\n\n${message}` : `Referenced file: ${path}`;
    return { type: "file_reference", path, message, content };
  }
  return { type: "prompt", content: text };
}
