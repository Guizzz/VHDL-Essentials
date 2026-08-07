import * as assert from 'node:assert';
import { findFlashCandidates, buildFlashArgs, isProgrammerError } from '../../commands/flash';

suite('flash', () =>
{
    suite('findFlashCandidates', () =>
    {
        test('finds a .sof in a custom output dir', () =>
        {
            const result = findFlashCandidates('blinky', 'synthesis_out', ['blinky.sof', 'blinky.fit.summary']);

            assert.deepStrictEqual(result, [{ file: 'synthesis_out/blinky.sof', extension: 'sof' }]);
        });

        test('falls back to .pof when no .sof exists', () =>
        {
            const result = findFlashCandidates('blinky', 'output_files', ['blinky.pof']);

            assert.deepStrictEqual(result, [{ file: 'output_files/blinky.pof', extension: 'pof' }]);
        });

        test('returns both candidates when both exist', () =>
        {
            const result = findFlashCandidates('blinky', 'output_files', ['blinky.pof', 'blinky.sof']);

            assert.strictEqual(result.length, 2);
            assert.ok(result.some(c => c.extension === 'sof'));
            assert.ok(result.some(c => c.extension === 'pof'));
        });

        test('case-insensitive extension and base matching', () =>
        {
            const result = findFlashCandidates('blinky', 'output_files', ['BLINKY.SOF']);

            assert.strictEqual(result.length, 1);
            assert.strictEqual(result[0].extension, 'sof');
            assert.strictEqual(result[0].file, 'output_files/BLINKY.SOF');
        });

        test('ignores unrelated files', () =>
        {
            const result = findFlashCandidates('blinky', 'output_files', ['other.pof', 'other.sof', 'blinky.done']);

            assert.deepStrictEqual(result, []);
        });

        test('normalizes Windows separators in the output dir', () =>
        {
            const result = findFlashCandidates('blinky', 'build\\out', ['blinky.sof']);

            assert.strictEqual(result[0].file, 'build/out/blinky.sof');
        });
    });

    suite('buildFlashArgs', () =>
    {
        test('builds the -o program argument', () =>
        {
            const args = buildFlashArgs({ file: 'output_files/blinky.pof', extension: 'pof' });

            assert.deepStrictEqual(args, ['-m', 'jtag', '-o', 'p;output_files/blinky.pof']);
        });

        test('uses the .sof path when flashing a sof project', () =>
        {
            const args = buildFlashArgs({ file: 'synthesis_out/blinky.sof', extension: 'sof' });

            assert.deepStrictEqual(args, ['-m', 'jtag', '-o', 'p;synthesis_out/blinky.sof']);
        });
    });

    suite('isProgrammerError', () =>
    {
        test('detects (error) in quartus_pgm output', () =>
        {
            assert.strictEqual(isProgrammerError('Info: (error)'), true);
        });

        test('detects (error) case-insensitively', () =>
        {
            assert.strictEqual(isProgrammerError('Info: (Error)'), true);
        });

        test('ignores non-error lines', () =>
        {
            assert.strictEqual(isProgrammerError('Info: Operation successful'), false);
            assert.strictEqual(isProgrammerError('Info: (successful)'), false);
            assert.strictEqual(isProgrammerError('Info: Programmed successfully'), false);
        });
    });
});
