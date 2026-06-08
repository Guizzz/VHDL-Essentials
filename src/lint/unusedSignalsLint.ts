import * as vscode from 'vscode';
import { parseSignals } from '../parsers/variableParser';
import { VHDL_KEYWORDS } from '../utils/vhdlKeywords';
import { offsetToPosition } from '../utils/positionUtils';

export function findUnusedSignals(text: string): vscode.Diagnostic[]
{
    const signals = parseSignals(text);
    const diagnostics: vscode.Diagnostic[] = [];
    const lines = text.split(/\r?\n/);

    for (const signal of signals)
    {
        if (signal.kind === 'port')
        {
            continue;
        }

        if (VHDL_KEYWORDS.has(signal.name.toLowerCase()))
        {
            continue;
        }

        const pos = offsetToPosition(text, signal.offset);
        const declLine = pos.line;
        const col = pos.character;

        // Skip declarations inside comments
        const lineText = lines[declLine];
        const commentIdx = lineText.indexOf('--');
        if (commentIdx >= 0 && col >= commentIdx)
        {
            continue;
        }

        const escaped = signal.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`\\b${escaped}\\b`, 'i');
        let found = false;

        for (let i = 0; i < lines.length && !found; i++)
        {
            if (i === declLine)
            {
                continue;
            }

            const line = lines[i];
            const ci = line.indexOf('--');
            const codePart = ci >= 0
                ? line.slice(0, ci)
                : line;

            if (regex.test(codePart))
            {
                found = true;
            }
        }

        if (!found)
        {
            const range = new vscode.Range(
                declLine, col,
                declLine, col + signal.name.length
            );
            const diagnostic = new vscode.Diagnostic(
                range,
                `Unused ${signal.kind} '${signal.name}'`,
                vscode.DiagnosticSeverity.Warning
            );
            diagnostic.source = 'VHDL Essentials';
            diagnostics.push(diagnostic);
        }
    }

    return diagnostics;
}

export class UnusedSignalsLinter
{
    private diagnostics = vscode.languages.createDiagnosticCollection('vhdl-unused');
    private debounceTimer: ReturnType<typeof setTimeout> | undefined;

    constructor(context: vscode.ExtensionContext)
    {
        if (vscode.window.activeTextEditor)
        {
            this.validate(vscode.window.activeTextEditor.document);
        }

        context.subscriptions.push(
            vscode.workspace.onDidOpenTextDocument(doc => this.validate(doc)),
            vscode.workspace.onDidChangeTextDocument(e => this.schedule(e.document))
        );
    }

    private schedule(document: vscode.TextDocument)
    {
        if (document.languageId !== 'vhdl') { return; }
        if (document.uri.scheme !== 'file') { return; }

        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(
            () => this.validate(document),
            400
        );
    }

    private validate(document: vscode.TextDocument)
    {
        if (document.languageId !== 'vhdl') { return; }
        if (document.uri.scheme !== 'file') { return; }

        const diags = findUnusedSignals(document.getText());
        this.diagnostics.set(document.uri, diags);
    }

    dispose(): void
    {
        clearTimeout(this.debounceTimer);
        this.diagnostics.dispose();
    }
}
