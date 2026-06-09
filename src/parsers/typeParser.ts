interface TypeDeclaration
{
    name: string;
    offset: number;
}

function getComponentRanges(text: string): Array<{start: number; end: number}>
{
    const ranges: Array<{start: number; end: number}> = [];
    const regex = /component\s+\w+\s+is[\s\S]*?end\s+component\s*;?/gi;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null)
    {
        ranges.push({start: match.index, end: match.index + match[0].length});
    }

    return ranges;
}

export function parseTypeDeclarations(text: string): TypeDeclaration[]
{
    const result: TypeDeclaration[] = [];
    const componentRanges = getComponentRanges(text);

    function isInsideComponent(offset: number): boolean
    {
        return componentRanges.some(r => offset >= r.start && offset < r.end);
    }

    // type <name> is ... ;
    const typeRegex = /\btype\s+(\w+)\s+is\s+/gi;
    let match: RegExpExecArray | null;

    while ((match = typeRegex.exec(text)) !== null)
    {
        if (isInsideComponent(match.index)) { continue; }

        const name = match[1];
        const nameOffset = match.index + match[0].indexOf(name);

        result.push({name, offset: nameOffset});

        // If the type body starts with '(' it's an enum type — extract literals
        const rest = text.substring(match.index + match[0].length).trimStart();

        if (rest.startsWith('('))
        {
            // find matching closing paren
            let depth = 0;
            let endIdx = -1;

            for (let i = 0; i < rest.length; i++)
            {
                if (rest[i] === '(') { depth++; }
                else if (rest[i] === ')')
                {
                    depth--;
                    if (depth === 0) { endIdx = i; break; }
                }
            }

            if (endIdx > 0)
            {
                const inner = rest.substring(1, endIdx);
                // split by commas, each item is a literal (possibly with comments)
                const literals = inner.split(',')
                    .map(s => s.trim())
                    .filter(s => s.length > 0 && /^\w+$/.test(s));

                for (const lit of literals)
                {
                    result.push({
                        name: lit,
                        offset: match.index + match[0].length + 1 + inner.indexOf(lit)
                    });
                }
            }
        }
    }

    return result;
}

export function parseSubtypeDeclarations(text: string): TypeDeclaration[]
{
    const result: TypeDeclaration[] = [];
    const componentRanges = getComponentRanges(text);

    function isInsideComponent(offset: number): boolean
    {
        return componentRanges.some(r => offset >= r.start && offset < r.end);
    }

    const regex = /\bsubtype\s+(\w+)\s+is\s+/gi;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null)
    {
        if (isInsideComponent(match.index)) { continue; }

        const name = match[1];
        const nameOffset = match.index + match[0].indexOf(name);

        result.push({name, offset: nameOffset});
    }

    return result;
}
