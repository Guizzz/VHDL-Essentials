import * as vscode from 'vscode';
import * as path from 'path';
import { getProjectFile } from '../quartus/quartusProject';
import { parseFitSummary } from '../parsers/fitSummaryParser';
import { FitSummaryData } from '../types/types';
import {
    BuildHistoryStore,
    BuildSnapshot,
    ResourceUsageEntry,
    formatDelta,
    renderBar,
    usageColor,
    usageSeverity,
    withDeltas
} from '../quartus/buildHistory';

export interface ResourceUsageDeps
{
    getProjectFile(): Promise<vscode.Uri | undefined>;
    parseFitSummary(uri: vscode.Uri): Promise<FitSummaryData>;
    readMtime(uri: vscode.Uri): Promise<number>;
    store: BuildHistoryStore;
}

export function createDefaultResourceUsageDeps(store: BuildHistoryStore): ResourceUsageDeps
{
    return {
        getProjectFile,
        parseFitSummary,
        readMtime: async uri => (await vscode.workspace.fs.stat(uri)).mtime,
        store
    };
}

export class ResourceUsageProvider implements vscode.TreeDataProvider<vscode.TreeItem>
{
    private _onDidChangeTreeData = new vscode.EventEmitter<void>();
    readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

    private current: BuildSnapshot | undefined;
    private previous: BuildSnapshot | undefined;
    private entries: ResourceUsageEntry[] = [];
    private loading = false;

    constructor(private deps: ResourceUsageDeps)
    {
    }

    async loadData(): Promise<void>
    {
        if (this.loading) { return; }
        this.loading = true;

        try
        {
            const projectFile = await this.deps.getProjectFile();

            if (!projectFile)
            {
                this.reset();
                return;
            }

            const projectDir = path.dirname(projectFile.fsPath);
            const projectName = path.basename(projectFile.fsPath, '.qpf');
            const fitSummaryUri = vscode.Uri.file(
                path.join(projectDir, 'output_files', `${projectName}.fit.summary`)
            );

            const timestamp = await this.deps.readMtime(fitSummaryUri);
            const data = await this.deps.parseFitSummary(fitSummaryUri);
            const snapshot: BuildSnapshot = {
                timestamp,
                status: data.status,
                entries: data.entries
            };

            let history = this.deps.store.getHistory(projectDir);

            if (!history.some(s => s.timestamp === timestamp))
            {
                history = this.deps.store.append(projectDir, snapshot);
            }

            const index = history.findIndex(s => s.timestamp === timestamp);

            this.current = history[index] ?? snapshot;
            this.previous = index > 0 ? history[index - 1] : undefined;
            this.entries = withDeltas(this.current, this.previous);
        }
        catch
        {
            this.reset();
        }
        finally
        {
            this.loading = false;
            this.refresh();
        }
    }

    private reset()
    {
        this.current = undefined;
        this.previous = undefined;
        this.entries = [];
    }

    refresh()
    {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: vscode.TreeItem): vscode.TreeItem
    {
        return element;
    }

    getChildren(element?: vscode.TreeItem): vscode.TreeItem[]
    {
        if (element) { return []; }
        if (!this.current) { return []; }

        const items: vscode.TreeItem[] = [this.createHeaderItem()];

        for (const entry of [...this.entries].sort((a, b) => b.percent - a.percent))
        {
            items.push(this.createEntryItem(entry));
        }

        return items;
    }

    private createHeaderItem(): vscode.TreeItem
    {
        const snapshot = this.current as BuildSnapshot;
        const item = new vscode.TreeItem(
            'Last build',
            vscode.TreeItemCollapsibleState.None
        );

        const status = snapshot.status?.startsWith('Successful')
            ? '$(pass)'
            : '$(error)';
        const delta = this.previous
            ? `· Δ vs ${new Date(this.previous.timestamp).toLocaleString()}`
            : '· first recorded build';

        item.description = `${new Date(snapshot.timestamp).toLocaleString()} ${status} ${delta}`;
        item.iconPath = new vscode.ThemeIcon('history');
        item.tooltip = new vscode.MarkdownString(
            `**Fit status:** ${snapshot.status ?? 'unknown'}\n\n` +
            `**Build:** ${new Date(snapshot.timestamp).toLocaleString()}\n\n` +
            (this.previous
                ? `**Previous build:** ${new Date(this.previous.timestamp).toLocaleString()}`
                : '**Previous build:** none recorded yet')
        );

        return item;
    }

    private createEntryItem(entry: ResourceUsageEntry): vscode.TreeItem
    {
        const item = new vscode.TreeItem(
            entry.label,
            vscode.TreeItemCollapsibleState.None
        );

        const percent = Math.round(entry.percent);
        const delta = formatDelta(entry.delta);

        item.description =
            `${renderBar(percent)} ${percent}% · ${entry.used} / ${entry.total}` +
            (delta ? ` · Δ ${delta}` : '');

        item.iconPath = new vscode.ThemeIcon(
            usageSeverity(percent),
            new vscode.ThemeColor(usageColor(percent))
        );

        item.tooltip = new vscode.MarkdownString(
            `**${entry.label}**\n\n` +
            `Used: ${entry.used} / ${entry.total} (${percent}%)\n\n` +
            `Change since previous build: ${delta || 'n/a'}`
        );

        item.contextValue = 'resourceUsageEntry';

        return item;
    }
}
