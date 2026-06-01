// quartusLogger.ts

import * as vscode from 'vscode';

export const quartusOutput = vscode.window.createOutputChannel('Quartus Assistant');

export type QuartusSeverity =
    | 'info'
    | 'warning'
    | 'critical'
    | 'error'
    | 'success';

export interface QuartusMessage {
    stage: string;
    severity: QuartusSeverity;
    code: string;
    text: string;
}

export class QuartusLogger {

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

    finishBuild(success: boolean) {

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

    parseChunk(chunk: string) {

        const lines = chunk.split(/\r?\n/);

        for (const line of lines) {
            if (!line.trim()) {continue;}
            this.parseLine(line);
        }
    }

    private parseLine(line: string) {

        // ignore spam
        if (
            line.startsWith('report_status') ||
            line.startsWith('refresh_report')
        ) {
            return;
        }

        // extract message
        const msg = this.extractMessage(line);

        if (!msg) {
            return;
        }

        // count
        if ( msg.severity === 'warning' || msg.severity === 'critical' ) 
        {
            this.warnings++;
        }

        if (msg.severity === 'error') 
        {
            this.errors++;
        }

        const log = this.formatMessage(msg);
        
        if (log !== '')
        {
            this.output.appendLine(log);
        }
    }

    private extractMessage(line: string): QuartusMessage | null {

        if (!line.startsWith('msg_tcl_post_message')) {
            return null;
        }

        // supporta escape tipo \"
        const stringRegex = /"((?:\\.|[^"\\])*)"/g;

        const strings = [...line.matchAll(stringRegex)]
            .map(m =>
                m[1]
                    .replace(/\\"/g, '"')
                    .replace(/\\\\/g, '\\')
                    .trim()
            );

        if (strings.length < 4) {
            return null;
        }

        const rawSeverity = strings[0];

        const code = strings[1] || 'UNKNOWN';

        // messaggio principale
        let text = strings[3];

        // cleanup opzionale
        text = text
            .replace(/\s+/g, ' ')
            .replace(/\\"/g, '"')
            .trim();

        // stage
        const stage = strings[strings.length - 3] || 'Quartus';

        return {
            stage,
            severity: this.mapSeverity(rawSeverity),
            code,
            text
        };
    }

    private mapSeverity(s: string): QuartusSeverity {

        switch (s.toLowerCase()) {

            case 'warning':
                return 'warning';

            case 'critical warning':
                return 'critical';

            case 'error':
                return 'error';

            default:
                return 'info';
        }
    }

    private formatMessage(msg: QuartusMessage): string {

        // Important warnings
        if (msg.code === 'WSTA_TIMING_NOT_MET') {
            return `⚠️ Timing requirements not met`;
        }

        if (msg.code === 'WSTA_SDC_NOT_FOUND') {
            return `⚠️ No SDC constraints file found`;
        }

        if (msg.code === 'ISTA_WORST_CASE_SLACK') {
            return `⚠️ ${msg.text}`;
        }

        if (msg.code === 'EVRFX_VHDL_SYNTAX_ERROR') {
            return `✍❌ ${msg.text}`;
        }

        if (msg.code === 'IQEXE_ERROR_COUNT') {

            if (msg.text.includes('successful')) {
                return `✅ ${msg.text}\n`;
            }

            return `❗ ${msg.text}`;
        }

        // Generic formatting
        switch (msg.severity) {

            case 'warning':
                return `⚠️ ${msg.text}`;

            case 'critical':
                return `🚨 ${msg.text}`;

            case 'error':
                return `❌ ${msg.text}`;

            case 'success':
                return `✅ ${msg.text}\n`;

            default:

                // hide boring infos
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

                if (msg.text.startsWith("Running Quartus"))
                {
                    return `[${msg.text}]\n`;
                }

                return `${msg.text}`;
        }
    }
}