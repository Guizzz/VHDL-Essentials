import * as vscode from 'vscode';
import { EntityIndexer } from '../services/entityIndexer';
import { parseSignals } from '../parsers/variableParser';

const KEYWORD_ITEMS: vscode.CompletionItem[] = [
    'abs', 'access', 'after', 'alias', 'all', 'and', 'architecture', 'array',
    'assert', 'attribute', 'begin', 'block', 'body', 'buffer', 'bus', 'case',
    'component', 'configuration', 'constant', 'disconnect', 'downto', 'else',
    'elsif', 'end', 'entity', 'exit', 'file', 'for', 'function',
    'generate', 'generic', 'group', 'guarded', 'if', 'impure', 'in', 'inertial',
    'inout', 'is', 'label', 'library', 'linkage', 'literal', 'loop', 'map',
    'mod', 'nand', 'natural', 'new', 'next', 'nor', 'not', 'null', 'of', 'on',
    'open', 'or', 'others', 'out', 'package', 'port', 'positive', 'postponed',
    'procedure', 'process', 'pure', 'range', 'record', 'register', 'reject',
    'rem', 'report', 'return', 'rol', 'ror', 'select', 'severity',
    'signal', 'sla', 'sll', 'sra', 'srl', 'std_logic', 'std_logic_vector',
    'subtype', 'then', 'to', 'transport', 'type', 'unaffected', 'units',
    'until', 'use', 'variable', 'wait', 'when', 'while', 'with', 'xnor', 'xor'
].map(kw =>
{
    const item = new vscode.CompletionItem(kw, vscode.CompletionItemKind.Keyword);
    item.insertText = kw;
    return item;
});

const FUNC_ITEMS: vscode.CompletionItem[] = [
    'falling_edge', 'now', 'rising_edge'
].map(fn =>
{
    const item = new vscode.CompletionItem(fn, vscode.CompletionItemKind.Function);
    item.insertText = fn;
    return item;
});

const SIMPLE_TYPES = new Set([
    'std_logic', 'std_logic_vector', 'integer', 'natural', 'positive',
    'boolean', 'bit', 'bit_vector', 'real', 'time', 'string', 'character',
]);

export class VhdlCompletionProvider implements vscode.CompletionItemProvider
{
    constructor(private indexer: EntityIndexer) {}

