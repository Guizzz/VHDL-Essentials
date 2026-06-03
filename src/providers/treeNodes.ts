import * as vscode from 'vscode';
import { PinAssignment } from '../types/types';

export class PinAssignmentsNode extends vscode.TreeItem
{
    constructor(
        public pins: PinAssignment[]
    )
    {
        super('Pin Assignments', vscode.TreeItemCollapsibleState.Expanded);
        this.iconPath = new vscode.ThemeIcon('pin');
    }

    getChildren(): vscode.TreeItem[]
    {
        return this.pins.map(p =>
        {
            const item = new vscode.TreeItem(p.signal);
            item.description = p.pin;
            return item;
        });
    }
}

export class TestBenchesNode extends vscode.TreeItem
{
    constructor(
        public uris: vscode.Uri[]
    )
    {
        super('Testbenches Files', vscode.TreeItemCollapsibleState.Expanded);
        this.iconPath = new vscode.ThemeIcon('beaker');
    }

    getChildren(): vscode.TreeItem[]
    {
        return this.uris.map(uri =>
        {
            const relativePath = vscode.workspace.asRelativePath(uri);
            const item = new vscode.TreeItem(relativePath, vscode.TreeItemCollapsibleState.None);
            item.resourceUri = uri;
            item.command = {
                command: 'quartus-assistant.generateDo',
                title: 'Generate Questasim .do file',
                arguments: [relativePath]
            };
            return item;
        });
    }
}

export class QuestaScriptsNode extends vscode.TreeItem
{
    constructor(
        public uris: vscode.Uri[]
    )
    {
        super('Questasim scripts', vscode.TreeItemCollapsibleState.Expanded);
        this.iconPath = new vscode.ThemeIcon('pulse');
    }

    getChildren(): vscode.TreeItem[]
    {
        return this.uris.map(uri =>
        {
            const relativePath = vscode.workspace.asRelativePath(uri);
            const item = new vscode.TreeItem(relativePath, vscode.TreeItemCollapsibleState.None);
            item.resourceUri = uri;
            item.command = {
                command: 'quartus-assistant.runDo',
                title: 'Run Simulation',
                arguments: [relativePath]
            };
            return item;
        });
    }
}
