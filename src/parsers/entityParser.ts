import { EntitySymbol, EntityPort } from "../types/types";


function stripVhdlComments(text: string): string
{
    return text.replace(/--[^\n]*/g, '');
}

export function parseEntities(text: string): EntitySymbol[]
{
    const entities: EntitySymbol[] = [];
    const entityRegex = /entity\s+(\w+)\s+is([\s\S]*?)end\s+(?:entity\s+)?(?:\w+)?\s*;/gi;
    let entityMatch: RegExpExecArray | null;

    while ((entityMatch = entityRegex.exec(text)) !== null)
    {
        const entityName = entityMatch[1];
        const entityBody = entityMatch[2];
        const nameOffset = entityMatch.index + entityMatch[0].indexOf(entityName);
        const ports: EntityPort[] = [];

        // find port(...) block — balanced parentheses to handle types like std_logic_vector(N-1 downto 0)
        const portBlockMatch = /port\s*\(((?:[^()]|\([^()]*\))*)\)\s*;/i.exec(entityBody);

        if (portBlockMatch)
        {
            const portBlock = stripVhdlComments(portBlockMatch[1]);

            const portRegex = /([\w\s,]+)\s*:\s*(in|out|inout|buffer)\s+([^;]+);?/gi;

            let portMatch: RegExpExecArray | null;

            while ((portMatch = portRegex.exec(portBlock)) !== null)
            {
                const names = portMatch[1].split(',').map(name => name.trim());
                const direction = portMatch[2];
                const type = portMatch[3].trim();

                for (const name of names)
                {
                    const nameMatch = new RegExp(`\\b${name}\\b`).exec(entityMatch[0]);

                    ports.push({
                        name,
                        direction,
                        type,
                        offset: entityMatch.index + (nameMatch?.index ?? 0)
                    });
                }
            }
        }

        entities.push({
            name: entityName,
            offset: nameOffset,
            ports
        });
    }

    return entities;
}

export function parseEntityGenerics(text: string): Array<{name: string; offset: number}>
{
    const result: Array<{name: string; offset: number}> = [];

    const entityRegex = /entity\s+(\w+)\s+is([\s\S]*?)end\s+(?:entity\s+)?(?:\w+)?\s*;/gi;
    let entityMatch: RegExpExecArray | null;

    while ((entityMatch = entityRegex.exec(text)) !== null)
    {
        const entityBody = entityMatch[2];

        const genericBlockMatch = /generic\s*\(((?:[^()]|\([^()]*\))*)\)\s*;/i.exec(entityBody);

        if (genericBlockMatch)
        {
            const genericBlock = stripVhdlComments(genericBlockMatch[1]);

            const declRegex = /(\w+(?:\s*,\s*\w+)*)\s*:/gi;
            let declMatch: RegExpExecArray | null;

            while ((declMatch = declRegex.exec(genericBlock)) !== null)
            {
                const names = declMatch[1].split(',').map(n => n.trim()).filter(n => n.length > 0);

                for (const name of names)
                {
                    const nameIdxInMatch = declMatch[0].indexOf(name);
                    const globalOffset = entityMatch.index +
                        entityMatch[0].indexOf(genericBlockMatch[0]) +
                        declMatch.index + nameIdxInMatch;

                    result.push({name, offset: globalOffset});
                }
            }
        }
    }

    return result;
}