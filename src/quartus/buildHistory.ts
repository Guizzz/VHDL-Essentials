import * as vscode from 'vscode';
import { FitSummaryEntry } from '../types/types';

export interface BuildSnapshot
{
    timestamp: number;
    status?: string;
    entries: FitSummaryEntry[];
}

export interface ResourceUsageEntry extends FitSummaryEntry
{
    delta: number | undefined;
}

export const MAX_BUILD_HISTORY = 20;

const HISTORY_KEY = 'quartus-assistant.buildHistory';

export function recordSnapshot(
    history: BuildSnapshot[],
    snapshot: BuildSnapshot
): BuildSnapshot[]
{
    const others = history.filter(s => s.timestamp !== snapshot.timestamp);

    return [...others, snapshot]
        .sort((a, b) => a.timestamp - b.timestamp)
        .slice(-MAX_BUILD_HISTORY);
}

export function withDeltas(
    current: BuildSnapshot,
    previous: BuildSnapshot | undefined
): ResourceUsageEntry[]
{
    return current.entries.map(e =>
    {
        const prev = previous?.entries.find(p => p.label === e.label);

        return { ...e, delta: prev ? e.used - prev.used : undefined };
    });
}

export function renderBar(percent: number): string
{
    const clamped = Math.max(0, Math.min(100, percent));
    const filled = Math.round(clamped / 12.5);

    return '█'.repeat(filled) + '░'.repeat(8 - filled);
}

export function formatDelta(delta: number | undefined): string
{
    if (delta === undefined) { return ''; }
    if (delta === 0) { return '±0'; }

    return delta > 0 ? `+${delta}` : `${delta}`;
}

export function usageSeverity(percent: number): 'error' | 'warning' | 'check'
{
    if (percent >= 90) { return 'error'; }
    if (percent >= 70) { return 'warning'; }

    return 'check';
}

export function usageColor(percent: number): string
{
    if (percent >= 90) { return 'charts.red'; }
    if (percent >= 70) { return 'charts.orange'; }

    return 'charts.green';
}

type HistoryMap = Record<string, BuildSnapshot[]>;

export class BuildHistoryStore
{
    constructor(private state: vscode.Memento)
    {
    }

    getHistory(projectKey: string): BuildSnapshot[]
    {
        return this.read()[projectKey] ?? [];
    }

    append(projectKey: string, snapshot: BuildSnapshot): BuildSnapshot[]
    {
        const map = this.read();
        const history = recordSnapshot(map[projectKey] ?? [], snapshot);

        map[projectKey] = history;
        void this.state.update(HISTORY_KEY, map);

        return history;
    }

    private read(): HistoryMap
    {
        return this.state.get<HistoryMap>(HISTORY_KEY) ?? {};
    }
}
