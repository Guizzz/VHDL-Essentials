import * as vscode from 'vscode';
import { formatVhdl } from '../utils/vhdlFormatterCore';

export class VhdlDocumentFormatter implements vscode.DocumentFormattingEditProvider
{
    public provideDocumentFormattingEdits(
        document: vscode.TextDocument,
        options: vscode.FormattingOptions,
        _token: vscode.CancellationToken
    ): vscode.TextEdit[]
    {
        const formatted = formatVhdl(document.getText(), {
            indentSize: options.tabSize,
            insertSpaces: options.insertSpaces,
        });

        const fullRange = new vscode.Range(
            document.positionAt(0),
            document.positionAt(document.getText().length)
        );

        return [vscode.TextEdit.replace(fullRange, formatted)];
    }
}
