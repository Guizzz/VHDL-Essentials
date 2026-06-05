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
            item.resourceUri = p.location.uri;
            item.iconPath = new vscode.ThemeIcon('plug', new vscode.ThemeColor('charts.blue'));
            item.command = {
                command: 'vscode.open',
                title: 'Open Pin Assignment',
                arguments: [
                    p.location.uri,
                    {
                        selection: new vscode.Range(
                            p.location.range.start,
                            p.location.range.start
                        )
                    }
                ]
            };
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
            item.contextValue = 'testbench';
            item.command = {
                command: 'vscode.open',
                title: 'Open File',
                arguments: [uri]
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
            item.contextValue = 'questascript';
            item.command = {
                command: 'vscode.open',
                title: 'Open File',
                arguments: [uri]
            };
            return item;
        });
    }
}
