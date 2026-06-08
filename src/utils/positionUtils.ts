import * as vscode from 'vscode';

export function offsetToPosition(text: string, offset: number): vscode.Position
{
    const before = text.substring(0, offset);
    const line = before.split('\n').length - 1;
    const col = before.length - before.lastIndexOf('\n') - 1;
    return new vscode.Position(line, col);
}
