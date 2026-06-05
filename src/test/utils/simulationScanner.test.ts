import * as assert from 'node:assert';
import { isTestBench, getPorts, runtimeEstimation } from '../../utils/simulationScanner';

const BLINKY_TB =
`library ieee;
use ieee.std_logic_1164.all;

entity blinky_tb is
end entity blinky_tb;

architecture sim of blinky_tb is
    signal clk : std_logic := '0';
    signal rst : std_logic := '0';
    signal led : std_logic;

    component blinky is
        port (
            clk : in  std_logic;
            rst : in  std_logic;
            led : out std_logic
        );
    end component blinky;

begin
    uut : blinky
        port map (
            clk => clk,
            rst => rst,
            led => led
        );

    clk <= not clk after 10 ns;

    process
    begin
        rst <= '1';
        wait for 100 ns;
        rst <= '0';
        wait for 2000 ns;
        wait;
    end process;
end architecture sim;`;

const BLINKY =
`library ieee;
use ieee.std_logic_1164.all;

entity blinky is
    port (
        clk : in  std_logic;
        rst : in  std_logic;
        led : out std_logic
    );
end entity blinky;

architecture rtl of blinky is
    signal pulse_500ms : std_logic;
    signal led_reg     : std_logic;
begin
    led <= led_reg;
end architecture rtl;`;

const PORTLESS_ENTITY =
`entity top is
end entity top;

architecture sim of top is
begin
    wait for 100 ns;
    assert false report "done" severity note;
    wait;
end architecture sim;`;

suite('simulationScanner', () =>
{
    suite('isTestBench', () =>
    {
        test('blinky_tb: entity with port map and no entity ports is a testbench', () =>
        {
            assert.strictEqual(isTestBench(BLINKY_TB), true);
        });

        test('blinky: entity with ports and component instantiation (no port map) is not a testbench', () =>
        {
            assert.strictEqual(isTestBench(BLINKY), false);
        });

        test('entity with both ports and port map is not a testbench', () =>
        {
            const text =
                'entity wrapper is port (x : in bit); end entity;\n' +
                'architecture rtl of wrapper is begin\n' +
                '    u : entity work.inner port map (a => x);\n' +
                'end architecture;';
            assert.strictEqual(isTestBench(text), false);
        });

        test('portless entity with wait/assert/sim architecture is a testbench', () =>
        {
            assert.strictEqual(isTestBench(PORTLESS_ENTITY), true);
        });

        test('portless entity without simulation constructs is not a testbench', () =>
        {
            const text =
                'entity empty is\n' +
                'end entity empty;\n' +
                'architecture rtl of empty is\n' +
                'begin\n' +
                'end architecture;';
            assert.strictEqual(isTestBench(text), false);
        });

        test('empty string is not a testbench', () =>
        {
            assert.strictEqual(isTestBench(''), false);
        });

        test('entity with architecture keyword but no wait/assert is not a testbench', () =>
        {
            const text =
                'entity dummy is\n' +
                'end entity;\n' +
                'architecture rtl of dummy is\n' +
                'begin\n' +
                '    x <= y;\n' +
                'end architecture;';
            assert.strictEqual(isTestBench(text), false);
        });

        test('entity with wait for is a testbench even without port map', () =>
        {
            const text =
                'entity tb is end entity;\n' +
                'architecture sim of tb is\n' +
                'begin\n' +
                '    process begin wait for 10 ns; wait; end process;\n' +
                'end architecture;';
            assert.strictEqual(isTestBench(text), true);
        });
    });

    suite('getPorts', () =>
    {
        test('blinky_tb: finds 3 signals', () =>
        {
            const signals = getPorts(BLINKY_TB);
            assert.strictEqual(signals.length, 3);
            assert.ok(signals.includes('clk'));
            assert.ok(signals.includes('rst'));
            assert.ok(signals.includes('led'));
        });

        test('no signal declarations returns empty array', () =>
        {
            const signals = getPorts('entity empty is end entity;');
            assert.strictEqual(signals.length, 0);
        });

        test('empty string returns empty array', () =>
        {
            const signals = getPorts('');
            assert.strictEqual(signals.length, 0);
        });

        test('only signal keyword without name is not matched', () =>
        {
            const signals = getPorts('architecture rtl of top is begin signal : bit; end;');
            assert.strictEqual(signals.length, 0);
        });
    });

    suite('runtimeEstimation', () =>
    {
        test('blinky_tb: sums wait for values + 100ns buffer', () =>
        {
            const total = runtimeEstimation(BLINKY_TB);
            assert.strictEqual(total, 100 + 2000 + 100);
        });

        test('single wait for 100 ns returns 200', () =>
        {
            const total = runtimeEstimation(
                'wait for 100 ns;'
            );
            assert.strictEqual(total, 200);
        });

        test('wait for in us is converted to ns', () =>
        {
            const total = runtimeEstimation(
                'wait for 1 us;\nwait for 500 ns;'
            );
            assert.strictEqual(total, 1000 + 500 + 100);
        });

        test('wait for in ms is converted to ns', () =>
        {
            const total = runtimeEstimation(
                'wait for 2 ms;'
            );
            assert.strictEqual(total, 2_000_000 + 100);
        });

        test('no wait for statements returns default 1000 + 100', () =>
        {
            const total = runtimeEstimation(
                'signal x : bit;'
            );
            assert.strictEqual(total, 1100);
        });

        test('empty string returns default 1100', () =>
        {
            const total = runtimeEstimation('');
            assert.strictEqual(total, 1100);
        });
    });
});
