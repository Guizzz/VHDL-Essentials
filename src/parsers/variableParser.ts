import { ParsedSignalLike } from "../types/types";

export function parseSignals(text: string): ParsedSignalLike[]
{
    const symbols: ParsedSignalLike[] = [];

    const regex = /\b(signal|variable|constant)\s+(\w+)\s*:\s*([\w\s\(\)\d<>:=\-']+)/gi;

    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null)
    {
        symbols.push({
            kind: match[1].toLowerCase(),
            name: match[2],
            type: match[3].trim(),
            offset: match.index
        });
    }

    // entity ports
    const portRegex = /\b(\w+)\s*:\s*(in|out|inout|buffer)\s+([^;]+)/gi;

    while ((match = portRegex.exec(text)) !== null)
    {
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