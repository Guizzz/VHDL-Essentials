import * as vscode from 'vscode';
import { EntityIndexer } from './entityIndexer';

export function registerWorkspaceWatchers( context: vscode.ExtensionContext, indexer: EntityIndexer)
{
    const pendingChanges = new Set<string>();
    let changeTimer: ReturnType<typeof setTimeout> | undefined;

    const saveListener =
        vscode.workspace.onDidSaveTextDocument(
            async (doc) => {
                if (doc.languageId !== 'vhdl') { return;}
                await indexer.indexFile(doc.uri);
            }
        );

    const changeListener =
        vscode.workspace.onDidChangeTextDocument(
            (event) => {
                const doc = event.document;

                if (doc.languageId !== 'vhdl') { return; }
                if (doc.uri.scheme !== 'file') { return; }

                pendingChanges.add(doc.uri.fsPath);

                clearTimeout(changeTimer);
                changeTimer = setTimeout(
                    async () => {
                        const paths = [ ...pendingChanges ];
                        pendingChanges.clear();

                        for (const path of paths)
                        {
                            await indexer.indexFile(vscode.Uri.file(path));
                        }
                    },
                    400
                );
            }
        );

    const createListener =
        vscode.workspace.onDidCreateFiles(
            async (event) => {
                for (const file of event.files) {
                    await indexer.indexFile(file);
                }
            }
        );

    const deleteListener =
        vscode.workspace.onDidDeleteFiles(
            async (event) => {
                for (const file of event.files) {
                    indexer.removeFile(file.fsPath);
                }
            }
        );

    context.subscriptions.push(
        saveListener,
        changeListener,
        createListener,
        deleteListener,
        {
            dispose: () => clearTimeout(changeTimer)
        },
        indexer
    );
}