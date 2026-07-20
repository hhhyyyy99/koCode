import React, { useCallback, useRef, useState } from "react";
import { Box, Text, useInput } from "ink";
import { addHistoryEntry, searchHistory, selectHistoryMatch } from "./input-history.js";
import {
  deleteBackward,
  insertText,
  moveCursor,
  setInputText,
  type InputBuffer,
} from "./input-buffer.js";
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
  escape?: boolean;
  backspace?: boolean;
  delete?: boolean;
  leftArrow?: boolean;
  rightArrow?: boolean;
  upArrow?: boolean;
  downArrow?: boolean;
  tab?: boolean;
  shift?: boolean;
}

export function inputKeyAction(input: string, key: InputKeyInfo): "submit" | "newline" | "none" {
  // Newline without submit: Shift+Enter (SHOULD Claude-aligned), Alt/Option+Enter, Ctrl+Enter, Ctrl+J
  if (key.return && (key.shift || key.meta || key.ctrl)) return "newline";
  if (key.ctrl && (input === "\n" || input === "j")) return "newline";
  if (key.return || input === "\r") return "submit";
  return "none";
}

interface Props {
  buffer: InputBuffer;
  onChange: (buffer: InputBuffer) => void;
  onSubmit: (submittedValue?: string) => void;
  onBareEscape?: () => void;
  onSlashModeChange?: (inSlashMode: boolean, filterText: string) => void;
  onHistorySearchModeChange?: (active: boolean) => void;
  running: boolean;
  focusActive?: boolean;
  submitActive?: boolean;
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

export interface ControlledInputDisplay {
  before: string;
  cursor: string;
  after: string;
  placeholder: boolean;
}

export function controlledInputDisplay(
  text: string,
  cursorOffset: number,
  placeholder: string,
  focused: boolean,
): ControlledInputDisplay {
  if (text.length === 0 && placeholder) {
    return {
      before: "",
      cursor: focused ? placeholder[0] ?? " " : "",
      after: focused ? placeholder.slice(1) : placeholder,
      placeholder: true,
    };
  }

  const buffer = setInputText(text, cursorOffset);
  if (!focused) {
    return { before: buffer.text, cursor: "", after: "", placeholder: false };
  }
  if (buffer.cursorOffset === buffer.text.length) {
    return { before: buffer.text, cursor: " ", after: "", placeholder: false };
  }

  const cursorChar = buffer.text[buffer.cursorOffset]!;
  const cursor = cursorChar === "\n" ? " " : cursorChar;
  const after = cursorChar === "\n"
    ? buffer.text.slice(buffer.cursorOffset)
    : buffer.text.slice(buffer.cursorOffset + 1);

  return {
    before: buffer.text.slice(0, buffer.cursorOffset),
    cursor,
    after,
    placeholder: false,
  };
}

function ControlledTextInput({
  buffer,
  placeholder,
  focus,
}: {
  buffer: InputBuffer;
  placeholder: string;
  focus: boolean;
}) {
  const { theme } = useTheme();
  const display = controlledInputDisplay(buffer.text, buffer.cursorOffset, placeholder, focus);

  if (display.placeholder) {
    if (!focus) return <Text color={theme.colors.dimmed}>{display.after}</Text>;
    return (
      <>
        <Text inverse>{display.cursor}</Text>
        <Text color={theme.colors.dimmed}>{display.after}</Text>
      </>
    );
  }

  if (!focus) return <Text>{display.before}</Text>;

  return (
    <>
      <Text>{display.before}</Text>
      <Text inverse>{display.cursor}</Text>
      <Text>{display.after}</Text>
    </>
  );
}

function isBareEscape(input: string, key: InputKeyInfo): boolean {
  return key.escape === true || (input.length > 0 && input.split("").every((char) => char === "\x1b"));
}

export function printableInput(input: string, key: InputKeyInfo): string {
  if (!input || key.ctrl || key.meta || key.escape || key.return || key.backspace || key.delete) return "";
  if (key.leftArrow || key.rightArrow || key.upArrow || key.downArrow || key.tab) return "";

  const sanitized = input.replace(/[\r\n\x07\b\x12\x7f]/g, "");
  if (!sanitized) return "";
  return Array.from(sanitized).every((char) => char >= " ") ? sanitized : "";
}

export function isSlashModeInput(text: string): boolean {
  return text.startsWith("/");
}

export function eraseInputCount(input: string, key: InputKeyInfo): number {
  if (key.backspace || key.delete) return 1;
  if (!input) return 0;
  const chars = Array.from(input);
  return chars.every((char) => char === "\x7f" || char === "\b") ? chars.length : 0;
}

export function eraseInputBuffer(buffer: InputBuffer, key: InputKeyInfo, input = ""): InputBuffer | undefined {
  const count = eraseInputCount(input, key);
  if (count === 0) return undefined;

  let next = buffer;
  for (let i = 0; i < count; i++) {
    next = deleteBackward(next);
  }
  return next;
}

export function InputBox({
  buffer,
  onChange,
  onSubmit,
  onBareEscape,
  onSlashModeChange,
  onHistorySearchModeChange,
  running,
  focusActive = true,
  submitActive = true,
  separator,
}: Props) {
  const { theme } = useTheme();
  const historyRef = useRef<string[]>([]);
  const [searchMode, setSearchMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchIndex, setSearchIndex] = useState(0);
  const savedBufferRef = useRef<InputBuffer>(setInputText(""));
  const controlEchoRef = useRef<"r" | "g" | null>(null);
  const lastSubmitRef = useRef<{ value: string; at: number } | null>(null);

  const recordHistory = useCallback((submittedValue: string) => {
    const trimmed = submittedValue.trim();
    if (trimmed) {
      historyRef.current = addHistoryEntry(historyRef.current, trimmed);
    }
  }, []);

  // Wrapped submit: record to history
  const wrappedSubmit = useCallback((overrideValue?: string) => {
    const submittedValue = overrideValue ?? buffer.text;
    const now = Date.now();
    const last = lastSubmitRef.current;
    if (last && last.value === submittedValue && now - last.at < 100) {
      return;
    }
    lastSubmitRef.current = { value: submittedValue, at: now };

    recordHistory(submittedValue);
    onSubmit(submittedValue);
  }, [buffer.text, onSubmit, recordHistory]);

  const emitSlashMode = useCallback((text: string) => {
    if (!onSlashModeChange) return;
    if (isSlashModeInput(text)) {
      onSlashModeChange(true, text);
    } else {
      onSlashModeChange(false, text);
    }
  }, [onSlashModeChange]);

  const handleChange = useCallback(
    (nextBuffer: InputBuffer, options: { updateSlashMode?: boolean } = {}) => {
      if (!focusActive) return;
      if (nextBuffer.text !== buffer.text || nextBuffer.cursorOffset !== buffer.cursorOffset) {
        onChange(nextBuffer);
      }
      if (options.updateSlashMode ?? true) emitSlashMode(nextBuffer.text);
    },
    [buffer.cursorOffset, buffer.text, emitSlashMode, focusActive, onChange],
  );

  useInput((_input, key) => {
    if (!focusActive && !searchMode) return;

    if (searchMode) {
      if (isBareEscape(_input, key)) {
        setSearchMode(false);
        onHistorySearchModeChange?.(false);
        onChange(savedBufferRef.current);
        return;
      }

      if (key.ctrl && (_input.includes("\x12") || _input.toLowerCase() === "r")) {
        controlEchoRef.current = "r";
        setSearchIndex((prev) => prev + 1);
        return;
      }

      if (key.return || /[\r\n]/.test(_input)) {
        const matches = searchHistory(historyRef.current, searchTerm);
        const selected = selectHistoryMatch(matches, searchIndex);
        if (selected) onChange(setInputText(selected));
        setSearchMode(false);
        onHistorySearchModeChange?.(false);
        return;
      }

      const searchEraseCount = eraseInputCount(_input, key);
      if (searchEraseCount > 0) {
        setSearchTerm((prev) => prev.slice(0, Math.max(0, prev.length - searchEraseCount)));
        setSearchIndex(0);
        return;
      }

      const printable = printableInput(_input, key);
      if (printable) {
        setSearchTerm((prev) => prev + printable);
        setSearchIndex(0);
      }
      return;
    }

    if (isBareEscape(_input, key)) {
      const escapeCount = _input.length > 0 ? _input.length : 1;
      for (let i = 0; i < escapeCount; i++) onBareEscape?.();
      return;
    }

    const keyAction = inputKeyAction(_input, key);
    if (keyAction === "newline") {
      handleChange(insertText(buffer, "\n"));
      return;
    }
    if (keyAction === "submit") {
      if (submitActive) {
        wrappedSubmit();
      } else {
        recordHistory(buffer.text);
      }
      return;
    }


    // Ctrl+R: reverse search
    if (key.ctrl && (_input.includes("\x12") || _input.toLowerCase() === "r")) {
      controlEchoRef.current = "r";
      if (!searchMode) {
        savedBufferRef.current = buffer;
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
      launchEditor(buffer.text).then((edited) => {
        if (edited !== undefined) onChange(setInputText(edited));
      }).catch(() => {});
      return;
    }

    if (key.leftArrow) {
      handleChange(moveCursor(buffer, "left"), { updateSlashMode: false });
      return;
    }
    if (key.rightArrow) {
      handleChange(moveCursor(buffer, "right"), { updateSlashMode: false });
      return;
    }
    const erased = eraseInputBuffer(buffer, key, _input);
    if (erased) {
      handleChange(erased);
      return;
    }

    const printable = printableInput(_input, key);
    if (printable) {
      const controlEcho = controlEchoRef.current;
      if (controlEcho && (printable === controlEcho)) {
        controlEchoRef.current = null;
        return;
      }
      handleChange(insertText(buffer, printable));
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
          <ControlledTextInput
            buffer={buffer}
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
