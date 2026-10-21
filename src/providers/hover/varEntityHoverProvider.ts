import * as vscode from 'vscode';
import { parseSignals } from '../../parsers/variableParser';
import { getIcon } from '../../utils/hoverIcon';
import { LANGUAGE_ID } from '../../constants';

export class VarEntityHoverProvider implements vscode.HoverProvider
{
    async provideHover( document: vscode.TextDocument, position: vscode.Position ): Promise<vscode.Hover | null>
    {
        const range = document.getWordRangeAtPosition(position);

        if (!range) {return null;}

        const word = document.getText(range);
        const symbol = parseSignals(document.getText()).find(s => s.name === word);

        if (!symbol) {return null;}

        const markdown = new vscode.MarkdownString(undefined, true);

        markdown.supportThemeIcons = true;
        markdown.isTrusted = true;
        
        markdown.appendCodeblock(
            `${symbol.kind} ${symbol.name} : ${symbol.direction ? symbol.direction + ' ' : ''}${symbol.type}`,
            LANGUAGE_ID
        );

        markdown.appendMarkdown(`$(${getIcon(symbol.kind)}) **${symbol.name}**\n\n`);

        return new vscode.Hover(markdown, range);
    }
}