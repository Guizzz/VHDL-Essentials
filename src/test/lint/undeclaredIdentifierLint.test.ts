import * as assert from 'node:assert';
import * as vscode from 'vscode';
import { findUndeclaredIdentifiers } from '../../lint/undeclaredIdentifierLint';

suite('undeclaredIdentifierLint', () =>
{
    test('declared and used signal produces no diagnostic', () =>
    {
        const diags = findUndeclaredIdentifiers(
            'architecture rtl of top is\n' +
            '  signal s1 : bit;\n' +
            'begin\n' +
            '  s1 <= \'1\';\n' +
            'end architecture;'
        );
        assert.strictEqual(diags.length, 0);
    });

    test('undeclared signal in assignment produces error', () =>
    {
        const diags = findUndeclaredIdentifiers(
            'architecture rtl of top is\n' +
            'begin\n' +
            '  s2 <= \'1\';\n' +
            'end architecture;'
        );
        assert.strictEqual(diags.length, 1);
        assert.ok(diags[0].message.includes('s2'));
        assert.strictEqual(diags[0].severity, vscode.DiagnosticSeverity.Error);
    });

    test('undeclared signal in sensitivity list produces error', () =>
    {
        const diags = findUndeclaredIdentifiers(
            'architecture rtl of top is\n' +
            'begin\n' +
            '  process(clk, rst)\n' +
            '  begin\n' +
            '  end process;\n' +
            'end architecture;'
        );
        assert.strictEqual(diags.length, 2);
        assert.ok(diags[0].message.includes('clk'));
        assert.ok(diags[1].message.includes('rst'));
    });

    test('loop variable is not flagged', () =>
    {
        const diags = findUndeclaredIdentifiers(
            'architecture rtl of top is\n' +
            'begin\n' +
            '  process\n' +
            '    variable data : std_logic_vector(7 downto 0);\n' +
            '  begin\n' +
            '    for i in 0 to 7 loop\n' +
            '      data(i) := \'1\';\n' +
            '    end loop;\n' +
            '  end process;\n' +
            'end architecture;'
        );
        assert.strictEqual(diags.length, 0);
    });

    test('port map formal is not flagged but actual is', () =>
    {
        const diags = findUndeclaredIdentifiers(
            'architecture rtl of top is\n' +
            'begin\n' +
            '  uut : entity work.ent\n' +
            '    port map (clk => clk_in, rst => rst_in);\n' +
            'end architecture;'
        );
        // clk, rst sono formali (prima di =>) → skipped
        // clk_in, rst_in sono actual (dopo =>) → flagged se non dichiarati
        assert.strictEqual(diags.length, 2);
        assert.ok(diags[0].message.includes('clk_in'));
        assert.ok(diags[1].message.includes('rst_in'));
    });

    test('attribute target and name are not flagged', () =>
    {
        const diags = findUndeclaredIdentifiers(
            'architecture rtl of top is\n' +
            '  signal s1 : bit;\n' +
            'begin\n' +
            '  process\n' +
            '  begin\n' +
            '    if s1\'event then\n' +
            '      null;\n' +
            '    end if;\n' +
            '  end process;\n' +
            'end architecture;'
        );
        assert.strictEqual(diags.length, 0);
    });

    test('comment line is not flagged', () =>
    {
        const diags = findUndeclaredIdentifiers(
            'architecture rtl of top is\n' +
            'begin\n' +
            '  -- s2 <= \'1\';\n' +
            'end architecture;'
        );
        assert.strictEqual(diags.length, 0);
    });

    test('VHDL keywords and built-in values are not flagged', () =>
    {
        const diags = findUndeclaredIdentifiers(
            'architecture rtl of top is\n' +
            'begin\n' +
            '  process\n' +
            '  begin\n' +
            '    if true then\n' +
            '      null;\n' +
            '    end if;\n' +
            '  end process;\n' +
            'end architecture;'
        );
        assert.strictEqual(diags.length, 0);
    });

    test('use/library lines are not flagged', () =>
    {
        const diags = findUndeclaredIdentifiers(
            'library ieee;\n' +
            'use ieee.std_logic_1164.all;\n' +
            'use work.my_pkg.all;\n' +
            'architecture rtl of top is\n' +
            'begin\n' +
            'end architecture;'
        );
        assert.strictEqual(diags.length, 0);
    });

    test('entity work reference is not flagged', () =>
    {
        const diags = findUndeclaredIdentifiers(
            'architecture rtl of top is\n' +
            '  signal clk_in : bit;\n' +
            'begin\n' +
            '  uut : entity work.ent\n' +
            '    port map (clk => clk_in);\n' +
            'end architecture;'
        );
        // clk_in è dichiarato → 0 diagnostics
        assert.strictEqual(diags.length, 0);
    });

    test('entity generic used in signal declaration is not flagged', () =>
    {
        const diags = findUndeclaredIdentifiers(
            'entity top is\n' +
            '    generic(DATA_WIDTH : positive := 8);\n' +
            '    port(clk : in std_logic);\n' +
            'end entity;\n' +
            'architecture rtl of top is\n' +
            '    signal data : std_logic_vector(DATA_WIDTH-1 downto 0);\n' +
            'begin\n' +
            'end architecture;'
        );
        assert.strictEqual(diags.length, 0);
    });

    test('type name used in signal declaration is not flagged', () =>
    {
        const diags = findUndeclaredIdentifiers(
            'architecture rtl of top is\n' +
            '    type state_t is (IDLE, TRANSFER);\n' +
            '    signal state : state_t;\n' +
            'begin\n' +
            'end architecture;'
        );
        assert.strictEqual(diags.length, 0);
    });

    test('enum literal used in assignment is not flagged', () =>
    {
        const diags = findUndeclaredIdentifiers(
            'architecture rtl of top is\n' +
            '    type state_t is (IDLE, TRANSFER);\n' +
            '    signal state : state_t;\n' +
            'begin\n' +
            '    state <= IDLE;\n' +
            'end architecture;'
        );
        assert.strictEqual(diags.length, 0);
    });

    test('subtype used in signal declaration is not flagged', () =>
    {
        const diags = findUndeclaredIdentifiers(
            'architecture rtl of top is\n' +
            '    subtype my_int is integer range 0 to 255;\n' +
            '    signal cnt : my_int;\n' +
            'begin\n' +
            'end architecture;'
        );
        assert.strictEqual(diags.length, 0);
    });

    test('full spi_master entity with generics types and enum literals produces no diagnostics', () =>
    {
        const diags = findUndeclaredIdentifiers(
            'entity spi_master is\n' +
            '    generic(\n' +
            '        DATA_WIDTH : positive := 8\n' +
            '    );\n' +
            '    port(\n' +
            '        clk      : in std_logic;\n' +
            '        start    : in std_logic;\n' +
            '        data_tx  : in std_logic_vector(DATA_WIDTH-1 downto 0);\n' +
            '        SPI_CLK  : out std_logic;\n' +
            '        SPI_MOSI : out std_logic := \'0\';\n' +
            '        SPI_SS   : out std_logic := \'1\';\n' +
            '        busy     : out std_logic := \'0\'\n' +
            '    );\n' +
            'end entity;\n' +
            '\n' +
            'architecture rtl of spi_master is\n' +
            '    type state_t is (IDLE, TRANSFER);\n' +
            '    signal state : state_t := IDLE;\n' +
            '    signal bit_cnt     : integer range 0 to DATA_WIDTH - 1 := 0;\n' +
            '    signal shift_reg   : std_logic_vector(DATA_WIDTH-1 downto 0);\n' +
            'begin\n' +
            'end architecture;'
        );
        assert.strictEqual(diags.length, 0);
    });

    test('package name in declaration and end line is not flagged', () =>
    {
        const diags = findUndeclaredIdentifiers(
            'package pulse_pkg is\n' +
            '    constant WIDTH : positive := 16;\n' +
            'end package pulse_pkg;'
        );
        assert.strictEqual(diags.length, 0);
    });

    test('package body name is not flagged', () =>
    {
        const diags = findUndeclaredIdentifiers(
            'package body pulse_pkg is\n' +
            '    constant WIDTH : positive := 16;\n' +
            'end package body pulse_pkg;'
        );
        assert.strictEqual(diags.length, 0);
    });

    test('time units (us, ns, ms) in wait for are not flagged', () =>
    {
        const diags = findUndeclaredIdentifiers(
            'architecture sim of tb is\n' +
            'begin\n' +
            '  wait for 1000 us;\n' +
            '  wait for 500 ns;\n' +
            '  wait for 1 ms;\n' +
            'end architecture;'
        );
        assert.strictEqual(diags.length, 0);
    });

    test('severity level (failure, note, warning) in assert are not flagged', () =>
    {
        const diags = findUndeclaredIdentifiers(
            'entity tb is end entity;\n' +
            'architecture sim of tb is\n' +
            'begin\n' +
            '  assert false severity failure;\n' +
            '  assert true severity note;\n' +
            '  assert false severity warning;\n' +
            'end architecture;'
        );
        assert.strictEqual(diags.length, 0);
    });

    test('hex literal prefix (x") is not flagged', () =>
    {
        const diags = findUndeclaredIdentifiers(
            'architecture rtl of top is\n' +
            '  signal tx_data : std_logic_vector(7 downto 0);\n' +
            'begin\n' +
            '  tx_data <= x"3C";\n' +
            'end architecture;'
        );
        assert.strictEqual(diags.length, 0);
    });

    test('binary and octal literal prefixes (b", o") are not flagged', () =>
    {
        const diags = findUndeclaredIdentifiers(
            'architecture rtl of top is\n' +
            '  signal bin_data : std_logic_vector(3 downto 0);\n' +
            '  signal oct_data : std_logic_vector(5 downto 0);\n' +
            'begin\n' +
            '  bin_data <= b"1100";\n' +
            '  oct_data <= o"77";\n' +
            'end architecture;'
        );
        assert.strictEqual(diags.length, 0);
    });

    test('empty text produces no diagnostics', () =>
    {
        const diags = findUndeclaredIdentifiers('');
        assert.strictEqual(diags.length, 0);
    });

    test('no declarations flags each undeclared usage', () =>
    {
        const diags = findUndeclaredIdentifiers(
            'architecture rtl of top is\n' +
            'begin\n' +
            '  data <= \'1\';\n' +
            '  result <= data;\n' +
            'end architecture;'
        );
        // data (riga 1), result (riga 2), data (riga 2) = 3 usi
        assert.strictEqual(diags.length, 3);
    });

    test('to_signed is not flagged via keywords', () =>
    {
        const diags = findUndeclaredIdentifiers(
            'architecture rtl of top is\n' +
            '  signal result : signed(7 downto 0);\n' +
            'begin\n' +
            '  result <= to_signed(42, 8);\n' +
            'end architecture;'
        );
        assert.strictEqual(diags.length, 0);
    });

    test('to_unsigned and resize are not flagged via keywords', () =>
    {
        const diags = findUndeclaredIdentifiers(
            'architecture rtl of top is\n' +
            '  signal a : unsigned(7 downto 0);\n' +
            '  signal b : unsigned(15 downto 0);\n' +
            'begin\n' +
            '  b <= resize(a, 16);\n' +
            '  a <= to_unsigned(100, 8);\n' +
            'end architecture;'
        );
        assert.strictEqual(diags.length, 0);
    });

    test('resolveSymbol callback skips identifier found by external resolver', () =>
    {
        const registeredSymbols = new Set(['width', 'my_const', 'my_func']);
        const resolver = (name: string) => registeredSymbols.has(name.toLowerCase());

        const diags = findUndeclaredIdentifiers(
            'architecture rtl of top is\n' +
            '  signal result : std_logic;\n' +
            'begin\n' +
            '  result <= width;\n' +
            '  result <= my_const;\n' +
            '  result <= my_func;\n' +
            'end architecture;',
            resolver
        );
        assert.strictEqual(diags.length, 0);
    });

    test('resolveSymbol callback does not hide truly undeclared identifiers', () =>
    {
        const registeredSymbols = new Set(['width']);
        const resolver = (name: string) => registeredSymbols.has(name.toLowerCase());

        const diags = findUndeclaredIdentifiers(
            'architecture rtl of top is\n' +
            '  signal result : std_logic;\n' +
            'begin\n' +
            '  result <= width + unknown_sig;\n' +
            'end architecture;',
            resolver
        );
        // width è risolto, unknown_sig no
        assert.strictEqual(diags.length, 1);
        assert.ok(diags[0].message.includes('unknown_sig'));
    });

    test('conv_integer and conv_std_logic_vector are not flagged via keywords', () =>
    {
        const diags = findUndeclaredIdentifiers(
            'architecture rtl of top is\n' +
            '  signal slv : std_logic_vector(7 downto 0);\n' +
            '  signal int_val : integer;\n' +
            'begin\n' +
            '  int_val <= conv_integer(slv);\n' +
            '  slv <= conv_std_logic_vector(42, 8);\n' +
            'end architecture;'
        );
        assert.strictEqual(diags.length, 0);
    });

    test('shift_left shift_right rotate_left rotate_right are not flagged via keywords', () =>
    {
        const diags = findUndeclaredIdentifiers(
            'architecture rtl of top is\n' +
            '  signal a : unsigned(7 downto 0);\n' +
            '  signal b : unsigned(7 downto 0);\n' +
            'begin\n' +
            '  b <= shift_left(a, 1);\n' +
            '  b <= shift_right(a, 2);\n' +
            '  b <= rotate_left(a, 3);\n' +
            '  b <= rotate_right(a, 4);\n' +
            'end architecture;'
        );
        assert.strictEqual(diags.length, 0);
    });
});
