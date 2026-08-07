import * as vscode from 'vscode';
import { getProjectName, getQuestaFile, getWorkspace } from '../quartus/quartusProject';
import path from 'path';
import { quartusOutput } from '../quartus/logger';
import { QuestaSimOption, runSimulation } from '../quartus/quartusRunner';
import { normalizeToForwardSlashes } from '../utils/fileUtils';

export function registerRunSimulationUnit(context: vscode.ExtensionContext) 
{
    const command = vscode.commands.registerCommand(
                'quartus-assistant.runDo',
                async (file?: string | vscode.Uri) => 
                {
                    const workspace = getWorkspace();
                    if (!workspace) {return;}

                    const workspaceRoot = workspace.fsPath;

                    if (!workspaceRoot) {
                        vscode.window.showErrorMessage("No workspace open");
                        return;
                    }

                    quartusOutput.clear();

                    const projectName = await getProjectName();
                    

                    if (file && typeof file !== 'string')
                    {
                        const arg = file as any;
                        const uri = arg.resourceUri ?? arg;

                        quartusOutput.show(true);
                        const opt: QuestaSimOption = {
                            doFile: normalizeToForwardSlashes(
                                vscode.workspace.asRelativePath(uri as vscode.Uri)
                            ),
                            label: path.basename(uri.fsPath ?? uri.path),
                            projectName: projectName!
                        };
                        await runSimulation(opt);
                        return;
                    }

                    if (typeof file === 'string')
                    {
                        quartusOutput.show(true);
                        const opt: QuestaSimOption = {
                            doFile: normalizeToForwardSlashes(file),
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
                    const opt: QuestaSimOption = {
                        doFile: normalizeToForwardSlashes(picked.detail),
                        label: picked.label,
                        projectName: projectName!
                    };

                    runSimulation(opt);

                });
    context.subscriptions.push(command);
}