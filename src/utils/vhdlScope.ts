export interface ScopeFrame
{
    type: string;
    name: string;
    line: number;
    hasIs: boolean;
    hasBegin: boolean;
}

export const END_KINDS: Record<string, string> =
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

export function stripCommentLine(line: string): string
{
    const idx = line.indexOf('--');
    return idx >= 0 ? line.slice(0, idx) : line;
}

export function tryOpenScope(
    line: string,
    stack: ScopeFrame[],
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
        return true;
    }

    m = tryMatch(/^process\s*(?:\([^)]*\))?\s*(is\b)?/i);
    if (m)
    {
        const hasBegin = /\bbegin\b/i.test(stripCommentLine(line));
        stack.push({ type: 'process', name: '', line: lineNum, hasIs: !!m[1], hasBegin });
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

export function closeScope(line: string, stack: ScopeFrame[]): boolean
{
    if (stack.length === 0) { return false; }

    const top = stack[stack.length - 1];

    let matched = false;

    const pkgBodyMatch = line.match(/^end\s+package\s+body\s*(\w+)?\s*;?\s*$/i);
    if (pkgBodyMatch)
    {
        if (top.type === 'package body') { matched = true; }
    }

    const forLoopMatch = line.match(/^end\s+for\s+loop\s*(\w+)?\s*;?\s*$/i);
    if (forLoopMatch && !matched)
    {
        if (top.type === 'for') { matched = true; }
    }

    const whileLoopMatch = line.match(/^end\s+while\s+loop\s*(\w+)?\s*;?\s*$/i);
    if (whileLoopMatch && !matched)
    {
        if (top.type === 'while') { matched = true; }
    }

    const loopMatch = line.match(/^end\s+loop\s*(\w+)?\s*;?\s*$/i);
    if (loopMatch && !matched)
    {
        if (top.type === 'for' || top.type === 'while') { matched = true; }
    }

    const endMatch = line.match(/^end\s+(\w+)\s*(\w+)?\s*;?\s*$/i);
    if (endMatch)
    {
        const kind = endMatch[1].toLowerCase();
        const mappedKind = END_KINDS[kind];
        if (mappedKind && top.type === mappedKind) { matched = true; }
    }

    const bareMatch = line.match(/^end\s*;?\s*$/i);
    if (bareMatch && !matched)
    {
        matched = true;
    }

    if (matched)
    {
        stack.pop();
        return true;
    }

    return false;
}

export function hasBeginKeyword(line: string): boolean
{
    return /^begin\b/i.test(stripCommentLine(line).trim());
}

export function hasElseKeyword(line: string): boolean
{
    const trimmed = stripCommentLine(line).trim();
    return /^else\s*;?\s*$/i.test(trimmed) || /^elsif\s/i.test(trimmed);
}

export function hasWhenKeyword(line: string): boolean
{
    return /^when\s/i.test(stripCommentLine(line).trim());
}