    async provideCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position,
        _token: vscode.CancellationToken,
        _context: vscode.CompletionContext
    ): Promise<vscode.CompletionItem[]>
    {
        const lineText = document.lineAt(position).text;
        const linePrefix = lineText.substring(0, position.character);

        const pkgItems = this.tryPackageCompletions(linePrefix);
        if (pkgItems)
        {
            return pkgItems;
        }

        const entityItems = this.tryEntityCompletions(lineText, position);
        if (entityItems !== null)
        {
            return entityItems;
        }

        const wordRange = document.getWordRangeAtPosition(position);
        const prefix = wordRange ? document.getText(wordRange).toLowerCase() : '';

        const items: vscode.CompletionItem[] = [];

        this.addMatchingKeywords(prefix, items);
        this.addMatchingFunctions(prefix, items);
        this.addMatchingSymbols(document, prefix, items);
        this.addMatchingEntities(prefix, items);

        return items;
    }

    private tryEntityCompletions(
        lineText: string,
        position: vscode.Position
    ): vscode.CompletionItem[] | null
    {
        const textBefore = lineText.substring(0, position.character);
        const trimmed = textBefore.trimEnd();

        let inEntityName = false;
        let filter = '';

        const entityMatch = trimmed.match(
            /entity\s+(?:work\.)?(\w*)$/i
        );
        if (entityMatch)
        {
            inEntityName = true;
            filter = (entityMatch[1] || '').toLowerCase();
        }

        const componentMatch = trimmed.match(
            /component\s+(\w*)$/i
        );
        if (componentMatch)
        {
            inEntityName = true;
            filter = (componentMatch[1] || '').toLowerCase();
        }

        const archMatch = trimmed.match(
            /architecture\s+\w+\s+of\s+(?:work\.)?(\w*)$/i
        );
        if (archMatch)
        {
            inEntityName = true;
            filter = (archMatch[1] || '').toLowerCase();
        }

        const endMatch = trimmed.match(
            /end\s+(entity|component)\s+(\w*)$/i
        );
        if (endMatch)
        {
            inEntityName = true;
            filter = (endMatch[2] || '').toLowerCase();
        }

        if (!inEntityName)
        {
            return null;
        }

        const prefixLen = filter.length;
        const items: vscode.CompletionItem[] = [];
        for (const name of this.indexer.getAllEntities())
        {
            if (name.length >= prefixLen &&
                name.substring(0, prefixLen).toLowerCase() === filter)
            {
                const item = new vscode.CompletionItem(
                    name,
                    vscode.CompletionItemKind.Class
                );
                item.detail = 'entity';
                items.push(item);
            }
        }

        if (items.length === 0)
        {
            const placeholder = new vscode.CompletionItem(
                '(no matching entities)',
                vscode.CompletionItemKind.Text
            );
            placeholder.insertText = '';
            items.push(placeholder);
        }

        return items;
    }

    private tryPackageCompletions(
        linePrefix: string
    ): vscode.CompletionItem[] | null
    {
        const pkgSymbolsMatch = linePrefix.match(
            /use\s+work\.(\w+)\.(\w*)$/i
        );
        if (pkgSymbolsMatch)
        {
            const pkgName = pkgSymbolsMatch[1];
            const filter = pkgSymbolsMatch[2].toLowerCase();
            const pkg = this.indexer.getPackage(pkgName);
            if (!pkg)
            {
                return [];
            }

            const items: vscode.CompletionItem[] = [];
            for (const [name, symbol] of pkg.symbols)
            {
                if (name.toLowerCase().startsWith(filter))
                {
                    const item = new vscode.CompletionItem(
                        name,
                        this.kindFromSymbolKind(symbol.kind)
                    );
                    item.detail = `${symbol.type}  (${pkgName})`;
                    items.push(item);
                }
            }
            return items;
        }

        const pkgMatch = linePrefix.match(/use\s+work\.(\w*)$/i);
        if (pkgMatch)
        {
            const filter = pkgMatch[1].toLowerCase();
            const items: vscode.CompletionItem[] = [];
            for (const name of this.indexer.getAllPackages())
            {
                if (name.toLowerCase().startsWith(filter))
                {
                    const item = new vscode.CompletionItem(
                        name,
                        vscode.CompletionItemKind.Module
                    );
                    item.detail = 'package';
                    items.push(item);
                }
            }
            return items;
        }

        return null;
    }

    private addMatchingKeywords(
        prefix: string,
        items: vscode.CompletionItem[]
    ): void
    {
        for (const kw of KEYWORD_ITEMS)
        {
            const label = kw.label as string;
            if (label.toLowerCase().startsWith(prefix))
            {
                items.push(kw);
            }
        }
    }

    private addMatchingFunctions(
        prefix: string,
        items: vscode.CompletionItem[]
    ): void
    {
        for (const fn of FUNC_ITEMS)
        {
            const label = fn.label as string;
            if (label.toLowerCase().startsWith(prefix))
            {
                items.push(fn);
            }
        }
    }

    private addMatchingSymbols(
        document: vscode.TextDocument,
        prefix: string,
        items: vscode.CompletionItem[]
    ): void
    {
        const symbols = parseSignals(document.getText());
        const seen = new Set<string>();

        for (const sym of symbols)
        {
            if (!sym.name.toLowerCase().startsWith(prefix))
            {
                continue;
            }

            if (seen.has(sym.name.toLowerCase()))
            {
                continue;
            }
            seen.add(sym.name.toLowerCase());

            const kind = this.kindFromSignalKind(sym.kind);
            const item = new vscode.CompletionItem(sym.name, kind);
            item.detail = `${sym.kind}: ${sym.type}`;
            items.push(item);

            if (SIMPLE_TYPES.has(sym.name.toLowerCase()))
            {
                continue;
            }
        }
    }

    private addMatchingEntities(
        prefix: string,
        items: vscode.CompletionItem[]
    ): void
    {
        for (const name of this.indexer.getAllEntities())
        {
            if (name.toLowerCase().startsWith(prefix))
            {
                const item = new vscode.CompletionItem(
                    name,
                    vscode.CompletionItemKind.Class
                );
                item.detail = 'entity';
                items.push(item);
            }
        }
    }

    private kindFromSignalKind(kind: string): vscode.CompletionItemKind
    {
        switch (kind)
        {
            case 'signal':    return vscode.CompletionItemKind.Variable;
            case 'variable':  return vscode.CompletionItemKind.Variable;
            case 'constant':  return vscode.CompletionItemKind.Constant;
            case 'port':      return vscode.CompletionItemKind.Field;
            default:          return vscode.CompletionItemKind.Variable;
        }
    }

    private kindFromSymbolKind(kind: string): vscode.CompletionItemKind
    {
        switch (kind)
        {
            case 'constant':  return vscode.CompletionItemKind.Constant;
            case 'function':  return vscode.CompletionItemKind.Function;
            case 'type':      return vscode.CompletionItemKind.TypeParameter;
            default:          return vscode.CompletionItemKind.Variable;
        }
    }
}
