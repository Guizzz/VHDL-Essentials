import * as vscode from 'vscode';
import * as path from 'path';

import { spawn } from 'child_process';

import { QuartusLogger, quartusOutput, TranscriptWatcher, transcriptOutput } from './logger';

import {
    getProjectDir,
    getProjectName
} from './quartusProject';

import { getQuartusBin, getQuestaPath } from './quartusConfig';
import { taskStatus } from '../ui/statusBar';

const logger = new QuartusLogger(quartusOutput);

export interface QuartusTaskOptions 
{
    command: string;
    tool: string;
    args: string[];

    statusRunning: string;
    statusSuccess: string;
    statusFail: string;

    successMessage: (project: string) => string;
    failMessage: (project: string) => string;
}

export interface QuestaSimOption
{
    doFile: string
    projectName: string
    label: string
}

export async function runQuartusTask(options: QuartusTaskOptions) 
{
    const [projectName, projectDir] = await Promise.all([
        getProjectName(),
        getProjectDir()
    ]);

    if (!projectName || !projectDir) {
        vscode.window.showErrorMessage('No Quartus project found');
        return;
    }

    const binPath = getQuartusBin(options.tool);

    if (!binPath) {
        vscode.window.showErrorMessage('Quartus path not configured or invalid');
        return;
    }

    taskStatus.text = `$(sync~spin) ${options.statusRunning}`;
    quartusOutput.show(true);

    const executable = path.join(binPath, options.command);

    logger.startTask(projectName, options.statusRunning.replace('...', ''));

    let proc;

    try {
        proc = spawn(
            executable,
            options.args,
            {
                cwd: projectDir,
                env: {
                    ...process.env,
                    PATH: `${binPath};${process.env.PATH}`
                }
            }
        );
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        vscode.window.showErrorMessage(`Failed to start ${options.command}: ${msg}`);
        taskStatus.text = `$(error) ${options.statusFail}`;
        return;
    }

    proc.stdout.on('data', d => {
        logger.parseChunk(d.toString());
    });

    proc.stderr.on('data', d => {
        logger.parseChunk(d.toString());
    });

    proc.on('error', err => {
        vscode.window.showErrorMessage(`Failed to start ${options.command}: ${err.message}`);
        taskStatus.text = `$(error) ${options.statusFail}`;
    });

    proc.on('close', code => {

        const success = code === 0;
        logger.finishBuild(success);

        if (success) {
            taskStatus.text = `$(check) ${options.statusSuccess}`;
            vscode.window.showInformationMessage(options.successMessage(projectName));
        } else {
            taskStatus.text = `$(error) ${options.statusFail}`;
            vscode.window.showErrorMessage(options.failMessage(projectName));
        }
    });
}

export async function runSimulation(options: QuestaSimOption) {
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0].uri.fsPath;

    if (!workspaceRoot) {
        vscode.window.showErrorMessage("No workspace open");
        return;
    }

    taskStatus.text = `$(sync~spin) Starting Simulation...`;

    logger.startTask(options.projectName, 'Starting Simulation');

    const proc = spawn(
        getQuestaPath(),
        ["-gui", "-do", options.doFile],
        {
            cwd: workspaceRoot,
            detached: true,
            stdio: "ignore"
        }
    );

    const watcher = new TranscriptWatcher();

    proc.on("spawn", () => {
        logger.appendLine("🧪 Simulation started 🔬");
        transcriptOutput.show(true);
        watcher.start(workspaceRoot);
    });

    proc.on('error', err => {
        vscode.window.showErrorMessage(`Failed to start vsim: ${err.message}`);
        taskStatus.text = `$(error) Simulation Error`;
    });

    proc.on('close', code => {
        watcher.stop();

        const success = code === 0;

        if (success) {
            taskStatus.text = `$(check) Simulation complete`;
            vscode.window.showInformationMessage(`${options.projectName}: Simulation complete for ${options.label}`);
        } else {
            taskStatus.text = `$(error) Simulation Error`;
            vscode.window.showErrorMessage(`${options.projectName}: Simulation fail for ${options.label}`);
        }
    });
}