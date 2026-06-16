import * as vscode from 'vscode';

interface ScopeFrame
{
    type: string;
    name: string;
    line: number;
    hasIs: boolean;
    hasBegin: boolean;
}

const END_KINDS: Record<string, string> =
{
    entity: 'entity',
    architecture: 'architecture',
    process: 'process',
    if: 'if',
    for: 'for',
    case: 'case',
    generate: 'generate',
    component: 'component',
    package: 'package',
    'package body': 'package body',
    function: 'function',
    procedure: 'procedure',
    block: 'block',
    record: 'record',
    context: 'context',
};

function makeDiag(
    range: vscode.Range,
    message: string,
    severity: vscode.DiagnosticSeverity,
    code?: string
): vscode.Diagnostic
{
    const d = new vscode.Diagnostic(range, message, severity);
    d.source = 'VHDL Essentials';
    if (code) { d.code = code; }
    return d;
}

function stripCommentLine(line: string): string
{
    const idx = line.indexOf('--');
    return idx >= 0 ? line.slice(0, idx) : line;
}

function tryOpenScope(
    line: string,
    stack: ScopeFrame[],
    diags: vscode.Diagnostic[],
    lineNum: number
): boolean
{
    const eff = line.replace(/^\w+\s*:\s*/, '');
    let m: RegExpMatchArray | null;

    const tryMatch = (re: RegExp) => eff.match(re);

    m = tryMatch(/^entity\s+(\w+)\s+is\b/i);
    if (m)
    {
        stack.push({ type: 'entity', name: m[1], line: lineNum, hasIs: true, hasBegin: false });
        return true;
    }

    m = tryMatch(/^entity\s+(\w+)(?!\.)\b/i);
    if (m)
    {
        stack.push({ type: 'entity', name: m[1], line: lineNum, hasIs: false, hasBegin: false });
        diags.push(makeDiag(new vscode.Range(lineNum, 0, lineNum, line.length), `'entity' missing 'is'`, vscode.DiagnosticSeverity.Error, 'syntax.missing-is'));
        return true;
    }

    m = tryMatch(/^architecture\s+(\w+)\s+of\s+(\w+)\s+is\b/i);
    if (m)
    {
        stack.push({ type: 'architecture', name: m[1], line: lineNum, hasIs: true, hasBegin: false });
        return true;
    }

    m = tryMatch(/^architecture\s+(\w+)\s+of\s+(\w+)\b/i);
    if (m)
    {
        stack.push({ type: 'architecture', name: m[1], line: lineNum, hasIs: false, hasBegin: false });
        diags.push(makeDiag(new vscode.Range(lineNum, 0, lineNum, line.length), `'architecture' missing 'is'`, vscode.DiagnosticSeverity.Error, 'syntax.missing-is'));
        return true;
    }

    m = tryMatch(/^process\s*(?:\([^)]*\))?\s*(is\b)?/i);
    if (m)
    {
        stack.push({ type: 'process', name: '', line: lineNum, hasIs: !!m[1], hasBegin: false });
        return true;
    }

    if (/^if\b.*\bgenerate\b/i.test(eff))
    {
        stack.push({ type: 'generate', name: '', line: lineNum, hasIs: false, hasBegin: false });
        return true;
    }

    m = tryMatch(/^if\b/i);
    if (m)
    {
        stack.push({ type: 'if', name: '', line: lineNum, hasIs: false, hasBegin: false });
        return true;
    }

    if (/^for\b.*\bgenerate\b/i.test(eff))
    {
        stack.push({ type: 'generate', name: '', line: lineNum, hasIs: false, hasBegin: false });
        return true;
    }

    m = tryMatch(/^for\b.*\bloop\b/i);
    if (m)
    {
        stack.push({ type: 'for', name: '', line: lineNum, hasIs: false, hasBegin: false });
        return true;
    }

    m = tryMatch(/^while\b.*\bloop\b/i);
    if (m)
    {
        stack.push({ type: 'while', name: '', line: lineNum, hasIs: false, hasBegin: false });
        return true;
    }

    if (/^case\b.*\bgenerate\b/i.test(eff))
    {
        stack.push({ type: 'generate', name: '', line: lineNum, hasIs: false, hasBegin: false });
        return true;
    }

    m = tryMatch(/^case\b.*\bis\b/i);
    if (m)
    {
        stack.push({ type: 'case', name: '', line: lineNum, hasIs: false, hasBegin: false });
        return true;
    }

    m = tryMatch(/^generate\b/i);
    if (m)
    {
        stack.push({ type: 'generate', name: '', line: lineNum, hasIs: false, hasBegin: false });
        return true;
    }

    m = tryMatch(/^component\s+(\w+)\s+is\b/i);
    if (m)
    {
        stack.push({ type: 'component', name: m[1], line: lineNum, hasIs: true, hasBegin: false });
        return true;
    }

    m = tryMatch(/^component\s+(\w+)(?!\.)\b/i);
    if (m)
    {
        stack.push({ type: 'component', name: m[1], line: lineNum, hasIs: false, hasBegin: false });
        diags.push(makeDiag(new vscode.Range(lineNum, 0, lineNum, line.length), `'component' missing 'is'`, vscode.DiagnosticSeverity.Error, 'syntax.missing-is'));
        return true;
    }

    m = tryMatch(/^package\s+body\s+(\w+)\s+is\b/i);
    if (m)
    {
        stack.push({ type: 'package body', name: m[1], line: lineNum, hasIs: true, hasBegin: false });
        return true;
    }

    m = tryMatch(/^package\s+(\w+)\s+is\b/i);
    if (m)
    {
        stack.push({ type: 'package', name: m[1], line: lineNum, hasIs: true, hasBegin: false });
        return true;
    }

    m = tryMatch(/^package\s+(\w+)\b/i);
    if (m)
    {
        stack.push({ type: 'package', name: m[1], line: lineNum, hasIs: false, hasBegin: false });
        diags.push(makeDiag(new vscode.Range(lineNum, 0, lineNum, line.length), `'package' missing 'is'`, vscode.DiagnosticSeverity.Error, 'syntax.missing-is'));
        return true;
    }

    m = tryMatch(/^function\s+(\w+)/i);
    if (m)
    {
        if (!/\bis\b/i.test(line) && line.endsWith(';')) { return false; }

        stack.push({ type: 'function', name: m[1], line: lineNum, hasIs: false, hasBegin: false });
        return true;
    }

    m = tryMatch(/^procedure\s+(\w+)/i);
    if (m)
    {
        if (!/\bis\b/i.test(line) && line.endsWith(';')) { return false; }

        stack.push({ type: 'procedure', name: m[1], line: lineNum, hasIs: false, hasBegin: false });
        return true;
    }

    m = tryMatch(/^context\s+(\w+)\s+is\b/i);
    if (m)
    {
        stack.push({ type: 'context', name: m[1], line: lineNum, hasIs: true, hasBegin: false });
        return true;
    }

    m = tryMatch(/^block\b/i);
    if (m)
    {
        stack.push({ type: 'block', name: '', line: lineNum, hasIs: false, hasBegin: false });
        return true;
    }

    m = tryMatch(/^type\s+\w+\s+is\s+record\b/i);
    if (m)
    {
        stack.push({ type: 'record', name: '', line: lineNum, hasIs: false, hasBegin: false });
        return true;
    }

    if (/\bis\b/i.test(eff) && stack.length > 0)
    {
        const top = stack[stack.length - 1];
        if (!top.hasIs)
        {
            top.hasIs = true;
        }
    }

    return false;
}

