import * as vscode from 'vscode';
import * as path from 'path';

export async function getProjectFile()
{
    const files = await vscode.workspace.findFiles('**/*.qpf');
    return files[0];
}

export async function getSettingsFile()
{
    const files = await vscode.workspace.findFiles('**/*.qsf');
    if (files.length === 0)
    {
        vscode.window.showErrorMessage('No Quartus Setting file found');
        return undefined;
    }
    return files[0];
}

export async function getQuestaFile()
{
    const files = await vscode.workspace.findFiles('**/*.do');
    return files;
}

export async function getProjectName(): Promise<string | null>
{
    const file = await getProjectFile();

    if (!file) { return null; }

    return path.basename(file.fsPath, '.qpf');
}

export async function getProjectDir(): Promise<string | null>
{
    const file = await getProjectFile();

    if (!file) { return null; }

    return path.dirname(file.fsPath);
}

export function getWorkspace()
{
    const workspace = vscode.workspace.workspaceFolders?.[0];

    if (!workspace)
    {
        vscode.window.showErrorMessage('No workspace opened');
        return undefined;
    }

    return workspace.uri;
}

export async function hasQuartusProject(): Promise<boolean>
{
    const file = await getProjectFile();
    return !!file;
}

export async function getTopLevelEntityFile(topLevelEntityName: string)
{
    const files = await vscode.workspace.findFiles('**/*.vhd');

    let topLevelFile: vscode.Uri | undefined;

    for (const file of files)
    {
        const content = Buffer.from(await vscode.workspace.fs.readFile(file)).toString('utf-8');

        const entityRegex = new RegExp(
            `entity\\s+${topLevelEntityName}\\s+is`,
            'i'
        );

        if (entityRegex.test(content))
        {
            topLevelFile = file;
            return { entity: topLevelEntityName, path: topLevelFile };
        }
    }
    return undefined;
}
