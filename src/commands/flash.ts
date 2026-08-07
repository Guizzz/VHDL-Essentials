import * as vscode from 'vscode';
import * as path from 'path';
import { getProjectName, getProjectDir, getSettingsFile } from '../quartus/quartusProject';
import { runQuartusTask } from '../quartus/quartusRunner';
import { parseQsfText } from '../parsers/qsfParser';

export interface FlashCandidate
{
    file: string;
    extension: 'sof' | 'pof';
}

export function findFlashCandidates(
    projectName: string,
    outputDir: string,
    entries: string[]
): FlashCandidate[]
{
    const base = projectName.toLowerCase();
    const relDir = outputDir.replace(/\\/g, '/').replace(/\/+$/, '');
    const candidates: FlashCandidate[] = [];

    for (const entry of entries)
    {
        const name = entry.toLowerCase();

        if (name === `${base}.sof`)
        {
            candidates.push({ file: `${relDir}/${entry}`, extension: 'sof' });
        }
        else if (name === `${base}.pof`)
        {
            candidates.push({ file: `${relDir}/${entry}`, extension: 'pof' });
        }
    }

    return candidates;
}

export function buildFlashArgs(candidate: FlashCandidate): string[]
{
    return ['-m', 'jtag', '-o', `p;${candidate.file}`];
}

export function isProgrammerError(text: string): boolean
{
    return /\(error\)/i.test(text);
}

export function registerFlashCommand(context: vscode.ExtensionContext)
{
    const command = vscode.commands.registerCommand(
                        'quartus-assistant.flash',
                        async () => {

                            const [projectName, projectDir] = await Promise.all([
                                getProjectName(),
                                getProjectDir()
                            ]);

                            if (!projectName || !projectDir) {return;}

                            const candidate = await resolveFlashTarget(projectName, projectDir);

                            if (!candidate) {return;}

                            let programError = false;

                            await runQuartusTask({
                                command: 'quartus_pgm',
                                tool: 'qprogrammer',
                                args: buildFlashArgs(candidate),

                                statusRunning: 'Flashing...',
                                statusSuccess: 'Flash OK',
                                statusFail: 'Flash failed',

                                successMessage: p =>
                                    `Flash complete: ${p}`,

                                failMessage: p =>
                                    `Flash failed: ${p}`,

                                onMessage: msg =>
                                {
                                    if (isProgrammerError(msg.text)) { programError = true; }
                                }
                            });

                            if (programError)
                            {
                                vscode.window.showErrorMessage(
                                    `Flash failed: ${projectName} — quartus_pgm reported an error`
                                );
                            }
                        }
                    );

    context.subscriptions.push(command);
}

async function resolveFlashTarget(projectName: string, projectDir: string): Promise<FlashCandidate | null>
{
    const outputDir = await getProjectOutputDir();
    const outputPath = path.join(projectDir, outputDir);

    let entries: string[];

    try
    {
        entries = (await vscode.workspace.fs.readDirectory(vscode.Uri.file(outputPath)))
            .map(([name]) => name);
    }
    catch
    {
        vscode.window.showErrorMessage(`Output directory not found: ${outputPath}`);
        return null;
    }

    const candidates = findFlashCandidates(projectName, outputDir, entries);

    if (candidates.length === 0)
    {
        vscode.window.showErrorMessage(`No ${projectName}.sof or ${projectName}.pof found in ${outputPath}`);
        return null;
    }

    if (candidates.length === 1) { return candidates[0]; }

    const chosen = await vscode.window.showQuickPick(
        candidates.map(c => c.file),
        { placeHolder: 'Multiple programming files found — choose one' }
    );

    return candidates.find(c => c.file === chosen) ?? null;
}

async function getProjectOutputDir(): Promise<string>
{
    const settingsFile = await getSettingsFile();

    if (!settingsFile) { return 'output_files'; }

    try
    {
        const content = Buffer.from(await vscode.workspace.fs.readFile(settingsFile)).toString('utf-8');

        const raw = parseQsfText(content).outputFolder;

        if (!raw) { return 'output_files'; }

        return raw.replace(/^"|"$/g, '').trim() || 'output_files';
    }
    catch
    {
        return 'output_files';
    }
}
