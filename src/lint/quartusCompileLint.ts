import * as vscode from 'vscode';
import { type QuartusCompileError } from '../utils/quartusErrorParser';

export class QuartusCompileLinter implements vscode.Disposable
{
    private diagnostics: vscode.DiagnosticCollection;

    constructor()
    {
        this.diagnostics = vscode.languages.createDiagnosticCollection('vhdl-quartus-compile');
    }

    setCompileErrors(errors: QuartusCompileError[]): void
    {
        const byUri = new Map<string, { uri: vscode.Uri; diags: vscode.Diagnostic[] }>();

        for (const err of errors)
        {
            const key = err.uri.toString();
            const entry = byUri.get(key);

            if (entry)
            {
                entry.diags.push(
                    new vscode.Diagnostic(
                        err.range,
                        err.message,
                        err.severity === 'error'
                            ? vscode.DiagnosticSeverity.Error
                            : vscode.DiagnosticSeverity.Warning
                    )
                );
            }
            else
            {
                byUri.set(
                    key,
                    {
                        uri: err.uri,
                        diags: [
                            new vscode.Diagnostic(
                                err.range,
                                err.message,
                                err.severity === 'error'
                                    ? vscode.DiagnosticSeverity.Error
                                    : vscode.DiagnosticSeverity.Warning
                            )
                        ]
                    }
                );
            }
        }

        for (const entry of byUri.values())
        {
            this.diagnostics.set(entry.uri, entry.diags);
        }
    }

    clearCompileErrors(): void
    {
        this.diagnostics.clear();
    }

    dispose(): void
    {
        this.diagnostics.dispose();
    }
}
