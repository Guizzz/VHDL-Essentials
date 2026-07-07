import * as vscode from 'vscode';

import {scanSimulationUnits} from '../utils/simulationScanner';
import { generateDoFile } from '../utils/doGenerator';
import { writeFileWithConfirmOverwrite } from '../utils/fileUtils';
import { getWorkspace } from '../quartus/quartusProject';

export function registerGenSimulationUnit(context: vscode.ExtensionContext) 
{
    const command = vscode.commands.registerCommand(
            'quartus-assistant.generateDo',
            async (file?: string | vscode.Uri) => {

                const workspace = getWorkspace();
                if (!workspace) {return;}


                const units = await scanSimulationUnits( workspace );

                if (units.length === 0) {
                    vscode.window.showErrorMessage( 'No simulation unit found' );
                    return;
                }

                let pickedUnit;

                if (file && typeof file !== 'string')
                {
                    const arg = file as any;
                    const filePath: string | undefined =
                        arg.fsPath || arg.resourceUri?.fsPath;

                    if (!filePath)
                    {
                        vscode.window.showErrorMessage('Invalid file argument');
                        return;
                    }

                    const normalized = filePath.toLowerCase();
                    const matches = units.filter(
                        unit => unit.uriFile.fsPath.toLowerCase() === normalized
                    );

                    if (matches.length === 1)
                    {
                        pickedUnit = {
                            label: matches[0].entity,
                            detail: matches[0].file,
                            unit: matches[0]
                        };
                    }
                    else if (matches.length === 0)
                    {
                        vscode.window.showErrorMessage('No simulation unit found for this file');
                        return;
                    }
                    else
                    {
                        vscode.window.showErrorMessage('Multiple simulation units found for this file');
                        return;
                    }
                }
                else if (typeof file === 'string')
                {
                    const matches = units.filter(unit => unit.file === file );

                    if (matches.length === 1)
                    {
                        pickedUnit = {
                            label: matches[0].entity,
                            detail: matches[0].file,
                            unit: matches[0]
                        };
                    }
                    else if (matches.length > 1)
                    {
                        const picked = await vscode.window.showQuickPick(
                            matches.map(unit => ({
                                label: unit.entity,
                                detail: unit.file,
                                unit
                            })),
                            { placeHolder: 'Multiple matches found, select simulation entity' }
                        );

                        if (!picked) {
                            vscode.window.showErrorMessage('No file picked');
                            return;
                        }

                        pickedUnit = picked;
                    }
                }

                if (!pickedUnit) {
                    const picked = await vscode.window.showQuickPick(
                        units.map(unit => ({
                            label: unit.entity,
                            detail: unit.file,
                            unit
                        })),
                        { placeHolder: 'Select simulation entity' }
                    );

                    if (!picked) {
                        vscode.window.showErrorMessage('No file picked');
                        return;
                    }

                    pickedUnit = picked;
                }


                if (!pickedUnit) { 
                    vscode.window.showErrorMessage( 'No file picked' );
                    return; 
                }

                const doFile =
                    vscode.Uri.joinPath(
                        workspace,
                        'simulation',
                        pickedUnit.unit.entity +'.do'
                    );
                
                const doContent =
                    generateDoFile(
                        pickedUnit.unit,
                        pickedUnit.unit.entityNeeded,
                        pickedUnit.unit.runTimeNs
                    );

                const res = await writeFileWithConfirmOverwrite(
                    doFile,
                    doContent,
                    pickedUnit.unit.entity + '.do'
                );

                if(res)
                {
                    vscode.window.showInformationMessage( 'questasim.do generated' );
                }
            }
        );

    context.subscriptions.push(command);
}