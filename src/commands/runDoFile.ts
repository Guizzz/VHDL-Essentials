import * as vscode from 'vscode';
import { getProjectName, getQuestaFile, getWorkspace } from '../quartus/quartusProject';
import path from 'path';
import { quartusOutput } from '../quartus/quartusLogger';
import { QuestaSimOption, runSimulation } from '../quartus/quartusRunner';

export function registerRunSimulationUnit(context: vscode.ExtensionContext) 
{
    const command = vscode.commands.registerCommand(
                'quartus-assistant.runDo',
                async (file?: string) => 
                {
                    const workspace = getWorkspace();
                    if (!workspace) {return;}

                    const workspaceRoot = workspace.fsPath;

                    if (!workspaceRoot) {
                        vscode.window.showErrorMessage("No workspace open");
                        return;
                    }

                    const projectName = await getProjectName();
                    

                    if (file) {
                        quartusOutput.show(true);
                        const opt: QuestaSimOption = {
                            doFile: file,
                            label: file,
                            projectName: projectName!
                        };
                        await runSimulation(opt);
                        return;
                    }

                    const qsfFiles = await getQuestaFile();
    
                    if (qsfFiles.length === 0) {
                        vscode.window.showErrorMessage( 'No .do file found' );
                        return;
                    }

                    const picked =
                        await vscode.window.showQuickPick(
                            qsfFiles.map(unit => ({
                                label: path.basename(unit.fsPath),
                                detail: vscode.workspace.asRelativePath(unit.fsPath),
                                unit
                            })),
                            {
                                placeHolder: 'Select simulation entity'
                            }
                        );
    
                    if (!picked) { 
                        vscode.window.showErrorMessage( 'No file picked' );
                        return; 
                    }

                    quartusOutput.show(true);

                    console.log (picked);
                    console.log("cwd:", workspaceRoot);
                    console.log("file:", picked.unit.fsPath);

                    const opt: QuestaSimOption = {
                        doFile: picked.detail,
                        label: picked.label,
                        projectName: projectName!
                    };

                    runSimulation(opt);

                });
    context.subscriptions.push(command);
}