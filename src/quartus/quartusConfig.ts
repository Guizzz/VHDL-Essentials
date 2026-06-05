import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export function getQuartusBin(tool: string): string | null {

    const config = vscode.workspace.getConfiguration('maxv');
    let quartusPath = config.get<string>('quartusPath');

    if (!quartusPath) {return null;}

    quartusPath = path.normalize(quartusPath);

    if (!fs.existsSync(quartusPath)) {
        vscode.window.showWarningMessage(
            `Quartus path "${quartusPath}" does not exist. Check maxv.quartusPath in settings.`
        );
        return null;
    }

    return path.join(quartusPath, tool, 'bin64');
}

export function getQuestaPath(): string
{
    const config = vscode.workspace.getConfiguration('maxv');
    let quartusPath = config.get<string>('quartusPath');

    if (quartusPath)
    {
        quartusPath = path.normalize(quartusPath);
        const questaDir = path.join(quartusPath, 'questa_fse');
        const binDir = process.platform === 'win32' ? 'win64' : 'linux64';
        const execName = process.platform === 'win32' ? 'vsim.exe' : 'vsim';
        const candidate = path.join(questaDir, binDir, execName);

        if (fs.existsSync(candidate))
        {
            return candidate;
        }
    }

    return 'vsim';
}