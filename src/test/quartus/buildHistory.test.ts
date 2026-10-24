import * as assert from 'node:assert';
import {
    MAX_BUILD_HISTORY,
    formatDelta,
    recordSnapshot,
    renderBar,
    usageColor,
    usageSeverity,
    withDeltas,
    type BuildSnapshot
} from '../../quartus/buildHistory';

function snapshot(timestamp: number, used: number, label = 'Logic elements'): BuildSnapshot
{
    return {
        timestamp,
        status: 'Successful',
        entries: [{ label, used, total: 1000, percent: used / 10 }]
    };
}

suite('buildHistory', () =>
{
    test('recordSnapshot keeps snapshots ordered by timestamp', () =>
    {
        const history = recordSnapshot([], snapshot(200, 10));
        const updated = recordSnapshot(history, snapshot(100, 5));

        assert.strictEqual(updated.length, 2);
        assert.strictEqual(updated[0].timestamp, 100);
        assert.strictEqual(updated[1].timestamp, 200);
    });

    test('recordSnapshot replaces a snapshot with the same timestamp', () =>
    {
        const first = recordSnapshot([], snapshot(100, 5));
        const updated = recordSnapshot(first, snapshot(100, 42));

        assert.strictEqual(updated.length, 1);
        assert.strictEqual(updated[0].entries[0].used, 42);
    });

    test('recordSnapshot caps the history length', () =>
    {
        let history: BuildSnapshot[] = [];

        for (let i = 0; i < MAX_BUILD_HISTORY + 5; i++)
        {
            history = recordSnapshot(history, snapshot(i, i));
        }

        assert.strictEqual(history.length, MAX_BUILD_HISTORY);
        assert.strictEqual(history[history.length - 1].timestamp, MAX_BUILD_HISTORY + 4);
        assert.strictEqual(history[0].timestamp, 5);
    });

    test('withDeltas computes the usage difference against the previous build', () =>
    {
        const entries = withDeltas(snapshot(200, 120), snapshot(100, 100));

        assert.strictEqual(entries.length, 1);
        assert.strictEqual(entries[0].used, 120);
        assert.strictEqual(entries[0].delta, 20);
    });

    test('withDeltas reports negative deltas', () =>
    {
        const entries = withDeltas(snapshot(200, 80), snapshot(100, 100));

        assert.strictEqual(entries[0].delta, -20);
    });

    test('withDeltas leaves the delta undefined on the first build', () =>
    {
        const entries = withDeltas(snapshot(100, 100), undefined);

        assert.strictEqual(entries[0].delta, undefined);
    });

    test('withDeltas leaves the delta undefined for new categories', () =>
    {
        const previous = snapshot(100, 100, 'Logic elements');
        const current = snapshot(200, 5, 'PLLs');

        const entries = withDeltas(current, previous);

        assert.strictEqual(entries[0].delta, undefined);
    });

    test('formatDelta renders sign and zero', () =>
    {
        assert.strictEqual(formatDelta(undefined), '');
        assert.strictEqual(formatDelta(0), '±0');
        assert.strictEqual(formatDelta(12), '+12');
        assert.strictEqual(formatDelta(-3), '-3');
    });

    test('renderBar fills proportionally and clamps out-of-range values', () =>
    {
        assert.strictEqual(renderBar(0), '░░░░░░░░');
        assert.strictEqual(renderBar(100), '████████');
        assert.strictEqual(renderBar(50), '████░░░░');
        assert.strictEqual(renderBar(-20), '░░░░░░░░');
        assert.strictEqual(renderBar(420), '████████');
    });

    test('usage severity and color follow the 70/90 thresholds', () =>
    {
        assert.strictEqual(usageSeverity(0), 'check');
        assert.strictEqual(usageSeverity(69), 'check');
        assert.strictEqual(usageSeverity(70), 'warning');
        assert.strictEqual(usageSeverity(89), 'warning');
        assert.strictEqual(usageSeverity(90), 'error');

        assert.strictEqual(usageColor(69), 'charts.green');
        assert.strictEqual(usageColor(70), 'charts.orange');
        assert.strictEqual(usageColor(90), 'charts.red');
    });
});
