export const FALLBACK_TERMINAL_WIDTH = 80;

export function resolveTerminalWidth(width?: number | null, fallback = FALLBACK_TERMINAL_WIDTH): number {
  if (typeof width === "number" && Number.isFinite(width) && width > 0) {
    return Math.floor(width);
  }
  return fallback;
}

export function currentTerminalWidth(fallback = FALLBACK_TERMINAL_WIDTH): number {
  return resolveTerminalWidth(process.stdout.columns, fallback);
}

export function horizontalSeparator(width?: number | null, char = "─"): string {
  return char.repeat(resolveTerminalWidth(width));
}
