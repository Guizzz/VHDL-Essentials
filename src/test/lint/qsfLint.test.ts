import * as assert from 'node:assert';
import { lintQsfText } from '../../lint/qsfLint';

const VALID_QSF =
`set_global_assignment -name FAMILY "MAX V"
set_global_assignment -name DEVICE 5M40ZE64C4N
set_global_assignment -name TOP_LEVEL_ENTITY blinky
set_global_assignment -name PROJECT_OUTPUT_DIRECTORY output_files

set_global_assignment -name VHDL_FILE src/blinky.vhd
set_global_assignment -name VHDL_FILE src/clk_div.vhd

set_location_assignment PIN_1 -to clk
set_location_assignment PIN_2 -to rst
set_location_assignment PIN_3 -to led`;

suite('qsfLint', () =>
{
    suite('valid QSF produces no diagnostics', () =>
    {
        test('demo.qsf has no lint errors', () =>
        {
            const diags = lintQsfText(VALID_QSF);
            const errors = diags.filter(d => d.severity === 0 || d.severity === 1);
            assert.strictEqual(errors.length, 0, `Got: ${diags.map(d => d.message).join(', ')}`);
        });

        test('empty string has no diagnostics', () =>
        {
            const diags = lintQsfText('');
            assert.strictEqual(diags.length, 0);
        });

        test('only comments has no diagnostics', () =>
        {
            const diags = lintQsfText(
                '# this is a comment\n' +
                '# another comment\n'
            );
            assert.strictEqual(diags.length, 0);
        });
    });

    suite('multiple consecutive spaces', () =>
    {
        test('double space is flagged', () =>
        {
            const diags = lintQsfText(
                'set_global_assignment  -name FAMILY "MAX V"\n'
            );
            const space = diags.find(d => d.message.includes('Multiple consecutive spaces'));
            assert.ok(space);
        });
    });

    suite('tab characters', () =>
    {
        test('tab is flagged', () =>
        {
            const diags = lintQsfText(
                'set_global_assignment\t-name FAMILY "MAX V"\n'
            );
            const tab = diags.find(d => d.message.includes('Tab character'));
            assert.ok(tab);
        });
    });

    suite('unknown QSF commands', () =>
    {
        test('unknown command is flagged', () =>
        {
            const diags = lintQsfText(
                'set_global_assignment -name FAMILY "MAX V"\n' +
                'garbage_command -something value\n'
            );
            const unknown = diags.find(d => d.message.includes('Unknown or unsupported'));
            assert.ok(unknown);
        });

        test('set_global_assignment lines are not flagged', () =>
        {
            const diags = lintQsfText(
                'set_global_assignment -name FAMILY "MAX V"\n' +
                'set_global_assignment -name VHDL_FILE src/top.vhd\n'
            );
            const unknown = diags.find(d => d.message.includes('Unknown or unsupported'));
            assert.strictEqual(unknown, undefined);
        });

        test('set_location_assignment lines are not flagged', () =>
        {
            const diags = lintQsfText(
                'set_location_assignment PIN_1 -to clk\n'
            );
            const unknown = diags.find(d => d.message.includes('Unknown or unsupported'));
            assert.strictEqual(unknown, undefined);
        });
    });

    suite('duplicate assignments', () =>
    {
        test('same PIN assigned to different signals', () =>
        {
            const diags = lintQsfText(
                'set_location_assignment PIN_1 -to clk\n' +
                'set_location_assignment PIN_1 -to rst\n'
            );
            const dupPin = diags.find(d => d.message.includes('Duplicate pin'));
            assert.ok(dupPin, 'Should detect duplicate PIN assignment');
        });

        test('same signal assigned to different pins', () =>
        {
            const diags = lintQsfText(
                'set_location_assignment PIN_1 -to clk\n' +
                'set_location_assignment PIN_2 -to clk\n'
            );
            const dupSig = diags.find(d => d.message.includes('Duplicate signal'));
            assert.ok(dupSig, 'Should detect duplicate signal assignment');
        });

        test('no duplicates produces no diagnostics', () =>
        {
            const diags = lintQsfText(
                'set_location_assignment PIN_1 -to clk\n' +
                'set_location_assignment PIN_2 -to rst\n'
            );
            const errors = diags.filter(d => d.severity === 0 || d.severity === 1);
            assert.strictEqual(errors.length, 0);
        });
    });

    suite('comment lines are ignored', () =>
    {
        test('commented duplicate is not flagged', () =>
        {
            const diags = lintQsfText(
                'set_location_assignment PIN_1 -to clk\n' +
                '# set_location_assignment PIN_1 -to rst\n'
            );
            const dupPin = diags.find(d => d.message.includes('Duplicate pin'));
            assert.strictEqual(dupPin, undefined);
        });

        test('commented unknown command is not flagged', () =>
        {
            const diags = lintQsfText(
                '# garbage_command\n'
            );
            const unknown = diags.find(d => d.message.includes('Unknown'));
            assert.strictEqual(unknown, undefined);
        });
    });
});
