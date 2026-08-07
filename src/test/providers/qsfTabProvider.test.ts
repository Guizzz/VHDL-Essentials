import * as assert from 'node:assert';
import * as vscode from 'vscode';
import { QsfProvider, QsfProviderDeps } from '../../providers/qsfTabProvider';
import { ProjectInfo } from '../../parsers/qsfParser';

function makeQsf(overrides: Partial<ProjectInfo> = {}): ProjectInfo
{
    return { pins: [], ...overrides };
}

function makeDeps(overrides: Partial<QsfProviderDeps> = {}): QsfProviderDeps
{
    return {
        getWorkspace: () => vscode.Uri.file('fake-workspace'),
        getQuestaFile: async () => [],
        getSettingsFile: async () => vscode.Uri.file('fake.qsf'),
        parseQsf: async () => makeQsf(),
        scanSimulationUnits: async () => [],
        getProjectFile: async () => vscode.Uri.file('fake.qpf'),
        parseFitSummary: async () => ({ status: 'success', entries: [] }),
        ...overrides
    };
}

function isLoading(provider: QsfProvider): boolean
{
    return provider.getChildren().some(i => i.label === 'Loading QSF...');
}

function isEmptyState(provider: QsfProvider): boolean
{
    return provider.getChildren().some(i => i.label === 'No QSF loaded');
}

suite('qsfTabProvider', () =>
{
    test('loadData with no workspace leaves the tree on the empty state', async () =>
    {
        const provider = new QsfProvider(makeDeps({
            getWorkspace: () => undefined
        }));

        await provider.loadData();

        assert.strictEqual(isLoading(provider), false, 'Tree must never stay on Loading');
        assert.strictEqual(isEmptyState(provider), true);
    });

    test('loadData without a settings file leaves the tree on the empty state', async () =>
    {
        const provider = new QsfProvider(makeDeps({
            getSettingsFile: async () => undefined
        }));

        await provider.loadData();

        assert.strictEqual(isLoading(provider), false);
        assert.strictEqual(isEmptyState(provider), true);
    });

    test('loadData with a valid QSF populates the tree', async () =>
    {
        const provider = new QsfProvider(makeDeps({
            parseQsf: async () => makeQsf({ family: 'MAX 10' })
        }));

        await provider.loadData();

        assert.strictEqual(isLoading(provider), false);
        const children = provider.getChildren();
        assert.ok(children.some(i => i.label === 'FAMILY'));
        assert.ok(children.some(i => i.label === 'Pin Assignments'));
    });

    test('loadData with a malformed QSF recovers to the empty state', async () =>
    {
        const provider = new QsfProvider(makeDeps({
            parseQsf: async () => { throw new Error('unreadable qsf'); }
        }));

        await provider.loadData();

        assert.strictEqual(isLoading(provider), false);
        assert.strictEqual(isEmptyState(provider), true);
    });

    test('loadData when a dependency rejects recovers to the empty state', async () =>
    {
        const provider = new QsfProvider(makeDeps({
            getSettingsFile: async () => { throw new Error('boom'); }
        }));

        await provider.loadData();

        assert.strictEqual(isLoading(provider), false);
        assert.strictEqual(isEmptyState(provider), true);
    });

    test('a second loadData call while loading is a no-op', async () =>
    {
        let resolveGate!: () => void;
        const gate = new Promise<void>(res => { resolveGate = res; });

        const provider = new QsfProvider(makeDeps({
            getSettingsFile: () => gate.then(() => vscode.Uri.file('fake.qsf'))
        }));

        let first: Promise<void> | undefined;
        try
        {
            first = provider.loadData();

            let secondSettled = false;
            const second = provider.loadData().then(() => { secondSettled = true; });

            await Promise.race([
                second,
                new Promise((_, reject) => setTimeout(
                    () => reject(new Error('second loadData must not wait on the in-flight load')),
                    100
                ))
            ]);

            assert.strictEqual(secondSettled, true);
        }
        finally
        {
            resolveGate();
            if (first) { await first; }
        }
    });
});
