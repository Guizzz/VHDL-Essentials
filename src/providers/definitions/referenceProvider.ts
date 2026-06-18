import * as vscode from 'vscode';

import { EntityIndexer } from '../../services/entityIndexer';
import { VHDL_KEYWORDS } from '../../utils/vhdlKeywords';
import { parseSignals } from '../../parsers/variableParser';

export class VhdlReferenceProvider implements vscode.ReferenceProvider
{
    constructor(private indexer: EntityIndexer) {}

    async provideReferences(
        document: vscode.TextDocument,
        position: vscode.Position,
        context: vscode.ReferenceContext,
        token: vscode.CancellationToken
    ): Promise<vscode.Location[]>
    {
        const range = document.getWordRangeAtPosition(position);
        if (!range) { return []; }

        const word = document.getText(range);
        if (VHDL_KEYWORDS.has(word.toLowerCase())) { return []; }

        const line = document.lineAt(position.line).text;
        const text = document.getText();

        const declaration = this.resolveSymbol(document, text, line, word);

        return this.findReferencesInWorkspace(
            word,
            declaration,
            context.includeDeclaration,
            token
        );
    }

    private resolveSymbol(
        document: vscode.TextDocument,
        text: string,
        line: string,
        word: string
    ): vscode.Location | undefined
    {
        // entity work.xxx
        const entityRefMatch = /entity\s+work\.(\w+)/i.exec(line);
        if (entityRefMatch && entityRefMatch[1].toLowerCase() === word.toLowerCase())
        {
            return this.indexer.getEntityLocation(word);
        }

        // use work.xxx.all (package name itself)
        const pkgUseMatch = /use\s+work\.(\w+)\.all\s*;/i.exec(line);
        if (pkgUseMatch && pkgUseMatch[1].toLowerCase() === word.toLowerCase())
        {
            return this.indexer.getPackageLocation(word);
        }

        // Symbol from any imported package
        const useRegex = /use\s+work\.(\w+)\.all\s*;/gi;
        let useMatch: RegExpExecArray | null;
        while ((useMatch = useRegex.exec(text)) !== null)
        {
            const loc = this.indexer.getPackageSymbolLocation(useMatch[1], word);
            if (loc) { return loc; }
        }

        // Local declaration (signal, variable, constant, port)
        const symbol = parseSignals(text)
            .find(s => s.name.toLowerCase() === word.toLowerCase());
        if (symbol)
        {
            const pos = document.positionAt(symbol.offset);
            return new vscode.Location(document.uri, pos);
        }

        // Standalone entity name (e.g. in instantiation `label : entity work.counter`)
        const entityLoc = this.indexer.getEntityLocation(word);
        if (entityLoc)
        {
            return entityLoc;
        }

        return undefined;
    }

    private async findReferencesInWorkspace(
        word: string,
        declaration: vscode.Location | undefined,
        includeDeclaration: boolean,
        token: vscode.CancellationToken
    ): Promise<vscode.Location[]>
    {
        const locations: vscode.Location[] = [];

        const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`\\b${escaped}\\b`, 'gi');

        const vhdlFiles = await vscode.workspace.findFiles(
            '**/*.{vhd,vhdl}',
            '**/node_modules/**'
        );

        for (const file of vhdlFiles)
        {
            if (token.isCancellationRequested) { return locations; }

            const doc = await vscode.workspace.openTextDocument(file);
            const fileText = doc.getText();
            const lines = fileText.split(/\r?\n/);

            regex.lastIndex = 0;
            let match: RegExpExecArray | null;
            while ((match = regex.exec(fileText)) !== null)
            {
                const matchPos = doc.positionAt(match.index);

                // Skip declaration line if includeDeclaration is false
                if (
                    !includeDeclaration &&
                    declaration &&
                    file.toString() === declaration.uri.toString() &&
                    matchPos.line === declaration.range.start.line
                )
                {
                    continue;
                }

                // Skip matches inside comments
                const lineText = lines[matchPos.line];
                const commentIdx = lineText.indexOf('--');
                if (commentIdx >= 0 && matchPos.character >= commentIdx)
                {
                    continue;
                }

                locations.push(new vscode.Location(
                    file,
                    new vscode.Range(matchPos, matchPos.translate(0, word.length))
                ));
            }
        }

        return locations;
    }
}
