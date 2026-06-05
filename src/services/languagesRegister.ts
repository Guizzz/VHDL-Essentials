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

    context.subscriptions.push(
        definitionProvider,
        completionProvider,
        varPackHoverProvider,
        varEntityHoverProvider,
        entityHoverProvider,
        pinHoverProvider,
        pinDefinitionProvider,
        highlightProvider
    );
}