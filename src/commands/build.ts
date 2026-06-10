import * as vscode from 'vscode';
import * as path from 'path';

import { runQuartusTask }
from '../quartus/quartusRunner';
import { getProjectName, getProjectDir } from '../quartus/quartusProject';
import { QuartusCompileLinter } from '../lint/quartusCompileLint';
import { parseQuartusError, type QuartusCompileError } from '../utils/quartusErrorParser';

function makeTextClickable(text: string, fileName: string, absPath: string): string
{
    const escaped = fileName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const fileRef = new RegExp(`${escaped}\\((\\d+)(?:,(\\d+))?\\)`);

    return text.replace(fileRef, (_, line, col) =>
        col
            ? `${absPath}(${line},${col})`
            : `${absPath}(${line})`
    );
}

export function registerBuildCommand(context: vscode.ExtensionContext)
{
    const linter = new QuartusCompileLinter();
    context.subscriptions.push(linter);

    const command = vscode.commands.registerCommand(
                        'quartus-assistant.build',
                        async () => {
                            const projectName = await getProjectName();

                            if (!projectName) {
                                vscode.window.showErrorMessage("No Quartus .qpf project found");
                                return;
                            }

                            const projectDir = await getProjectDir();

                            if (!projectDir) {
                                vscode.window.showErrorMessage("No Quartus project directory found");
                                return;
                            }

                            // Build a map of basename → full path by scanning the project
                            const vhdFiles = await vscode.workspace.findFiles(
                                new vscode.RelativePattern(projectDir, '**/*.vhd')
                            );
                            const fileMap = new Map<string, vscode.Uri>();

                            for (const uri of vhdFiles)
                            {
                                const existing = fileMap.get(path.basename(uri.fsPath));

                                if (!existing)
                                {
                                    fileMap.set(path.basename(uri.fsPath), uri);
                                }
                            }

                            linter.clearCompileErrors();

                            const errors: QuartusCompileError[] = [];

                            await runQuartusTask({
                                command: 'quartus_sh',
                                tool: 'quartus',
                                args: ['--flow', 'compile', projectName],

                                statusRunning: 'Building...',
                                statusSuccess: 'Build OK',
                                statusFail: 'Build failed',

                                successMessage: p =>
                                    `Build complete: ${p}`,

                                failMessage: p =>
                                    `Build failed: ${p}`,

                                onMessage: msg => {
                                    const err = parseQuartusError(msg, projectDir);
                                    if (err) {
                                        const actualUri =
                                            fileMap.get(err.fileName) ?? err.uri;

                                        msg.text = makeTextClickable(
                                            msg.text,
                                            err.fileName,
                                            actualUri.fsPath
                                        );
                                        err.uri = actualUri;
                                        err.message = msg.text;
                                        errors.push(err);
                                    }
                                }
                            });

                            linter.setCompileErrors(errors);
                        }
                    );

    context.subscriptions.push(command);
}