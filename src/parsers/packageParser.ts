import { ParsedPackage, ParsedPackageSymbol } from "../types/types";

function isInsideParens(text: string, index: number): boolean
{
    let depth = 0;

    for (let i = 0; i < index; i++)
    {
        if (text[i] === '(') { depth++; }
        else if (text[i] === ')') { depth--; }
    }

    return depth > 0;
}

export function parsePackages(text: string): ParsedPackage[] {

    const packages: ParsedPackage[] = [];

    const packageRegex = /package\s+(\w+)\s+is([\s\S]*?)end\s+package/gi;

    let packageMatch: RegExpExecArray | null;

    while ((packageMatch = packageRegex.exec(text)) !== null) {

        const packageName = packageMatch[1];
        const packageBody = packageMatch[2];
        const packageOffset = packageMatch.index;

        const symbols: ParsedPackageSymbol[] = [];
        const symbolRegex = /\b(constant|signal|type|subtype|function|procedure)\s+(\w+)(?:\s*:\s*([^;:=\)]+))?(?:\s*:=\s*([^;\n]+))?/gm;

        let symbolMatch: RegExpExecArray | null;

        while ((symbolMatch = symbolRegex.exec(packageBody)) !== null) 
        {
            if (isInsideParens(packageBody, symbolMatch.index)) { continue; }

            const kind = symbolMatch[1];
            const symbolName = symbolMatch[2];
            const type = symbolMatch[3]?.trim() ?? '';
            const value = symbolMatch[4]?.trim();

            const symbolOffset = packageOffset + packageMatch[0].indexOf(packageBody) + symbolMatch.index;
            
            symbols.push({
                kind,
                name: symbolName,
                offset: symbolOffset,
                type: type,
                value: value || undefined
            });
        }

        packages.push({
            name: packageName,
            offset: packageOffset,
            symbols,
        });
    }

    return packages;
}