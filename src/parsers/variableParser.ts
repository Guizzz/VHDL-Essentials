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
    const portRegex =  /\b(\w+)\s*:\s*(in|out|inout|buffer)\s+([\w\s\(\)\d]+)\b/gi;

    while ((match = portRegex.exec(text)) !== null)
    {
        symbols.push({
            kind: 'port',
            name: match[1],
            direction: match[2],
            type: match[3].trim(),
            offset: match.index
        });
    }

    return symbols;
}