function checkEnd(
    line: string,
    stack: ScopeFrame[],
    diags: vscode.Diagnostic[],
    lineNum: number
)
{
    if (stack.length === 0)
    {
        diags.push(makeDiag(
            new vscode.Range(lineNum, 0, lineNum, line.length),
            `'end' without matching scope`,
            vscode.DiagnosticSeverity.Error,
            'syntax.end-without-scope'
        ));
        return;
    }

    const pkgBodyMatch = line.match(/^end\s+package\s+body\s*(\w+)?\s*;?\s*$/i);
    if (pkgBodyMatch)
    {
        const top = stack[stack.length - 1];
        if (top.type !== 'package body')
        {
            diags.push(makeDiag(
                new vscode.Range(lineNum, 0, lineNum, line.length),
                `'end package body' does not match enclosing '${top.type}'`,
                vscode.DiagnosticSeverity.Error,
                'syntax.end-mismatch'
            ));
            return;
        }
        const name = pkgBodyMatch[1];
        if (name && top.name && name.toLowerCase() !== top.name.toLowerCase())
        {
            diags.push(makeDiag(
                new vscode.Range(lineNum, 0, lineNum, line.length),
                `'end package body ${name}' does not match 'package body ${top.name}'`,
                vscode.DiagnosticSeverity.Warning,
                'syntax.end-name-mismatch'
            ));
        }
        finalizeScope(top, diags);
        stack.pop();
        return;
    }

    const forLoopMatch = line.match(/^end\s+for\s+loop\s*(\w+)?\s*;?\s*$/i);
    if (forLoopMatch)
    {
        const top = stack[stack.length - 1];
        if (top.type !== 'for')
        {
            diags.push(makeDiag(
                new vscode.Range(lineNum, 0, lineNum, line.length),
                `'end for loop' does not match enclosing '${top.type}'`,
                vscode.DiagnosticSeverity.Error,
                'syntax.end-mismatch'
            ));
            return;
        }
        finalizeScope(top, diags);
        stack.pop();
        return;
    }

    const whileLoopMatch = line.match(/^end\s+while\s+loop\s*(\w+)?\s*;?\s*$/i);
    if (whileLoopMatch)
    {
        const top = stack[stack.length - 1];
        if (top.type !== 'while')
        {
            diags.push(makeDiag(
                new vscode.Range(lineNum, 0, lineNum, line.length),
                `'end while loop' does not match enclosing '${top.type}'`,
                vscode.DiagnosticSeverity.Error,
                'syntax.end-mismatch'
            ));
            return;
        }
        finalizeScope(top, diags);
        stack.pop();
        return;
    }

    const loopMatch = line.match(/^end\s+loop\s*(\w+)?\s*;?\s*$/i);
    if (loopMatch)
    {
        const top = stack[stack.length - 1];
        if (top.type !== 'for' && top.type !== 'while')
        {
            diags.push(makeDiag(
                new vscode.Range(lineNum, 0, lineNum, line.length),
                `'end loop' does not match enclosing '${top.type}'`,
                vscode.DiagnosticSeverity.Error,
                'syntax.end-mismatch'
            ));
            return;
        }
        finalizeScope(top, diags);
        stack.pop();
        return;
    }

    const endMatch = line.match(/^end\s+(\w+)\s*(\w+)?\s*;?\s*$/i);
    if (endMatch)
    {
        const kind = endMatch[1].toLowerCase();
        const name = endMatch[2] || '';

        const mappedKind = END_KINDS[kind];
        if (!mappedKind)
        {
            diags.push(makeDiag(
                new vscode.Range(lineNum, 0, lineNum, line.length),
                `Unknown 'end' type '${kind}'`,
                vscode.DiagnosticSeverity.Hint,
                'syntax.unknown-end-type'
            ));
            return;
        }

        const top = stack[stack.length - 1];
        if (top.type !== mappedKind)
        {
            diags.push(makeDiag(
                new vscode.Range(lineNum, 0, lineNum, line.length),
                `'end ${kind}' does not match enclosing '${top.type}'`,
                vscode.DiagnosticSeverity.Error,
                'syntax.end-mismatch'
            ));
            return;
        }

        if (name && top.name && name.toLowerCase() !== top.name.toLowerCase())
        {
            diags.push(makeDiag(
                new vscode.Range(lineNum, 0, lineNum, line.length),
                `'end ${kind} ${name}' does not match '${top.type} ${top.name}'`,
                vscode.DiagnosticSeverity.Warning,
                'syntax.end-name-mismatch'
            ));
        }

        finalizeScope(top, diags);
        stack.pop();
        return;
    }

    const bareMatch = line.match(/^end\s*;?\s*$/i);
    if (bareMatch)
    {
        const top = stack[stack.length - 1];
        finalizeScope(top, diags);
        stack.pop();
    }
}

