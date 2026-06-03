import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Box, Text, useInput } from "ink";
import { AgentSession } from "@kocode/ko-agent";
import type { AgentSessionEvent, SessionSummary } from "@kocode/ko-agent";
import type { PermissionMode, PermissionRequestToolType } from "@kocode/ko-agent";
import type { AssistantMessage, Message, Model } from "@kocode/ko-ai";
import { Header } from "./Header.js";
import { Conversation } from "./Conversation.js";
import { InputBox } from "./InputBox.js";
import { StatusBar } from "./StatusBar.js";
import { PermissionDialog } from "./PermissionDialog.js";
import { StatusPanel } from "./StatusPanel.js";
import { CommandPanel } from "./CommandPanel.js";
import { SessionPanel } from "./SessionPanel.js";
import { filterCommands, getCommands } from "./commands.js";
import type { CommandDef } from "./commands.js";
import { busySubmitMessage, moveToolIndex, restoreFocusAfterBlockingMode, type FocusMode } from "./focus.js";
import { parseInputRoute } from "./input-prefix.js";
import { useTheme, type ThemeName } from "./theme.js";
import { ThemePanel } from "./ThemePanel.js";
import { RewindDialog } from "./RewindDialog.js";

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

export function App({ session, onThemeChange }: AppProps) {
  const { theme, setTheme } = useTheme();
  const [events, setEvents] = useState<AgentSessionEvent[]>([]);
  const [message, setMessage] = useState("");
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
  const [toolKeys, setToolKeys] = useState<string[]>([]);
  const [selectedToolIndex, setSelectedToolIndex] = useState(0);
  const [expandedToolIds, setExpandedToolIds] = useState<Set<string>>(() => new Set());
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

  const commandContext = useMemo(() => ({ currentTheme: theme.name, setTheme, openBranchPanel, openResumePanel, openThemePanel, onThemeChange }), [theme.name, setTheme, openBranchPanel, openResumePanel, openThemePanel, onThemeChange]);

  const [slashMode, setSlashMode] = useState(false);
  const [slashFilter, setSlashFilter] = useState("");
  const [slashIndex, setSlashIndex] = useState(0);
  const [filteredCommands, setFilteredCommands] = useState<CommandDef[]>(
    getCommands(),
  );

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
    setFocusMode("input");
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
        setMessage(cmd.name + " ");
        closeSlashMode();
      } else {
        // No-arg commands: execute immediately
        setMessage("");
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
    [closeSlashMode, session, notify, commandContext],
  );

  const handleSubmit = useCallback((submittedValue?: string) => {
    const text = (submittedValue ?? message).trim();
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
        setMessage("");
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

    setMessage("");

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
    message, session, notify, running, focusMode,
    slashMode, slashIndex, filteredCommands, handleCommandSelect, closeSlashMode, commandContext,
  ]);

  const handleToolKeysChange = useCallback((keys: string[]) => {
    setToolKeys((prev) => {
      if (prev.length === keys.length && prev.every((key, index) => key === keys[index])) {
        return prev;
      }
      return keys;
    });
    setSelectedToolIndex((prev) => (keys.length === 0 ? 0 : Math.min(prev, keys.length - 1)));
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
    const now = Date.now();
    const lastEsc = lastEscRef.current;
    lastEscRef.current = now;
    if (now - lastEsc < 500) {
      openRewindDialog();
      lastEscRef.current = 0;
    }
  }, [openRewindDialog]);

  const resolvePermissionFocus = useCallback(() => {
    setPendingPermission(null);
    setFocusMode(restoreFocusAfterBlockingMode(previousFocusRef.current));
  }, []);

  useInput((_input, key) => {
    if (focusMode === "permission" || focusMode === "rewind-confirm") return;

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
        setMessage("");
        return;
      }
      if (key.tab) {
        if (filteredCommands.length > 0) {
          const cmd = filteredCommands[0]!;
          setMessage(cmd.takesArgs ? cmd.name + " " : cmd.name);
          updateSlashFilter(cmd.takesArgs ? cmd.name + " " : cmd.name);
          return;
        }
      }
      return;
    }

    if (focusMode === "status-modal" || focusMode === "model-modal" || focusMode === "session-modal" || focusMode === "theme-modal") {
      if (key.escape) closeModal();
      return;
    }

    if (key.ctrl && _input === "\u000f" && toolKeys.length > 0) {
      if (focusMode !== "tool-output") {
        setFocusMode("tool-output");
        setSelectedToolIndex((prev) => Math.min(prev, toolKeys.length - 1));
        return;
      }
      const toolKey = toolKeys[selectedToolIndex];
      if (toolKey) {
        setExpandedToolIds((prev) => {
          const next = new Set(prev);
          if (next.has(toolKey)) next.delete(toolKey);
          else next.add(toolKey);
          return next;
        });
      }
      return;
    }

    if (focusMode === "tool-output") {
      if (key.downArrow || key.tab) {
        setSelectedToolIndex((prev) => moveToolIndex(prev, toolKeys.length, "next"));
        return;
      }
      if (key.upArrow) {
        setSelectedToolIndex((prev) => moveToolIndex(prev, toolKeys.length, "previous"));
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

  const sep = "─".repeat(60);

  return (
    <Box flexDirection="column" padding={0}>
      <Header model={model} cwd={session.getCwd()} hasContent={events.length > 0} />

      <Box><Text dimColor>{sep}</Text></Box>

      <Conversation
        events={events}
        model={model}
        cwd={session.getCwd()}
        toolFocusKey={focusMode === "tool-output" ? toolKeys[selectedToolIndex] ?? null : null}
        expandedToolIds={expandedToolIds}
        onToolKeysChange={handleToolKeysChange}
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

      <Box><Text dimColor>{sep}</Text></Box>

      <InputBox
        value={message}
        onChange={setMessage}
        onSubmit={handleSubmit}
        onBareEscape={handleInputEscape}
        onSlashModeChange={handleSlashModeChange}
        running={running}
        focusActive={focusMode === "input" || focusMode === "slash"}
        onHistorySearchModeChange={(active) => setFocusMode(active ? "history-search" : "input")}
      />

      <StatusBar running={running} permissionMode={permissionMode} />

      {slashMode && (
        <Box flexDirection="column">
          <Box><Text dimColor>{sep}</Text></Box>
          <CommandPanel
            commands={filteredCommands}
            selectedIndex={slashIndex}
          />
        </Box>
      )}
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
      const assistant = message as AssistantMessage;
      const text = assistant.content
        .filter((part) => part.type === "text")
        .map((part: any) => part.text)
        .join("\n");
      if (text) events.push({ type: "message_delta", index, delta: text, partial: assistant });
      events.push({ type: "message_end", index, message: assistant });
      events.push({ type: "turn_end", usage: assistant.usage, stopReason: assistant.stopReason });
    }
  }
  return events;
}

function userMessageText(content: Message["content"]): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content.map((part: any) => part.type === "text" ? part.text : `[${part.type}]`).join(" ");
  }
  return String(content);
}
