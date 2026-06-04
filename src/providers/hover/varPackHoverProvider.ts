import * as vscode from 'vscode';
import { EntityIndexer } from '../../services/entityIndexer';
import { getIcon } from '../../utils/hoverIcon';


export class VarPackHoverProvider implements vscode.HoverProvider {

    constructor(private indexer: EntityIndexer){}

    async provideHover( document: vscode.TextDocument, position: vscode.Position ): Promise<vscode.Hover | null>
    {
        if (document.languageId !== 'vhdl'){return null;}

        const range = document.getWordRangeAtPosition(position);
        if (!range) {return null;}

        const word = document.getText(range);

        const symbol = this.indexer.getSymbol(word);
        if (!symbol) {return null;}

        const markdown = new vscode.MarkdownString();
        markdown.supportThemeIcons = true;
        
        markdown.appendCodeblock(
            `${symbol.symbol.kind} ${word} : ${symbol.symbol.type}${symbol.symbol.value ? ` := ${symbol.symbol.value}` : ''}`,
            'vhdl'
        );

        markdown.appendMarkdown(`$(${getIcon(symbol.symbol.kind)}) **${word}**\n\n`);

        markdown.isTrusted = true;
        return new vscode.Hover( markdown,range);
    }
}