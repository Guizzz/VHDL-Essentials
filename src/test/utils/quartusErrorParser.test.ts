import * as assert from 'node:assert';
import * as path from 'path';
import { parseQuartusError } from '../../utils/quartusErrorParser';
import { type QuartusMessage } from '../../quartus/logger/outputParser';

const WORKSPACE_ROOT = 'C:\\test\\workspace';

function normalizePath(p: string): string
{
    return p.replace(/\\/g, '/').toLowerCase();
}

function makeMsg(text: string, severity: QuartusMessage['severity'] = 'error'): QuartusMessage
{
    return {
        stage: 'Analysis & Synthesis',
        severity,
        code: '10500',
        text
    };
}

suite('quartusErrorParser', () =>
{
    test('parse VHDL syntax error with "at filename(line)" format', () =>
    {
        const msg = makeMsg('VHDL syntax error at counter.vhd(12): near "text"');
        const result = parseQuartusError(msg, WORKSPACE_ROOT);

        assert.ok(result !== null);
        assert.strictEqual(result.severity, 'error');
        assert.strictEqual(
            normalizePath(result.uri.fsPath),
            normalizePath(path.join(WORKSPACE_ROOT, 'counter.vhd'))
        );
        assert.strictEqual(result.range.start.line, 11);
        assert.strictEqual(result.range.start.character, 0);
        assert.ok(
            result.message.includes('counter.vhd(12)'),
            'message should retain original bare filename'
        );
    });

    test('parse error with relative path in filename', () =>
    {
        const msg = makeMsg('Error (10818): Can\'t infer register for "foo" at src/counter.vhd(34)');
        const result = parseQuartusError(msg, WORKSPACE_ROOT);

        assert.ok(result !== null);
        assert.strictEqual(
            normalizePath(result.uri.fsPath),
            normalizePath(path.join(WORKSPACE_ROOT, 'src', 'counter.vhd'))
        );
        assert.strictEqual(result.range.start.line, 33);
        assert.ok(
            result.message.includes('src/counter.vhd(34)'),
            'message should retain original relative path'
        );
    });

    test('parse error with absolute Windows path in filename', () =>
    {
        const msg = makeMsg('Error (10500): VHDL error at C:\\projects\\vhdl\\counter.vhd(5)');
        const result = parseQuartusError(msg, WORKSPACE_ROOT);

        assert.ok(result !== null);
        assert.strictEqual(
            normalizePath(result.uri.fsPath),
            normalizePath('C:\\projects\\vhdl\\counter.vhd')
        );
        assert.strictEqual(result.range.start.line, 4);
        assert.ok(
            result.message.includes('C:\\projects\\vhdl\\counter.vhd(5)'),
            'absolute paths in message should be preserved'
        );
    });

    test('parse error with absolute forward-slash path in filename', () =>
    {
        const msg = makeMsg('VHDL error at C:/projects/vhdl/counter.vhd(8)');
        const result = parseQuartusError(msg, WORKSPACE_ROOT);

        assert.ok(result !== null);
        assert.strictEqual(
            normalizePath(result.uri.fsPath),
            normalizePath('c:\\projects\\vhdl\\counter.vhd')
        );
        assert.strictEqual(result.range.start.line, 7);
        assert.ok(
            result.message.includes('C:/projects/vhdl/counter.vhd(8)'),
            'absolute paths in message should be preserved'
        );
    });

    test('return null for error without file:line reference', () =>
    {
        const msg = makeMsg('Error (20004): Device family "MAX 10" is not installed');
        const result = parseQuartusError(msg, WORKSPACE_ROOT);

        assert.strictEqual(result, null);
    });

    test('map warning severity correctly', () =>
    {
        const msg = makeMsg('Warning (10036): unconstrained input port at counter.vhd(42)', 'warning');
        const result = parseQuartusError(msg, WORKSPACE_ROOT);

        assert.ok(result !== null);
        assert.strictEqual(result.severity, 'warning');
        assert.strictEqual(result.range.start.line, 41);
    });

    test('map critical severity as warning', () =>
    {
        const msg = makeMsg('Critical Warning (20001): issue at counter.vhd(15)', 'critical');
        const result = parseQuartusError(msg, WORKSPACE_ROOT);

        assert.ok(result !== null);
        assert.strictEqual(result.severity, 'warning');
    });

    test('parse message without "at" prefix', () =>
    {
        const msg = makeMsg('Error: counter.vhd(22): near "signal"');
        const result = parseQuartusError(msg, WORKSPACE_ROOT);

        assert.ok(result !== null);
        assert.strictEqual(
            normalizePath(result.uri.fsPath),
            normalizePath(path.join(WORKSPACE_ROOT, 'counter.vhd'))
        );
        assert.strictEqual(result.range.start.line, 21);
    });

    test('handle column info when present', () =>
    {
        const msg = makeMsg('Error at counter.vhd(12,5): syntax error');
        const result = parseQuartusError(msg, WORKSPACE_ROOT);

        assert.ok(result !== null);
        assert.strictEqual(result.range.start.line, 11);
        assert.strictEqual(result.range.start.character, 4);
    });
});
