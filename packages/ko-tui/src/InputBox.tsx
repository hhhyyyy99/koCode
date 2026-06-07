import React, { useCallback, useRef, useState } from "react";
import { Box, Text, useInput } from "ink";
import TextInput from "ink-text-input";
import { addHistoryEntry, searchHistory, selectHistoryMatch } from "./input-history.js";
import { useTheme } from "./theme.js";

export function inputPrompt(running: boolean): string {
  return running ? "● " : "❯ ";
}

export function inputPlaceholder(running: boolean): string {
  return running ? "Agent running; draft next message..." : "输入消息，或 / 查看命令...";
}

export interface InputKeyInfo {
  return?: boolean;
  meta?: boolean;
  ctrl?: boolean;
}

export function inputKeyAction(input: string, key: InputKeyInfo): "submit" | "newline" | "none" {
  if ((key.meta && key.return) || (key.ctrl && input === "\n")) return "newline";
  if (key.return || input === "\r") return "submit";
  return "none";
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (submittedValue?: string) => void;
  onBareEscape?: () => void;
  onSlashModeChange?: (inSlashMode: boolean, filterText: string) => void;
  onHistorySearchModeChange?: (active: boolean) => void;
  running: boolean;
  focusActive?: boolean;
  separator?: string;
}

export function sanitizeTextInputValueForControls(
  currentValue: string,
  nextValue: string,
): { value: string; bareEscapeCount: number } {
  if (!nextValue.includes("\x1b")) return { value: nextValue, bareEscapeCount: 0 };

  const inserted = nextValue.startsWith(currentValue)
    ? nextValue.slice(currentValue.length)
    : nextValue;
  const bareEscapeCount = inserted.length > 0 && inserted.split("").every((char) => char === "\x1b")
    ? inserted.length
    : 0;

  return {
    value: nextValue.replace(/\x1b(?:\[[0-?]*[ -/]*[@-~])?/g, ""),
    bareEscapeCount,
  };
}

export function InputBox({
  value,
  onChange,
  onSubmit,
  onBareEscape,
  onSlashModeChange,
  onHistorySearchModeChange,
  running,
  focusActive = true,
  separator,
}: Props) {
  const { theme } = useTheme();
  const historyRef = useRef<string[]>([]);
  const [searchMode, setSearchMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchIndex, setSearchIndex] = useState(0);
  const savedValueRef = useRef("");
  const controlEchoRef = useRef<"r" | "g" | null>(null);
  const submitEchoRef = useRef(false);
  const lastSubmitRef = useRef<{ value: string; at: number } | null>(null);

  // Wrapped submit: record to history
  const wrappedSubmit = useCallback((overrideValue?: string) => {
    const submittedValue = overrideValue ?? value;
    const now = Date.now();
    const last = lastSubmitRef.current;
    if (last && last.value === submittedValue && now - last.at < 100) {
      return;
    }
    lastSubmitRef.current = { value: submittedValue, at: now };

    const trimmed = submittedValue.trim();
    if (trimmed) {
      historyRef.current = addHistoryEntry(historyRef.current, trimmed);
    }
    onSubmit(submittedValue);
  }, [value, onSubmit]);

  const handleChange = useCallback(
    (val: string) => {
      if (!focusActive) return;
      if (/[\r\n]$/.test(val)) {
        const nextValue = val.replace(/[\r\n]+$/g, "");
        if (nextValue !== value) onChange(nextValue);
        submitEchoRef.current = true;
        wrappedSubmit(nextValue);
        return;
      }
      if (submitEchoRef.current && val.replace(/[\r\n]+$/g, "") === value) {
        submitEchoRef.current = false;
        return;
      }
      const escaped = sanitizeTextInputValueForControls(value, val);
      if (escaped.bareEscapeCount > 0 || escaped.value !== val) {
        for (let i = 0; i < escaped.bareEscapeCount; i++) onBareEscape?.();
        if (escaped.value !== value) onChange(escaped.value);
        return;
      }
      const sanitized = val.replace(/[\x07\x12]/g, "");
      if (sanitized !== val) {
        if (sanitized !== value) onChange(sanitized);
        return;
      }
      const controlEcho = controlEchoRef.current;
      if (controlEcho && (val === value + controlEcho || val === controlEcho)) {
        controlEchoRef.current = null;
        return;
      }
      onChange(val);
      if (onSlashModeChange) {
        if (val.startsWith("/")) {
          onSlashModeChange(true, val);
        } else {
          onSlashModeChange(false, val);
        }
      }
    },
    [focusActive, onBareEscape, onChange, onSlashModeChange, value, wrappedSubmit],
  );

  useInput((_input, key) => {
    if (!focusActive && !searchMode) return;

    if (!searchMode && (key.escape || _input.split("").every((char) => char === "\x1b") && _input.length > 0)) {
      const escapeCount = _input.length > 0 ? _input.length : 1;
      for (let i = 0; i < escapeCount; i++) onBareEscape?.();
      return;
    }

    const keyAction = inputKeyAction(_input, key);
    if (keyAction === "newline") {
      onChange(value + "\n");
      return;
    }
    if (keyAction === "submit") {
      submitEchoRef.current = true;
      wrappedSubmit();
      return;
    }


    // Ctrl+R: reverse search
    if (key.ctrl && (_input.includes("\x12") || _input.toLowerCase() === "r")) {
      controlEchoRef.current = "r";
      if (!searchMode) {
        savedValueRef.current = value;
        setSearchMode(true);
        onHistorySearchModeChange?.(true);
        setSearchTerm("");
        setSearchIndex(0);
      } else {
        // Next match
        setSearchIndex((prev) => prev + 1);
      }
      return;
    }

    // Ctrl+G: external editor
    if (key.ctrl && (_input.includes("\x07") || _input.toLowerCase() === "g")) {
      controlEchoRef.current = "g";
      launchEditor(value).then((edited) => {
        if (edited !== undefined) onChange(edited);
      }).catch(() => {});
      return;
    }

    // In search mode
    if (searchMode && !key.ctrl && !key.meta && _input && !key.escape) {
      if (key.backspace || key.delete) {
        setSearchTerm((prev) => prev.slice(0, -1));
        setSearchIndex(0);
        return;
      }

      const printable = _input.replace(/[\r\n]/g, "");
      const nextTerm = printable >= " " ? searchTerm + printable : searchTerm;
      if (printable >= " ") {
        setSearchTerm(nextTerm);
        setSearchIndex(0);
      }

      if (key.return || /[\r\n]/.test(_input)) {
        const matches = searchHistory(historyRef.current, nextTerm);
        const selected = selectHistoryMatch(matches, printable >= " " ? 0 : searchIndex);
        if (selected) onChange(selected);
        setSearchMode(false);
        onHistorySearchModeChange?.(false);
      }
      return;
    }

    if (searchMode && key.escape) {
      setSearchMode(false);
      onHistorySearchModeChange?.(false);
      onChange(savedValueRef.current);
      return;
    }

    if (searchMode && key.return) {
      const matches = searchHistory(historyRef.current, searchTerm);
      const selected = selectHistoryMatch(matches, searchIndex);
      if (selected) onChange(selected);
      setSearchMode(false);
      onHistorySearchModeChange?.(false);
      return;
    }
  });

  // Filter history matches
  const matches = searchMode ? searchHistory(historyRef.current, searchTerm) : [];

  return (
    <Box flexDirection="column" paddingX={0}>
      {separator && (
        <Box>
          <Text dimColor>{separator}</Text>
        </Box>
      )}

      {searchMode && (
        <Box>
          <Text color={theme.colors.dimmed}>
            (reverse-i-search): {searchTerm}
            {matches.length > 0
              ? ` — ${matches[searchIndex % matches.length]!.slice(0, 60)}`
              : " — no matches"}
          </Text>
        </Box>
      )}

      {!searchMode && (
        <Box>
          <Text bold color={running ? theme.colors.warning : theme.colors.success}>{inputPrompt(running)}</Text>
          <TextInput
            value={value}
            onChange={handleChange}
            onSubmit={wrappedSubmit}
            placeholder={inputPlaceholder(running)}
            focus={focusActive}
          />
        </Box>
      )}

      {searchMode && (
        <Box>
          <Text color={theme.colors.dimmed}>Enter to select · Esc to cancel</Text>
        </Box>
      )}

      {separator && (
        <Box>
          <Text dimColor>{separator}</Text>
        </Box>
      )}
    </Box>
  );
}

async function launchEditor(text: string): Promise<string | undefined> {
  const { randomUUID } = await import("node:crypto");
  const { writeFile, readFile, unlink } = await import("node:fs/promises");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  const { spawn } = await import("node:child_process");

  const editor = process.env.EDITOR || process.env.VISUAL || "vim";
  const tmpFile = join(tmpdir(), `kocode-input-${randomUUID()}.md`);

  await writeFile(tmpFile, text, "utf-8");

  return new Promise<string | undefined>((resolve) => {
    const child = spawn(editor, [tmpFile], { stdio: "inherit" });
    child.on("exit", async (code) => {
      if (code === 0) {
        try {
          const content = await readFile(tmpFile, "utf-8");
          await unlink(tmpFile);
          resolve(content.trimEnd());
        } catch {
          resolve(undefined);
        }
      } else {
        try { await unlink(tmpFile); } catch {}
        resolve(undefined);
      }
    });
  });
}
