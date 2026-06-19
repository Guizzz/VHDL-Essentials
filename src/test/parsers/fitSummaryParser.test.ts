import * as assert from 'node:assert';
import { parseFitSummaryText } from '../../parsers/fitSummaryParser';

const DEMO_FIT_SUMMARY = `Fitter Status : Successful - Thu Apr  3 12:11:15 2025
Quartus Prime Version : 23.1std.1 Build 993 05/14/2024 SC Standard Edition
Revision Name : Lab0
Top-level Entity Name : Lab0
Family : Cyclone V
Device : 5CSXFC6D6F31C6
Timing Models : Final
Logic utilization (in ALMs) : 4 / 41,910 ( < 1 % )
Total registers : 0
Total pins : 11 / 499 ( 2 % )
Total virtual pins : 0
`;

suite('fitSummaryParser', () =>
{
    test('parses fit summary header fields', () =>
    {
        const result = parseFitSummaryText(DEMO_FIT_SUMMARY);
        assert.strictEqual(result.status, 'Successful - Thu Apr  3 12:11:15 2025');
    });

    test('parses resource entries with usage data', () =>
    {
        const result = parseFitSummaryText(DEMO_FIT_SUMMARY);

        const logic = result.entries.find(e => e.label === 'Logic utilization (in ALMs)');
        assert.ok(logic);
        assert.strictEqual(logic.used, 4);
        assert.strictEqual(logic.total, 41910);
        assert.strictEqual(logic.percent, 0);

        const pins = result.entries.find(e => e.label === 'Total pins');
        assert.ok(pins);
        assert.strictEqual(pins.used, 11);
        assert.strictEqual(pins.total, 499);
        assert.strictEqual(pins.percent, 2);
    });

    test('skips metadata lines', () =>
    {
        const result = parseFitSummaryText(DEMO_FIT_SUMMARY);
        const hasVersion = result.entries.some(
            e => e.label === 'Quartus Prime Version' || e.label === 'Revision Name'
        );
        assert.strictEqual(hasVersion, false);
    });

    test('handles MAX 7000 format', () =>
    {
        const text = `Fitter Status : Successful - Tue Jul 19 00:22:29 2022
Quartus II 64-Bit Version : 13.0.1 Build 232
Revision Name : EPM7064B
Top-level Entity Name : EPM7064B
Family : MAX7000B
Device : EPM7064BLC44-7
Timing Models : Final
Total macrocells : 60 / 64 ( 94 % )
Total pins : 36 / 36 ( 100 % )
`;
        const result = parseFitSummaryText(text);
        assert.strictEqual(result.status, 'Successful - Tue Jul 19 00:22:29 2022');

        const macrocells = result.entries.find(e => e.label === 'Total macrocells');
        assert.ok(macrocells);
        assert.strictEqual(macrocells.used, 60);
        assert.strictEqual(macrocells.total, 64);
        assert.strictEqual(macrocells.percent, 94);

        const pins = result.entries.find(e => e.label === 'Total pins');
        assert.ok(pins);
        assert.strictEqual(pins.percent, 100);
    });

    test('handles empty input', () =>
    {
        const result = parseFitSummaryText('');
        assert.strictEqual(result.status, undefined);
        assert.strictEqual(result.entries.length, 0);
    });

    test('handles fit failure', () =>
    {
        const text = `Fitter Status : Failed - Could not fit design in device
Quartus Prime Version : 23.1std.1 Build 993
Revision Name : myproject
Top-level Entity Name : myproject
Family : MAX V
Device : 5M570ZT100C5
`;
        const result = parseFitSummaryText(text);
        assert.strictEqual(result.status, 'Failed - Could not fit design in device');
        assert.strictEqual(result.entries.length, 0);
    });

    test('handles resource line without percent', () =>
    {
        const text = `Total registers : 0
`;
        const result = parseFitSummaryText(text);
        assert.strictEqual(result.entries.length, 0);
    });

    test('ignores Family and Device lines', () =>
    {
        const result = parseFitSummaryText(DEMO_FIT_SUMMARY);
        const family = result.entries.find(e => e.label === 'Family');
        assert.strictEqual(family, undefined);
    });

    test('parses multiple resource entries', () =>
    {
        const text = `Total logic elements : 120 / 120 ( 100 % )
Total registers : 45 / 60 ( 75 % )
Total pins : 20 / 36 ( 56 % )
Total memory bits : 0 / 8192 ( 0 % )
Total PLLs : 1 / 2 ( 50 % )
`;
        const result = parseFitSummaryText(text);
        assert.strictEqual(result.entries.length, 5);

        const le = result.entries.find(e => e.label === 'Total logic elements');
        assert.ok(le);
        assert.strictEqual(le.used, 120);
        assert.strictEqual(le.total, 120);
        assert.strictEqual(le.percent, 100);

        const pll = result.entries.find(e => e.label === 'Total PLLs');
        assert.ok(pll);
        assert.strictEqual(pll.used, 1);
        assert.strictEqual(pll.total, 2);
    });
});
