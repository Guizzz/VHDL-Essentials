import * as assert from 'node:assert';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { resolveQuartusBinDir } from '../../quartus/quartusConfig';

suite('resolveQuartusBinDir', () =>
{
    let tmpDir: string;

    setup(() =>
    {
        tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'qa-quartus-config-'));
    });

    teardown(() =>
    {
        fs.rmSync(tmpDir, { recursive: true, force: true });
    });

    test('prefers bin64 when present', () =>
    {
        const expected = path.join(tmpDir, 'quartus_map', 'bin64');
        fs.mkdirSync(expected, { recursive: true });

        assert.strictEqual(resolveQuartusBinDir(tmpDir, 'quartus_map'), expected);
    });

    test('falls back to bin for 32-bit layouts', () =>
    {
        const expected = path.join(tmpDir, 'quartus_map', 'bin');
        fs.mkdirSync(expected, { recursive: true });

        assert.strictEqual(resolveQuartusBinDir(tmpDir, 'quartus_map'), expected);
    });

    test('returns bin64 when neither bin nor bin64 exists', () =>
    {
        assert.strictEqual(
            resolveQuartusBinDir(tmpDir, 'quartus_map'),
            path.join(tmpDir, 'quartus_map', 'bin64')
        );
    });
});
