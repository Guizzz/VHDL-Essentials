import * as assert from 'node:assert';
import * as path from 'path';
import { buildRunEnv, QuartusTaskController } from '../../quartus/quartusRunner';

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

    test('rejects a second active task', () =>
    {
        const controller = new QuartusTaskController();

        assert.strictEqual(controller.acquire(true), true);
        assert.strictEqual(controller.acquire(true), false);
    });

    test('kills the attached process when cancelled', () =>
    {
        const controller = new QuartusTaskController();
        let killCount = 0;
        const process = { kill: () => { killCount++; return true; } };

        controller.acquire(true);
        controller.attach(process);

        assert.strictEqual(controller.cancel(), true);
        assert.strictEqual(killCount, 1);
        assert.strictEqual(controller.isCancellationRequested(), true);
    });

    test('does not cancel a non-cancellable task', () =>
    {
        const controller = new QuartusTaskController();
        let killCount = 0;
        const process = { kill: () => { killCount++; return true; } };

        controller.acquire();
        controller.attach(process);

        assert.strictEqual(controller.cancel(), false);
        assert.strictEqual(killCount, 0);
    });

    test('kills a process attached after cancellation was requested', () =>
    {
        const controller = new QuartusTaskController();
        let killCount = 0;
        const process = { kill: () => { killCount++; return true; } };

        controller.acquire(true);
        controller.cancel();
        controller.attach(process);

        assert.strictEqual(killCount, 1);
    });

    test('allows a new task after release', () =>
    {
        const controller = new QuartusTaskController();

        controller.acquire(true);
        controller.release();

        assert.strictEqual(controller.acquire(), true);
    });

    test('reports active state', () =>
    {
        const controller = new QuartusTaskController();

        assert.strictEqual(controller.isActive(), false);
        controller.acquire(true);
        assert.strictEqual(controller.isActive(), true);
        controller.release();
        assert.strictEqual(controller.isActive(), false);
    });
});
