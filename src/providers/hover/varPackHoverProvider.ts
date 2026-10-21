import * as vscode from 'vscode';
import { EntityIndexer } from '../../services/entityIndexer';
import { getIcon } from '../../utils/hoverIcon';
import { LANGUAGE_ID } from '../../constants';


export class VarPackHoverProvider implements vscode.HoverProvider {

    constructor(private indexer: EntityIndexer){}

    async provideHover( document: vscode.TextDocument, position: vscode.Position ): Promise<vscode.Hover | null>
    {
        if (document.languageId !== LANGUAGE_ID){return null;}

        const range = document.getWordRangeAtPosition(position);
        if (!range) {return null;}

        const word = document.getText(range);

        const symbol = this.indexer.getSymbol(word);
        if (!symbol) {return null;}

        const markdown = new vscode.MarkdownString();
        markdown.supportThemeIcons = true;
        
        markdown.appendMarkdown(`$(${getIcon(symbol.symbol.kind)}) **${word}**\n\n`);

        markdown.appendCodeblock(
            `${symbol.symbol.kind} ${word} : ${symbol.symbol.type}${symbol.symbol.value ? ` := ${symbol.symbol.value}` : ''}`,
            LANGUAGE_ID
        );

        markdown.isTrusted = true;
        return new vscode.Hover( markdown,range);
    }
}