import * as vscode from 'vscode';

import { EntityIndexer } from '../services/entityIndexer';
import { VHDL_KEYWORDS } from '../utils/vhdlKeywords';
import { parseSignals } from '../parsers/variableParser';

export class VhdlRenameProvider implements vscode.RenameProvider
{
    constructor(private indexer: EntityIndexer) {}

    prepareRename(
        document: vscode.TextDocument,
        position: vscode.Position
    ): vscode.ProviderResult<vscode.Range | { range: vscode.Range; placeholder: string }>
    {
        const range = document.getWordRangeAtPosition(position);
        if (!range) { return undefined; }

        const word = document.getText(range);
        if (VHDL_KEYWORDS.has(word.toLowerCase())) { return undefined; }

        if (!this.canResolve(document, word)) { return undefined; }

        return { range, placeholder: word };
    }

    async provideRenameEdits(
        document: vscode.TextDocument,
        position: vscode.Position,
        newName: string,
        token: vscode.CancellationToken
    ): Promise<vscode.WorkspaceEdit>
    {
        const edit = new vscode.WorkspaceEdit();
        const range = document.getWordRangeAtPosition(position);
        if (!range) { return edit; }

        const word = document.getText(range);

        const locations = await this.findReferenceLocations(word, token);

        for (const loc of locations)
        {
            edit.replace(loc.uri, loc.range, newName);
        }

        return edit;
    }

    private canResolve(document: vscode.TextDocument, word: string): boolean
    {
        const text = document.getText();

        if (this.indexer.getEntityLocation(word)) { return true; }

        if (this.indexer.getPackageLocation(word)) { return true; }

        const useRegex = /use\s+work\.(\w+)\.all\s*;/gi;
        let useMatch: RegExpExecArray | null;
        while ((useMatch = useRegex.exec(text)) !== null)
        {
            if (this.indexer.getPackageSymbolLocation(useMatch[1], word))
            {
                return true;
            }
        }

        const symbol = parseSignals(text)
            .find(s => s.name.toLowerCase() === word.toLowerCase());
        if (symbol) { return true; }

        return false;
    }

    private async findReferenceLocations(
        word: string,
        token: vscode.CancellationToken
    ): Promise<Array<{ uri: vscode.Uri; range: vscode.Range }>>
    {
        const locations: Array<{ uri: vscode.Uri; range: vscode.Range }> = [];

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

                const lineText = lines[matchPos.line];
                const commentIdx = lineText.indexOf('--');
                if (commentIdx >= 0 && matchPos.character >= commentIdx)
                {
                    continue;
                }

                locations.push({
                    uri: file,
                    range: new vscode.Range(
                        matchPos,
                        matchPos.translate(0, word.length)
                    )
                });
            }
        }

        return locations;
    }
}
