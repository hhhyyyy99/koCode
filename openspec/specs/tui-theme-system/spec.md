# tui-theme-system Specification

## Purpose
TBD - created by archiving change kocode-tui-full-alignment. Update Purpose after archive.
## Requirements
### Requirement: Theme selection command
The system SHALL support theme switching via `/theme` command with an interactive selector.

#### Scenario: Theme list
- **WHEN** user runs `/theme`
- **THEN** a theme selector is displayed with options:
  - Auto (match terminal)
  - Dark mode
  - Light mode
  - Dark mode (colorblind-friendly)
  - Light mode (colorblind-friendly)
  - Dark mode (ANSI colors only)
  - Light mode (ANSI colors only)
- **AND** the current theme is marked with ✔

#### Scenario: Theme preview
- **WHEN** user navigates the theme list
- **THEN** a preview code snippet is shown below the list demonstrating the selected theme's colors

#### Scenario: Theme applied
- **WHEN** user selects a theme and presses Enter
- **THEN** the TUI immediately switches to the new theme
- **AND** the selection is persisted to config

### Requirement: Theme runtime switching
The system SHALL re-render the entire TUI when the theme changes, applying new colors to all components.

#### Scenario: Dark to light switch
- **WHEN** theme is changed from dark to light
- **THEN** all text colors, borders, and backgrounds update
- **AND** the input prompt ❯ remains visible

