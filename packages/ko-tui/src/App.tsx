import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Box, Text, useInput } from "ink";
import { AgentSession } from "@kocode/ko-agent";
import type { AgentSessionEvent, SessionSummary } from "@kocode/ko-agent";
import type { PermissionMode, PermissionRequestToolType } from "@kocode/ko-agent";
import type { Message, Model, ToolResultMessage } from "@kocode/ko-ai";
import { Header } from "./Header.js";
import { Conversation } from "./Conversation.js";
import { InputBox, isSlashModeInput } from "./InputBox.js";
import { FilePickerPanel } from "./FilePickerPanel.js";
import { applyCandidate, deriveFilePickerState, filePickerKeyAction, listFileCandidates, type FilePickerState } from "./file-picker.js";
import { StatusBar } from "./StatusBar.js";
import { PermissionDialog } from "./PermissionDialog.js";
import { StatusPanel } from "./StatusPanel.js";
import { CommandPanel } from "./CommandPanel.js";
import { SessionPanel } from "./SessionPanel.js";
import { filterCommands, getCommands } from "./commands.js";
import type { CommandDef } from "./commands.js";
import { applyCtrlOBlockToggle, bareEscapeAction, busySubmitMessage, canUseGlobalShortcut, isCtrlOInput, isTextInputFocus, moveBlockIndex, restoreFocusAfterBlockingMode, type FocusMode } from "./focus.js";
import { emptyInputBuffer, setInputText, type InputBuffer } from "./input-buffer.js";
import { parseInputRoute } from "./input-prefix.js";
import { useTheme, type ThemeName } from "./theme.js";
import { ThemePanel } from "./ThemePanel.js";
import { RewindDialog } from "./RewindDialog.js";
import { currentTerminalWidth, horizontalSeparator } from "./layout.js";
import { formatContextPressure, formatCostAbbrev } from "./StatusBar.js";
import { execSync } from "node:child_process";

interface PendingPermission {
  requestId: string;
  toolType: PermissionRequestToolType;
  toolName: string;
  params: Record<string, any>;
  description: string;
}

interface AppProps {
  session: AgentSession;
  onThemeChange?: (name: ThemeName) => void;
}

export function bottomLayoutOrder(slashMode: boolean): string[] {
  return slashMode
    ? ["input", "command-panel", "status-bar"]
    : ["input", "status-bar"];
}

export function commandInputText(cmd: CommandDef): string {
  return cmd.takesArgs ? `${cmd.name} ` : cmd.name;
}

export function slashCompletionInputText(commands: CommandDef[], selectedIndex: number): string | undefined {
  const cmd = commands[selectedIndex];
  return cmd ? commandInputText(cmd) : undefined;
}

/** TUI-local git branch read (SHOULD status field). No agent seam. */
export function readGitBranch(cwd: string): string | undefined {
  try {
    const out = execSync("git rev-parse --abbrev-ref HEAD", {
      cwd,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
      timeout: 500,
    }).trim();
    if (!out || out === "HEAD") return undefined;
    return out;
  } catch {
    return undefined;
  }
}

export function statusChromeFromSession(session: AgentSession): {
  contextPressure: string;
  costLabel: string;
} {
  const breakdown = session.getContextBreakdown();
  const total = breakdown.Total ?? 0;
  const window = session.getModel().contextWindow || 0;
  const usage = session.getUsage();
  return {
    contextPressure: formatContextPressure(total, window),
    costLabel: formatCostAbbrev(usage.cost.total),
  };
}

