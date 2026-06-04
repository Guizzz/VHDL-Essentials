import * as vscode from 'vscode';

const VHDL_KEYWORDS = new Set([
    'all', 'and', 'architecture', 'array', 'assert', 'attribute',
    'begin', 'block', 'body', 'buffer', 'bus', 'case', 'component',
    'configuration', 'constant', 'disconnect', 'downto', 'else', 'elsif',
    'end', 'entity', 'exit', 'file', 'for', 'function', 'generate',
    'generic', 'group', 'guarded', 'if', 'impure', 'in', 'inertial',
    'inout', 'is', 'label', 'library', 'linkage', 'literal', 'loop',
    'map', 'mod', 'nand', 'new', 'next', 'nor', 'not', 'null', 'of',
    'on', 'open', 'or', 'others', 'out', 'package', 'port', 'postponed',
    'procedure', 'process', 'pure', 'range', 'record', 'register',
    'reject', 'report', 'return', 'rol', 'ror', 'select', 'severity',
    'signal', 'shared', 'sla', 'sll', 'sra', 'srl', 'subtype', 'then',
    'to', 'transport', 'type', 'unaffected', 'units', 'until', 'use',
    'variable', 'wait', 'when', 'while', 'with', 'xnor', 'xor',
    'std_logic', 'std_logic_vector', 'integer', 'boolean', 'natural',
    'positive', 'bit', 'bit_vector', 'character', 'string', 'time',
    'real', 'signed', 'unsigned',
    'rising_edge', 'falling_edge', 'now',
]);


function stripComment(line: string): string
{
    const idx = line.indexOf('--');
    return idx >= 0 ? line.slice(0, idx) : line;
}

function extractIdents(expr: string): Set<string>
{
    const idents = new Set<string>();
    const regex = /\b([a-zA-Z_]\w*)\b/g;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(expr)) !== null)
    {
        const word = match[1].toLowerCase();
        if (!VHDL_KEYWORDS.has(word))
        {
            idents.add(word);
        }
    }
    return idents;
}

export class SensitivityLinter
{
    private diagnostics = vscode.languages.createDiagnosticCollection('vhdl-sensitivity');
    private debounceTimer: ReturnType<typeof setTimeout> | undefined;

    constructor(context: vscode.ExtensionContext)
    {
        if (vscode.window.activeTextEditor)
        {
            this.validate(vscode.window.activeTextEditor.document);
        }

        context.subscriptions.push(
            vscode.workspace.onDidOpenTextDocument(doc => this.validate(doc)),
            vscode.workspace.onDidChangeTextDocument(e => this.schedule(e.document))
        );
    }

    private schedule(document: vscode.TextDocument)
    {
        if (document.languageId !== 'vhdl') { return; }

        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(
            () => this.validate(document),
            400
        );
    }

