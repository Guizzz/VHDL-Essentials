import * as assert from 'node:assert';
import { parseEntities } from '../../parsers/entityParser';
import { parseSignals } from '../../parsers/variableParser';
import { parsePackages } from '../../parsers/packageParser';

const COUNTER_VHD = `library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity counter is
    port (
        clk   : in  std_logic;
        rst   : in  std_logic;
        en    : in  std_logic;
        count : out std_logic_vector(7 downto 0);
        carry : out std_logic
    );
end entity counter;

architecture rtl of counter is
    signal cnt_reg : unsigned(7 downto 0);
    signal carry_reg : std_logic;
begin
    process(clk, rst)
    begin
        if rst = '1' then
            cnt_reg <= (others => '0');
            carry_reg <= '0';
        elsif rising_edge(clk) then
            if en = '1' then
                if cnt_reg = X"FF" then
                    cnt_reg <= (others => '0');
                    carry_reg <= '1';
                else
                    cnt_reg <= cnt_reg + 1;
                    carry_reg <= '0';
                end if;
            end if;
        end if;
    end process;

    count <= std_logic_vector(cnt_reg);
    carry <= carry_reg;
end architecture rtl;`;

const UART_RX_VHD = `library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity uart_rx is
    port (
        clk       : in  std_logic;
        rst       : in  std_logic;
        rx_line   : in  std_logic;
        data_out  : out std_logic_vector(7 downto 0);
        data_rdy  : out std_logic
    );
end entity;

architecture rtl of uart_rx is
    type state_t is (idle, start_bit, data_bits, stop_bit);
    signal state : state_t;
    signal bit_count : unsigned(2 downto 0);
    signal shift_reg : std_logic_vector(7 downto 0);
    signal clk_div : unsigned(15 downto 0);
    constant CLKS_PER_BIT : positive := 868;
begin
    process(clk, rst)
        variable temp : std_logic_vector(7 downto 0);
    begin
        if rst = '1' then
            state <= idle;
            data_rdy <= '0';
            clk_div <= (others => '0');
        elsif rising_edge(clk) then
            case state is
                when idle =>
                    data_rdy <= '0';
                    if rx_line = '0' then
                        state <= start_bit;
                        clk_div <= (others => '0');
                    end if;
                when start_bit =>
                    if clk_div = CLKS_PER_BIT / 2 then
                        if rx_line = '0' then
                            state <= data_bits;
                            bit_count <= (others => '0');
                            clk_div <= (others => '0');
                        else
                            state <= idle;
                        end if;
                    else
                        clk_div <= clk_div + 1;
                    end if;
                when data_bits =>
                    if clk_div = CLKS_PER_BIT then
                        shift_reg <= rx_line & shift_reg(7 downto 1);
                        clk_div <= (others => '0');
                        if bit_count = 7 then
                            state <= stop_bit;
                        else
                            bit_count <= bit_count + 1;
                        end if;
                    else
                        clk_div <= clk_div + 1;
                    end if;
                when stop_bit =>
                    if clk_div = CLKS_PER_BIT then
                        data_out <= shift_reg;
                        data_rdy <= '1';
                        state <= idle;
                    else
                        clk_div <= clk_div + 1;
                    end if;
            end case;
        end if;
    end process;
end architecture rtl;`;

const COMMON_PKG_VHD = `library ieee;
use ieee.std_logic_1164.all;

package common_pkg is
    constant DATA_WIDTH : positive := 16;
    constant ADDR_WIDTH : positive := 8;
    constant VERSION : string := "2.1.0";

    subtype word_t is std_logic_vector(DATA_WIDTH - 1 downto 0);
    subtype addr_t is std_logic_vector(ADDR_WIDTH - 1 downto 0);

    type bus_state_t is (idle, request, grant, release);

    signal sys_clk : std_logic;
    signal sys_rst : std_logic;

    function clog2(x : positive) return natural;
end package common_pkg;

package body common_pkg is
    function clog2(x : positive) return natural is
        variable result : natural := 0;
        variable temp : positive := 1;
    begin
        while temp < x loop
            temp := temp * 2;
            result := result + 1;
        end loop;
        return result;
    end function;
end package body;`;

