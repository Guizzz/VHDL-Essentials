import * as vscode from 'vscode';
import * as path from 'path';
import { type QuartusMessage } from '../quartus/logger/outputParser';

export interface QuartusCompileError
{
    uri: vscode.Uri;
    range: vscode.Range;
    message: string;
    severity: 'error' | 'warning';
    fileName: string;
}

const FILE_LINE_RE = /(?:at\s+)?([\w.:\\.\/-]+?\.\w+)\((\d+)(?:,(\d+))?\)/;

export function parseQuartusError(
    msg: QuartusMessage,
    workspaceRoot: string
): QuartusCompileError | null
{
    const match = msg.text.match(FILE_LINE_RE);

    if (!match) { return null; }

    const fileName = match[1];
    const line = Math.max(0, parseInt(match[2], 10) - 1);
    const col = match[3] ? Math.max(0, parseInt(match[3], 10) - 1) : 0;

    const isAbs = path.isAbsolute(fileName);
    const uri = isAbs
        ? vscode.Uri.file(fileName)
        : vscode.Uri.file(path.join(workspaceRoot, fileName));

    const range = new vscode.Range(line, col, line, col + 1);

    return {
        uri,
        range,
        message: msg.text,
        severity: msg.severity === 'warning' || msg.severity === 'critical'
            ? 'warning'
            : 'error',
        fileName
    };
}


