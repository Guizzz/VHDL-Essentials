import * as vscode from 'vscode';
import { type QuartusSeverity, type QuartusMessage, extractMessage, parseRawLine } from './outputParser';
import { LineBuffer } from './lineBuffer';

export const quartusOutput = vscode.window.createOutputChannel('Quartus Assistant', 'log');

export class QuartusLogger
{
    private warnings = 0;
    private errors = 0;
    private lineBuffer = new LineBuffer();

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

    finishBuild(success: boolean, cancelled = false)
    {
        this.flush();

        this.output.appendLine('');
        this.output.appendLine('━━━━━━━━━━━━━━━━━━━━━━━━━━');

        if (cancelled) {
            this.output.appendLine('BUILD CANCELLED');
        } else if (success) {
            this.output.appendLine('BUILD SUCCESSFUL');
        } else {
            this.output.appendLine('BUILD FAILED');
        }

        this.output.appendLine(
            `${this.errors} errors • ${this.warnings} warnings`
        );

        this.output.appendLine('━━━━━━━━━━━━━━━━━━━━━━━━━━');
        this.output.appendLine('');

        this.warnings = 0;
        this.errors = 0;
    }

    parseChunk(
        chunk: string,
        onMessage?: (msg: QuartusMessage) => void
    )
    {
        for (const line of this.lineBuffer.push(chunk))
        {
            this._handleLine(line, onMessage);
        }
    }

    flush(onMessage?: (msg: QuartusMessage) => void)
    {
        for (const line of this.lineBuffer.flush())
        {
            this._handleLine(line, onMessage);
        }
    }

    private _handleLine(
        line: string,
        onMessage?: (msg: QuartusMessage) => void
    )
    {
        if (!line.trim()) { return; }

        if (
            line.startsWith('report_status') ||
            line.startsWith('refresh_report')
        ) {
            return;
        }

        let msg = extractMessage(line);

        if (!msg) { msg = parseRawLine(line); }

        if (!msg) { return; }

        onMessage?.(msg);

        if (msg.severity === 'warning' || msg.severity === 'critical')
        {
            this.warnings++;
        }

        if (msg.severity === 'error')
        {
            this.errors++;
        }

        const text = this._formatText(msg);

        if (text !== '')
        {
            this._log(msg.severity, text);
        }
    }

    private _formatText(msg: QuartusMessage): string
    {
        if (msg.code === 'IQEXE_ERROR_COUNT')
        {
            if (msg.text.includes('successful')) {
                return msg.text;
            }

            return msg.text;
        }

        if (
            msg.text.includes('Processing started') ||
            msg.text.includes('Peak virtual memory') ||
            msg.text.includes('Total CPU time') ||
            msg.text.includes('elapsed time') ||
            msg.text.includes('Parallel compilation') ||
            msg.text.includes('qfit2_default_script') ||
            msg.text.includes('qsta_default_script')
        ) {
            return '';
        }

        if (msg.text.startsWith('Running Quartus'))
        {
            return `[${msg.text}]`;
        }

        return msg.text;
    }

    private _timestamp(): string
    {
        const d = new Date();
        const p = (n: number, len = 2) => String(n).padStart(len, '0');

        return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}.${p(d.getMilliseconds(), 3)}`;
    }

    private _log(severity: QuartusSeverity, text: string): void
    {
        const ts = this._timestamp();

        switch (severity)
        {
            case 'warning':
            case 'critical':
                this.output.appendLine(`${ts} [warning] ${text}`);
                break;
            case 'error':
                this.output.appendLine(`${ts} [error] ${text}`);
                break;
            default:
                this.output.appendLine(`${ts} [info] ${text}`);
                break;
        }
    }
}
