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

        this.diagnostics.set(document.uri, diagnostics);
    }

    public dispose(): void
    {
        this.diagnostics.dispose();
    }
}