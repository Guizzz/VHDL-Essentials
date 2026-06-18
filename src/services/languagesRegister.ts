import * as vscode from 'vscode';

import { EntityIndexer } from './entityIndexer';
import { VhdlDefinitionProvider } from '../providers/definitions/definitionProvider';
import { VhdlCompletionProvider } from '../providers/vhdlCompletionProvider';
import { VhdlHighlightProvider } from '../providers/vhdlHighlightProvider';
import { PinHoverProvider } from '../providers/hover/pinHoverProvider';
import { PinDefinitionProvider } from '../providers/definitions/pinDefinitionProvider';
import { VarPackHoverProvider } from '../providers/hover/varPackHoverProvider';
import { VarEntityHoverProvider } from '../providers/hover/varEntityHoverProvider';
import { EntityHoverProvider } from '../providers/hover/entityHoverProvider';
import { VhdlCodeActionProvider } from '../providers/codeActions';
import { VhdlDocumentSymbolProvider } from '../providers/vhdlDocumentSymbolProvider';
import { VhdlReferenceProvider } from '../providers/definitions/referenceProvider';

export function registerLanguageFeatures(context: vscode.ExtensionContext, indexer: EntityIndexer) 
{
    const definitionProvider    = vscode.languages.registerDefinitionProvider(
                                    'vhdl',
                                    new VhdlDefinitionProvider(indexer)
                                );
    
    const varPackHoverProvider  = vscode.languages.registerHoverProvider(
                                    'vhdl',
                                    new VarPackHoverProvider(indexer)
                                );

    const entityHoverProvider  = vscode.languages.registerHoverProvider(
                                    'vhdl',
                                    new EntityHoverProvider(indexer)
                                );

    const varEntityHoverProvider  = vscode.languages.registerHoverProvider(
                                    'vhdl',
                                    new VarEntityHoverProvider()
                                );

    const pinHoverProvider      = vscode.languages.registerHoverProvider(
                                    'vhdl',
                                    new PinHoverProvider()
                                );
    
    const pinDefinitionProvider = vscode.languages.registerDefinitionProvider(
                                    'vhdl',
                                    new PinDefinitionProvider()
                                );
    
    const completionProvider = vscode.languages.registerCompletionItemProvider(
        'vhdl',
        new VhdlCompletionProvider(indexer)
    );

    const highlightProvider = new VhdlHighlightProvider(indexer);
    highlightProvider.activate();

    const docSymbolProvider = vscode.languages.registerDocumentSymbolProvider(
        'vhdl',
        new VhdlDocumentSymbolProvider()
    );

    const codeActionProvider = vscode.languages.registerCodeActionsProvider(
        'vhdl',
        new VhdlCodeActionProvider()
    );

    const referenceProvider = vscode.languages.registerReferenceProvider(
        'vhdl',
        new VhdlReferenceProvider(indexer)
    );

    const qsfCodeActionProvider = vscode.languages.registerCodeActionsProvider(
        'qsf',
        new VhdlCodeActionProvider()
    );

    const choosePinCmd = vscode.commands.registerCommand(
        '_vhdl.chooseDuplicatePin',
        async (uri: vscode.Uri, line: number) =>
        {
            const doc = await vscode.workspace.openTextDocument(uri);
            const text = doc.getText();
            const lines = text.split('\n');

            if (line < 0 || line >= lines.length) { return; }

            const match = lines[line].match(/set_location_assignment (PIN_\w+) -to (\w+)/);
            if (!match) { return; }

            const signal = match[2];

            // Find all lines assigning the same signal
            const pinOptions: string[] = [];
            const pinLines: number[] = [];

            for (let i = 0; i < lines.length; i++)
            {
                const m = lines[i].match(/set_location_assignment (PIN_\w+) -to (\w+)/);
                if (m && m[2] === signal)
                {
                    pinOptions.push(`${m[1]} (line ${i + 1})`);
                    pinLines.push(i);
                }
            }

            const picked = await vscode.window.showQuickPick(pinOptions, {
                placeHolder: `Which pin to keep for '${signal}'?`
            });

            if (!picked) { return; }

            // Find which line was picked
            const pickedIdx = pinOptions.indexOf(picked);
            if (pickedIdx < 0) { return; }

            const keepLine = pinLines[pickedIdx];

            // Delete all other lines
            const edit = new vscode.WorkspaceEdit();
            for (let i = 0; i < pinLines.length; i++)
            {
                if (pinLines[i] !== keepLine)
                {
                    const r = new vscode.Range(pinLines[i], 0, pinLines[i] + 1, 0);
                    edit.delete(uri, r);
                }
            }

            await vscode.workspace.applyEdit(edit);
        }
    );

    context.subscriptions.push(
        definitionProvider,
        referenceProvider,
        docSymbolProvider,
        completionProvider,
        varPackHoverProvider,
        varEntityHoverProvider,
        entityHoverProvider,
        pinHoverProvider,
        pinDefinitionProvider,
        highlightProvider,
        codeActionProvider,
        qsfCodeActionProvider,
        choosePinCmd
    );
}