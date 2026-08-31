import * as vscode from 'vscode';
import * as path from 'path';

import { spawn } from 'child_process';
import type {
    ChildProcessWithoutNullStreams,
    SpawnOptionsWithoutStdio
} from 'child_process';

import { QuartusLogger, quartusOutput, TranscriptWatcher, transcriptOutput } from './logger';
import { type QuartusMessage } from './logger/outputParser';

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

    onMessage?: (msg: QuartusMessage) => void;
    onStateChange?: (running: boolean) => void;
    cancellable?: boolean;
}

export interface QuestaSimOption
{
    doFile: string
    projectName: string
    label: string
}

export interface CancellableProcess
{
    kill(): boolean;
}

export class QuartusTaskController
{
    private active = false;
    private cancellable = false;
    private cancellationRequested = false;
    private process: CancellableProcess | undefined;

    acquire(cancellable = false): boolean
    {
        if (this.active) { return false; }

        this.active = true;
        this.cancellable = cancellable;
        this.cancellationRequested = false;
        this.process = undefined;
        return true;
    }

    attach(process: CancellableProcess): void
    {
        this.process = process;

        if (this.cancellationRequested)
        {
            process.kill();
        }
    }

    cancel(): boolean
    {
        if (!this.active || !this.cancellable) { return false; }

        this.cancellationRequested = true;
        this.process?.kill();
        return true;
    }

    isCancellationRequested(): boolean
    {
        return this.cancellationRequested;
    }

    isActive(): boolean
    {
        return this.active;
    }

    release(): void
    {
        this.active = false;
        this.cancellable = false;
        this.cancellationRequested = false;
        this.process = undefined;
    }
}

type SpawnProcess = (
    command: string,
    args: readonly string[],
    options: SpawnOptionsWithoutStdio
) => ChildProcessWithoutNullStreams;

const quartusTaskController = new QuartusTaskController();

export function buildRunEnv(binPath: string, env: NodeJS.ProcessEnv): NodeJS.ProcessEnv
{
    return {
        ...env,
        PATH: `${binPath}${path.delimiter}${env.PATH ?? ''}`
    };
}

export async function runQuartusTask(
    options: QuartusTaskOptions,
    spawnProcess: SpawnProcess = spawn
): Promise<number | null>
{
    if (!quartusTaskController.acquire(options.cancellable))
    {
        vscode.window.showWarningMessage('A Quartus task is already running');
        return null;
    }

    let taskStarted = false;

    try
    {
        const [projectName, projectDir] = await Promise.all([
            getProjectName(),
            getProjectDir()
        ]);

        if (!projectName || !projectDir)
        {
            vscode.window.showErrorMessage('No Quartus project found');
            return null;
        }

        const binPath = getQuartusBin(options.tool);

        if (!binPath)
        {
            vscode.window.showErrorMessage('Quartus path not configured or invalid');
            return null;
        }

        if (quartusTaskController.isCancellationRequested()) { return null; }

        taskStarted = true;
        options.onStateChange?.(true);
        taskStatus.text = `$(sync~spin) ${options.statusRunning}`;
        quartusOutput.show(true);

        const executable = path.join(binPath, options.command);

        logger.startTask(projectName, options.statusRunning.replace('...', ''));

        let proc: ChildProcessWithoutNullStreams;

        try
        {
            proc = spawnProcess(
                executable,
                options.args,
                {
                    cwd: projectDir,
                    env: buildRunEnv(binPath, process.env)
                }
            );
        }
        catch (err)
        {
            const msg = err instanceof Error ? err.message : String(err);
            vscode.window.showErrorMessage(`Failed to start ${options.command}: ${msg}`);
            taskStatus.text = `$(error) ${options.statusFail}`;
            return null;
        }

        quartusTaskController.attach(proc);

        const onMsg = options.onMessage;

        proc.stdout.on('data', d => {
            logger.parseChunk(d.toString(), onMsg);
        });

        proc.stderr.on('data', d => {
            logger.parseChunk(d.toString(), onMsg);
        });

        return await new Promise<number | null>(resolve =>
        {
            let settled = false;

            const finish = (code: number | null): void =>
            {
                if (settled) { return; }

                settled = true;
                const cancelled = quartusTaskController.isCancellationRequested();
                logger.finishBuild(code === 0, cancelled);

                if (cancelled)
                {
                    taskStatus.text = `$(close) ${options.statusRunning.replace('...', '')} cancelled`;
                    vscode.window.showInformationMessage(`${projectName}: task cancelled`);
                } else if (code === 0) {
                    taskStatus.text = `$(check) ${options.statusSuccess}`;
                    vscode.window.showInformationMessage(options.successMessage(projectName));
                } else {
                    taskStatus.text = `$(error) ${options.statusFail}`;
                    vscode.window.showErrorMessage(options.failMessage(projectName));
                }

                resolve(code);
            };

            proc.on('error', () =>
            {
                finish(null);
            });

            proc.on('close', code => finish(code));
        });
    }
    finally
    {
        quartusTaskController.release();

        if (taskStarted)
        {
            options.onStateChange?.(false);
        }
    }
}

export function cancelQuartusTask(): boolean
{
    return quartusTaskController.cancel();
}

export function isQuartusTaskRunning(): boolean
{
    return quartusTaskController.isActive();
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
