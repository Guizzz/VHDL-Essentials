import * as vscode from 'vscode';
import { hasQuartusProject } from '../quartus/quartusProject';

export let buildButton: vscode.StatusBarItem;
export let flashButton: vscode.StatusBarItem;
export let taskStatus: vscode.StatusBarItem;

export function createStatusBar(context: vscode.ExtensionContext) 
{
    buildButton = vscode.window.createStatusBarItem(
                    vscode.StatusBarAlignment.Left,
                    2
                );

    buildButton.text = "$(symbol-property) Build";

    buildButton.command = 'quartus-assistant.build';

    flashButton = vscode.window.createStatusBarItem(
                    vscode.StatusBarAlignment.Left,
                    1
                );

    flashButton.text = "$(arrow-down) Flash";
    flashButton.command = 'quartus-assistant.flash';

    taskStatus = vscode.window.createStatusBarItem(
                    vscode.StatusBarAlignment.Left,
                    0
                );

    taskStatus.text = "$(gear) Quartus: idle";

    context.subscriptions.push(
        buildButton,
        flashButton,
        taskStatus
    );
}

export function setBuildButtonRunning(running: boolean): void
{
    if (running)
    {
        buildButton.text = "$(close) Cancel Build";
        buildButton.command = 'quartus-assistant.cancelBuild';
        buildButton.tooltip = 'Cancel Quartus build';
        return;
    }

    buildButton.text = "$(symbol-property) Build";
    buildButton.command = 'quartus-assistant.build';
    buildButton.tooltip = 'Build Quartus project';
}

export async function updateButtonsVisibility() 
{
    const hasProject = await hasQuartusProject();

    if (hasProject) {
        buildButton.show();
        flashButton.show();
        taskStatus.show();
    } else {
        buildButton.hide();
        flashButton.hide();
        taskStatus.hide();
    }
}
