import type { Model } from "@kocode/ko-ai";

interface Props {
  model: Model;
  cwd: string;
}

export function formatWelcomeLines(model: Model, cwd: string): string[] {
  void model;
  void cwd;
  return [];
}

export function Welcome({ model, cwd }: Props) {
  void model;
  void cwd;
  return null;
}
