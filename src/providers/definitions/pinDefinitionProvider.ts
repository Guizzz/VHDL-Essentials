import * as vscode from 'vscode';
import { getSettingsFile } from '../../quartus/quartusProject';
import { parseQsf } from '../../parsers/qsfParser';
import { LANGUAGE_ID } from '../../constants';

export class PinDefinitionProvider implements vscode.DefinitionProvider {

    async provideDefinition(document: vscode.TextDocument, position: vscode.Position): Promise<vscode.Definition | null> 
    {

        if (document.languageId !== LANGUAGE_ID) { return null;}

        const range = document.getWordRangeAtPosition(position);

        if (!range) {return null;}

        const word = document.getText(range);
        const qsfFile = await getSettingsFile();

        if (!qsfFile) {return null;}

        const qsf = await parseQsf(qsfFile);

        if (document.uri.path !== qsf.topLevel?.path.path) {return null;}

        const pin = qsf.pins.find(p => p.signal.toLowerCase() === word.toLowerCase());

        if (pin?.location) 
        {
            return pin.location;
        }

        return null;
    }
}