function finalizeScope(
    frame: ScopeFrame,
    diags: vscode.Diagnostic[]
)
{
    if ((frame.type === 'entity' || frame.type === 'architecture'
        || frame.type === 'component' || frame.type === 'package'
        || frame.type === 'package body')
        && !frame.hasIs)
    {
        diags.push(makeDiag(
            new vscode.Range(frame.line, 0, frame.line, 50),
            `'${frame.type}' missing 'is' declaration`,
            vscode.DiagnosticSeverity.Error,
            'syntax.missing-is'
        ));
    }

    if (frame.type === 'process' && !frame.hasBegin)
    {
        diags.push(makeDiag(
            new vscode.Range(frame.line, 0, frame.line, 50),
            `'process' without 'begin'`,
            vscode.DiagnosticSeverity.Error,
            'syntax.process-no-begin'
        ));
    }

    if (frame.type === 'architecture' && !frame.hasBegin)
    {
        diags.push(makeDiag(
            new vscode.Range(frame.line, 0, frame.line, 50),
            `'architecture' without 'begin'`,
            vscode.DiagnosticSeverity.Warning,
            'syntax.arch-no-begin'
        ));
    }
}

function checkSemicolon(
    line: string,
    lineNum: number,
    diags: vscode.Diagnostic[]
)
{
    if (line.endsWith(';')) { return; }

    if (/[,\(\[]$/.test(line)) { return; }
    if (/=>$/.test(line)) { return; }
    if (/=>/.test(line)) { return; }
    if (/^library\s/i.test(line)) { return; }
    if (/^use\s/i.test(line)) { return; }
    if (/^assert\b/i.test(line)) { return; }
    if (/^report\b/i.test(line)) { return; }
    if (/^severity\b/i.test(line)) { return; }
    if (/^\w+\s*:\s*(entity|component)\s/i.test(line)) { return; }
    if (/^\s*\w+\s*:\s*\w+\s*$/i.test(line)) { return; }
    if (/^\s*\w+(?:\s*,\s*\w+)*\s*:\s*(in|out|inout|buffer|positive|natural|integer|string|time|boolean|real|character)\b/i.test(line)) { return; }
    if (line.length < 4) { return; }

    diags.push(makeDiag(
        new vscode.Range(lineNum, line.length - 1, lineNum, line.length),
        `Missing ';'`,
        vscode.DiagnosticSeverity.Warning,
        'syntax.missing-semicolon'
    ));
}

export function validateSyntax(text: string): vscode.Diagnostic[]
{
    const lines = text.split(/\r?\n/);
    const diags: vscode.Diagnostic[] = [];

    const stack: ScopeFrame[] = [];
    let parenBalance = 0;
    let inAssertBlock = false;

    for (let i = 0; i < lines.length; i++)
    {
        const raw = stripCommentLine(lines[i]);
        const line = raw.trim();
        if (!line || line.startsWith('--')) { continue; }

        for (const ch of line)
        {
            if (ch === '(') { parenBalance++; }
            else if (ch === ')') { parenBalance--; }
        }

        if (/^end\b/i.test(line))
        {
            checkEnd(line, stack, diags, i);
            continue;
        }

        if (/^else\s*;?\s*$/i.test(line) || /^elsif\s/i.test(line))
        {
            if (stack.length === 0 || stack[stack.length - 1].type !== 'if')
            {
                const range = new vscode.Range(i, 0, i, line.length);
                const msg = /^elsif/i.test(line)
                    ? `'elsif' without matching 'if'`
                    : `'else' without matching 'if'`;
                diags.push(makeDiag(range, msg, vscode.DiagnosticSeverity.Warning, 'syntax.else-without-if'));
            }
            continue;
        }

        if (/^when\s/i.test(line))
        {
            if (stack.length > 0
                && stack[stack.length - 1].type !== 'case'
                && stack[stack.length - 1].type !== 'generate')
            {
                diags.push(makeDiag(
                    new vscode.Range(i, 0, i, line.length),
                    `'when' outside 'case' or 'generate'`,
                    vscode.DiagnosticSeverity.Warning,
                    'syntax.when-outside-case'
                ));
            }
            continue;
        }

        if (/^begin\b/i.test(line))
        {
            if (stack.length > 0)
            {
                stack[stack.length - 1].hasBegin = true;
            }
            else
            {
                diags.push(makeDiag(
                    new vscode.Range(i, 0, i, line.length),
                    `'begin' outside any scope`,
                    vscode.DiagnosticSeverity.Warning,
                    'syntax.begin-outside-scope'
                ));
            }
            continue;
        }

        if (/^assert\b/i.test(line))
        {
            inAssertBlock = true;
            continue;
        }

        if (inAssertBlock)
        {
            if (/^severity\b/i.test(line))
            {
                inAssertBlock = false;
            }
            continue;
        }

        if (tryOpenScope(line, stack, diags, i)) { continue; }

        checkSemicolon(line, i, diags);
    }

    for (const frame of stack)
    {
        const range = new vscode.Range(frame.line, 0, frame.line, 50);
        const nameNote = frame.name ? ` '${frame.name}'` : '';
        diags.push(makeDiag(
            range,
            `Unclosed ${frame.type}${nameNote}`,
            vscode.DiagnosticSeverity.Warning,
            'syntax.unclosed-scope'
        ));
    }

    if (parenBalance !== 0)
    {
        const lastLine = lines.length - 1;
        const range = new vscode.Range(lastLine, 0, lastLine, lines[lastLine].length);
        const side = parenBalance > 0 ? ')' : '(';
        diags.push(makeDiag(
            range,
            `Unbalanced parentheses (missing ${parenBalance > 0 ? parenBalance : -parenBalance} '${side}')`,
            vscode.DiagnosticSeverity.Information,
            'syntax.unbalanced-parens'
        ));
    }

    return diags;
}

export class SyntaxLinter
{
    private diagnostics = vscode.languages.createDiagnosticCollection('vhdl-syntax');
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

        const diags = validateSyntax(document.getText());
        this.diagnostics.set(document.uri, diags);
    }

    dispose(): void
    {
        clearTimeout(this.debounceTimer);
        this.diagnostics.dispose();
    }
}
