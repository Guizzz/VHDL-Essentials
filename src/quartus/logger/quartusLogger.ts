import * as vscode from 'vscode';
import { extractMessage, formatMessage } from './outputParser';

export const quartusOutput = vscode.window.createOutputChannel('Quartus Assistant');

export class QuartusLogger
{
    private warnings = 0;
    private errors = 0;

    constructor(private output: vscode.OutputChannel) {}

    appendLine(line: string)
    {
        this.output.appendLine(line);
    }

    startTask(project: string, label = 'Compiling')
    {
        this.output.clear();
        this.output.appendLine('');
        this.output.appendLine('━━━━━━━━━━━━━━━━━━━━━━━━━━');
        this.output.appendLine(`${label} ${project}`);
        this.output.appendLine('━━━━━━━━━━━━━━━━━━━━━━━━━━');
        this.output.appendLine('');
    }

    finishBuild(success: boolean)
    {
        this.output.appendLine('');
        this.output.appendLine('━━━━━━━━━━━━━━━━━━━━━━━━━━');

        if (success) {
            this.output.appendLine('✅ BUILD SUCCESSFUL');
        } else {
            this.output.appendLine('❌ BUILD FAILED');
        }

        this.output.appendLine(
            `${this.errors} errors • ${this.warnings} warnings`
        );

        this.output.appendLine('━━━━━━━━━━━━━━━━━━━━━━━━━━');
        this.output.appendLine('');

        this.warnings = 0;
        this.errors = 0;
    }

    parseChunk(chunk: string)
    {
        const lines = chunk.split(/\r?\n/);

        for (const line of lines)
        {
            if (!line.trim()) { continue; }

            if (
                line.startsWith('report_status') ||
                line.startsWith('refresh_report')
            ) {
                continue;
            }

            const msg = extractMessage(line);

            if (!msg) { continue; }

            if (msg.severity === 'warning' || msg.severity === 'critical')
            {
                this.warnings++;
            }

            if (msg.severity === 'error')
            {
                this.errors++;
            }

            const log = formatMessage(msg);

            if (log !== '')
            {
                this.output.appendLine(log);
            }
        }
    }
}
