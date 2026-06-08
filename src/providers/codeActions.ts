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
    // Extract port name from message: "Missing port 'foo' (in std_logic)"
    const m = diag.message.match(/'(\w+)'/);
    if (!m) { return null; }
    const portName = m[1];

    // Find the port map block and add after the last mapping
    const text = doc.getText();
    const pmMatch = text.match(/port\s+map\s*\(/i);
    if (!pmMatch) { return null; }

    // Find closing paren by scanning
    const startIdx = (pmMatch.index ?? 0) + pmMatch[0].length;
    let depth = 1;
    let endIdx = startIdx;
    while (endIdx < text.length && depth > 0)
    {
        if (text[endIdx] === '(') { depth++; }
        else if (text[endIdx] === ')') { depth--; }
        if (depth > 0) { endIdx++; }
    }

    // Find the last semicolon before the closing paren
    const blockText = text.substring(startIdx, endIdx);
    const lines = blockText.split('\n');
    const lastMappingLine = lines[lines.length - 1].trim();
    const insertText = lastMappingLine.endsWith(';') ? '' : ';\n';
    const insertPos = doc.positionAt(startIdx + blockText.length);

    const edit = new vscode.WorkspaceEdit();
    edit.insert(doc.uri, insertPos, `${insertText}${INDENT}${portName} => open`);
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