    private validate(document: vscode.TextDocument)
    {
        if (document.languageId !== 'vhdl') { return; }

        const text = document.getText();
        const lines = text.split(/\r?\n/);
        const diags: vscode.Diagnostic[] = [];

        for (let i = 0; i < lines.length; i++)
        {
            const cleanLine = stripComment(lines[i]).trim();
            const headerMatch = cleanLine.match(
                /(?:(\w+)\s*:\s*)?process\s*\(([^)]*)\)/i
            );
            if (!headerMatch) { continue; }

            const sensRaw = headerMatch[2].trim();
            if (sensRaw.toLowerCase() === 'all') { continue; }

            const sensList = sensRaw
                .split(',')
                .map(s => s.trim().toLowerCase())
                .filter(s => s.length > 0 && !VHDL_KEYWORDS.has(s));

            let bodyLines: string[] = [];
            let inDeclarations = true;
            let processEnded = false;

            if (/\bbegin\b/i.test(cleanLine))
            {
                const beginIdx = cleanLine.search(/\bbegin\b/i);
                const tail = cleanLine.slice(beginIdx + 5).trim();
                if (tail.length > 0)
                {
                    bodyLines.push(tail);
                }
                inDeclarations = false;
            }

            for (let j = i + 1; j < lines.length && !processEnded; j++)
            {
                const l = stripComment(lines[j]).trim();
                if (!l) { continue; }

                if (/^end\s+process\b/i.test(l))
                {
                    processEnded = true;
                    break;
                }

                if (/^begin\b/i.test(l))
                {
                    inDeclarations = false;
                    const tail = l.slice(5).trim();
                    if (tail.length > 0)
                    {
                        bodyLines.push(tail);
                    }
                    continue;
                }

                if (!inDeclarations)
                {
                    bodyLines.push(l);
                }
            }

            if (!processEnded || bodyLines.length === 0) { continue; }

            const body = bodyLines.join('\n');
            const isSync = /\b(?:rising_edge|falling_edge)\b/i.test(body);

            const readSignals = new Set<string>();

            if (isSync)
            {
                const edgeRegex = /(?:rising_edge|falling_edge)\s*\(\s*(\w+)\s*\)/gi;
                let edgeMatch: RegExpExecArray | null;
                while ((edgeMatch = edgeRegex.exec(body)) !== null)
                {
                    const sig = edgeMatch[1].toLowerCase();
                    if (!VHDL_KEYWORDS.has(sig))
                    {
                        readSignals.add(sig);
                    }
                }
            }
            else
            {
                const assignRegex = /(\w+)\s*<=\s*([^;]+);/gi;
                let assignMatch: RegExpExecArray | null;
                while ((assignMatch = assignRegex.exec(body)) !== null)
                {
                    const rhsIdents = extractIdents(assignMatch[2]);
                    for (const w of rhsIdents)
                    {
                        readSignals.add(w);
                    }
                }

                const ifRegex = /(?:if|elsif)\s+(.+?)\s+then/gi;
                let ifMatch: RegExpExecArray | null;
                while ((ifMatch = ifRegex.exec(body)) !== null)
                {
                    const condIdents = extractIdents(ifMatch[1]);
                    for (const w of condIdents)
                    {
                        readSignals.add(w);
                    }
                }

                const caseRegex = /case\s+(\w+)\s+is/gi;
                let caseMatch: RegExpExecArray | null;
                while ((caseMatch = caseRegex.exec(body)) !== null)
                {
                    const sig = caseMatch[1].toLowerCase();
                    if (!VHDL_KEYWORDS.has(sig))
                    {
                        readSignals.add(sig);
                    }
                }

                const edgeRegex2 = /(?:rising_edge|falling_edge)\s*\(\s*(\w+)\s*\)/gi;
                let edgeMatch2: RegExpExecArray | null;
                while ((edgeMatch2 = edgeRegex2.exec(body)) !== null)
                {
                    const sig = edgeMatch2[1].toLowerCase();
                    if (!VHDL_KEYWORDS.has(sig))
                    {
                        readSignals.add(sig);
                    }
                }
            }

            if (readSignals.size === 0) { continue; }

            const processLineRange = new vscode.Range(
                i, 0, i, lines[i].length
            );

            const missing: string[] = [];
            for (const sig of readSignals)
            {
                if (!sensList.includes(sig))
                {
                    missing.push(sig);
                }
            }

            if (missing.length > 0)
            {
                const msg = missing.length === 1
                    ? `Sensitivity list missing '${missing[0]}'`
                    : `Sensitivity list missing: ${missing.map(s => `'${s}'`).join(', ')}`;
                const d = new vscode.Diagnostic(
                    processLineRange,
                    msg,
                    vscode.DiagnosticSeverity.Warning
                );
                d.source = 'VHDL Essentials';
                diags.push(d);
            }

            if (!isSync)
            {
                const extra: string[] = [];
                for (const sig of sensList)
                {
                    if (!readSignals.has(sig))
                    {
                        extra.push(sig);
                    }
                }

                if (extra.length > 0)
                {
                    const msg = extra.length === 1
                        ? `Unnecessary signal '${extra[0]}' in sensitivity list (never read)`
                        : `Unnecessary signals in sensitivity list: ${extra.map(s => `'${s}'`).join(', ')}`;
                    const d = new vscode.Diagnostic(
                        processLineRange,
                        msg,
                        vscode.DiagnosticSeverity.Hint
                    );
                    d.source = 'VHDL Essentials';
                    diags.push(d);
                }
            }
        }

        this.diagnostics.set(document.uri, diags);
    }

    dispose(): void
    {
        clearTimeout(this.debounceTimer);
        this.diagnostics.dispose();
    }
}
