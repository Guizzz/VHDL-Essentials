import * as assert from 'node:assert';
import * as os from 'node:os';
import * as path from 'node:path';
import * as vscode from 'vscode';
import { EntityIndexer } from '../../services/entityIndexer';

function tempVhdlUri(name: string): vscode.Uri
{
    return vscode.Uri.file(
        path.join(os.tmpdir(), `qa_index_${name}_${Date.now()}.vhd`)
    );
}

suite('EntityIndexer', () =>
{
    test('onDidChange fires after indexFile and entity is queryable', async () =>
    {
        const indexer = new EntityIndexer();
        const file = tempVhdlUri('basic');

        await vscode.workspace.fs.writeFile(
            file,
            Buffer.from('entity foo is\n  port (clk : in std_logic);\nend entity foo;\n')
        );

        let fired = 0;
        let portsAtEvent: number | undefined;
        const sub = indexer.onDidChange(() =>
        {
            fired++;
            portsAtEvent = indexer.getEntity('foo')?.ports.size;
        });

        await indexer.indexFile(file);

        assert.ok(fired >= 1, 'onDidChange should fire after indexFile');
        assert.strictEqual(portsAtEvent, 1);
        assert.ok(indexer.hasEntity('foo'));

        sub.dispose();
        indexer.dispose();
        await vscode.workspace.fs.delete(file);
    });

    test('onDidChange fires on every re-index', async () =>
    {
        const indexer = new EntityIndexer();
        const file = tempVhdlUri('reindex');

        await vscode.workspace.fs.writeFile(
            file,
            Buffer.from('entity bar is\n  port (clk : in std_logic);\nend entity bar;\n')
        );

        let fired = 0;
        const sub = indexer.onDidChange(() => { fired++; });

        await indexer.indexFile(file);
        const afterFirst = fired;

        await indexer.indexFile(file);

        assert.ok(afterFirst >= 1);
        assert.ok(fired > afterFirst, 're-index should fire again');

        sub.dispose();
        indexer.dispose();
        await vscode.workspace.fs.delete(file);
    });

    test('onDidChange fires after removeFile', () =>
    {
        const indexer = new EntityIndexer();
        let fired = 0;
        const sub = indexer.onDidChange(() => { fired++; });

        indexer.removeFile('does/not/exist.vhd');

        assert.strictEqual(fired, 1);

        sub.dispose();
        indexer.dispose();
    });

    test('disposed subscription stops receiving events', async () =>
    {
        const indexer = new EntityIndexer();
        const file = tempVhdlUri('dispose');

        await vscode.workspace.fs.writeFile(
            file,
            Buffer.from('entity baz is\n  port (clk : in std_logic);\nend entity baz;\n')
        );

        let fired = 0;
        const sub = indexer.onDidChange(() => { fired++; });
        sub.dispose();

        await indexer.indexFile(file);

        assert.strictEqual(fired, 0);

        indexer.dispose();
        await vscode.workspace.fs.delete(file);
    });
});
