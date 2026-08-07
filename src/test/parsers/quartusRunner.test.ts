import * as assert from 'node:assert';
import * as path from 'path';
import { buildRunEnv } from '../../quartus/quartusRunner';

suite('buildRunEnv', () =>
{
    test('prepends the bin path using the platform path delimiter', () =>
    {
        const env = { PATH: '/usr/bin:/bin' };

        const result = buildRunEnv('/opt/quartus/bin64', env);

        assert.strictEqual(result.PATH, `/opt/quartus/bin64${path.delimiter}/usr/bin:/bin`);
    });

    test('uses path.delimiter instead of a hardcoded separator', () =>
    {
        const result = buildRunEnv('C:\\quartus\\bin64', { PATH: 'C:\\Windows' });

        assert.strictEqual(result.PATH, `C:\\quartus\\bin64${path.delimiter}C:\\Windows`);
    });

    test('preserves other environment variables', () =>
    {
        const result = buildRunEnv('/opt/quartus/bin64', { PATH: '/usr/bin', HOME: '/home/user' });

        assert.strictEqual(result.HOME, '/home/user');
    });

    test('handles a missing PATH', () =>
    {
        const result = buildRunEnv('/opt/quartus/bin64', {});

        assert.strictEqual(result.PATH, `/opt/quartus/bin64${path.delimiter}`);
    });
});
