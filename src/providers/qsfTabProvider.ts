import * as vscode from 'vscode';
import * as path from 'path';
import { getProjectFile, getQuestaFile, getSettingsFile, getWorkspace } from '../quartus/quartusProject';
import { parseQsf, ProjectInfo } from '../parsers/qsfParser';
import { parseFitSummary } from '../parsers/fitSummaryParser';
import { FitSummaryData } from '../types/types';
import { scanSimulationUnits } from '../utils/simulationScanner';
import { FitSummaryNode, PinAssignmentsNode, TestBenchesNode, QuestaScriptsNode } from './treeNodes';

export interface QsfProviderDeps
{
    getWorkspace(): vscode.Uri | undefined;
    getQuestaFile(): Promise<vscode.Uri[]>;
    getSettingsFile(): Promise<vscode.Uri | undefined>;
    parseQsf(file: vscode.Uri): Promise<ProjectInfo>;
    scanSimulationUnits(workspace: vscode.Uri): Promise<Array<{ uriFile: vscode.Uri }>>;
    getProjectFile(): Promise<vscode.Uri | undefined>;
    parseFitSummary(uri: vscode.Uri): Promise<FitSummaryData>;
}

export function createDefaultQsfProviderDeps(): QsfProviderDeps
{
    return {
        getWorkspace,
        getQuestaFile,
        getSettingsFile,
        parseQsf,
        scanSimulationUnits,
        getProjectFile,
        parseFitSummary
    };
}

export class QsfProvider implements vscode.TreeDataProvider<vscode.TreeItem>
{
    private _onDidChangeTreeData = new vscode.EventEmitter<void>();
    readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

    private deps: QsfProviderDeps;

    private qsfData: ProjectInfo | undefined;
    private fitSummaryData: FitSummaryData | undefined;
    private questaFiles: vscode.Uri[] = [];
    private testBenchFiles: vscode.Uri[] = [];
    private loading = false;

    constructor(deps?: QsfProviderDeps)
    {
        this.deps = deps ?? createDefaultQsfProviderDeps();
    }

    async loadData()
    {
        if (this.loading) { return; }
        this.loading = true;

        try
        {
            const workspace = this.deps.getWorkspace();

            if (workspace)
            {
                this.questaFiles = await this.deps.getQuestaFile();
                this.testBenchFiles = (await this.deps.scanSimulationUnits(workspace)).map(i => i.uriFile);

                const file = await this.deps.getSettingsFile();

                if (file)
                {
                    this.qsfData = await this.deps.parseQsf(file);
                    await this.loadFitSummary();
                }
                else
                {
                    this.qsfData = undefined;
                    this.fitSummaryData = undefined;
                }
            }
            else
            {
                this.qsfData = undefined;
                this.fitSummaryData = undefined;
                this.questaFiles = [];
                this.testBenchFiles = [];
            }

            this.refresh();
        }
        catch
        {
            this.qsfData = undefined;
            this.fitSummaryData = undefined;
            this.questaFiles = [];
            this.testBenchFiles = [];
            this.refresh();
        }
        finally
        {
            this.loading = false;
        }
    }

    private async loadFitSummary()
    {
        const projectFile = await this.deps.getProjectFile();

        if (!projectFile)
        {
            this.fitSummaryData = undefined;
            return;
        }

        const projectDir = path.dirname(projectFile.fsPath);
        const projectName = path.basename(projectFile.fsPath, '.qpf');
        const fitSummaryPath = path.join(projectDir, 'output_files', `${projectName}.fit.summary`);
        const fitSummaryUri = vscode.Uri.file(fitSummaryPath);

        try
        {
            await vscode.workspace.fs.stat(fitSummaryUri);
            this.fitSummaryData = await this.deps.parseFitSummary(fitSummaryUri);
        }
        catch
        {
            this.fitSummaryData = undefined;
        }
    }

    refresh()
    {
        this._onDidChangeTreeData.fire(undefined);
    }

    getTreeItem(element: vscode.TreeItem): vscode.TreeItem
    {
        return element;
    }

    getChildren(element?: vscode.TreeItem): vscode.TreeItem[]
    {
        if (this.loading)
        {
            return [new vscode.TreeItem('Loading QSF...')];
        }

        if (!this.qsfData)
        {
            return [new vscode.TreeItem('No QSF loaded')];
        }

        if (!element)
        {
            const items: vscode.TreeItem[] = [];

            if (this.qsfData.family)
            {
                const item = new vscode.TreeItem('FAMILY');
                item.description = this.qsfData.family;
                item.iconPath = new vscode.ThemeIcon('chip');
                items.push(item);
            }

            if (this.qsfData.device)
            {
                const item = new vscode.TreeItem('DEVICE');
                item.description = this.qsfData.device;
                item.iconPath = new vscode.ThemeIcon('circuit-board');
                items.push(item);
            }

            if (this.qsfData.topLevel)
            {
                const relativePath = vscode.workspace.asRelativePath(this.qsfData.topLevel.path);
                const item = new vscode.TreeItem('TOP LEVEL');
                item.description = relativePath;
                item.resourceUri = this.qsfData.topLevel.path;
                item.iconPath = new vscode.ThemeIcon('home');
                item.command = {
                    command: 'vscode.open',
                    title: 'Open File',
                    arguments: [this.qsfData.topLevel.path]
                };
                items.push(item);
            }

            if (this.qsfData.outputFolder)
            {
                const item = new vscode.TreeItem('OUTPUT DIR');
                item.description = this.qsfData.outputFolder;
                item.iconPath = new vscode.ThemeIcon('rocket');
                items.push(item);
            }

            if (this.fitSummaryData)
            {
                items.push(new FitSummaryNode(
                    this.fitSummaryData.entries,
                    this.fitSummaryData.status
                ));
            }

            items.push(new QuestaScriptsNode(this.questaFiles));
            items.push(new TestBenchesNode(this.testBenchFiles));
            items.push(new PinAssignmentsNode(this.qsfData.pins));

            return items;
        }

        if (element instanceof PinAssignmentsNode) { return element.getChildren(); }
        if (element instanceof TestBenchesNode) { return element.getChildren(); }
        if (element instanceof QuestaScriptsNode) { return element.getChildren(); }
        if (element instanceof FitSummaryNode) { return element.getChildren(); }

        return [];
    }
}