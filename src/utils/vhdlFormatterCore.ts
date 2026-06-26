import {
    tryOpenScope,
    closeScope,
    hasElseKeyword,
    hasWhenKeyword,
    stripCommentLine,
    type ScopeFrame,
} from './vhdlScope';

export interface FormatOptions
{
    indentSize: number;
    insertSpaces: boolean;
}

const DEFAULTS: FormatOptions = {
    indentSize: 4,
    insertSpaces: true,
};

function countChar(line: string, ch: string): number
{
    let count = 0;
    for (const c of line)
    {
        if (c === ch) { count++; }
    }
    return count;
}

function extractComment(line: string): { code: string; comment: string }
{
    const idx = line.indexOf('--');
    if (idx < 0) { return { code: line, comment: '' }; }

    const before = line.slice(0, idx);
    const after = line.slice(idx);

    return { code: before, comment: after };
}

function isBeginLine(line: string): boolean
{
    return /^begin\b/i.test(stripCommentLine(line).trim());
}

function isEndLine(line: string): boolean
{
    return /^end\b/i.test(stripCommentLine(line).trim());
}

function isWhenBodyLine(line: string): boolean
{
    const trimmed = stripCommentLine(line).trim();
    return /^when\s/i.test(trimmed) && /=>/.test(trimmed);
}

export function formatVhdl(text: string, options?: Partial<FormatOptions>): string
{
    const opts: FormatOptions = { ...DEFAULTS, ...options };
    const rawLines = text.split(/\r?\n/);
    const result: string[] = [];

    const stack: ScopeFrame[] = [];
    let parenDepth = 0;
    let inWhenBody = false;

    const indentUnit = opts.insertSpaces
        ? ' '.repeat(opts.indentSize)
        : '\t';

    for (let i = 0; i < rawLines.length; i++)
    {
        const fullLine = rawLines[i];
        const extracted = extractComment(fullLine);
        const codeTrimmed = extracted.code.trim();
        const trimmed = fullLine.trim();

        let indent = 0;
        let whenLine = false;

        if (codeTrimmed)
        {
            const effectiveCode = stripCommentLine(fullLine).trim();

            // Base indent: scope depth + paren depth + when body
            indent = stack.length + parenDepth + (inWhenBody ? 1 : 0);
            const openParens = countChar(effectiveCode, '(');
            const closeParens = countChar(effectiveCode, ')');

            // 'end' closes a scope → outdent by 1
            if (isEndLine(effectiveCode))
            {
                indent = stack.length > 0 ? stack.length - 1 + parenDepth : 0;
                inWhenBody = false;
            }

            // 'else' / 'elsif' at the same level as matching 'if'
            if (hasElseKeyword(fullLine))
            {
                indent = stack.length > 0 ? stack.length - 1 + parenDepth : 0;
            }

            // 'when' at case body indent (not inside when body)
            if (hasWhenKeyword(effectiveCode))
            {
                inWhenBody = false;
                indent = stack.length + parenDepth;
                whenLine = isWhenBodyLine(effectiveCode);
            }

            // 'begin' at the same indent as the enclosing scope
            if (isBeginLine(effectiveCode))
            {
                indent = stack.length > 0 ? stack.length - 1 + parenDepth : 0;
            }

            // Closing parens that were opened on a prior line → outdent
            if (closeParens > openParens && parenDepth > 0)
            {
                const netClosers = closeParens - openParens;
                indent = stack.length + Math.max(0, parenDepth - netClosers);
            }

            if (indent < 0) { indent = 0; }

            // Update state for next line
            const procLine = effectiveCode;

            // Mark hasBegin on current scope
            if (isBeginLine(procLine) && stack.length > 0)
            {
                stack[stack.length - 1].hasBegin = true;
            }

            // Close scopes
            const closed = closeScope(procLine, stack);
            if (closed) { inWhenBody = false; }

            // Open new scopes
            tryOpenScope(procLine, stack, i);

            // Update paren depth
            parenDepth += openParens - closeParens;
            if (parenDepth < 0) { parenDepth = 0; }

            // After a 'when ... =>' line, the next lines are in when body
            if (whenLine)
            {
                inWhenBody = true;
            }
        }

        const indentStr = indent > 0 ? indentUnit.repeat(indent) : '';
        const lineOut = indentStr + (trimmed || '');

        result.push(lineOut);
    }

    return result.join('\n');
}
