export type QuartusSeverity =
    | 'info'
    | 'warning'
    | 'critical'
    | 'error'
    | 'success';

export interface QuartusMessage
{
    stage: string;
    severity: QuartusSeverity;
    code: string;
    text: string;
}

export function extractMessage(line: string): QuartusMessage | null
{
    if (!line.startsWith('msg_tcl_post_message')) {
        return null;
    }

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
    let text = strings[3];

    text = text
        .replace(/\s+/g, ' ')
        .replace(/\\"/g, '"')
        .trim();

    const stage = strings[2] || 'Quartus';

    return {
        stage,
        severity: mapSeverity(rawSeverity),
        code,
        text
    };
}

function mapSeverity(s: string): QuartusSeverity
{
    switch (s.toLowerCase())
    {
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

export function formatMessage(msg: QuartusMessage): string
{
    if (msg.code === 'WSTA_TIMING_NOT_MET') {
        return '⚠️ Timing requirements not met';
    }

    if (msg.code === 'WSTA_SDC_NOT_FOUND') {
        return '⚠️ No SDC constraints file found';
    }

    if (msg.code === 'ISTA_WORST_CASE_SLACK') {
        return `⚠️ ${msg.text}`;
    }

    if (msg.code === 'EVRFX_VHDL_SYNTAX_ERROR') {
        return `✍❌ ${msg.text}`;
    }

    if (msg.code === 'IQEXE_ERROR_COUNT')
    {
        if (msg.text.includes('successful')) {
            return `✅ ${msg.text}\n`;
        }

        return `❗ ${msg.text}`;
    }

    switch (msg.severity)
    {
        case 'warning':
            return `⚠️ ${msg.text}`;
        case 'critical':
            return `🚨 ${msg.text}`;
        case 'error':
            return `❌ ${msg.text}`;
        case 'success':
            return `✅ ${msg.text}\n`;
        default:
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
                return `[${msg.text}]\n`;
            }

            return msg.text;
    }
}
