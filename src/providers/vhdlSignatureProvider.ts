import * as vscode from 'vscode';
import { EntityIndexer } from '../services/entityIndexer';

const VHDL_KEYWORDS = new Set([
    'port', 'map', 'entity', 'component', 'for', 'if', 'when',
    'begin', 'end', 'process', 'architecture', 'generate', 'while',
    'in', 'out', 'inout', 'buffer', 'is', 'of', 'signal', 'variable',
    'constant', 'type', 'subtype', 'function', 'procedure', 'package',
    'body', 'new', 'return', 'range', 'others', 'open', 'bus',
    'library', 'use', 'work', 'all', 'and', 'or', 'nand', 'nor',
    'xor', 'xnor', 'not', 'to', 'downto'
]);

interface PortMapContext
{
    entityName: string;
    openParenOffset: number;
}

export function findEnclosingPortMap(
    text: string,
    offset: number
): PortMapContext | undefined
{
    const regex = /port\s+map\s*\(/gi;
    let match: RegExpExecArray | null;
    let lastMatch: RegExpExecArray | null = null;

    while ((match = regex.exec(text)) !== null)
    {
        if (match.index >= offset) { break; }
        lastMatch = match;
    }

    if (!lastMatch) { return undefined; }

    const openParenOffset = lastMatch.index + lastMatch[0].length - 1;

    if (offset <= openParenOffset) { return undefined; }

    const closeParenOffset = findBalancedClose(text, openParenOffset);
    if (closeParenOffset !== -1 && offset > closeParenOffset) { return undefined; }

    if (isInsideComment(text, offset)) { return undefined; }

    const textBefore = text.substring(0, lastMatch.index);
    const entityName = findLabeledEntityName(textBefore);

    return entityName ? { entityName, openParenOffset } : undefined;
}

function findLabeledEntityName(textBefore: string): string | undefined
{
    const directRe = /(^|\n)\s*\w+\s*:\s*entity\s+(?:work\.)?(\w+)/gi;
    let match: RegExpExecArray | null;
    let lastDirect: RegExpExecArray | null = null;

    while ((match = directRe.exec(textBefore)) !== null)
    {
        lastDirect = match;
    }

    if (lastDirect) { return lastDirect[2]; }

    const compRe = /(^|\n)\s*\w+\s*:\s*(\w+)/gi;
    let lastComp: RegExpExecArray | null = null;

    while ((match = compRe.exec(textBefore)) !== null)
    {
        if (!VHDL_KEYWORDS.has(match[2].toLowerCase()))
        {
            lastComp = match;
        }
    }

    return lastComp ? lastComp[2] : undefined;
}

function findBalancedClose(text: string, openIdx: number): number
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

function isInsideComment(text: string, offset: number): boolean
{
    const lineStart = text.lastIndexOf('\n', offset - 1) + 1;
    const line = text.substring(lineStart, offset);
    const commentIdx = line.indexOf('--');
    return commentIdx !== -1;
}

export function countCommas(text: string): number
{
    let depth = 0;
    let count = 0;
    for (let i = 0; i < text.length; i++)
    {
        if (text[i] === '-' && text[i + 1] === '-')
        {
            while (i < text.length && text[i] !== '\n') { i++; }
            continue;
        }
        if (text[i] === '(') { depth++; }
        else if (text[i] === ')') { depth--; }
        else if (text[i] === ',' && depth === 0) { count++; }
    }
    return count;
}

export class VhdlSignatureProvider implements vscode.SignatureHelpProvider
{
    constructor(private indexer: EntityIndexer) {}

    provideSignatureHelp(
        document: vscode.TextDocument,
        position: vscode.Position,
        _token: vscode.CancellationToken,
        _context: vscode.SignatureHelpContext
    ): vscode.SignatureHelp | undefined
    {
        const text = document.getText();
        const offset = document.offsetAt(position);

        const pmInfo = findEnclosingPortMap(text, offset);
        if (!pmInfo) { return undefined; }

        const entity = this.indexer.getEntity(pmInfo.entityName);
        if (!entity || entity.ports.size === 0) { return undefined; }

        const paramLabels: string[] = [];
        const params: vscode.ParameterInformation[] = [];

        for (const [, port] of entity.ports)
        {
            const label = `${port.name}: ${port.direction} ${port.type}`;
            paramLabels.push(port.name);
            params.push(new vscode.ParameterInformation(label, label));
        }

        const signature = new vscode.SignatureInformation(
            `${pmInfo.entityName}(${paramLabels.join(', ')})`
        );
        signature.parameters = params;

        const textBetween = text.substring(pmInfo.openParenOffset + 1, offset);
        const activeParam = countCommas(textBetween);

        const help = new vscode.SignatureHelp();
        help.signatures = [signature];
        help.activeSignature = 0;
        help.activeParameter = Math.min(activeParam, params.length - 1);

        return help;
    }
}
