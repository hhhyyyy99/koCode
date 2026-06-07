export interface InputBuffer {
  text: string;
  cursorOffset: number;
}

export type CursorDirection = "left" | "right";

export function clampCursorOffset(text: string, cursorOffset: number): number {
  if (!Number.isFinite(cursorOffset)) return text.length;
  return Math.max(0, Math.min(text.length, Math.trunc(cursorOffset)));
}

export function setInputText(text: string, cursorOffset = text.length): InputBuffer {
  return {
    text,
    cursorOffset: clampCursorOffset(text, cursorOffset),
  };
}

export function emptyInputBuffer(): InputBuffer {
  return setInputText("");
}

export function insertText(buffer: InputBuffer, text: string): InputBuffer {
  const cursorOffset = clampCursorOffset(buffer.text, buffer.cursorOffset);
  const nextText = buffer.text.slice(0, cursorOffset) + text + buffer.text.slice(cursorOffset);
  return setInputText(nextText, cursorOffset + text.length);
}

export function deleteBackward(buffer: InputBuffer): InputBuffer {
  const cursorOffset = clampCursorOffset(buffer.text, buffer.cursorOffset);
  if (cursorOffset === 0) return setInputText(buffer.text, 0);

  const nextText = buffer.text.slice(0, cursorOffset - 1) + buffer.text.slice(cursorOffset);
  return setInputText(nextText, cursorOffset - 1);
}

export function deleteForward(buffer: InputBuffer): InputBuffer {
  const cursorOffset = clampCursorOffset(buffer.text, buffer.cursorOffset);
  if (cursorOffset >= buffer.text.length) return setInputText(buffer.text, cursorOffset);

  const nextText = buffer.text.slice(0, cursorOffset) + buffer.text.slice(cursorOffset + 1);
  return setInputText(nextText, cursorOffset);
}

export function moveCursor(buffer: InputBuffer, direction: CursorDirection): InputBuffer {
  const cursorOffset = clampCursorOffset(buffer.text, buffer.cursorOffset);
  const delta = direction === "left" ? -1 : 1;
  return setInputText(buffer.text, cursorOffset + delta);
}

export function replaceRange(
  buffer: InputBuffer,
  start: number,
  end: number,
  text: string,
  cursorOffset = clampCursorOffset(buffer.text, start) + text.length,
): InputBuffer {
  const rangeStart = clampCursorOffset(buffer.text, Math.min(start, end));
  const rangeEnd = clampCursorOffset(buffer.text, Math.max(start, end));
  const nextText = buffer.text.slice(0, rangeStart) + text + buffer.text.slice(rangeEnd);
  return setInputText(nextText, cursorOffset);
}
