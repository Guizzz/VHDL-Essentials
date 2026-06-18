---
name: vscode-extension-patterns
description: Use when modifying or adding VS Code extension features — commands, linters, providers, services, UI, or any file under src/ in the QuartusAssistant project.
---

# VS Code Extension Patterns — QuartusAssistant

## Entrypoint (`src/extension.ts`)
Activation: `onStartupFinished` (not command-based). The `activate()` function:
1. Creates the `EntityIndexer` singleton
2. Calls `registerLintFeature()`, `registerLanguages()`, `registerCommands()`, `registerQsfView()`, `setupStatusBar()`, `setupIcons()`, `setupUiWatcher()`
3. All disposables are pushed into `context.subscriptions`

`deactivate()` returns `void` — VS Code handles disposal of `context.subscriptions`.

## Command pattern
Each command is a separate file in `src/commands/`. Signature:
```ts
import * as vscode from 'vscode';
export function register<Name>Command(context: vscode.ExtensionContext): void
{
    context.subscriptions.push(
        vscode.commands.registerCommand('quartus-assistant.<name>', () =>
        {
            // no async unless needed (command handlers return void)
        })
    );
}
```
Commands return `void` — no promises unless required.

## Linter pattern (11 linters exist)
Every linter follows this exact structure:

```ts
import * as vscode from 'vscode';

// Pure function for testing (no VS Code dependency in signature)
export function extractFoo(text: string): vscode.Diagnostic[]
{
    // returns diagnostics
}

export class FooLinter
{
    private diagnostics = vscode.languages.createDiagnosticCollection('vhdl-foo');
    private debounceTimer: ReturnType<typeof setTimeout> | undefined;

    constructor(context: vscode.ExtensionContext)
    {
        if (vscode.window.activeTextEditor) {
            this.validate(vscode.window.activeTextEditor.document);
        }
        context.subscriptions.push(
            vscode.workspace.onDidOpenTextDocument(doc => this.validate(doc)),
            vscode.workspace.onDidChangeTextDocument(e => this.schedule(e.document)),
            this.diagnostics
        );
    }

    private schedule(document: vscode.TextDocument): void
    {
        if (document.languageId !== 'vhdl') { return; }
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => this.validate(document), 400);
    }

    private validate(document: vscode.TextDocument): void
    {
        if (document.languageId !== 'vhdl') { return; }
        const diags = extractFoo(document.getText());
        this.diagnostics.set(document.uri, diags);
    }

    dispose(): void
    {
        clearTimeout(this.debounceTimer);
        this.diagnostics.dispose();
    }
}
```
Key rules:
- `createDiagnosticCollection` name must be unique (prefix `vhdl-` for VHDL, `qsf` for QSF)
- `diagnostic.source = 'VHDL Essentials'`
- Debounce timer: 400ms on `onDidChangeTextDocument`
- `dispose()` clears timer and disposes collection

## Provider pattern
Providers follow VS Code standard registration:
- **Hover**: `vscode.languages.registerHoverProvider('vhdl', provider)`
- **Definition**: `vscode.languages.registerDefinitionProvider('vhdl', provider)`
- **Completion**: `vscode.languages.registerCompletionItemProvider('vhdl', provider, ...triggerChars)`
- **DocumentSymbol**: `vscode.languages.registerDocumentSymbolProvider('vhdl', provider)`
- **CodeActions**: `vscode.languages.registerCodeActionsProvider('vhdl', provider)`
All registered inside `src/services/languagesRegister.ts`.

## Code action pattern (`codeActions.ts`)
Dispatch-based: a function receives `(doc, diag, token)` and returns `CodeAction | CodeAction[] | null`.
Action builders are registered in a map keyed by diagnostic code. Each creates a `WorkspaceEdit` with `edit.insert()` or `edit.replace()`, and returns a `CodeAction` with `kind: vscode.CodeActionKind.QuickFix`.

## Type definitions (`src/types/types.ts`)
Key interfaces: `EntityPort`, `EntitySymbol`, `EntityInfo`, `ParsedPackage`, `PackageSymbolInfo`, `PackageInfo`, `ParsedSignalLike`, `PinAssignment`. Used across parsers, linters, providers.

## EntityIndexer singleton (`src/services/entityIndexer.ts`)
Consumed by multiple providers and linters. Built on activation, re-indexed on file save/create/delete. Provides cached entity/package lookups.

## UI components
- Status bar: left-side buttons shown only when `.qpf` project exists
- Activity bar: `quartus-assistant-view` tree view
- Output channels: `Quartus Assistant` (log), `Questa Transcript` (simulation)

## Config key
`maxv.quartusPath` (default `C:\\altera_lite\\25.1std`) — drives Quartus CLI tool discovery.
