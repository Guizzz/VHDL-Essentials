import * as vscode from 'vscode';

import {scanSimulationUnits} from '../utils/simulationScanner';
import { generateDoFile } from '../utils/doGenerator';
import { getWorkspace } from '../quartus/quartusProject';

async function writeFileWithConfirmOverwrite( uri: vscode.Uri, content: string, fileLabel?: string ): Promise<boolean> 
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
        return true; // scritto
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
    return true; // written
}

export function registerGenSimulationUnit(context: vscode.ExtensionContext) 
{
    const command = vscode.commands.registerCommand(
            'quartus-assistant.generateDo',
            async (file?: string) => {

                const workspace = getWorkspace();
                if (!workspace) {return;}


                const units = await scanSimulationUnits( workspace );

                if (units.length === 0) {
                    vscode.window.showErrorMessage( 'No simulation unit found' );
                    return;
                }

                // file passed from command → try auto-match
                let pickedUnit;

                if (file) 
                {
                    const matches = units.filter(unit => unit.file === file );

                    if (matches.length === 1) {
                        pickedUnit = {
                            label: matches[0].entity,
                            detail: matches[0].file,
                            unit: matches[0]
                        };
                    } 
                    else if (matches.length > 1) 
                    {
                        // ambiguity → fallback to UI picker
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

                // normal fallback (no file or no match)
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