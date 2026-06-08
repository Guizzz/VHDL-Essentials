import * as vscode from 'vscode';
import { parseSignals } from '../parsers/variableParser';

const VHDL_KEYWORDS = new Set([
    'all', 'and', 'architecture', 'array', 'assert', 'attribute',
    'begin', 'block', 'body', 'buffer', 'bus', 'case', 'component',
    'configuration', 'constant', 'disconnect', 'downto', 'else', 'elsif',
    'end', 'entity', 'exit', 'file', 'for', 'function', 'generate',
    'generic', 'group', 'guarded', 'if', 'impure', 'in', 'inertial',
    'inout', 'is', 'label', 'library', 'linkage', 'literal', 'loop',
    'map', 'mod', 'nand', 'new', 'next', 'nor', 'not', 'null', 'of',
    'on', 'open', 'or', 'others', 'out', 'package', 'port', 'postponed',
    'procedure', 'process', 'pure', 'range', 'record', 'register',
    'reject', 'report', 'return', 'rol', 'ror', 'select', 'severity',
    'signal', 'shared', 'sla', 'sll', 'sra', 'srl', 'subtype', 'then',
    'to', 'transport', 'type', 'unaffected', 'units', 'until', 'use',
    'variable', 'wait', 'when', 'while', 'with', 'xnor', 'xor',
    'std_logic', 'std_logic_vector', 'integer', 'boolean', 'natural',
    'positive', 'bit', 'bit_vector', 'character', 'string', 'time',
    'real', 'signed', 'unsigned',
]);

function offsetToLine(text: string, offset: number): number
{
    let line = 0;
    for (let i = 0; i < offset; i++)
    {
        if (text[i] === '\n')
        {
            line++;
        }
    }
    return line;
}

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

        const declLine = offsetToLine(text, signal.offset);

        // Compute column of the signal name within its line (same method as range below)
        let col = 0;
        for (let i = signal.offset - 1; i >= 0 && text[i] !== '\n'; i--)
        {
            col++;
        }

        // Skip declarations inside comments
        const lineText = lines[declLine];
        const commentIdx = lineText.indexOf('--');
        if (commentIdx >= 0 && col >= commentIdx)
        {
            continue;
        }

        const regex = new RegExp(`\\b${signal.name}\\b`, 'i');
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
