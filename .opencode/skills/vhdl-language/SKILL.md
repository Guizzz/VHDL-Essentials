---
name: vhdl-language
description: Use when working with VHDL source files (.vhd, .vhdl), VHDL parsers, linters, code actions, or any VHDL language feature in the QuartusAssistant project.
---

# VHDL Language — Project-Specific Reference

## Entity pattern
```vhdl
entity <name> is
    port (
        <signal> : <direction> <type>;
    );
end entity <name>;
```

Directions: `in`, `out`, `inout`, `buffer`. The `;` after `end entity` is optional in VHDL'87 but required in VHDL'93+. This project typically omits or includes it inconsistently — the syntax linter (`syntaxLint.ts`) permits both.

## Architecture pattern
```vhdl
architecture <name> of <entity> is
    -- declarations (signals, components, functions, constants)
begin
    -- concurrent statements / processes
end architecture <name>;
```

## Process pattern
```vhdl
process(<sensitivity_list>)
    -- variables, constants
begin
    -- sequential statements (if, case, loop, wait)
end process;
```

## Scopes tracked by syntaxLint.ts
`entity`, `architecture`, `process`, `if`, `for`, `case`, `generate`, `component`, `package`, `package body`, `function`, `procedure`, `block`, `record`, `context`.

The linter uses a stack-based scope tracker (`ScopeFrame[]`) with `tryOpenScope()` on each line. Comments (`--`) are stripped before analysis. Every `begin`/`end` pair is matched, and unclosed or mismatched scopes produce diagnostics.

## Port map rules
Port map lint (`portMapLint.ts`) checks:
- Named association: `port_a => sig_a` (formal => actual)
- Positional association (no formal name)
- Unconnected: `port_a => open`
- Missing required ports
- Extra ports not in entity definition

## VHDL keywords (vhdlKeywords.ts)
Keywords are grouped: `statements`, `types`, `functions`, `packages`, `operators`, `attributes`, `directives`. Used for completion and syntax highlighting.

## Package parsing (`packageParser.ts`)
Exported symbols: `constant`, `function`, `procedure`, `type`, `subtype`, `component`, `signal`, `file`. Each parsed with name, kind, type, offset, optional value.

## Variable/signal parsing (`variableParser.ts`)
Declarations matched in architecture bodies and processes. Kinds: `signal`, `variable`, `constant`. Supports `:=` initialization.

## Comment style
VHDL comments use `--` (double dash). The project also supports `TODO`, `FIXME`, `HACK`, `XXX`, `NOTE` tags in comments for the TODO linter.

## Conventions in this project
- Entity names are PascalCase or snake_case
- Port names are lowercase with underscores
- Signals prefixed with `s_` or descriptive names
- Clock and reset typically named `clk`, `rst`
- Active-low signals suffixed with `_n` or `_b`
- Architecture names: `rtl`, `behav`, `structural`, `sim`
