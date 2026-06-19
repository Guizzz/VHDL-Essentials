import * as vscode from 'vscode';

type ActionBuilder = (
    doc: vscode.TextDocument,
    diag: vscode.Diagnostic,
    token: vscode.CancellationToken
) => vscode.CodeAction | vscode.CodeAction[] | null;

const INDENT = '    ';

function indentOf(line: string): string
{
    const m = line.match(/^\s*/);
    return m ? m[0] : '';
}

// ── Helpers to extract type from diagnostic messages ──

function enclosingTypeFromMsg(msg: string): string | null
{
    // "'end ...' does not match enclosing '<type>'"
    const m = msg.match(/enclosing '(\w+(?: \w+)?)'/i);
    return m ? m[1] : null;
}

function frameTypeFromUnclosed(msg: string): string | null
{
    // "Unclosed entity" or "Unclosed entity 'foo'"
    const m = msg.match(/^Unclosed (\w+(?: \w+)?)/);
    return m ? m[1] : null;
}

// ── Code action builders ──

function fixMissingSemicolon(
    doc: vscode.TextDocument,
    diag: vscode.Diagnostic,
    _token: vscode.CancellationToken
): vscode.CodeAction | null
{
    const line = doc.lineAt(diag.range.start.line);
    const edit = new vscode.WorkspaceEdit();
    edit.insert(doc.uri, line.range.end, ';');
    const action = new vscode.CodeAction(
        'Add missing semicolon',
        vscode.CodeActionKind.QuickFix
    );
    action.edit = edit;
    action.diagnostics = [diag];
    return action;
}

function fixUnclosedScope(
    doc: vscode.TextDocument,
    diag: vscode.Diagnostic,
    _token: vscode.CancellationToken
): vscode.CodeAction | null
{
    const type = frameTypeFromUnclosed(diag.message);
    if (!type) { return null; }

    const lastLine = doc.lineAt(doc.lineCount - 1);
    const eol = lastLine.range.end;

    const edit = new vscode.WorkspaceEdit();
    edit.insert(doc.uri, eol, `\nend ${type};`);
    const action = new vscode.CodeAction(
        `Add 'end ${type};'`,
        vscode.CodeActionKind.QuickFix
    );
    action.edit = edit;
    action.diagnostics = [diag];
    return action;
}

function fixEndMismatch(
    doc: vscode.TextDocument,
    diag: vscode.Diagnostic,
    _token: vscode.CancellationToken
): vscode.CodeAction | null
{
    const enclosing = enclosingTypeFromMsg(diag.message);
    if (!enclosing) { return null; }

    const line = doc.lineAt(diag.range.start.line);
    const before = line.text.match(/^(\s*).*/);
    const indent = before ? before[1] : '';

    const edit = new vscode.WorkspaceEdit();
    edit.replace(doc.uri, line.range, `${indent}end ${enclosing};`);
    const action = new vscode.CodeAction(
        `Replace with 'end ${enclosing};'`,
        vscode.CodeActionKind.QuickFix
    );
    action.edit = edit;
    action.diagnostics = [diag];
    return action;
}

function fixEndNameMismatch(
    doc: vscode.TextDocument,
    diag: vscode.Diagnostic,
    _token: vscode.CancellationToken
): vscode.CodeAction | null
{
    // "'end <kind> <name>' does not match '<type> <expected>'"
    const m = diag.message.match(/does not match '\w+(?: \w+)? (\w+)'/);
    if (!m) { return null; }
    const expectedName = m[1];

    const kindMatch = diag.message.match(/'end ([\w ]+) \w+'/);
    if (!kindMatch) { return null; }
    const kind = kindMatch[1];

    const line = doc.lineAt(diag.range.start.line);
    const indent = indentOf(line.text);

    const edit = new vscode.WorkspaceEdit();
    edit.replace(doc.uri, line.range, `${indent}end ${kind} ${expectedName};`);
    const action = new vscode.CodeAction(
        `Rename to '${expectedName}'`,
        vscode.CodeActionKind.QuickFix
    );
    action.edit = edit;
    action.diagnostics = [diag];
    return action;
}

