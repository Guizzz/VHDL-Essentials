import * as vscode from 'vscode';

import { getWorkspace } from '../quartus/quartusProject';
import { writeFileWithConfirmOverwrite } from '../utils/fileUtils';

const DEVICE_FAMILIES = [
    'MAX 10',
    'Cyclone V',
    'Cyclone IV E',
    'Cyclone 10 LP',
    'Arria V',
    'Arria 10',
    'Stratix V'
];

function generateQpf(projectName: string): string
{
    const now = new Date();
    const time = now.toLocaleTimeString('en-US', { hour12: false });
    const dateStr = now.toLocaleDateString('en-US',
        { month: 'long', day: 'numeric', year: 'numeric' }
    );
    const lines: string[] = [];

    lines.push('QUARTUS_VERSION = "25.1"');
    lines.push(`DATE = "${time}  ${dateStr}"`);
    lines.push('');
    lines.push(`PROJECT_REVISION = "${projectName}"`);

    return lines.join('\n');
}

function generateQsf(
    family: string, device: string, entity: string
): string
{
    const lines: string[] = [];

    lines.push(`set_global_assignment -name FAMILY "${family}"`);
    lines.push(`set_global_assignment -name DEVICE ${device}`);
    lines.push(`set_global_assignment -name TOP_LEVEL_ENTITY ${entity}`);
    lines.push('set_global_assignment -name PROJECT_OUTPUT_DIRECTORY output_files');
    lines.push('');
    lines.push(`set_global_assignment -name VHDL_FILE src/${entity}.vhd`);
    lines.push(`set_global_assignment -name VHDL_FILE test/tb_${entity}.vhd`);
    lines.push('');
    lines.push('set_global_assignment -name EDA_DESIGN_SYNTHESIS_TOOL None');
    lines.push('set_global_assignment -name EDA_SIMULATION_TOOL "QuestaSim"');

    return lines.join('\n');
}

function generateVhdEntity(entity: string): string
{
    const lines: string[] = [];

    lines.push('library ieee;');
    lines.push('use ieee.std_logic_1164.all;');
    lines.push('');
    lines.push(`entity ${entity} is`);
    lines.push('    port (');
    lines.push('');
    lines.push('    );');
    lines.push(`end entity;`);
    lines.push('');
    lines.push(`architecture rtl of ${entity} is`);
    lines.push('');
    lines.push('begin');
    lines.push('');
    lines.push(`end architecture;`);

    return lines.join('\n');
}

function generateTestbench(entity: string): string
{
    const tbEntity = `tb_${entity}`;
    const lines: string[] = [];

    lines.push('library ieee;');
    lines.push('use ieee.std_logic_1164.all;');
    lines.push('');
    lines.push(`entity ${tbEntity} is`);
    lines.push('end entity;');
    lines.push('');
    lines.push(`architecture sim of ${tbEntity} is`);
    lines.push('');
    lines.push('    constant CLK_PERIOD : time := 10 ns;');
    lines.push('');
    lines.push('    signal clk : std_logic := \'0\';');
    lines.push('    signal rst : std_logic := \'0\';');
    lines.push('');
    lines.push('begin');
    lines.push('');
    lines.push('    clk <= not clk after CLK_PERIOD / 2;');
    lines.push('');
    lines.push('    -- rst <= \'1\', \'0\' after 100 ns;');
    lines.push('    --');
    lines.push(`    -- uut : entity work.${entity}`);
    lines.push('    -- port map (');
    lines.push('    -- );');
    lines.push('');
    lines.push(`end architecture;`);

    return lines.join('\n');
}

function generateDoFile(entity: string): string
{
    const lines: string[] = [];

    lines.push('if {[file exists work]} {');
    lines.push('    vdel -all');
    lines.push('}');
    lines.push('');
    lines.push('vlib work');
    lines.push('');
    lines.push(`vcom src/${entity}.vhd`);
    lines.push(`vcom test/tb_${entity}.vhd`);
    lines.push('');
    lines.push(`vsim -voptargs=+acc work.tb_${entity}`);
    lines.push('');
    lines.push('add wave sim:/tb_${entity}/*');
    lines.push('');
    lines.push('run 1 us');
    lines.push('');
    lines.push('wave zoom full');

    return lines.join('\n');
}

function isValidProjectName(name: string): boolean
{
    return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name);
}

