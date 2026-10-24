import * as vscode from 'vscode';
import { BuildHistoryStore } from '../quartus/buildHistory';
import {
    ResourceUsageProvider,
    createDefaultResourceUsageDeps
} from '../providers/resourceUsageProvider';

export async function registerResourceUsageView(context: vscode.ExtensionContext)
{
    const store = new BuildHistoryStore(context.workspaceState);
    const provider = new ResourceUsageProvider(createDefaultResourceUsageDeps(store));

    await provider.loadData();

    const view = vscode.window.registerTreeDataProvider(
        'quartus-assistant-resource-usage',
        provider
    );

    const fitWatcher = vscode.workspace.createFileSystemWatcher('**/*.fit.summary');
    fitWatcher.onDidCreate(() => provider.loadData());
    fitWatcher.onDidChange(() => provider.loadData());
    fitWatcher.onDidDelete(() => provider.loadData());

    const projectWatcher = vscode.workspace.createFileSystemWatcher('**/*.qpf');
    projectWatcher.onDidCreate(() => provider.loadData());
    projectWatcher.onDidChange(() => provider.loadData());
    projectWatcher.onDidDelete(() => provider.loadData());

    context.subscriptions.push(view, fitWatcher, projectWatcher);
}
