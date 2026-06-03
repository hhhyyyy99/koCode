export function addHistoryEntry(history: string[], value: string, limit = 100): string[] {
  const trimmed = value.trim();
  if (!trimmed) return history;
  return [...history, trimmed].slice(-limit);
}

export function searchHistory(history: string[], term: string): string[] {
  const needle = term.toLowerCase();
  return history.filter((entry) => entry.toLowerCase().includes(needle));
}

export function selectHistoryMatch(matches: string[], index: number): string | undefined {
  if (matches.length === 0) return undefined;
  const normalized = ((index % matches.length) + matches.length) % matches.length;
  return matches[normalized];
}
