import * as vscode from 'vscode';
import { EntityIndexer } from '../../services/entityIndexer';
import { LANGUAGE_ID } from '../../constants';


export class EntityHoverProvider implements vscode.HoverProvider {

    constructor(private indexer: EntityIndexer){}

    async provideHover( document: vscode.TextDocument, position: vscode.Position ): Promise<vscode.Hover | null>
    {
        if (document.languageId !== LANGUAGE_ID){return null;}

        const range = document.getWordRangeAtPosition(position);
        if (!range) {return null;}

        const word = document.getText(range);

        const entity = this.indexer.getEntity(word);
        if (!entity) {return null;}

        const markdown = new vscode.MarkdownString();
        markdown.supportThemeIcons = true;
        markdown.appendCodeblock(
                `entity ${word} is\n\tport(\n`,
                LANGUAGE_ID
            );
        for(const [, port] of entity.ports)
        {
            markdown.appendCodeblock(
                `\t\t${port.name} : ${port.direction} ${port.type}\n`,
                LANGUAGE_ID
            );
        }
        markdown.appendCodeblock(
                `\t);\nend entity;`,
                LANGUAGE_ID
            );

        markdown.isTrusted = true;
        return new vscode.Hover( markdown,range);
    }
}