function fixUnbalancedParens(
    doc: vscode.TextDocument,
    diag: vscode.Diagnostic,
    _token: vscode.CancellationToken
): vscode.CodeAction | null
{
    const m = diag.message.match(/\(missing (\d+) '([()])'\)/);
    if (!m) { return null; }
    const count = parseInt(m[1], 10);
    const which = m[2];
    const pad = which === ')' ? ')' : '(';

    const edit = new vscode.WorkspaceEdit();
    edit.insert(doc.uri, doc.lineAt(doc.lineCount - 1).range.end, pad.repeat(count));
    const action = new vscode.CodeAction(
        `Add missing ${count} '${which}'`,
        vscode.CodeActionKind.QuickFix
    );
    action.edit = edit;
    action.diagnostics = [diag];
    return action;
}

function fixProcessNoBegin(
    doc: vscode.TextDocument,
    diag: vscode.Diagnostic,
    _token: vscode.CancellationToken
): vscode.CodeAction | null
{
    const lineNum = diag.range.start.line;
    const line = doc.lineAt(lineNum);
    const indent = indentOf(line.text);

    // Insert 'begin' after the process declaration line(s)
    const insertPos = new vscode.Position(lineNum + 1, 0);
    const edit = new vscode.WorkspaceEdit();
    edit.insert(doc.uri, insertPos, `${indent}begin\n`);
    const action = new vscode.CodeAction(
        "Add 'begin' after process",
        vscode.CodeActionKind.QuickFix
    );
    action.edit = edit;
    action.diagnostics = [diag];
    return action;
}

function fixArchNoBegin(
    doc: vscode.TextDocument,
    diag: vscode.Diagnostic,
    _token: vscode.CancellationToken
): vscode.CodeAction | null
{
    const lineNum = diag.range.start.line;
    const line = doc.lineAt(lineNum);
    const indent = indentOf(line.text);

    const insertPos = new vscode.Position(lineNum + 1, 0);
    const edit = new vscode.WorkspaceEdit();
    edit.insert(doc.uri, insertPos, `${indent}begin\n`);
    const action = new vscode.CodeAction(
        "Add 'begin' after architecture",
        vscode.CodeActionKind.QuickFix
    );
    action.edit = edit;
    action.diagnostics = [diag];
    return action;
}

function fixDuplicateSignal(
    doc: vscode.TextDocument,
    diag: vscode.Diagnostic,
    _token: vscode.CancellationToken
): vscode.CodeAction | null
{
    const line = doc.lineAt(diag.range.start.line);
    const edit = new vscode.WorkspaceEdit();
    edit.delete(doc.uri, line.rangeIncludingLineBreak);
    const action = new vscode.CodeAction(
        'Remove duplicate declaration',
        vscode.CodeActionKind.QuickFix
    );
    action.edit = edit;
    action.diagnostics = [diag];
    return action;
}

function fixUnusedSignal(
    doc: vscode.TextDocument,
    diag: vscode.Diagnostic,
    _token: vscode.CancellationToken
): vscode.CodeAction | null
{
    const line = doc.lineAt(diag.range.start.line);
    const edit = new vscode.WorkspaceEdit();
    edit.delete(doc.uri, line.rangeIncludingLineBreak);
    const action = new vscode.CodeAction(
        'Remove unused declaration',
        vscode.CodeActionKind.QuickFix
    );
    action.edit = edit;
    action.diagnostics = [diag];
    return action;
}

