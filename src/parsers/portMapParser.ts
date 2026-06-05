export interface PortMapping
{
    formal: string;
    actual: string;
    offset: number;
}

export interface PortMapClause
{
    entityName: string;
    label: string;
    mappings: PortMapping[];
    offset: number;
    entityOffset: number;
}

export function parsePortMaps(text: string): PortMapClause[]
{
    const clauses: PortMapClause[] = [];
    const regex = /(\w+)\s*:\s*(?:entity\s+)?(?:work\.)?(\w+)\s+port\s+map\s*\(/gi;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null)
    {
        const label = match[1];
        const entityName = match[2];
        const portMapOffset = match.index;
        const openParenIdx = regex.lastIndex - 1;

        const closeParenIdx = findBalancedParen(text, openParenIdx);
        if (closeParenIdx === -1) { continue; }

        const colonPos = match[0].indexOf(':');
        const entityOffset = match.index + match[0].indexOf(match[2], colonPos);

        const content = text.substring(openParenIdx + 1, closeParenIdx);
        const contentStart = openParenIdx + 1;

        const mappings = parseMappings(content, contentStart);

        clauses.push({ entityName, label, mappings, offset: portMapOffset, entityOffset });
    }

    return clauses;
}

function stripVhdlComments(text: string): string
{
    return text.replace(/--[^\n]*/g, '');
}

function findBalancedParen(text: string, openIdx: number): number
{
    let depth = 1;
    for (let i = openIdx + 1; i < text.length; i++)
    {
        if (text[i] === '-' && text[i + 1] === '-')
        {
            while (i < text.length && text[i] !== '\n') { i++; }
            continue;
        }
        if (text[i] === '(') { depth++; }
        else if (text[i] === ')') { depth--; }
        if (depth === 0) { return i; }
    }
    return -1;
}

function parseMappings(content: string, baseOffset: number): PortMapping[]
{
    const mappings: PortMapping[] = [];
    let depth = 0;
    let start = 0;

    for (let i = 0; i < content.length; i++)
    {
        if (content[i] === '-' && content[i + 1] === '-')
        {
            while (i < content.length && content[i] !== '\n') { i++; }
            continue;
        }
        if (content[i] === '(') { depth++; }
        else if (content[i] === ')') { depth--; }
        else if (content[i] === ',' && depth === 0)
        {
            processMapping(content.substring(start, i), baseOffset + start, mappings);
            start = i + 1;
        }
    }

    processMapping(content.substring(start), baseOffset + start, mappings);

    return mappings;
}

function processMapping(part: string, offset: number, mappings: PortMapping[])
{
    const clean = stripVhdlComments(part).trim();
    if (!clean) { return; }

    const arrowIdx = clean.indexOf('=>');
    if (arrowIdx === -1) { return; }

    const formal = clean.substring(0, arrowIdx).trim();
    const actual = clean.substring(arrowIdx + 2).trim();

    if (formal)
    {
        const formalOffset = findFormalOffsetInPart(part, formal);
        mappings.push({ formal, actual, offset: offset + formalOffset });
    }
}

/** Find where `formal` appears in `part` (which may contain VHDL comments).
 *  Returns the index within `part` corresponding to the start of `formal`
 *  in the non-comment portion. */
function findFormalOffsetInPart(part: string, formal: string): number
{
    const stripped = stripVhdlComments(part);
    const nameRegex = new RegExp(`\\b${formal}\\b`);
    const nameMatch = nameRegex.exec(stripped);
    if (!nameMatch) { return 0; }

    const targetIdx = nameMatch.index;
    let nonCommentCount = 0;
    for (let i = 0; i < part.length; i++)
    {
        if (part[i] === '-' && part[i + 1] === '-')
        {
            while (i < part.length && part[i] !== '\n') { i++; }
            // i is now at '\n' — count it as a non-comment char before continuing
            if (nonCommentCount === targetIdx) { return i; }
            nonCommentCount++;
            continue;
        }
        if (nonCommentCount === targetIdx) { return i; }
        nonCommentCount++;
    }
    return part.length;
}
