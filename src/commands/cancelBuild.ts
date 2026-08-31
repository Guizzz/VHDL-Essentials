import * as vscode from 'vscode';

import { cancelQuartusTask } from '../quartus/quartusRunner';

export function registerCancelBuildCommand(context: vscode.ExtensionContext): void
{
    const command = vscode.commands.registerCommand(
        'quartus-assistant.cancelBuild',
        () =>
        {
            if (!cancelQuartusTask())
            {
                vscode.window.showInformationMessage('No cancellable Quartus build is currently running');
            }
        }
    );

    context.subscriptions.push(command);
}