export function registerNewProjectCommand(context: vscode.ExtensionContext)
{
    const command = vscode.commands.registerCommand(
        'quartus-assistant.newProject',
        async () => {
            const workspace = getWorkspace();
            if (!workspace) {return;}

            const projectName = await vscode.window.showInputBox({
                title: 'Project name',
                placeHolder: 'e.g. blinky',
                validateInput: (value) => {
                    if (!value || !isValidProjectName(value))
                    {
                        return 'Must be a valid identifier (letters, digits, underscores)';
                    }
                    return null;
                }
            });
            if (!projectName) {return;}

            const familyPick = await vscode.window.showQuickPick(
                [
                    ...DEVICE_FAMILIES.map(f => ({ label: f })),
                    { label: '', kind: vscode.QuickPickItemKind.Separator },
                    { label: 'Altro...', description: 'Enter a custom device family' }
                ],
                {
                    title: 'Device family',
                    placeHolder: 'Select a device family',
                }
            );
            if (!familyPick) {return;}

            let deviceFamily: string;
            if (familyPick.label === 'Altro...')
            {
                const custom = await vscode.window.showInputBox({
                    title: 'Device family',
                    placeHolder: 'e.g. MAX V',
                    validateInput: (value) => {
                        if (!value || value.trim().length === 0)
                        {
                            return 'Device family cannot be empty';
                        }
                        return null;
                    }
                });
                if (!custom) {return;}
                deviceFamily = custom;
            }
            else
            {
                deviceFamily = familyPick.label;
            }

            const partNumber = await vscode.window.showInputBox({
                title: 'Device part number',
                placeHolder: 'e.g. 10M50DAF484C7G',
                validateInput: (value) => {
                    if (!value || value.trim().length === 0)
                    {
                        return 'Part number cannot be empty';
                    }
                    return null;
                }
            });
            if (!partNumber) {return;}

            const entityName = await vscode.window.showInputBox({
                title: 'Top-level entity name',
                value: projectName,
                validateInput: (value) => {
                    if (!value || !isValidProjectName(value))
                    {
                        return 'Must be a valid VHDL identifier (letters, digits, underscores)';
                    }
                    return null;
                }
            });
            if (!entityName) {return;}

            let projectDir = vscode.Uri.joinPath(workspace, projectName);

            for (;;)
            {
                const confirm = await vscode.window.showQuickPick(
                    [
                        { label: '$(check) Create', description: projectDir.fsPath },
                        { label: '$(edit) Change path', description: '' },
                        { label: '$(close) Cancel', description: '' }
                    ],
                    { placeHolder: 'Confirm project location' }
                );
                if (!confirm || confirm.label === '$(close) Cancel') {return;}

                if (confirm.label === '$(check) Create') {break;}

                const newPath = await vscode.window.showInputBox({
                    title: 'Project path',
                    value: projectDir.fsPath,
                    placeHolder: 'Full path to project directory',
                    validateInput: (value) => {
                        if (!value || value.trim().length === 0)
                        {
                            return 'Path cannot be empty';
                        }
                        return null;
                    }
                });
                if (!newPath) {continue;}

                projectDir = vscode.Uri.file(newPath);
            }

            const dirs = ['src', 'test', 'sim'].map(d =>
                vscode.Uri.joinPath(projectDir, d)
            );

            for (const dir of dirs)
            {
                await vscode.workspace.fs.createDirectory(dir);
            }

            const files: { uri: vscode.Uri; content: string; label: string }[] = [
                {
                    uri: vscode.Uri.joinPath(projectDir, `${projectName}.qpf`),
                    content: generateQpf(projectName),
                    label: `${projectName}.qpf`
                },
                {
                    uri: vscode.Uri.joinPath(projectDir, `${projectName}.qsf`),
                    content: generateQsf(deviceFamily, partNumber, entityName),
                    label: `${projectName}.qsf`
                },
                {
                    uri: vscode.Uri.joinPath(projectDir, `src`, `${entityName}.vhd`),
                    content: generateVhdEntity(entityName),
                    label: `${entityName}.vhd`
                },
                {
                    uri: vscode.Uri.joinPath(projectDir, `test`, `tb_${entityName}.vhd`),
                    content: generateTestbench(entityName),
                    label: `tb_${entityName}.vhd`
                },
                {
                    uri: vscode.Uri.joinPath(projectDir, `sim`, `${entityName}.do`),
                    content: generateDoFile(entityName),
                    label: `${entityName}.do`
                }
            ];

            let written = 0;
            for (const f of files)
            {
                const ok = await writeFileWithConfirmOverwrite(f.uri, f.content, f.label);
                if (ok) {written++;}
            }

            vscode.window.showInformationMessage(
                `Project "${projectName}" created (${written}/${files.length} files written)`
            );

            await vscode.commands.executeCommand('vscode.openFolder', projectDir, true);
        }
    );

    context.subscriptions.push(command);
}
