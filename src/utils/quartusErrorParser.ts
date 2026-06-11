import * as vscode from 'vscode';
import * as path from 'path';
import { type QuartusMessage } from '../quartus/logger/outputParser';

const WIN_ABS_RE = /^[a-zA-Z]:[/\\]/;

export interface QuartusCompileError
{
    uri: vscode.Uri;
    range: vscode.Range;
    message: string;
    severity: 'error' | 'warning' | 'info';
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

    let fileName = match[1];
    const line = Math.max(0, parseInt(match[2], 10) - 1);
    const col = match[3] ? Math.max(0, parseInt(match[3], 10) - 1) : 0;

    fileName = fileName.replace(/\\/g, '/');
    const isAbs = path.isAbsolute(fileName) || WIN_ABS_RE.test(fileName);

    const root = workspaceRoot.replace(/\\/g, '/');
    const filePath = isAbs ? fileName : path.posix.join(root, fileName);
    const uri = vscode.Uri.file(filePath);

    const range = new vscode.Range(line, col, line, col + 1);

    let severity: 'error' | 'warning' | 'info';

    if (msg.severity === 'info')
    {
        severity = 'info';
    }
    else if (msg.severity === 'warning' || msg.severity === 'critical')
    {
        severity = 'warning';
    }
    else
    {
        severity = 'error';
    }

    return {
        uri,
        range,
        message: msg.text,
        severity,
        fileName
    };
}


