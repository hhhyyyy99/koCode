## ADDED Requirements

### Requirement: Code block syntax highlighting
The system SHALL render code blocks with keyword, string, comment, and number coloring using a lightweight tokenizer.

#### Scenario: Code block with keywords
- **WHEN** a code block contains language keywords (function, const, if, return, class, import, def)
- **THEN** keywords are rendered in a distinct color (blue or cyan)

#### Scenario: Code block with strings
- **WHEN** a code block contains string literals (single/double quoted, backtick)
- **THEN** strings are rendered in green or yellow

#### Scenario: Code block with comments
- **WHEN** a code block contains line comments (//, #) or block comments (/* */)
- **THEN** comments are rendered in dimmed/gray

#### Scenario: Unsupported language fallback
- **WHEN** a code block language is not in the supported list (Python, TS, JS, Go, Rust, Bash)
- **THEN** the code block renders without syntax highlighting
- **AND** no error or warning is shown

### Requirement: Supported languages
The system SHALL support syntax highlighting for Python, TypeScript, JavaScript, Go, Rust, and Bash.

#### Scenario: Language detection from markdown
- **WHEN** a markdown code fence specifies a supported language (e.g., ```python)
- **THEN** the tokenizer for that language is used for highlighting