function fixMissingSensitivity(
    doc: vscode.TextDocument,
    diag: vscode.Diagnostic,
    _token: vscode.CancellationToken
): vscode.CodeAction | null
{
    // Message: "Sensitivity list missing 'foo'" or "Sensitivity list missing: 'foo', 'bar'"
    const sigs: string[] = [];
    const single = diag.message.match(/'(\w+)'/);
    if (single)
    {
        sigs.push(single[1]);
    }

    if (sigs.length === 0) { return null; }

    const line = doc.lineAt(diag.range.start.line);
    const text = line.text;
    const parenMatch = text.match(/(process\s*\()([^)]*)(\))/i);
    if (!parenMatch) { return null; }

    const before = parenMatch[1];
    const inside = parenMatch[2];
    const after = parenMatch[3];

    const existing = inside.split(',').map(s => s.trim()).filter(s => s.length > 0);
    const newSigs = sigs.filter(s => !existing.some(e => e.toLowerCase() === s.toLowerCase()));
    if (newSigs.length === 0) { return null; }

    const updated = existing.length > 0
        ? `${inside}, ${newSigs.join(', ')}`
        : newSigs.join(', ');

    const edit = new vscode.WorkspaceEdit();
    edit.replace(doc.uri, line.range, `${before}${updated}${after}`);
    const action = new vscode.CodeAction(
        `Add '${newSigs.join(', ')}' to sensitivity list`,
        vscode.CodeActionKind.QuickFix
    );
    action.edit = edit;
    action.diagnostics = [diag];
    return action;
}

function fixUnnecessarySensitivity(
    doc: vscode.TextDocument,
    diag: vscode.Diagnostic,
    _token: vscode.CancellationToken
): vscode.CodeAction | null
{
    // Extract signal name from message: "Unnecessary signal 'foo'..."
    const m = diag.message.match(/'(\w+)'/);
    if (!m) { return null; }
    const sig = m[1];

    const line = doc.lineAt(diag.range.start.line);
    const text = line.text;
    const parenMatch = text.match(/(process\s*\()([^)]*)(\))/i);
    if (!parenMatch) { return null; }

    const before = parenMatch[1];
    const inside = parenMatch[2];
    const after = parenMatch[3];

    const items = inside.split(',').map(s => s.trim()).filter(s => s.length > 0);
    const filtered = items.filter(s => s.toLowerCase() !== sig.toLowerCase());
    if (filtered.length === items.length) { return null; }

    const updated = filtered.join(', ');

    const edit = new vscode.WorkspaceEdit();
    edit.replace(doc.uri, line.range, `${before}${updated}${after}`);
    const action = new vscode.CodeAction(
        `Remove '${sig}' from sensitivity list`,
        vscode.CodeActionKind.QuickFix
    );
    action.edit = edit;
    action.diagnostics = [diag];
    return action;
}

