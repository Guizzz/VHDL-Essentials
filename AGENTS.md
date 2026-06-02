# Quartus Assistant — Agent Guide

## Dev commands

| Command | What it does |
|---|---|
| `npm run check-types` | `tsc --noEmit` (typecheck only) |
| `npm run lint` | `eslint src` |
| `npm run compile` | `check-types && lint && esbuild` — **run before commit** |
| `npm run package` | `check-types && lint && esbuild --production` (minified) — CI equivalent |
| `npm run watch` | Parallel `tsc --watch` + `esbuild --watch` |
| `npm run compile-tests` | `tsc -p . --outDir out` (compiles `src/test/` → `out/test/`) |
| `npm test` | Compiles tests + extension, then runs `vscode-test` |
| `npx vsce package` | Produces `.vsix` for distribution |

Command order (not enforced by tooling, but expected by convention): `lint → check-types → build` (already encoded in `compile` and `package` scripts).

## Architecture

**Entrypoint**: `src/extension.ts` — bundles to `dist/extension.js` via esbuild (CJS, Node target, `vscode` external).

**Major directories**:
- `src/commands/` — 5 registered commands (build, flash, setPath, genDoFile, runDoFile)
- `src/services/` — indexer, watchers, language registration, lint registration, QSF tree view
- `src/providers/` — definition providers, hover providers, tree data provider, semantic highlight
- `src/parsers/` — VHDL entity, package, variable, and QSF parsers
- `src/quartus/` — Quartus CLI runner, project config, pin resolver, logger
- `src/lint/` — port lint, duplicate signal lint, QSF lint (all use VS Code diagnostic collections)
- `src/ui/` — status bar, icon setup, UI state watcher
- `src/utils/` — DO file generator, simulation scanner, hover icon helper

**Activation**: `onStartupFinished` — no command-based activation.

**Config key**: `maxv.quartusPath` (default `C:\\altera_lite\\25.1std`).

## Key constraints

- **No test files exist yet.** The test infra (`@vscode/test-cli`, `out/test/**/*.test.js`) is configured but unused. If adding tests, place them in `src/test/` and compile with `npm run compile-tests`.
- **Generated files in `dist/` and `out/`** are gitignored and vscodeignored. Do not commit build output.
- **Extension is packaged** — `.vscodeignore` excludes `src/`, `*.ts`, `*.map`, config files from the `.vsix`.
- **CI**: GitHub Actions on `v*` tags — runs `npm ci && vsce package && vsce publish`. No tests run in CI.
- **Syntax grammars**: TextMate JSON files in `syntaxes/` (vhdl, do, quartus). Edit these if changing syntax highlighting.
- **Language config**: `syntaxes/language-configuration.json` for VHDL bracket matching, comments, etc.

## Style & conventions

- TypeScript with strict mode enabled (see `tsconfig.json`).
- ESLint: 4-space indent, semicolons required, `curly`/`eqeqeq` warnings.
- VS Code API imports use `import * as vscode from 'vscode'`.
- All commands return `void` (no `async` on command handlers unless needed).
- No external runtime dependencies — the extension bundle is self-contained (only `vscode` externalized).
- **Opening braces on new line** (Allman style) — functions, `if`, `for`, `while`, `class`.
- **Inline helpers used once** — avoid extracting a function unless called from ≥2 places. If it's single-use, keep it inline or a private method at most.
- **Single-line early returns** — `if (!cond) { return; }` su stessa riga quando il body è solo un `return` o un semplice statement.
