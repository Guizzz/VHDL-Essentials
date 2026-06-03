import * as vscode from 'vscode';
import { getQuestaFile, getSettingsFile, getWorkspace } from '../quartus/quartusProject';
import { parseQsf, ProjectInfo } from '../parsers/qsfParser';
import { scanSimulationUnits } from '../utils/simulationScanner';
import { PinAssignmentsNode, TestBenchesNode, QuestaScriptsNode } from './treeNodes';

export class QsfProvider implements vscode.TreeDataProvider<vscode.TreeItem>
{
    private _onDidChangeTreeData = new vscode.EventEmitter<void>();
    readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

    private qsfData: ProjectInfo | undefined;
    private questaFiles: vscode.Uri[] = [];
    private testBenchFiles: vscode.Uri[] = [];
    private loading = false;

    async loadData()
    {
        if (this.loading) { return; }
        this.loading = true;

        const workspace = getWorkspace();
        if (!workspace) { return; }

        try
        {
            this.questaFiles = await getQuestaFile();
            this.testBenchFiles = (await scanSimulationUnits(workspace)).map(i => i.uriFile);

            const file = await getSettingsFile();

            if (!file)
            {
                this.qsfData = undefined;
                this.refresh();
                return;
            }

            this.qsfData = await parseQsf(file);
            this.refresh();
        }
        finally
        {
            this.loading = false;
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

            items.push(new QuestaScriptsNode(this.questaFiles));
            items.push(new TestBenchesNode(this.testBenchFiles));
            items.push(new PinAssignmentsNode(this.qsfData.pins));

            return items;
        }

        if (element instanceof PinAssignmentsNode) { return element.getChildren(); }
        if (element instanceof TestBenchesNode) { return element.getChildren(); }
        if (element instanceof QuestaScriptsNode) { return element.getChildren(); }

        return [];
    }
}