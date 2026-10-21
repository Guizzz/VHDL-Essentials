import * as vscode from 'vscode';
import { resolvePin } from '../../quartus/qsfPinResolver';
import { LANGUAGE_ID } from '../../constants';


export class PinHoverProvider implements vscode.HoverProvider {

    async provideHover( document: vscode.TextDocument, position: vscode.Position ): Promise<vscode.Hover | null>
    {
        if (document.languageId !== LANGUAGE_ID){return null;}

        const range = document.getWordRangeAtPosition( position);
        if (!range) {return null;}

        const word = document.getText(range);
        const resolved = await resolvePin(word, document.uri);

        if (!resolved) {return null;}
        
        const targetDoc = await vscode.workspace.openTextDocument(resolved.location.uri);
        const line = targetDoc.lineAt(resolved.location.range.start.line).text;
        const markdown = new vscode.MarkdownString();
        markdown.supportThemeIcons = true;

        markdown.appendCodeblock(
            line.trim(),
            'quartus'
        );

        return new vscode.Hover( markdown,range);
    }
}