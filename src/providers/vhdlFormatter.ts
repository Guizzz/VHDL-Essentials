import * as vscode from 'vscode';
import { formatVhdl, resolveFormatOptions } from '../utils/vhdlFormatterCore';

export class VhdlDocumentFormatter implements vscode.DocumentFormattingEditProvider
{
    public provideDocumentFormattingEdits(
        document: vscode.TextDocument,
        options: vscode.FormattingOptions,
        _token: vscode.CancellationToken
    ): vscode.TextEdit[]
    {
        const config = vscode.workspace.getConfiguration('vhdl.formatter');
        const opts = resolveFormatOptions(
            {
                indentSize: config.get<number>('indentSize'),
                insertSpaces: config.get<boolean>('insertSpaces'),
            },
            options
        );

        const formatted = formatVhdl(document.getText(), opts);

        const fullRange = new vscode.Range(
            document.positionAt(0),
            document.positionAt(document.getText().length)
        );

        return [vscode.TextEdit.replace(fullRange, formatted)];
    }
}
