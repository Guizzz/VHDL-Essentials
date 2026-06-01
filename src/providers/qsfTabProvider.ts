import * as vscode from 'vscode';
import { getQuestaFile, getSettingsFile, getWorkspace } from '../quartus/quartusProject';
import { parseQsf, ProjectInfo } from '../parsers/qsfParser';
import { scanSimulationUnits } from '../utils/simulationScanner';
import { PinAssignment } from '../types/types';

export class QsfProvider implements vscode.TreeDataProvider<vscode.TreeItem> {

    private _onDidChangeTreeData = new vscode.EventEmitter<void>();
    readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

    private qsfData: ProjectInfo | undefined;
    private questaFiles : vscode.Uri[] = [];
    private testBenchFiles : vscode.Uri[] = [];
    private loading = false;

    async loadData() 
    {    
        if (this.loading) {return;}
        this.loading = true;

        const workspace = getWorkspace();
        if (!workspace) {return;}

        try 
        {   
            this.questaFiles = await getQuestaFile();
            this.testBenchFiles = (await scanSimulationUnits(workspace)).map(i => i.uriFile);

            const file = await getSettingsFile();

            if (!file) {
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

    refresh() {
        this._onDidChangeTreeData.fire(undefined);
    }

    getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: vscode.TreeItem): vscode.TreeItem[] {

        if (this.loading) {
            return [new vscode.TreeItem("Loading QSF...")];
        }

        if (!this.qsfData) {
            return [new vscode.TreeItem("No QSF loaded")];
        }

        if (!element) {

            const items: vscode.TreeItem[] = [];

            if (this.qsfData.family) {
                const familyItem = new vscode.TreeItem("FAMILY");
                familyItem.description = this.qsfData.family;
                familyItem.iconPath = new vscode.ThemeIcon("chip");
                items.push(familyItem);
            }

            if (this.qsfData.device) {
                const deviceItem = new vscode.TreeItem("DEVICE");
                deviceItem.description = this.qsfData.device;
                deviceItem.iconPath = new vscode.ThemeIcon("circuit-board");
                items.push(deviceItem);
            }

            if (this.qsfData.topLevel) {
                const relativePath = vscode.workspace.asRelativePath(this.qsfData.topLevel.path);

                const deviceItem = new vscode.TreeItem("TOP LEVEL");
                
                deviceItem.description = relativePath;
                deviceItem.resourceUri = this.qsfData.topLevel.path;
                deviceItem.iconPath = new vscode.ThemeIcon("home");
                deviceItem.command = {
                    command: "vscode.open",
                    title: "Open File",
                    arguments: [this.qsfData.topLevel.path]
                };
                items.push(deviceItem);
            }

            if (this.qsfData.outputFolder) {
                const deviceItem = new vscode.TreeItem("OUTPUT DIR");
                deviceItem.description = this.qsfData.outputFolder;
                deviceItem.iconPath = new vscode.ThemeIcon("rocket");
                items.push(deviceItem);
            }

            const questaSimScripts = new vscode.TreeItem(
                "Questasim scripts",
                vscode.TreeItemCollapsibleState.Expanded
            );
            questaSimScripts.iconPath = new vscode.ThemeIcon("pulse");
            items.push(questaSimScripts);

            const testBenches = new vscode.TreeItem(
                "Testbenches Files",
                vscode.TreeItemCollapsibleState.Expanded
            );
            testBenches.iconPath = new vscode.ThemeIcon("beaker");
            items.push(testBenches);
            
            const pinHeader = new vscode.TreeItem(
                "Pin Assignments",
                vscode.TreeItemCollapsibleState.Expanded
            );
            pinHeader.iconPath = new vscode.ThemeIcon("pin");
            items.push(pinHeader);

            return items;
        }

        if (element.label === "Pin Assignments") 
        {
            return this.qsfData.pins.map((p: PinAssignment) => {
                const item = new vscode.TreeItem(p.signal);
                item.description = p.pin;
                return item;
            });
        }

        if (element.label === "Testbenches Files") 
        {
            return this.testBenchFiles.map((uri: vscode.Uri) => {
                const relativePath = vscode.workspace.asRelativePath(uri);
                const item = new vscode.TreeItem(
                    relativePath,
                    vscode.TreeItemCollapsibleState.None
                );
                item.resourceUri = uri;
                item.command = {
                    command: "quartus-assistant.generateDo",
                    title: "Generate Questasim .do file",
                    arguments: [relativePath]
                };
                return item;
            });
        }

        if (element.label === "Questasim scripts") 
        {
            return this.questaFiles.map((uri: vscode.Uri) => {

                const relativePath = vscode.workspace.asRelativePath(uri);

                const item = new vscode.TreeItem(
                    relativePath,
                    vscode.TreeItemCollapsibleState.None
                );

                item.resourceUri = uri;

                item.command = {
                    command: "quartus-assistant.runDo",
                    title: "Run Simulation",
                    arguments: [relativePath]
                };

                return item;
            });
        }

        return [];
    }
}