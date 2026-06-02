import * as vscode from 'vscode';

export class QsfLint
{
    private diagnostics: vscode.DiagnosticCollection;

    constructor(context: vscode.ExtensionContext)
    {
        this.diagnostics = vscode.languages.createDiagnosticCollection('qsf');

        context.subscriptions.push(
            vscode.workspace.onDidOpenTextDocument(document => this.lint(document)),
            vscode.workspace.onDidChangeTextDocument(event => this.lint(event.document)),
            vscode.workspace.onDidCloseTextDocument(document => this.diagnostics.delete(document.uri))
        );
    }

    public lint(document: vscode.TextDocument): void
    {
        if (document.languageId !== 'qsf') { return; }

        const diagnostics: vscode.Diagnostic[] = [];

        for (let lineIndex = 0; lineIndex < document.lineCount; lineIndex++)
        {
            const line = document.lineAt(lineIndex).text;

            // skip comments
            if (line.trim().startsWith('#')) { continue; }

            // multiple spaces
            const multipleSpaces = / {2,}/g;
            let match: RegExpExecArray | null;

            while ((match = multipleSpaces.exec(line)) !== null)
            {
                diagnostics.push(
                    new vscode.Diagnostic(
                        new vscode.Range(
                            lineIndex,
                            match.index,
                            lineIndex,
                            match.index + match[0].length
                        ),
                        'Multiple consecutive spaces',
                        vscode.DiagnosticSeverity.Warning
                    )
                );
            }

            // tab character
            const tabs = /\t/g;

            while ((match = tabs.exec(line)) !== null)
            {
                diagnostics.push(
                    new vscode.Diagnostic(
                        new vscode.Range(
                            lineIndex,
                            match.index,
                            lineIndex,
                            match.index + 1
                        ),
                        'Tab character detected, use spaces instead',
                        vscode.DiagnosticSeverity.Information
                    )
                );
            }

            // missing assignment command
            if (
                line.trim().length > 0 &&
                !line.trim().startsWith('#') &&
                !line.includes('set_global_assignment') &&
                !line.includes('set_location_assignment')
            )
            {
                diagnostics.push(
                    new vscode.Diagnostic(
                        new vscode.Range(
                            lineIndex,
                            0,
                            lineIndex,
                            line.length
                        ),
                        'Unknown or unsupported QSF command',
                        vscode.DiagnosticSeverity.Hint
                    )
                );
            }
        }

        this.checkDuplicateAssignments(document, diagnostics);

        this.diagnostics.set(document.uri, diagnostics);
    }

    private checkDuplicateAssignments(document: vscode.TextDocument, diagnostics: vscode.Diagnostic[]): void
    {
        const assignments: { pin: string; signal: string; line: number }[] = [];

        for (let lineIndex = 0; lineIndex < document.lineCount; lineIndex++)
        {
            const line = document.lineAt(lineIndex).text;
            if (line.trim().startsWith('#')) { continue; }

            const match = line.match(/set_location_assignment (PIN_[A-Z0-9]+) -to (\w+)/);
            if (match)
            {
                assignments.push({ pin: match[1], signal: match[2], line: lineIndex });
            }
        }

        // same PIN_xx assigned to different signals
        const byPin = new Map<string, typeof assignments>();
        for (const a of assignments)
        {
            const group = byPin.get(a.pin);
            if (group) { group.push(a); } else { byPin.set(a.pin, [a]); }
        }
        for (const [, group] of byPin)
        {
            if (group.length < 2) { continue; }

            const signals = [...new Set(group.map(a => a.signal))].join(', ');
            for (const a of group)
            {
                const range = new vscode.Range(a.line, 0, a.line, document.lineAt(a.line).text.length);
                diagnostics.push(
                    new vscode.Diagnostic(
                        range,
                        `Duplicate pin '${a.pin}': assigned to ${signals}`,
                        vscode.DiagnosticSeverity.Error
                    )
                );
            }
        }

        // same signal assigned to different pins
        const bySignal = new Map<string, typeof assignments>();
        for (const a of assignments)
        {
            const group = bySignal.get(a.signal);
            if (group) { group.push(a); } else { bySignal.set(a.signal, [a]); }
        }
        for (const [, group] of bySignal)
        {
            if (group.length < 2) { continue; }

            const pins = [...new Set(group.map(a => a.pin))].join(', ');
            for (const a of group)
            {
                const range = new vscode.Range(a.line, 0, a.line, document.lineAt(a.line).text.length);
                diagnostics.push(
                    new vscode.Diagnostic(
                        range,
                        `Duplicate signal '${a.signal}': assigned to ${pins}`,
                        vscode.DiagnosticSeverity.Warning
                    )
                );
            }
        }
    }

    public dispose(): void
    {
        this.diagnostics.dispose();
    }
}