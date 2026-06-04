import { EntitySymbol, EntityPort } from "../types/types";


export function parseEntities(text: string): EntitySymbol[]
{
    const entities: EntitySymbol[] = [];
    const entityRegex = /entity\s+(\w+)\s+is([\s\S]*?)end\s+(?:entity\s+)?(?:\w+)?\s*;/gi;
    let entityMatch: RegExpExecArray | null;

    while ((entityMatch = entityRegex.exec(text)) !== null)
    {
        const entityName = entityMatch[1];
        const entityBody = entityMatch[2];
        const entityOffset = entityMatch.index;
        const ports: EntityPort[] = [];

        // find port(...) block — balanced parentheses to handle types like std_logic_vector(N-1 downto 0)
        const portBlockMatch = /port\s*\(((?:[^()]|\([^()]*\))*)\)\s*;/i.exec(entityBody);

        if (portBlockMatch)
        {
            const portBlock = portBlockMatch[1];

            // supporta:
            // clk : in std_logic;
            // a,b : out unsigned(7 downto 0);
            const portRegex = /([\w\s,]+)\s*:\s*(in|out|inout|buffer)\s+([^;]+);?/gi;

            let portMatch: RegExpExecArray | null;

            while ((portMatch = portRegex.exec(portBlock)) !== null)
            {
                const names = portMatch[1].split(',').map(name => name.trim());
                const direction = portMatch[2];
                const type = portMatch[3].trim();

                for (const name of names)
                {
                    const relativeOffset = entityMatch[0].indexOf(portMatch[0]);

                    ports.push({
                        name,
                        direction,
                        type,
                        offset: entityOffset + relativeOffset
                    });
                }
            }
        }

        entities.push({
            name: entityName,
            offset: entityOffset,
            ports
        });
    }

    return entities;
}