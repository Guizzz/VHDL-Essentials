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

## Workflow

Before starting work on an issue, prepare a **work plan** (what needs to change, files involved, risks) and submit it to the user for approval. Only proceed with implementation, commit, and issue closure after receiving the go-ahead.

When closing a GitHub issue, **always link the relevant commit** in the closing comment.

## Architecture

**Entrypoint**: `src/extension.ts` — bundles to `dist/extension.js` via esbuild (CJS, Node target, `vscode` external).

**Major directories**:
- `src/commands/` — 4 registered commands (build, flash, genDoFile, runDoFile)
- `src/services/` — indexer, watchers, language registration, lint registration, QSF tree view
- `src/providers/` — definition providers, hover providers, tree data provider, semantic highlight
- `src/parsers/` — VHDL entity, package, variable, and QSF parsers
- `src/quartus/` — Quartus CLI runner, project config, pin resolver, logger
- `src/lint/` — port lint, duplicate signal lint, QSF lint (all use VS Code diagnostic collections)
- `src/ui/` — status bar, icon setup, UI state watcher
- `src/utils/` — DO file generator, simulation scanner, hover icon helper

**Activation**: `onStartupFinished` — no command-based activation.

**Config key**: `maxv.quartusPath` (default `C:\\altera_lite\\25.1std`).

## Git rules

- **No push/commit without approval** — every push and commit must be approved by the user first. Never push or commit without asking.
- **No tag generation** — never create or push git tags unless explicitly requested.
- **CHANGELOG.md is OFF-LIMITS** — never touch the changelog. Only the user decides when and how to update it. The only exception is the `crea versione v#.#.#` workflow below, and only when explicitly requested.
- **Version creation (`crea versione v#.#.#`)** — on request "crea versione v#.#.#":
  1. Generate a new changelog section (CHANGELOG.md) for the given version
  2. Run `npm run docs:prebuild` to regenerate `docs/development/changelog.md` from CHANGELOG.md
  3. Update version in package.json (and package-lock.json if present)
  4. Create a commit with **only** those three files (CHANGELOG.md, docs/development/changelog.md, package.json)
  5. The commit message must be exactly the version (e.g. `v1.2.3`)
  Assumes all other project changes have already been committed separately.

## Key constraints

- **Tests exist** in `src/test/` (parsers, utils, linters). Compile with `npm run compile-tests` and run with `npm test`. When adding tests, place them in the appropriate subdirectory under `src/test/`.
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
- **Single-line early returns** — `if (!cond) { return; }` on the same line when the body is just a `return` or a simple statement.
