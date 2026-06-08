import { ParsedSignalLike } from "../types/types";

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

export function parseSignals(text: string): ParsedSignalLike[]
{
    const symbols: ParsedSignalLike[] = [];
    const componentRanges = getComponentRanges(text);

    function isInsideComponent(offset: number): boolean
    {
        return componentRanges.some(r => offset >= r.start && offset < r.end);
    }

    const regex = /\b(signal|variable|constant)\s+(\w+)\s*:\s*([\w\s\(\)\d<>:=\-']+)/gi;

    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null)
    {
        if (isInsideComponent(match.index)) { continue; }

        symbols.push({
            kind: match[1].toLowerCase(),
            name: match[2],
            type: match[3].trim(),
            offset: match.index + match[0].indexOf(match[2])
        });
    }

    // entity ports
    const portRegex = /\b(\w+)\s*:\s*(in|out|inout|buffer)\s+([^;]+)/gi;

    while ((match = portRegex.exec(text)) !== null)
    {
        if (isInsideComponent(match.index)) { continue; }

        let type = match[3].trim();

        // strip trailing structural ) that closes the port block (not part of type)
        if (type.endsWith(')'))
        {
            const without = type.slice(0, -1).trimEnd();
            const opens = (without.match(/\(/g) || []).length;
            const closes = (without.match(/\)/g) || []).length;

            if (opens === closes)
            {
                type = without;
            }
        }

        symbols.push({
            kind: 'port',
            name: match[1],
            direction: match[2],
            type,
            offset: match.index
        });
    }

    return symbols;
}