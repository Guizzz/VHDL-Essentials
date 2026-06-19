import * as vscode from 'vscode';
import { FitSummaryData, FitSummaryEntry } from '../types/types';

export function parseFitSummaryText(text: string): FitSummaryData
{
    const lines = text.split(/\r?\n/);
    let status: string | undefined;
    const entries: FitSummaryEntry[] = [];

    for (const line of lines)
    {
        const trimmed = line.trim();
        if (!trimmed) { continue; }

        const sepIndex = trimmed.indexOf(' : ');
        if (sepIndex === -1) { continue; }

        const key = trimmed.substring(0, sepIndex).trim();
        const value = trimmed.substring(sepIndex + 3).trim();
        if (!key || !value) { continue; }

        if (key === 'Fitter Status')
        {
            status = value;
            continue;
        }

        if (
            key === 'Quartus Prime Version' ||
            key === 'Quartus II 64-Bit Version' ||
            key === 'Revision Name' ||
            key === 'Top-level Entity Name'
        )
        {
            continue;
        }

        const entry = parseResourceEntry(key, value);
        if (entry)
        {
            entries.push(entry);
        }
    }

    return { status, entries };
}

function parseResourceEntry(key: string, value: string): FitSummaryEntry | null
{
    const cleaned = value
        .replace(/,/g, '')
        .replace(/<\s*1\s*%/g, '0%');

    const match = cleaned.match(/^(\d+)\s*\/\s*(\d+)\s*(?:\(\s*(\d+)\s*%\))?/);
    if (!match) { return null; }

    const used = parseInt(match[1], 10);
    const total = parseInt(match[2], 10);
    const percent = match[3]
        ? parseInt(match[3], 10)
        : Math.round((used / total) * 100);

    return { label: key, used, total, percent };
}

export async function parseFitSummary(fileUri: vscode.Uri): Promise<FitSummaryData>
{
    const content = await vscode.workspace.fs.readFile(fileUri);
    const text = Buffer.from(content).toString('utf-8');
    return parseFitSummaryText(text);
}
