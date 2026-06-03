import * as vscode from 'vscode';
import { QsfProvider } from '../providers/qsfTabProvider';

export async function registerQsfView(context: vscode.ExtensionContext) 
{
    const tabView = new QsfProvider();
    await tabView.loadData();

    const treeProvider =
        vscode.window.registerTreeDataProvider(
            'quartus-assistant-view',
            tabView
        );
    
    const watcher = vscode.workspace.createFileSystemWatcher('**/*.{qsf,do,vhd}');
    watcher.onDidCreate(() => tabView.loadData());
    watcher.onDidChange(() => tabView.loadData());
    watcher.onDidDelete(() => tabView.loadData());

    context.subscriptions.push(
        treeProvider,
        watcher
    );
}