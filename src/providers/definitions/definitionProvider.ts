import * as vscode from 'vscode';

import { EntityIndexer } from '../../services/entityIndexer';
import { parseSignals } from '../../parsers/variableParser';

export class VhdlDefinitionProvider implements vscode.DefinitionProvider {

    constructor( private indexer: EntityIndexer ) {}

    provideDefinition( document: vscode.TextDocument, position: vscode.Position ): vscode.ProviderResult<vscode.Definition> 
    {
        const range = document.getWordRangeAtPosition( position );
        if (!range) { return null; }

        const word = document.getText(range);
        const line = document.lineAt(position.line).text;

        //
        // ==================================================== // PACKAGE
        // use work.xxx.all;
        // ==================================================== //

        const packageRegex = /use\s+work\.(\w+)\.all/i;
        const packageMatch = packageRegex.exec(line);

        if (packageMatch && packageMatch[1].toLowerCase() === word.toLowerCase()) 
        {
            const packageLocation = this.indexer.getPackageLocation( word );
            if (packageLocation) {
                return packageLocation;
            }
        }

        //
        // ==================================================== // ENTITY
        // entity work.xxx
        // ==================================================== //

        const entityRegex = /entity\s+work\.(\w+)/i;
        const entityMatch = entityRegex.exec(line);

        if (entityMatch && entityMatch[1].toLowerCase() === word.toLowerCase()) {

            const entityLocation = this.indexer.getEntityLocation(word);

            if (entityLocation) {
                return entityLocation;
            }
        }

        //
        // ==================================================== // PACKAGE SYMBOLS
        // WIDTH, state_t, etc.
        // ==================================================== //

        const text = document.getText();
        const useRegex = /use\s+work\.(\w+)\.all\s*;/gi;
        let useMatch: RegExpExecArray | null;

        while ((useMatch = useRegex.exec(text)) !== null) {

            const packageName = useMatch[1];
            const symbolLocation = this.indexer.getPackageSymbolLocation(packageName, word);

            if (symbolLocation) {
                return symbolLocation;
            }
        }

        //
        // ==================================================== // ENTITY-LOCAL SYMBOLS
        // signal / variable / constant / port in the same file
        // ==================================================== //

        const symbol = parseSignals(document.getText())
            .find(s => s.name.toLowerCase() === word.toLowerCase());

        if (symbol)
        {
            const pos = document.positionAt(symbol.offset);
            const range = new vscode.Range(
                pos,
                pos.translate(0, symbol.name.length)
            );
            return new vscode.Location(document.uri, range);
        }

        return null;
    }
}