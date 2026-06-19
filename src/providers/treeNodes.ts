import * as vscode from 'vscode';
import { FitSummaryEntry, PinAssignment } from '../types/types';

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

export class FitSummaryNode extends vscode.TreeItem
{
    constructor(
        public entries: FitSummaryEntry[],
        public fitStatus?: string
    )
    {
        super('Fit Summary', vscode.TreeItemCollapsibleState.Expanded);
        this.iconPath = new vscode.ThemeIcon('dashboard');

        if (fitStatus)
        {
            const isSuccess = fitStatus.startsWith('Successful');
            this.description = isSuccess ? '$(pass)' : '$(error)';
        }
    }

    getChildren(): vscode.TreeItem[]
    {
        const sorted = [...this.entries].sort((a, b) => b.percent - a.percent);

        return sorted.map(e =>
        {
            const item = new vscode.TreeItem(e.label, vscode.TreeItemCollapsibleState.None);
            item.description = `${e.used} / ${e.total} (${e.percent}%)`;

            let icon: string;
            let color: vscode.ThemeColor;

            if (e.percent >= 90)
            {
                icon = 'error';
                color = new vscode.ThemeColor('charts.red');
            }
            else if (e.percent >= 70)
            {
                icon = 'warning';
                color = new vscode.ThemeColor('charts.orange');
            }
            else
            {
                icon = 'check';
                color = new vscode.ThemeColor('charts.green');
            }

            item.iconPath = new vscode.ThemeIcon(icon, color);
            return item;
        });
    }
}