suite('realWorld VHDL', () =>
{
    suite('counter', () =>
    {
        test('entityParser finds counter entity with 5 ports', () =>
        {
            const entities = parseEntities(COUNTER_VHD);
            assert.strictEqual(entities.length, 1);
            assert.strictEqual(entities[0].name, 'counter');

            const portNames = entities[0].ports.map(p => p.name);
            assert.deepStrictEqual(portNames, ['clk', 'rst', 'en', 'count', 'carry']);

            const clk = entities[0].ports[0];
            assert.strictEqual(clk.direction, 'in');
            assert.strictEqual(clk.type, 'std_logic');

            const count = entities[0].ports[3];
            assert.strictEqual(count.direction, 'out');
            assert.strictEqual(count.type, 'std_logic_vector(7 downto 0)');
        });

        test('variableParser finds entity ports', () =>
        {
            const symbols = parseSignals(COUNTER_VHD);
            const ports = symbols.filter(s => s.kind === 'port');
            assert.strictEqual(ports.length, 5);
            assert.strictEqual(ports[0].name, 'clk');
            assert.strictEqual(ports[3].name, 'count');
            assert.strictEqual(ports[3].type, 'std_logic_vector(7 downto 0)');
        });

        test('variableParser finds internal signals', () =>
        {
            const symbols = parseSignals(COUNTER_VHD);
            const signals = symbols.filter(s => s.kind === 'signal');
            assert.strictEqual(signals.length, 2);
            assert.strictEqual(signals[0].name, 'cnt_reg');
            assert.strictEqual(signals[0].type, 'unsigned(7 downto 0)');
            assert.strictEqual(signals[1].name, 'carry_reg');
        });
    });

    suite('uart_rx (state machine)', () =>
    {
        test('entityParser finds uart_rx entity', () =>
        {
            const entities = parseEntities(UART_RX_VHD);
            assert.strictEqual(entities.length, 1);
            assert.strictEqual(entities[0].name, 'uart_rx');
            assert.strictEqual(entities[0].ports.length, 5);
        });

        test('variableParser finds ports and signals', () =>
        {
            const symbols = parseSignals(UART_RX_VHD);
            const ports = symbols.filter(s => s.kind === 'port');
            const signals = symbols.filter(s => s.kind === 'signal');

            assert.strictEqual(ports.length, 5);
            assert.strictEqual(signals.length, 4);
            assert.strictEqual(signals[0].name, 'state');
            assert.strictEqual(signals[1].name, 'bit_count');
            assert.strictEqual(signals[2].name, 'shift_reg');
            assert.strictEqual(signals[3].name, 'clk_div');
        });

        test('variableParser finds variable declaration in process', () =>
        {
            const symbols = parseSignals(UART_RX_VHD);
            const vars = symbols.filter(s => s.kind === 'variable');
            assert.strictEqual(vars.length, 1);
            assert.strictEqual(vars[0].name, 'temp');
            assert.strictEqual(vars[0].type, 'std_logic_vector(7 downto 0)');
        });
    });

    suite('common_pkg (package)', () =>
    {
        test('packageParser finds package with all symbol kinds', () =>
        {
            const packages = parsePackages(COMMON_PKG_VHD);
            assert.strictEqual(packages.length, 1);
            assert.strictEqual(packages[0].name, 'common_pkg');

            const names = packages[0].symbols.map(s => s.name);
            assert.ok(names.includes('DATA_WIDTH'));
            assert.ok(names.includes('ADDR_WIDTH'));
            assert.ok(names.includes('VERSION'));
            assert.ok(names.includes('word_t'));
            assert.ok(names.includes('addr_t'));
            assert.ok(names.includes('bus_state_t'));
            assert.ok(names.includes('sys_clk'));
            assert.ok(names.includes('sys_rst'));
            assert.ok(names.includes('clog2'));
        });

        test('packageParser captures constant values', () =>
        {
            const packages = parsePackages(COMMON_PKG_VHD);
            const width = packages[0].symbols.find(s => s.name === 'DATA_WIDTH');
            assert.ok(width);
            assert.strictEqual(width.type, 'positive');
            assert.strictEqual(width.value, '16');
        });

        test('packageParser does not match symbols inside function body', () =>
        {
            const packages = parsePackages(COMMON_PKG_VHD);
            const resultVars = packages[0].symbols.filter(s => s.name === 'result');
            assert.strictEqual(resultVars.length, 0);
        });

        test('entityParser returns nothing for package-only file', () =>
        {
            const entities = parseEntities(COMMON_PKG_VHD);
            assert.strictEqual(entities.length, 0);
        });

        test('variableParser finds package-level signals', () =>
        {
            const symbols = parseSignals(COMMON_PKG_VHD);
            const pkgSignals = symbols.filter(s => s.kind === 'signal');
            assert.strictEqual(pkgSignals.length, 2);
            assert.strictEqual(pkgSignals[0].name, 'sys_clk');
            assert.strictEqual(pkgSignals[1].name, 'sys_rst');
        });
    });
});
