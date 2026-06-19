import * as assert from 'node:assert';
import * as vscode from 'vscode';
import { findEnclosingPortMap, countCommas, VhdlSignatureProvider } from '../../providers/vhdlSignatureProvider';
import { EntityIndexer } from '../../services/entityIndexer';

suite('vhdlSignatureProvider', () =>
{
    suite('findEnclosingPortMap', () =>
    {
        test('direct entity instantiation', () =>
        {
            const text = `architecture rtl of top is\nbegin\nu : entity work.blinky port map (|\nend architecture;`;
            const offset = text.indexOf('|');
            const textClean = text.replace('|', '');

            const result = findEnclosingPortMap(textClean, offset);

            assert.ok(result, 'should find port map context');
            assert.strictEqual(result!.entityName, 'blinky');
        });

        test('component instantiation without entity work', () =>
        {
            const text = `\nu_counter : counter port map (|\n`;
            const offset = text.indexOf('|');
            const textClean = text.replace('|', '');

            const result = findEnclosingPortMap(textClean, offset);

            assert.ok(result, 'should find port map context');
            assert.strictEqual(result!.entityName, 'counter');
        });

        test('returns undefined when not inside port map parens', () =>
        {
            const text = `u : entity work.blinky port map (clk => x);\n|`;
            const offset = text.indexOf('|');
            const textClean = text.replace('|', '');

            const result = findEnclosingPortMap(textClean, offset);

            assert.strictEqual(result, undefined);
        });

        test('returns undefined when no port map before cursor', () =>
        {
            const text = `|entity foo is end entity;`;
            const offset = text.indexOf('|');
            const textClean = text.replace('|', '');

            const result = findEnclosingPortMap(textClean, offset);

            assert.strictEqual(result, undefined);
        });

        test('returns undefined when cursor is inside comment', () =>
        {
            const text = `u : entity work.blinky port map ( -- |\n`;
            const offset = text.indexOf('|');
            const textClean = text.replace('|', '');

            const result = findEnclosingPortMap(textClean, offset);

            assert.strictEqual(result, undefined);
        });

        test('handles multi-line instantiation', () =>
        {
            const text = `u : entity work.blinky\n    port map (|`;
            const offset = text.indexOf('|');
            const textClean = text.replace('|', '');

            const result = findEnclosingPortMap(textClean, offset);

            assert.ok(result, 'should find port map context');
            assert.strictEqual(result!.entityName, 'blinky');
        });

        test('ignores VHDL keywords as component names', () =>
        {
            const text = `x : process port map (|`;
            const offset = text.indexOf('|');
            const textClean = text.replace('|', '');

            const result = findEnclosingPortMap(textClean, offset);

            assert.strictEqual(result, undefined, 'process is a keyword, should not match');
        });

        test('port map after generic map still works', () =>
        {
            const text = `u : entity work.fifo\n    generic map (WIDTH => 8)\n    port map (|`;
            const offset = text.indexOf('|');
            const textClean = text.replace('|', '');

            const result = findEnclosingPortMap(textClean, offset);

            assert.ok(result, 'should find port map context');
            assert.strictEqual(result!.entityName, 'fifo');
        });

        test('multiple port maps, cursor in second one', () =>
        {
            const text = `u1 : entity work.a port map (x => y);\nu2 : entity work.b port map (|`;
            const offset = text.indexOf('|');
            const textClean = text.replace('|', '');

            const result = findEnclosingPortMap(textClean, offset);

            assert.ok(result, 'should find second port map context');
            assert.strictEqual(result!.entityName, 'b');
        });

        test('return undefined when inside other parentheses (not port map)', () =>
        {
            const text = `process (|)`;
            const offset = text.indexOf('|');
            const textClean = text.replace('|', '');

            const result = findEnclosingPortMap(textClean, offset);

            assert.strictEqual(result, undefined);
        });
    });

    suite('countCommas', () =>
    {
        test('empty string returns 0', () =>
        {
            assert.strictEqual(countCommas(''), 0);
        });

        test('no commas returns 0', () =>
        {
            assert.strictEqual(countCommas('clk => '), 0);
        });

        test('one comma returns 1', () =>
        {
            assert.strictEqual(countCommas('clk => x, '), 1);
        });

        test('two commas returns 2', () =>
        {
            assert.strictEqual(countCommas('clk => x, rst => y, '), 2);
        });

        test('commas inside nested parens are ignored', () =>
        {
            assert.strictEqual(countCommas('data => (a, b), '), 1);
        });

        test('commas inside comments are ignored', () =>
        {
            assert.strictEqual(countCommas('clk => x, -- comment, \n'), 1);
        });
    });

    suite('VhdlSignatureProvider', () =>
    {
        test('returns signature help for known entity in port map', async () =>
        {
            const doc = await vscode.workspace.openTextDocument({
                content: [
                    'entity blinky is',
                    '  port (',
                    '    clk   : in  std_logic;',
                    '    rst   : in  std_logic;',
                    '    pulse : out std_logic',
                    '  );',
                    'end entity blinky;'
                ].join('\n'),
                language: 'vhdl'
            });

            // We need the indexer to find the entity. Create it and index.
            const indexer = new EntityIndexer();
            await indexer.buildIndex();

            // Force our test document into the index by calling indexFile
            await indexer.indexFile(doc.uri);

            const provider = new VhdlSignatureProvider(indexer);

            // Simulate cursor right after "port map (" on a new file that instantiates blinky
            const instDoc = await vscode.workspace.openTextDocument({
                content: `architecture rtl of top is\nbegin\nu : entity work.blinky port map (\nend architecture;`,
                language: 'vhdl'
            });

            const pos = new vscode.Position(2, 37); // right after "port map ("
            const help = await provider.provideSignatureHelp(instDoc, pos, new vscode.CancellationTokenSource().token, {
                triggerKind: vscode.SignatureHelpTriggerKind.TriggerCharacter,
                triggerCharacter: '(',
                isRetrigger: false,
                activeSignatureHelp: undefined
            });

            assert.ok(help, 'should provide signature help');
            assert.strictEqual(help!.signatures.length, 1);
            assert.ok(help!.signatures[0].label.includes('blinky'));
            assert.strictEqual(help!.activeParameter, 0);

            const params = help!.signatures[0].parameters;
            assert.ok(params, 'should have parameters');
            assert.ok(params!.length >= 3, 'should have at least 3 ports');

            const paramLabels = params!.map(p => (p.label as string));
            assert.ok(paramLabels.some(l => l.startsWith('clk')), 'should include clk port');
            assert.ok(paramLabels.some(l => l.startsWith('rst')), 'should include rst port');
            assert.ok(paramLabels.some(l => l.startsWith('pulse')), 'should include pulse port');
        });

        test('returns undefined for unknown entity', async () =>
        {
            const indexer = new EntityIndexer();
            await indexer.buildIndex();

            const provider = new VhdlSignatureProvider(indexer);

            const doc = await vscode.workspace.openTextDocument({
                content: `architecture rtl of top is\nbegin\nu : entity work.unknown port map (\nend architecture;`,
                language: 'vhdl'
            });

            const pos = new vscode.Position(2, 40);
            const help = await provider.provideSignatureHelp(doc, pos, new vscode.CancellationTokenSource().token, {
                triggerKind: vscode.SignatureHelpTriggerKind.TriggerCharacter,
                triggerCharacter: '(',
                isRetrigger: false,
                activeSignatureHelp: undefined
            });

            assert.strictEqual(help, undefined);
        });
    });
});
