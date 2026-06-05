import * as vscode from 'vscode';
import { registerBuildCommand } from './commands/build';
import { registerFlashCommand } from './commands/flash';
import { setupMaterialIcons } from './ui/setIcon';
import { createStatusBar, updateButtonsVisibility } from './ui/statusBar';
import { registerGenSimulationUnit } from './commands/genDoFile';
import { registerRunSimulationUnit } from './commands/runDoFile';
import { EntityIndexer } from './services/entityIndexer';
import { registerWorkspaceWatchers } from './services/workspaceWatcher';
import { registerLanguageFeatures } from './services/languagesRegister';
import { registerUiWatchers } from './ui/uiWatcher';
import { registerQsfView } from './services/qsfViewService';
import { registerLintFeature } from './services/lintRegister';


export async function activate(context: vscode.ExtensionContext) 
{
    // Ui
    setupMaterialIcons();
    createStatusBar(context);

    // UI watchers
    registerUiWatchers(context);
    
    // Command
    registerBuildCommand(context);
    registerFlashCommand(context);
    registerGenSimulationUnit(context);
    registerRunSimulationUnit(context);

    // Tree View
    await registerQsfView(context);

    // VHDL indexing
    const indexer = new EntityIndexer();
    await indexer.buildIndex();

    // Lint (after indexer is built — PortMapLinter depends on it)
    registerLintFeature(context, indexer);

    // Workspace listeners
    registerWorkspaceWatchers(context, indexer);

    // Language features
    registerLanguageFeatures(context, indexer);

    updateButtonsVisibility();
}

export function deactivate() {}