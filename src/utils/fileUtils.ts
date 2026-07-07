import * as vscode from 'vscode';

export async function writeFileWithConfirmOverwrite(
    uri: vscode.Uri, content: string, fileLabel?: string
): Promise<boolean>
{
    let exists = false;

    try {
        await vscode.workspace.fs.stat(uri);
        exists = true;
    } catch {
        exists = false;
    }

    if (!exists)
    {
        await vscode.workspace.fs.writeFile(uri, Buffer.from(content));
        return true;
    }

    const name = fileLabel ?? uri.path.split('/').pop();

    const choice = await vscode.window.showQuickPick(
        [
            {
                label: "Overwrite",
                description: "Replace the existing file"
            },
            {
                label: "Cancel",
                description: "Keep the existing file"
            }
        ],
        {
            placeHolder: `The file ${name} already exists. What do you want to do?`
        }
    );

    if (!choice || choice.label !== "Overwrite") {
        return false;
    }

    await vscode.workspace.fs.writeFile(uri, Buffer.from(content));
    return true;
}
