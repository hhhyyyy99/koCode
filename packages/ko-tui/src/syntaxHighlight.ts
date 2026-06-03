// Lightweight syntax tokenizer — no external dependencies.
// Supports: Python, TypeScript, JavaScript, Go, Rust, Bash

interface Token {
  text: string;
  type: "keyword" | "string" | "comment" | "number" | "plain";
}

interface LangConfig {
  keywords: Set<string>;
  lineComment: string;
  blockComment?: [string, string];
}

const LANG: Record<string, LangConfig> = {
  python: {
    keywords: new Set([
      "def", "class", "import", "from", "return", "if", "else", "elif",
      "for", "while", "try", "except", "finally", "with", "as", "pass",
      "break", "continue", "raise", "yield", "lambda", "and", "or", "not",
      "in", "is", "None", "True", "False", "self", "async", "await",
    ]),
    lineComment: "#",
  },
  typescript: {
    keywords: new Set([
      "function", "const", "let", "var", "return", "if", "else", "for",
      "while", "try", "catch", "finally", "throw", "class", "interface",
      "type", "enum", "export", "import", "from", "default", "async",
      "await", "new", "this", "extends", "implements", "typeof", "instanceof",
      "true", "false", "null", "undefined", "as", "of", "in",
    ]),
    lineComment: "//",
    blockComment: ["/*", "*/"],
  },
  javascript: {
    keywords: new Set([
      "function", "const", "let", "var", "return", "if", "else", "for",
      "while", "try", "catch", "finally", "throw", "class", "export",
      "import", "from", "default", "async", "await", "new", "this",
      "extends", "typeof", "instanceof", "true", "false", "null",
      "undefined", "of", "in", "switch", "case", "break", "continue",
    ]),
    lineComment: "//",
    blockComment: ["/*", "*/"],
  },
  go: {
    keywords: new Set([
      "func", "package", "import", "return", "if", "else", "for", "range",
      "var", "const", "type", "struct", "interface", "map", "chan", "go",
      "defer", "select", "case", "switch", "break", "continue", "fallthrough",
      "nil", "true", "false", "error", "string", "int", "bool", "byte",
    ]),
    lineComment: "//",
    blockComment: ["/*", "*/"],
  },
  rust: {
    keywords: new Set([
      "fn", "let", "mut", "return", "if", "else", "for", "while", "loop",
      "match", "impl", "struct", "enum", "trait", "pub", "use", "mod",
      "where", "as", "in", "ref", "self", "Self", "super", "crate",
      "true", "false", "async", "await", "move", "unsafe", "extern",
    ]),
    lineComment: "//",
    blockComment: ["/*", "*/"],
  },
  bash: {
    keywords: new Set([
      "if", "then", "else", "elif", "fi", "for", "while", "do", "done",
      "case", "esac", "in", "function", "return", "exit", "export", "local",
      "unset", "echo", "source", "alias",
    ]),
    lineComment: "#",
  },
  sh: {
    keywords: new Set([
      "if", "then", "else", "elif", "fi", "for", "while", "do", "done",
      "case", "esac", "in", "function", "return", "exit", "export", "local",
      "unset", "echo", "source", "alias",
    ]),
    lineComment: "#",
  },
};

export { LANG };
export type { Token, LangConfig };

export function tokenize(code: string, lang: string): Token[] {
  const config = LANG[lang];
  if (!config) return [{ text: code, type: "plain" }];

  return tokenizeWithConfig(code, config);
}

function tokenizeWithConfig(code: string, cfg: LangConfig): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < code.length) {
    // Whitespace
    if (code[i] === " " || code[i] === "\t") {
      let ws = "";
      while (i < code.length && (code[i] === " " || code[i] === "\t")) {
        ws += code[i];
        i++;
      }
      tokens.push({ text: ws, type: "plain" });
      continue;
    }

    // Line comment
    if (code.slice(i, i + cfg.lineComment.length) === cfg.lineComment) {
      const rest = code.slice(i);
      tokens.push({ text: rest, type: "comment" });
      i = code.length;
      break;
    }

    // Block comment
    if (cfg.blockComment) {
      const [open, close] = cfg.blockComment;
      if (code.slice(i, i + open.length) === open) {
        let bc = open;
        i += open.length;
        while (i < code.length && code.slice(i, i + close.length) !== close) {
          bc += code[i];
          i++;
        }
        if (i < code.length) {
          bc += close;
          i += close.length;
        }
        tokens.push({ text: bc, type: "comment" });
        continue;
      }
    }

    // String (double quoted)
    if (code[i] === '"') {
      let s = '"';
      i++;
      while (i < code.length && code[i] !== '"') {
        if (code[i] === "\\" && i + 1 < code.length) {
          s += code[i] + code[i + 1];
          i += 2;
        } else {
          s += code[i];
          i++;
        }
      }
      if (i < code.length) { s += '"'; i++; }
      tokens.push({ text: s, type: "string" });
      continue;
    }

    // String (single quoted)
    if (code[i] === "'") {
      let s = "'";
      i++;
      while (i < code.length && code[i] !== "'") {
        if (code[i] === "\\" && i + 1 < code.length) {
          s += code[i] + code[i + 1];
          i += 2;
        } else {
          s += code[i];
          i++;
        }
      }
      if (i < code.length) { s += "'"; i++; }
      tokens.push({ text: s, type: "string" });
      continue;
    }

    // Backtick string
    if (code[i] === "`") {
      let s = "`";
      i++;
      while (i < code.length && code[i] !== "`") {
        if (code[i] === "\\" && i + 1 < code.length) {
          s += code[i] + code[i + 1];
          i += 2;
        } else {
          s += code[i];
          i++;
        }
      }
      if (i < code.length) { s += "`"; i++; }
      tokens.push({ text: s, type: "string" });
      continue;
    }

    // Number
    if (/[0-9]/.test(code[i]!)) {
      let num = "";
      while (i < code.length && /[0-9a-fA-FxXoObB_.]/.test(code[i]!)) {
        num += code[i];
        i++;
      }
      tokens.push({ text: num, type: "number" });
      continue;
    }

    // Word (keyword or identifier)
    if (/[a-zA-Z_]/.test(code[i]!)) {
      let word = "";
      while (i < code.length && /[a-zA-Z0-9_]/.test(code[i]!)) {
        word += code[i];
        i++;
      }
      const type = cfg.keywords.has(word) ? "keyword" : "plain";
      tokens.push({ text: word, type });
      continue;
    }

    // Everything else (operators, punctuation)
    tokens.push({ text: code[i]!, type: "plain" });
    i++;
  }

  return tokens;
}
