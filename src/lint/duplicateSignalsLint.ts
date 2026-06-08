import * as vscode from 'vscode';
import { parseSignals } from '../parsers/variableParser';
import { offsetToPosition } from '../utils/positionUtils';

export function findDuplicateSignals(text: string): vscode.Diagnostic[]
{
    const signals = parseSignals(text);
    const diagnostics: vscode.Diagnostic[] = [];
    const seen = new Map<string, typeof signals[0]>();

    for (const signal of signals)
    {
        const key = signal.name.toLowerCase();
        if (seen.has(key))
        {
            const pos = offsetToPosition(text, signal.offset);
            const range = new vscode.Range(
                pos,
                pos.translate(0, signal.name.length)
            );
            const diagnostic = new vscode.Diagnostic(
                range,
                `Duplicate declaration of '${signal.name}'`,
                vscode.DiagnosticSeverity.Error
            );
            diagnostic.source = 'VHDL Essentials';
            diagnostics.push(diagnostic);
        }
        else
        {
            seen.set(key, signal);
        }
    }

    return diagnostics;
}

export class DuplicateSignalLinter
{
    private diagnostics = vscode.languages.createDiagnosticCollection('vhdl');

    constructor(context: vscode.ExtensionContext)
    {
        if (vscode.window.activeTextEditor)
        {
            this.refresh(vscode.window.activeTextEditor.document);
        }
        context.subscriptions.push(
            vscode.workspace.onDidOpenTextDocument(doc => this.refresh(doc)),
            vscode.workspace.onDidChangeTextDocument(e => this.refresh(e.document))
        );
    }

    private refresh(document: vscode.TextDocument)
    {
        if (document.languageId !== 'vhdl') {return;}

        const diags = findDuplicateSignals(document.getText());
        this.diagnostics.set(document.uri, diags);
    }

    dispose(): void
    {
        this.diagnostics.dispose();
    }
}
