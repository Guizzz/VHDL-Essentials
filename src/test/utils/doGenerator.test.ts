import * as assert from 'node:assert';
import { generateDoFile } from '../../utils/doGenerator';
import { SimulationUnit } from '../../utils/simulationScanner';

const BLINKY_TB_UNIT: SimulationUnit = {
    entity: 'blinky_tb',
    signals: ['clk', 'rst', 'led'],
    file: 'test/blinky_tb.vhd',
    uriFile: {} as any,
    entityNeeded: ['blinky', 'clk_div'],
    runTimeNs: 2100,
};

const EMPTY_UNIT: SimulationUnit = {
    entity: 'empty_tb',
    signals: [],
    file: 'test/empty_tb.vhd',
    uriFile: {} as any,
    entityNeeded: [],
    runTimeNs: 1000,
};

suite('doGenerator', () =>
{
    test('generate DO file with dependencies', () =>
    {
        const vhdlFiles = ['src/blinky.vhd', 'src/clk_div.vhd'];
        const result = generateDoFile(BLINKY_TB_UNIT, vhdlFiles, 2100);

        assert.ok(result.includes('vdel -all'));
        assert.ok(result.includes('vlib work'));
        assert.ok(result.includes('vcom src/blinky.vhd'));
        assert.ok(result.includes('vcom src/clk_div.vhd'));
        assert.ok(result.includes('vcom test/blinky_tb.vhd'));
        assert.ok(result.includes('vsim -voptargs=+acc -wlf simulation/waves/blinky_tb.wlf work.blinky_tb'));
        assert.ok(result.includes('add wave sim:/blinky_tb/clk'));
        assert.ok(result.includes('add wave sim:/blinky_tb/rst'));
        assert.ok(result.includes('add wave sim:/blinky_tb/led'));
        assert.ok(result.includes('run 2100 ns'));
        assert.ok(result.includes('wave zoom full'));
    });

    test('generate DO file with no dependencies', () =>
    {
        const result = generateDoFile(EMPTY_UNIT, [], 1000);

        assert.ok(result.includes('vcom test/empty_tb.vhd'));
        assert.ok(result.includes('vsim -voptargs=+acc -wlf simulation/waves/empty_tb.wlf work.empty_tb'));
        assert.ok(result.includes('run 1000 ns'));
    });

    test('generate DO file with no signals', () =>
    {
        const result = generateDoFile(EMPTY_UNIT, [], 1000);

        assert.strictEqual(result.includes('add wave'), false);
    });

    test('generate DO file creates waves directory', () =>
    {
        const result = generateDoFile(BLINKY_TB_UNIT, [], 2100);

        assert.ok(result.includes('file mkdir simulation/waves'));
    });

    test('generate DO file header has correct order', () =>
    {
        const result = generateDoFile(BLINKY_TB_UNIT, ['src/a.vhd', 'src/b.vhd'], 500);
        const lines = result.split('\n');

        const vdelIdx = lines.findIndex(l => l.includes('vdel'));
        const vlibIdx = lines.findIndex(l => l.includes('vlib'));
        const vcomA = lines.findIndex(l => l.includes('vcom src/a.vhd'));
        const vcomB = lines.findIndex(l => l.includes('vcom src/b.vhd'));
        const vcomTb = lines.findIndex(l => l.includes('vcom test/blinky_tb.vhd'));
        const vsimIdx = lines.findIndex(l => l.includes('vsim'));
        const addWaveIdx = lines.findIndex(l => l.includes('add wave'));
        const runIdx = lines.findIndex(l => l.includes('run'));
        const zoomIdx = lines.findIndex(l => l.includes('wave zoom'));

        assert.ok(vdelIdx < vlibIdx, 'vdel before vlib');
        assert.ok(vlibIdx < vcomA, 'vlib before vcom');
        assert.ok(vcomA < vcomB, 'dependency order preserved');
        assert.ok(vcomB < vcomTb, 'dependencies before testbench');
        assert.ok(vcomTb < vsimIdx, 'vcom before vsim');
        assert.ok(vsimIdx < addWaveIdx, 'vsim before add wave');
        assert.ok(addWaveIdx < runIdx, 'add wave before run');
        assert.ok(runIdx < zoomIdx, 'run before wave zoom');
    });

    test('generate DO file uses .wlf with entity name', () =>
    {
        const result = generateDoFile(BLINKY_TB_UNIT, [], 500);

        assert.ok(result.includes('blinky_tb.wlf'));
    });

    test('custom runtime is reflected in output', () =>
    {
        const result = generateDoFile(BLINKY_TB_UNIT, [], 9999);

        assert.ok(result.includes('run 9999 ns'));
    });
});