export function App({ session, onThemeChange }: AppProps) {
  const { theme, setTheme } = useTheme();
  const [events, setEvents] = useState<AgentSessionEvent[]>([]);
  const [input, setInput] = useState<InputBuffer>(() => emptyInputBuffer());
  const [running, setRunning] = useState(false);
  const [model, setModel] = useState<Model>(session.getModel());
  const [permissionMode, setPermissionMode] = useState<PermissionMode>(session.getPermissionMode());
  const [pendingPermission, setPendingPermission] = useState<PendingPermission | null>(null);
  const [modal, setModal] = useState<"status" | "model" | "theme" | "branch" | "resume" | "rewind" | null>(null);
  const [notifications, setNotifications] = useState<string[]>([]);
  const [focusMode, setFocusMode] = useState<FocusMode>("input");
  const previousFocusRef = useRef<FocusMode>("input");
  const lastEscRef = useRef(0);
  const focusModeRef = useRef<FocusMode>("input");
  const [expandableBlockKeys, setExpandableBlockKeys] = useState<string[]>([]);
  const [selectedBlockIndex, setSelectedBlockIndex] = useState(0);
  const [expandedBlockIds, setExpandedBlockIds] = useState<Set<string>>(() => new Set());
  const [statusTick, setStatusTick] = useState(0);
  const [gitBranch, setGitBranch] = useState<string | undefined>(() => readGitBranch(session.getCwd()));
  const notify = useCallback((msg: string) => {
    setNotifications((prev) => [...prev, msg]);
    setTimeout(() => setNotifications((prev) => prev.filter((m) => m !== msg)), 6000);
  }, []);

  const closeModal = useCallback(() => {
    setModal(null);
    setFocusMode(restoreFocusAfterBlockingMode(previousFocusRef.current));
  }, []);

  const openBranchPanel = useCallback(() => {
    previousFocusRef.current = focusMode;
    setModal("branch");
    setFocusMode("session-modal");
  }, [focusMode]);

  const openResumePanel = useCallback(() => {
    previousFocusRef.current = focusMode;
    setModal("resume");
    setFocusMode("session-modal");
  }, [focusMode]);

  const openThemePanel = useCallback(() => {
    previousFocusRef.current = focusMode;
    setModal("theme");
    setFocusMode("theme-modal");
  }, [focusMode]);

  const applyTheme = useCallback((name: ThemeName) => {
    if (!setTheme(name)) {
      notify(`Unknown theme: ${name}`);
      return;
    }
    onThemeChange?.(name);
    notify(`Theme switched to ${name}`);
    closeModal();
  }, [setTheme, onThemeChange, notify, closeModal]);

  useEffect(() => {
    focusModeRef.current = focusMode;
  }, [focusMode]);

  // Refresh footer pressure/cost when turn activity flips; git branch is TUI-local.
  useEffect(() => {
    setStatusTick((n) => n + 1);
  }, [running, model]);

  useEffect(() => {
    setGitBranch(readGitBranch(session.getCwd()));
  }, [session, running]);

  const statusChrome = useMemo(() => statusChromeFromSession(session), [session, statusTick, model]);

  const commandContext = useMemo(() => ({ currentTheme: theme.name, setTheme, openBranchPanel, openResumePanel, openThemePanel, onThemeChange }), [theme.name, setTheme, openBranchPanel, openResumePanel, openThemePanel, onThemeChange]);

  const [slashMode, setSlashMode] = useState(false);
  const [slashFilter, setSlashFilter] = useState("");
  const [slashIndex, setSlashIndex] = useState(0);
  const [filteredCommands, setFilteredCommands] = useState<CommandDef[]>(
    getCommands(),
  );

  const [filePicker, setFilePicker] = useState<FilePickerState | null>(null);
  const filePickerRef = useRef<FilePickerState | null>(null);
  useEffect(() => {
    filePickerRef.current = filePicker;
  }, [filePicker]);

  const listCandidates = useCallback(
    (fragment: string) => listFileCandidates(session.getCwd(), fragment),
    [session],
  );

  const handleInputChange = useCallback((nextBuffer: InputBuffer) => {
    setInput(nextBuffer);
    const prev = filePickerRef.current;
    const next = deriveFilePickerState(
      prev,
      nextBuffer.text,
      nextBuffer.cursorOffset,
      isSlashModeInput(nextBuffer.text),
      listCandidates,
    );
    if (next !== prev) setFilePicker(next);
    const mode = focusModeRef.current;
    // "slash" here is the same-tick transition where slash text was replaced by
    // an @ token (e.g. external editor); closeSlashMode uses a functional
    // update that preserves the file-picker focus set below.
    if (next && (mode === "input" || mode === "slash")) setFocusMode("file-picker");
    else if (!next && mode === "file-picker") setFocusMode("input");
  }, [listCandidates]);

  const closeFilePicker = useCallback(() => {
    setFilePicker(null);
    setFocusMode("input");
  }, []);

  // Blocking flows (permission, modals) restore focus to input; drop any stale
  // picker state left behind so it cannot resurface with old candidates.
  useEffect(() => {
    if (focusMode !== "file-picker" && filePicker) setFilePicker(null);
  }, [focusMode, filePicker]);

  useEffect(() => {
    const listener = (event: AgentSessionEvent) => {
      setEvents((prev) => [...prev, event]);
      switch (event.type) {
        case "turn_start":
          setRunning(true);
          break;
        case "turn_end":
          setRunning(false);
          break;
        case "turn_cancelled":
          setRunning(false);
          break;
        case "model_changed":
          setModel(event.model);
          break;
        case "permission_mode_changed":
          setPermissionMode(event.mode);
          break;
        case "session_resumed":
          setEvents(messagesToEvents(event.messages));
          break;
        case "permission_request":
          previousFocusRef.current = focusMode;
          setFocusMode("permission");
          setPendingPermission({
            requestId: event.requestId,
            toolType: event.toolType,
            toolName: event.toolName,
            params: event.params,
            description: event.description,
          });
          break;
      }
    };
    session.addEventListener(listener);
    return () => session.removeEventListener(listener);
  }, [session, focusMode]);

  const updateSlashFilter = useCallback((filter: string) => {
    const query = filter.replace(/^\//, "");
    const results = filterCommands(query);
    setSlashFilter(filter);
    setFilteredCommands(results);
    setSlashIndex(0);
  }, []);

  const closeSlashMode = useCallback(() => {
    setSlashMode(false);
    setSlashFilter("");
    setSlashIndex(0);
    setFilteredCommands(getCommands());
    // Only downgrade slash focus; never clobber file-picker or modal focus
    // (this runs on every non-slash buffer change via onSlashModeChange).
    setFocusMode((mode) => (mode === "slash" ? "input" : mode));
  }, []);

  const clearInput = useCallback(() => {
    setInput(emptyInputBuffer());
  }, []);

  const handleSlashModeChange = useCallback(
    (active: boolean, filterText: string) => {
      if (focusMode === "permission" || focusMode === "status-modal" || focusMode === "model-modal") return;
      if (active) {
        setSlashMode(true);
        setFocusMode("slash");
        updateSlashFilter(filterText);
      } else {
        closeSlashMode();
      }
    },
    [updateSlashFilter, closeSlashMode, focusMode],
  );

  const handleCommandSelect = useCallback(
    (cmd: CommandDef) => {
      if (cmd.takesArgs) {
        // Commands that need arguments: fill input, let user type args
        setInput(setInputText(commandInputText(cmd)));
        closeSlashMode();
      } else {
        // No-arg commands: execute immediately
        clearInput();
        closeSlashMode();
        if (cmd.name === "/status") {
          previousFocusRef.current = "input";
          setModal("status");
          setFocusMode("status-modal");
          return;
        }
        cmd.handler("", session, notify, commandContext);
        if (cmd.name === "/clear") setEvents([]);
      }
    },
    [clearInput, closeSlashMode, session, notify, commandContext],
  );

  const handleSubmit = useCallback((submittedValue?: string) => {
    const text = (submittedValue ?? input.text).trim();
    if (!text) return;

    if (running) {
      notify(busySubmitMessage(text));
      return;
    }

    if (focusMode === "permission" || focusMode === "status-modal" || focusMode === "model-modal") return;

    const exactSlashRoute = parseInputRoute(text);
    if (slashMode && exactSlashRoute.type === "slash") {
      const exactCommand = getCommands().find((c) => c.name === exactSlashRoute.command);
      if (exactCommand) {
        clearInput();
        closeSlashMode();
        if (exactSlashRoute.command === "/status") {
          previousFocusRef.current = focusMode;
          setModal("status");
          setFocusMode("status-modal");
          return;
        }
        if (exactSlashRoute.command === "/model" && !exactSlashRoute.args) {
          previousFocusRef.current = focusMode;
          setModal("model");
          setFocusMode("model-modal");
          return;
        }
        exactCommand.handler(exactSlashRoute.args, session, notify, commandContext);
        if (exactSlashRoute.command === "/clear") setEvents([]);
        return;
      }
    }

    if (slashMode) {
      const cmd = filteredCommands[slashIndex];
      if (cmd) {
        handleCommandSelect(cmd);
        return;
      }
    }

    clearInput();

    const route = exactSlashRoute;

    if (route.type === "shell") {
      if (route.command) {
        session.execShell(route.command).catch((err: Error) => notify(`Shell error: ${err.message}`));
      }
      return;
    }

    if (route.type === "memory") {
      if (route.content) {
        session.saveMemory(route.content).then((filePath) => {
          notify(`Saved to ${filePath}`);
        }).catch((err: Error) => notify(`Memory error: ${err.message}`));
      }
      return;
    }

    if (route.type === "slash") {
      const cmdName = route.command;
      const args = route.args;
      closeSlashMode();

      // Interactive modals
      if (cmdName === "/status") { previousFocusRef.current = focusMode; setModal("status"); setFocusMode("status-modal"); return; }
      if (cmdName === "/model" && !args) { previousFocusRef.current = focusMode; setModal("model"); setFocusMode("model-modal"); return; }

      const cmd = getCommands().find((c) => c.name === cmdName);
      if (cmd) {
        cmd.handler(args, session, notify, commandContext);
        if (cmdName === "/clear") setEvents([]);
        return;
      }
    }

    if (route.type === "file_reference") {
      session.prompt(route.content).catch((err: Error) => {
        notify(`Error: ${err.message}`);
      });
      return;
    }

    if (route.type === "prompt") {
      session.prompt(route.content).catch((err: Error) => {
        notify(`Error: ${err.message}`);
      });
    }
  }, [
    input.text, session, notify, running, focusMode,
    slashMode, slashIndex, filteredCommands, handleCommandSelect, clearInput, closeSlashMode, commandContext,
  ]);

  const handleExpandableBlockKeysChange = useCallback((keys: string[]) => {
    setExpandableBlockKeys((prev) => {
      if (prev.length === keys.length && prev.every((key, index) => key === keys[index])) {
        return prev;
      }
      return keys;
    });
    setSelectedBlockIndex((prev) => (keys.length === 0 ? 0 : Math.min(prev, keys.length - 1)));
  }, []);

  const runRewind = useCallback(() => {
    session.rewindLastTurn().then((files) => {
      if (files.length > 0) {
        notify(`Rewound: restored ${files.join(", ")}`);
      } else {
        notify("Nothing to rewind");
      }
    }).catch((err: Error) => notify(`Rewind error: ${err.message}`));
  }, [session, notify]);

  const openRewindDialog = useCallback(() => {
    previousFocusRef.current = focusModeRef.current;
    setModal("rewind");
    setFocusMode("rewind-confirm");
  }, []);

  const closeRewindDialog = useCallback(() => {
    setModal(null);
    setFocusMode(restoreFocusAfterBlockingMode(previousFocusRef.current));
  }, []);

  const confirmRewind = useCallback(() => {
    closeRewindDialog();
    runRewind();
  }, [closeRewindDialog, runRewind]);

  const handleInputEscape = useCallback(() => {
    const action = bareEscapeAction(focusModeRef.current, running);
    if (action === "cancel-turn") {
      session.cancel();
      lastEscRef.current = 0;
      return;
    }
    if (action === "ignore") {
      lastEscRef.current = 0;
      return;
    }
    const now = Date.now();
    const lastEsc = lastEscRef.current;
    lastEscRef.current = now;
    if (now - lastEsc < 500) {
      openRewindDialog();
      lastEscRef.current = 0;
    }
  }, [openRewindDialog, running, session]);

  const resolvePermissionFocus = useCallback(() => {
    setPendingPermission(null);
    setFocusMode(restoreFocusAfterBlockingMode(previousFocusRef.current));
  }, []);

  useInput((_input, key) => {
    if (focusMode === "permission" || focusMode === "rewind-confirm") return;

    if (focusMode === "file-picker" && filePicker) {
      const action = filePickerKeyAction(_input, key);
      if (action === "previous") {
        setFilePicker((prev) => prev && {
          ...prev,
          selectedIndex: prev.candidates.length === 0
            ? 0
            : (prev.selectedIndex - 1 + prev.candidates.length) % prev.candidates.length,
        });
        return;
      }
      if (action === "next") {
        setFilePicker((prev) => prev && {
          ...prev,
          selectedIndex: prev.candidates.length === 0
            ? 0
            : (prev.selectedIndex + 1) % prev.candidates.length,
        });
        return;
      }
      if (action === "insert") {
        const candidate = filePicker.candidates[filePicker.selectedIndex];
        if (!candidate) return;
        const applied = applyCandidate(input.text, input.cursorOffset, filePicker.tokenStart, candidate);
        handleInputChange(setInputText(applied.text, applied.cursorOffset));
        return;
      }
      if (action === "dismiss") {
        closeFilePicker();
        return;
      }
      return;
    }

    if (focusMode === "slash") {
      if (key.downArrow) {
        setSlashIndex((prev) =>
          prev < filteredCommands.length - 1 ? prev + 1 : 0,
        );
        return;
      }
      if (key.upArrow) {
        setSlashIndex((prev) =>
          prev > 0 ? prev - 1 : filteredCommands.length - 1,
        );
        return;
      }
      if (key.escape) {
        closeSlashMode();
        clearInput();
        return;
      }
      if (key.return || _input === "\r" || _input === "\n") {
        handleSubmit(input.text);
        return;
      }
      if (key.tab) {
        const completed = slashCompletionInputText(filteredCommands, slashIndex);
        if (completed !== undefined) {
          setInput(setInputText(completed));
          updateSlashFilter(completed);
          return;
        }
      }
      return;
    }

    if (focusMode === "status-modal" || focusMode === "model-modal" || focusMode === "session-modal" || focusMode === "theme-modal") {
      if (key.escape) closeModal();
      return;
    }

    if (canUseGlobalShortcut(focusMode) && isCtrlOInput(_input, key) && expandableBlockKeys.length > 0) {
      const next = applyCtrlOBlockToggle({
        focusMode,
        selectedBlockIndex,
        blockKeys: expandableBlockKeys,
        expandedBlockIds,
      });
      setFocusMode(next.focusMode);
      setSelectedBlockIndex(next.selectedBlockIndex);
      setExpandedBlockIds(next.expandedBlockIds);
      return;
    }

    if (focusMode === "transcript-block") {
      if (key.downArrow || key.tab) {
        setSelectedBlockIndex((prev) => moveBlockIndex(prev, expandableBlockKeys.length, "next"));
        return;
      }
      if (key.upArrow) {
        setSelectedBlockIndex((prev) => moveBlockIndex(prev, expandableBlockKeys.length, "previous"));
        return;
      }
      if (key.escape) {
        setFocusMode("input");
        return;
      }
      return;
    }

    if (focusMode === "history-search") return;

    if (key.tab && key.shift) {
      const modes: PermissionMode[] = ["default", "accept_edits", "auto"];
      const idx = modes.indexOf(permissionMode);
      const next = modes[(idx + 1) % modes.length]!;
      session.setPermissionMode(next);
      return;
    }


  });

  const terminalWidth = currentTerminalWidth();
  const sep = horizontalSeparator(terminalWidth);

  return (
    <Box flexDirection="column" padding={0}>
      <Header model={model} cwd={session.getCwd()} hasContent={events.length > 0} />

      <Conversation
        events={events}
        model={model}
        cwd={session.getCwd()}
        focusedBlockKey={focusMode === "transcript-block" ? expandableBlockKeys[selectedBlockIndex] ?? null : null}
        expandedBlockIds={expandedBlockIds}
        onExpandableBlockKeysChange={handleExpandableBlockKeysChange}
      />

      {notifications.map((n, i) => (
        <Box key={i}><Text color="yellow">{n}</Text></Box>
      ))}

      {pendingPermission && (
        <PermissionDialog
          session={session}
          requestId={pendingPermission.requestId}
          toolType={pendingPermission.toolType}
          toolName={pendingPermission.toolName}
          params={pendingPermission.params}
          description={pendingPermission.description}
          active={focusMode === "permission"}
          onResolve={resolvePermissionFocus}
        />
      )}

      {modal === "status" && (
        <StatusPanel session={session} onClose={closeModal} active={focusMode === "status-modal"} />
      )}

      {modal === "model" && (
        <Box borderStyle="round" paddingX={1}>
          <Text dimColor>Use /model {"<provider/id>"} to switch. Use /models to list available models.</Text>
        </Box>
      )}

      {modal === "theme" && (
        <ThemePanel active={focusMode === "theme-modal"} onClose={closeModal} onSelect={applyTheme} />
      )}

      {modal === "rewind" && (
        <RewindDialog active={focusMode === "rewind-confirm"} onConfirm={confirmRewind} onCancel={closeRewindDialog} />
      )}

      {modal === "branch" && (
        <SessionPanel mode="branch" branches={session.listBranches()} active={focusMode === "session-modal"} onClose={closeModal} />
      )}

      {modal === "resume" && (
        <SessionPanel
          mode="resume"
          sessions={AgentSession.listSavedSessions()}
          active={focusMode === "session-modal"}
          onClose={closeModal}
          onSelect={(summary: SessionSummary) => {
            session.resumeSession(summary.id);
            notify(`Resumed ${summary.name}`);
            closeModal();
          }}
        />
      )}

      <InputBox
        buffer={input}
        onChange={handleInputChange}
        onSubmit={handleSubmit}
        onBareEscape={handleInputEscape}
        onSlashModeChange={handleSlashModeChange}
        running={running}
        focusActive={isTextInputFocus(focusMode)}
        submitActive={focusMode === "input"}
        onHistorySearchModeChange={(active) => setFocusMode(active ? "history-search" : "input")}
        separator={sep}
      />

      {slashMode && (
        <Box flexDirection="column">
          <CommandPanel
            commands={filteredCommands}
            selectedIndex={slashIndex}
            width={terminalWidth}
          />
        </Box>
      )}

      {focusMode === "file-picker" && filePicker && (
        <Box flexDirection="column">
          <FilePickerPanel
            candidates={filePicker.candidates}
            selectedIndex={filePicker.selectedIndex}
          />
        </Box>
      )}

      <StatusBar
        running={running}
        permissionMode={permissionMode}
        width={terminalWidth}
        contextPressure={statusChrome.contextPressure}
        costLabel={statusChrome.costLabel}
        gitBranch={gitBranch}
        yieldChrome={focusMode === "permission"}
        shortcutsHint={
          focusMode === "transcript-block"
            ? "ctrl+o expand · esc input"
            : undefined
        }
      />
    </Box>
  );
}


function messagesToEvents(messages: Message[]): AgentSessionEvent[] {
  const events: AgentSessionEvent[] = [];
  for (let index = 0; index < messages.length; index++) {
    const message = messages[index]!;
    if (message.role === "user") {
      events.push({ type: "user_message", content: userMessageText(message.content) });
      events.push({ type: "turn_start" });
      continue;
    }
    if (message.role === "assistant") {
      const assistant = message;
      for (const part of assistant.content) {
        if (part.type === "text") {
          events.push({ type: "message_delta", index, delta: part.text, partial: assistant });
          continue;
        }
        if (part.type === "thinking") {
          events.push({ type: "thinking_delta", index, delta: part.thinking, partial: assistant });
          continue;
        }
        if (part.type === "toolCall") {
          events.push({ type: "tool_start", toolCallId: part.id, toolName: part.name, input: part.arguments });
          const result = findToolResult(messages, index + 1, part.id);
          if (result) {
            events.push({
              type: "tool_end",
              toolCallId: part.id,
              toolName: part.name,
              result: {
                isError: result.isError,
                content: toolResultText(result),
              },
            });
          }
        }
      }
      events.push({ type: "message_end", index, message: assistant });
      if (assistant.stopReason !== "toolUse") {
        events.push({ type: "turn_end", usage: assistant.usage, stopReason: assistant.stopReason });
      }
    }
  }
  return events;
}

function userMessageText(content: Message["content"]): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content.map((part) => part.type === "text" ? part.text : `[${part.type}]`).join(" ");
  }
  return String(content);
}

function findToolResult(messages: Message[], startIndex: number, toolCallId: string): ToolResultMessage | undefined {
  for (let index = startIndex; index < messages.length; index++) {
    const message = messages[index]!;
    if (message.role === "user" || message.role === "assistant") return undefined;
    if (message.role === "toolResult" && message.toolCallId === toolCallId) return message;
  }
  return undefined;
}

function toolResultText(message: ToolResultMessage): string {
  return message.content
    .map((part) => part.type === "text" ? part.text : `[${part.type}]`)
    .join("\n");
}