function fixPortmapMissingPort(
    doc: vscode.TextDocument,
    diag: vscode.Diagnostic,
    _token: vscode.CancellationToken
): vscode.CodeAction | null
{
    const m = diag.message.match(/'(\w+)'/);
    if (!m) { return null; }
    const portName = m[1];

    const lines = doc.getText().split(/\r?\n/);

    // Scan forward from diagnostic line to find 'port map('
    let pmLine = -1;
    for (let i = diag.range.start.line; i < lines.length; i++)
    {
        if (/port\s+map\s*\(/i.test(lines[i]))
        {
            pmLine = i;
            break;
        }
    }
    if (pmLine < 0) { return null; }

    // Track paren depth to find the block and last mapping line
    let depth = 0;
    let inPm = false;
    let lastMappingLine = -1;
    let closeLine = -1;

    for (let i = pmLine; i < lines.length; i++)
    {
        const line = lines[i];
        const trimmed = line.trim();

        for (const ch of line)
        {
            if (ch === '(') { depth++; inPm = true; }
            else if (ch === ')') { depth--; }
        }

        if (inPm && depth === 1)
        {
            if (trimmed.length > 0 && !trimmed.startsWith('--'))
            {
                lastMappingLine = i;
            }
        }
        else if (inPm && depth === 0)
        {
            closeLine = i;
            break;
        }
    }

    if (lastMappingLine < 0 || closeLine < 0) { return null; }
    if (lastMappingLine === closeLine || lastMappingLine === pmLine) { return null; }

    const mapIndent = indentOf(lines[lastMappingLine]);
    const lastLineText = lines[lastMappingLine].trimEnd();

    const edit = new vscode.WorkspaceEdit();

    // Add comma to last mapping if missing
    if (!lastLineText.endsWith(','))
    {
        const lastLineEnd = new vscode.Position(lastMappingLine, lines[lastMappingLine].length);
        edit.insert(doc.uri, lastLineEnd, ',');
    }

    // Insert new mapping after last mapping line
    const insertPos = new vscode.Position(lastMappingLine + 1, 0);
    edit.insert(doc.uri, insertPos, `${mapIndent}${portName} => open\n`);

    const action = new vscode.CodeAction(
        `Add '${portName} => open'`,
        vscode.CodeActionKind.QuickFix
    );
    action.edit = edit;
    action.diagnostics = [diag];
    return action;
}

function fixPortmapUndefinedPort(
    doc: vscode.TextDocument,
    diag: vscode.Diagnostic,
    _token: vscode.CancellationToken
): vscode.CodeAction | null
{
    const line = doc.lineAt(diag.range.start.line);
    const edit = new vscode.WorkspaceEdit();
    edit.delete(doc.uri, line.rangeIncludingLineBreak);
    const action = new vscode.CodeAction(
        'Remove undefined port mapping',
        vscode.CodeActionKind.QuickFix
    );
    action.edit = edit;
    action.diagnostics = [diag];
    return action;
}

function fixQsfMultiSpace(
    doc: vscode.TextDocument,
    diag: vscode.Diagnostic,
    _token: vscode.CancellationToken
): vscode.CodeAction | null
{
    const range = diag.range;
    const edit = new vscode.WorkspaceEdit();
    edit.replace(doc.uri, range, ' ');
    const action = new vscode.CodeAction(
        'Collapse to single space',
        vscode.CodeActionKind.QuickFix
    );
    action.edit = edit;
    action.diagnostics = [diag];
    return action;
}

function fixQsfTab(
    doc: vscode.TextDocument,
    diag: vscode.Diagnostic,
    _token: vscode.CancellationToken
): vscode.CodeAction | null
{
    const range = diag.range;
    const edit = new vscode.WorkspaceEdit();
    edit.replace(doc.uri, range, INDENT);
    const action = new vscode.CodeAction(
        'Replace tab with spaces',
        vscode.CodeActionKind.QuickFix
    );
    action.edit = edit;
    action.diagnostics = [diag];
    return action;
}

function fixQsfDuplicatePin(
    doc: vscode.TextDocument,
    diag: vscode.Diagnostic,
    _token: vscode.CancellationToken
): vscode.CodeAction | null
{
    const line = doc.lineAt(diag.range.start.line);
    const edit = new vscode.WorkspaceEdit();
    edit.delete(doc.uri, line.rangeIncludingLineBreak);
    const action = new vscode.CodeAction(
        'Remove duplicate pin assignment',
        vscode.CodeActionKind.QuickFix
    );
    action.edit = edit;
    action.diagnostics = [diag];
    return action;
}

function fixQsfDuplicateSignal(
    doc: vscode.TextDocument,
    diag: vscode.Diagnostic,
    _token: vscode.CancellationToken
): vscode.CodeAction | null
{
    // Returns a command that will show a QuickPick
    const cmdAction = new vscode.CodeAction(
        'Choose which pin to keep...',
        vscode.CodeActionKind.QuickFix
    );
    cmdAction.command = {
        title: 'Choose which pin to keep',
        command: '_vhdl.chooseDuplicatePin',
        arguments: [doc.uri, diag.range.start.line]
    };
    cmdAction.diagnostics = [diag];
    return cmdAction;
}

function fixElseWithoutIf(
    doc: vscode.TextDocument,
    diag: vscode.Diagnostic,
    _token: vscode.CancellationToken
): vscode.CodeAction | null
{
    const line = doc.lineAt(diag.range.start.line);
    const indent = indentOf(line.text);

    const newText = `${indent}if <condition> then\n${line.text.replace(/^\s*/, indent + INDENT)}\n${indent}end if;`;
    const edit = new vscode.WorkspaceEdit();
    edit.replace(doc.uri, line.range, newText);
    const action = new vscode.CodeAction(
        "Wrap in 'if ... then ... end if;'",
        vscode.CodeActionKind.QuickFix
    );
    action.edit = edit;
    action.diagnostics = [diag];
    return action;
}

function fixWhenOutsideCase(
    doc: vscode.TextDocument,
    diag: vscode.Diagnostic,
    _token: vscode.CancellationToken
): vscode.CodeAction | null
{
    const line = doc.lineAt(diag.range.start.line);
    const indent = indentOf(line.text);

    const newText = `${indent}case <expression> is\n${line.text.replace(/^\s*/, indent + INDENT)}\n${indent}end case;`;
    const edit = new vscode.WorkspaceEdit();
    edit.replace(doc.uri, line.range, newText);
    const action = new vscode.CodeAction(
        "Wrap in 'case ... is ... end case;'",
        vscode.CodeActionKind.QuickFix
    );
    action.edit = edit;
    action.diagnostics = [diag];
    return action;
}

function fixPackageBodyMissing(
    doc: vscode.TextDocument,
    diag: vscode.Diagnostic,
    _token: vscode.CancellationToken
): vscode.CodeAction | null
{
    // Find function name from context: search backward from diagnostic
    const text = doc.getText();
    const offset = doc.offsetAt(diag.range.start);
    const before = text.substring(0, offset);
    const funcMatch = before.match(/(?:function|procedure)\s+(\w+)\s*[\((]/i);
    if (!funcMatch) { return null; }
    const funcName = funcMatch[1];

    const line = doc.lineAt(diag.range.start.line);
    const indent = indentOf(line.text);

    const stub = `${indent}function ${funcName} return <type> is\n${indent}begin\n${indent + INDENT}-- TODO: implement\n${indent}end function;\n`;
    const edit = new vscode.WorkspaceEdit();
    edit.insert(doc.uri, new vscode.Position(doc.lineCount, 0), stub);
    const action = new vscode.CodeAction(
        `Generate stub for '${funcName}'`,
        vscode.CodeActionKind.QuickFix
    );
    action.edit = edit;
    action.diagnostics = [diag];
    return action;
}

function fixPortlinterUnassigned(
    doc: vscode.TextDocument,
    diag: vscode.Diagnostic,
    _token: vscode.CancellationToken
): vscode.CodeAction | null
{
    const m = diag.message.match(/'(\w+)'/);
    if (!m) { return null; }
    const portName = m[1];

    const edit = new vscode.WorkspaceEdit();
    edit.insert(doc.uri, new vscode.Position(0, 0),
        `# TODO: assign pin for ${portName}\n# set_location_assignment PIN_<xx> -to ${portName}\n`);
    const action = new vscode.CodeAction(
        `Generate pin assignment stub for '${portName}'`,
        vscode.CodeActionKind.QuickFix
    );
    action.edit = edit;
    action.diagnostics = [diag];
    return action;
}

function fixUndeclaredIdentifier(
    doc: vscode.TextDocument,
    diag: vscode.Diagnostic,
    _token: vscode.CancellationToken
): vscode.CodeAction | null
{
    const m = diag.message.match(/'(\w+)'/);
    if (!m) { return null; }
    const name = m[1];

    const text = doc.getText();
    const lines = text.split(/\r?\n/);
    const diagLine = diag.range.start.line;

    // Scan backward to find containing architecture header
    let archIsLine = -1;
    for (let i = diagLine; i >= 0; i--)
    {
        const line = lines[i].trim();
        if (line.startsWith('--')) { continue; }
        if (/^architecture\s+\w+\s+of\s+\w+\s+is/i.test(line))
        {
            archIsLine = i;
            break;
        }
    }
    if (archIsLine < 0) { return null; }

    // Scan forward from architecture header to find its 'begin'
    let beginLine = -1;
    for (let i = archIsLine + 1; i < lines.length; i++)
    {
        const trimmed = lines[i].trim();
        if (trimmed.startsWith('--')) { continue; }
        if (/^begin\b/i.test(trimmed))
        {
            beginLine = i;
            break;
        }
    }
    if (beginLine < 0) { return null; }

    const indent = indentOf(lines[beginLine]);

    // Find insertion point: after the last non-comment declaration line before begin
    let insertLine = beginLine;
    for (let i = beginLine - 1; i > archIsLine; i--)
    {
        const trimmed = lines[i].trim();
        if (trimmed && !trimmed.startsWith('--'))
        {
            insertLine = i + 1;
            break;
        }
    }

    const edit = new vscode.WorkspaceEdit();
    edit.insert(doc.uri, new vscode.Position(insertLine, 0),
        `${indent}signal ${name} : std_logic;\n`);

    const action = new vscode.CodeAction(
        `Declare '${name}' as signal`,
        vscode.CodeActionKind.QuickFix
    );
    action.edit = edit;
    action.diagnostics = [diag];
    return action;
}

// ── Map from diagnostic code to builder ──

const ACTION_MAP: Record<string, ActionBuilder> =
{
    'syntax.missing-semicolon':      fixMissingSemicolon,
    'syntax.unclosed-scope':         fixUnclosedScope,
    'syntax.end-mismatch':           fixEndMismatch,
    'syntax.end-name-mismatch':      fixEndNameMismatch,
    'syntax.unbalanced-parens':      fixUnbalancedParens,
    'syntax.process-no-begin':       fixProcessNoBegin,
    'syntax.arch-no-begin':          fixArchNoBegin,
    'syntax.else-without-if':        fixElseWithoutIf,
    'syntax.when-outside-case':      fixWhenOutsideCase,
    'duplicate-signal':              fixDuplicateSignal,
    'unused-signal':                 fixUnusedSignal,
    'sensitivity.missing-signal':    fixMissingSensitivity,
    'sensitivity.unnecessary-signal': fixUnnecessarySensitivity,
    'portmap.missing-port':          fixPortmapMissingPort,
    'portmap.undefined-port':        fixPortmapUndefinedPort,
    'qsf.multi-space':               fixQsfMultiSpace,
    'qsf.tab':                       fixQsfTab,
    'qsf.duplicate-pin':             fixQsfDuplicatePin,
    'qsf.duplicate-signal':          fixQsfDuplicateSignal,
    'packagebody.missing-impl':      fixPackageBodyMissing,
    'portlinter.unassigned-port':    fixPortlinterUnassigned,
    'undeclared-identifier':         fixUndeclaredIdentifier,
};

// ── Provider class ──

export class VhdlCodeActionProvider implements vscode.CodeActionProvider
{
    public static readonly providedCodeActionKinds = [vscode.CodeActionKind.QuickFix];

    provideCodeActions(
        document: vscode.TextDocument,
        _range: vscode.Range,
        context: vscode.CodeActionContext,
        token: vscode.CancellationToken
    ): vscode.CodeAction[]
    {
        const actions: vscode.CodeAction[] = [];

        for (const diag of context.diagnostics)
        {
            if (!diag.code || typeof diag.code !== 'string') { continue; }

            const builder = ACTION_MAP[diag.code];
            if (!builder) { continue; }

            const result = builder(document, diag, token);
            if (!result) { continue; }

            if (Array.isArray(result))
            {
                actions.push(...result);
            }
            else
            {
                actions.push(result);
            }
        }

        return actions;
    }
}
