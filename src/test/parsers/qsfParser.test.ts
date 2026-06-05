import * as assert from 'node:assert';
import { parseQsfText } from '../../parsers/qsfParser';

const DEMO_QSF =
`set_global_assignment -name FAMILY "MAX V"
set_global_assignment -name DEVICE 5M40ZE64C4N
set_global_assignment -name TOP_LEVEL_ENTITY blinky
set_global_assignment -name PROJECT_OUTPUT_DIRECTORY output_files

set_global_assignment -name VHDL_FILE src/blinky.vhd
set_global_assignment -name VHDL_FILE src/clk_div.vhd
set_global_assignment -name VHDL_FILE src/demo_pkg.vhd
set_global_assignment -name VHDL_FILE src/counter.vhd
set_global_assignment -name VHDL_FILE src/uart_rx.vhd
set_global_assignment -name VHDL_FILE src/common_pkg.vhd
set_global_assignment -name VHDL_FILE test/blinky_tb.vhd

set_location_assignment PIN_1 -to clk
set_location_assignment PIN_2 -to rst
set_location_assignment PIN_3 -to led`;

suite('qsfParser', () =>
{
    test('parse demo QSF: family, device, top entity', () =>
    {
        const result = parseQsfText(DEMO_QSF);
        assert.strictEqual(result.family, 'MAX V');
        assert.strictEqual(result.device, '5M40ZE64C4N');
        assert.strictEqual(result.topLevelEntity, 'blinky');
        assert.strictEqual(result.outputFolder, 'output_files');
    });

    test('parse demo QSF: pin assignments', () =>
    {
        const result = parseQsfText(DEMO_QSF);
        assert.strictEqual(result.pins.length, 3);
        assert.strictEqual(result.pins[0].pin, 'PIN_1');
        assert.strictEqual(result.pins[0].signal, 'clk');
        assert.strictEqual(result.pins[0].line, 13);
        assert.strictEqual(result.pins[1].pin, 'PIN_2');
        assert.strictEqual(result.pins[1].signal, 'rst');
        assert.strictEqual(result.pins[2].pin, 'PIN_3');
        assert.strictEqual(result.pins[2].signal, 'led');
    });

    test('skip comment lines starting with #', () =>
    {
        const result = parseQsfText(
            '# this is a comment\n' +
            'set_global_assignment -name FAMILY "MAX II"\n' +
            '# another comment\n' +
            'set_location_assignment PIN_10 -to data'
        );
        assert.strictEqual(result.family, 'MAX II');
        assert.strictEqual(result.pins.length, 1);
    });

    test('return empty pins for no assignments', () =>
    {
        const result = parseQsfText(
            'set_global_assignment -name FAMILY "Cyclone V"\n'
        );
        assert.strictEqual(result.pins.length, 0);
        assert.strictEqual(result.family, 'Cyclone V');
    });

    test('return empty result for empty string', () =>
    {
        const result = parseQsfText('');
        assert.strictEqual(result.pins.length, 0);
        assert.strictEqual(result.family, undefined);
        assert.strictEqual(result.device, undefined);
        assert.strictEqual(result.topLevelEntity, undefined);
    });

    test('return empty result for only comments', () =>
    {
        const result = parseQsfText(
            '# comment 1\n' +
            '# comment 2\n'
        );
        assert.strictEqual(result.pins.length, 0);
        assert.strictEqual(result.family, undefined);
    });

    test('parse pin with underscore in signal name', () =>
    {
        const result = parseQsfText(
            'set_location_assignment PIN_A14 -to data_out\n' +
            'set_location_assignment PIN_B7 -to sys_clk\n'
        );
        assert.strictEqual(result.pins.length, 2);
        assert.strictEqual(result.pins[0].signal, 'data_out');
        assert.strictEqual(result.pins[1].signal, 'sys_clk');
    });

    test('parse device without quotes', () =>
    {
        const result = parseQsfText(
            'set_global_assignment -name DEVICE EP4CE22F17C6\n'
        );
        assert.strictEqual(result.device, 'EP4CE22F17C6');
    });

    test('family with quotes', () =>
    {
        const result = parseQsfText(
            'set_global_assignment -name FAMILY "Cyclone IV E"\n'
        );
        assert.strictEqual(result.family, 'Cyclone IV E');
    });

    test('parse VHDL_FILE lines are ignored (not pin assignments)', () =>
    {
        const result = parseQsfText(
            'set_global_assignment -name VHDL_FILE src/top.vhd\n' +
            'set_global_assignment -name VHDL_FILE src/util.vhd\n'
        );
        assert.strictEqual(result.pins.length, 0);
        assert.strictEqual(result.family, undefined);
    });
});
