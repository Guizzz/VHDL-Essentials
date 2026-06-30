import * as vscode from 'vscode';

const QSF_VHDL_FILE_RE = /set_global_assignment\s+-name\s+VHDL_FILE\s+/;

export class QsfCompletionProvider implements vscode.CompletionItemProvider
{
    async provideCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position,
        _token: vscode.CancellationToken,
        _context: vscode.CompletionContext
    ): Promise<vscode.CompletionItem[]>
    {
        const lineText = document.lineAt(position).text;
        const linePrefix = lineText.substring(0, position.character);

        const match = linePrefix.match(QSF_VHDL_FILE_RE);
        if (!match)
        {
            return [];
        }

        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0)
        {
            return [];
        }

        const afterCommand = linePrefix.substring(match[0].length);

        const lastSlash = afterCommand.lastIndexOf('/');
        const basePath = lastSlash >= 0
            ? afterCommand.substring(0, lastSlash + 1)
            : '';
        const partialName = lastSlash >= 0
            ? afterCommand.substring(lastSlash + 1)
            : afterCommand;

        const uris = await vscode.workspace.findFiles(
            '**/*.{vhd,vhdl}',
            '**/node_modules/**'
        );

        if (uris.length === 0)
        {
            return [];
        }

        const directories = new Set<string>();
        const items: vscode.CompletionItem[] = [];
        const replaceRange = new vscode.Range(
            position.translate(0, -partialName.length),
            position
        );

        for (const uri of uris)
        {
            const relativePath = vscode.workspace
                .asRelativePath(uri, false)
                .replace(/\\/g, '/');

            if (!relativePath.startsWith(basePath))
            {
                continue;
            }

            const suffix = relativePath.substring(basePath.length);

            if (!suffix)
            {
                continue;
            }

            const firstSlash = suffix.indexOf('/');

            if (firstSlash >= 0)
            {
                const dirName = suffix.substring(0, firstSlash);

                if (directories.has(dirName))
                {
                    continue;
                }
                directories.add(dirName);

                const item = new vscode.CompletionItem(
                    dirName,
                    vscode.CompletionItemKind.Folder
                );
                item.insertText = dirName + '/';
                item.range = replaceRange;
                item.command = {
                    command: 'editor.action.triggerSuggest',
                    title: ''
                };
                items.push(item);
            }
            else
            {
                const item = new vscode.CompletionItem(
                    suffix,
                    vscode.CompletionItemKind.File
                );
                item.insertText = suffix;
                item.range = replaceRange;
                items.push(item);
            }
        }

        return items;
    }
}
