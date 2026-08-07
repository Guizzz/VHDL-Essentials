import * as assert from 'node:assert';
import { formatVhdl, resolveFormatOptions } from '../../utils/vhdlFormatterCore';

const OPTIONS = {
    indentSize: 4,
    insertSpaces: true,
};

suite('resolveFormatOptions', () =>
{
    const EDITOR = { tabSize: 2, insertSpaces: false };

    test('uses config values when present', () =>
    {
        assert.deepStrictEqual(
            resolveFormatOptions({ indentSize: 4, insertSpaces: true }, EDITOR),
            { indentSize: 4, insertSpaces: true }
        );
    });

    test('falls back to editor options when config missing', () =>
    {
        assert.deepStrictEqual(
            resolveFormatOptions({}, EDITOR),
            { indentSize: 2, insertSpaces: false }
        );
    });

    test('partial config keeps editor fallback for missing key', () =>
    {
        assert.deepStrictEqual(
            resolveFormatOptions({ indentSize: 8 }, EDITOR),
            { indentSize: 8, insertSpaces: false }
        );

        assert.deepStrictEqual(
            resolveFormatOptions({ insertSpaces: true }, EDITOR),
            { indentSize: 2, insertSpaces: true }
        );
    });

    test('explicit false insertSpaces is honored', () =>
    {
        assert.deepStrictEqual(
            resolveFormatOptions({ insertSpaces: false }, EDITOR),
            { indentSize: 2, insertSpaces: false }
        );
    });

    test('config wins over editor options', () =>
    {
        assert.deepStrictEqual(
            resolveFormatOptions({ indentSize: 4, insertSpaces: true }, { tabSize: 2, insertSpaces: false }),
            { indentSize: 4, insertSpaces: true }
        );
    });
});

suite('config-driven formatting', () =>
{
    test('indentSize config changes output', () =>
    {
        const input =
`entity counter is
port (
clk : in std_logic
);
end entity counter;`;

        const opts = resolveFormatOptions({ indentSize: 2 }, { tabSize: 4, insertSpaces: true });
        const expected =
`entity counter is
  port (
    clk : in std_logic
  );
end entity counter;`;

        assert.strictEqual(formatVhdl(input, opts), expected);
    });

    test('insertSpaces false config emits tabs', () =>
    {
        const input =
`entity counter is
port (
clk : in std_logic
);
end entity counter;`;

        const opts = resolveFormatOptions({ insertSpaces: false }, { tabSize: 4, insertSpaces: true });
        const expected =
`entity counter is
\tport (
\t\tclk : in std_logic
\t);
end entity counter;`;

        assert.strictEqual(formatVhdl(input, opts), expected);
    });
});

suite('vhdlFormatter', () =>
{
    suite('indentation', () =>
    {
        test('entity with port declarations', () =>
        {
            const input =
`entity counter is
port (
clk : in std_logic;
dout : out std_logic_vector(7 downto 0)
);
end entity counter;`;

            const expected =
`entity counter is
    port (
        clk : in std_logic;
        dout : out std_logic_vector(7 downto 0)
    );
end entity counter;`;

            assert.strictEqual(formatVhdl(input, OPTIONS), expected);
        });

        test('architecture with signals and begin/end', () =>
        {
            const input =
`architecture rtl of counter is
signal tmp : std_logic;
begin
end architecture rtl;`;

            const expected =
`architecture rtl of counter is
    signal tmp : std_logic;
begin
end architecture rtl;`;

            assert.strictEqual(formatVhdl(input, OPTIONS), expected);
        });

        test('process with sensitivity list', () =>
        {
            const input =
`architecture rtl of foo is
begin
process (clk, rst) is
begin
if rst = '1' then
q <= '0';
elsif rising_edge(clk) then
q <= d;
end if;
end process;
end architecture rtl;`;

            const expected =
`architecture rtl of foo is
begin
    process (clk, rst) is
    begin
        if rst = '1' then
            q <= '0';
        elsif rising_edge(clk) then
            q <= d;
        end if;
    end process;
end architecture rtl;`;

            assert.strictEqual(formatVhdl(input, OPTIONS), expected);
        });

        test('nested if-elsif-else inside process', () =>
        {
            const input =
`architecture rtl of nested is
begin
process (clk) is
begin
if rst = '1' then
counter <= (others => '0');
elsif rising_edge(clk) then
if en = '1' then
counter <= counter + 1;
else
counter <= counter;
end if;
end if;
end process;
end architecture rtl;`;

            const expected =
`architecture rtl of nested is
begin
    process (clk) is
    begin
        if rst = '1' then
            counter <= (others => '0');
        elsif rising_edge(clk) then
            if en = '1' then
                counter <= counter + 1;
            else
                counter <= counter;
            end if;
        end if;
    end process;
end architecture rtl;`;

            assert.strictEqual(formatVhdl(input, OPTIONS), expected);
        });

        test('case-when inside process', () =>
        {
            const input =
`architecture rtl of mux is
begin
process (sel, a, b, c, d) is
begin
case sel is
when "00" =>
y <= a;
when "01" =>
y <= b;
when others =>
y <= '0';
end case;
end process;
end architecture rtl;`;

            const expected =
`architecture rtl of mux is
begin
    process (sel, a, b, c, d) is
    begin
        case sel is
            when "00" =>
                y <= a;
            when "01" =>
                y <= b;
            when others =>
                y <= '0';
        end case;
    end process;
end architecture rtl;`;

            assert.strictEqual(formatVhdl(input, OPTIONS), expected);
        });

        test('for loop inside process', () =>
        {
            const input =
`architecture rtl of shift is
begin
process (clk) is
begin
if rising_edge(clk) then
for i in 0 to 7 loop
shift_reg(i) <= d(i);
end loop;
end if;
end process;
end architecture rtl;`;

            const expected =
`architecture rtl of shift is
begin
    process (clk) is
    begin
        if rising_edge(clk) then
            for i in 0 to 7 loop
                shift_reg(i) <= d(i);
            end loop;
        end if;
    end process;
end architecture rtl;`;

            assert.strictEqual(formatVhdl(input, OPTIONS), expected);
        });

        test('for-generate', () =>
        {
            const input =
`architecture rtl of gen is
begin
gen_label : for i in 0 to 3 generate
inst : entity work.dff
port map (
clk => clk,
d => d_in(i),
q => q_out(i)
);
end generate;
end architecture rtl;`;

            const expected =
`architecture rtl of gen is
begin
    gen_label : for i in 0 to 3 generate
        inst : entity work.dff
        port map (
            clk => clk,
            d => d_in(i),
            q => q_out(i)
        );
    end generate;
end architecture rtl;`;

            assert.strictEqual(formatVhdl(input, OPTIONS), expected);
        });
    });

    suite('comments', () =>
    {
        test('preserves trailing comments', () =>
        {
            const input =
`architecture rtl of foo is
begin
process (clk) is -- sensitivity list
begin
if rst = '1' then -- reset
q <= '0'; -- clear output
end if;
end process;
end architecture rtl;`;

            const result = formatVhdl(input, OPTIONS);
            assert.ok(result.includes('-- sensitivity list'));
            assert.ok(result.includes('-- reset'));
            assert.ok(result.includes('-- clear output'));
            assert.ok(result.includes('    process (clk) is -- sensitivity list'));
        });

        test('preserves standalone comment lines', () =>
        {
            const input =
`entity counter is
-- This is a comment
port (
clk : in std_logic
);
end entity counter;`;

            const result = formatVhdl(input, OPTIONS);
            assert.ok(result.includes('-- This is a comment'));
        });
    });

    suite('edge cases', () =>
    {
        test('empty string', () =>
        {
            assert.strictEqual(formatVhdl('', OPTIONS), '');
        });

        test('single line', () =>
        {
            const input = 'library ieee;\n';
            assert.strictEqual(formatVhdl(input, OPTIONS), 'library ieee;\n');
        });

        test('concurrent assignments at architecture level', () =>
        {
            const input =
`architecture rtl of foo is
begin
led <= clk and en;
pulse <= '1' when cnt = 0 else '0';
end architecture rtl;`;

            const expected =
`architecture rtl of foo is
begin
    led <= clk and en;
    pulse <= '1' when cnt = 0 else '0';
end architecture rtl;`;

            assert.strictEqual(formatVhdl(input, OPTIONS), expected);
        });

        test('multiple entities in one file', () =>
        {
            const input =
`entity foo is
port (
a : in std_logic
);
end entity foo;

architecture rtl of foo is
begin
end architecture rtl;

entity bar is
port (
b : in std_logic
);
end entity bar;

architecture rtl of bar is
begin
end architecture rtl;`;

            const expected =
`entity foo is
    port (
        a : in std_logic
    );
end entity foo;

architecture rtl of foo is
begin
end architecture rtl;

entity bar is
    port (
        b : in std_logic
    );
end entity bar;

architecture rtl of bar is
begin
end architecture rtl;`;

            assert.strictEqual(formatVhdl(input, OPTIONS), expected);
        });

        test('tab indentation mode', () =>
        {
            const input =
`entity counter is
port (
clk : in std_logic
);
end entity counter;`;

            const expected =
`entity counter is
\tport (
\t\tclk : in std_logic
\t);
end entity counter;`;

            assert.strictEqual(formatVhdl(input, {
                ...OPTIONS,
                insertSpaces: false,
            }), expected);
        });

        test('indent size 2', () =>
        {
            const input =
`entity counter is
port (
clk : in std_logic
);
end entity counter;`;

            const expected =
`entity counter is
  port (
    clk : in std_logic
  );
end entity counter;`;

            assert.strictEqual(formatVhdl(input, {
                ...OPTIONS,
                indentSize: 2,
            }), expected);
        });
    });

    suite('library and use clauses', () =>
    {
        test('preserves library and use clauses', () =>
        {
            const input =
`library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity counter is
port (
clk : in std_logic;
cnt : out std_logic_vector(7 downto 0)
);
end entity counter;`;

            const expected =
`library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity counter is
    port (
        clk : in std_logic;
        cnt : out std_logic_vector(7 downto 0)
    );
end entity counter;`;

            assert.strictEqual(formatVhdl(input, OPTIONS), expected);
        });
    });

    suite('blinky.vhd golden test', () =>
    {
        test('formats the canonical blinky example', () =>
        {
            const input =
`library ieee;
use ieee.std_logic_1164.all;

entity blinky is
port (
clk : in std_logic;
rst : in std_logic;
led : out std_logic
);
end entity blinky;

architecture rtl of blinky is
signal pulse_500ms : std_logic;
signal led_reg : std_logic;
begin
led <= led_reg;
end architecture rtl;`;

            const expected =
`library ieee;
use ieee.std_logic_1164.all;

entity blinky is
    port (
        clk : in std_logic;
        rst : in std_logic;
        led : out std_logic
    );
end entity blinky;

architecture rtl of blinky is
    signal pulse_500ms : std_logic;
    signal led_reg : std_logic;
begin
    led <= led_reg;
end architecture rtl;`;

            assert.strictEqual(formatVhdl(input, OPTIONS), expected);
        });
    });

    suite('stability: formatting is idempotent', () =>
    {
        test('already formatted VHDL stays unchanged', () =>
        {
            const input =
`library ieee;
use ieee.std_logic_1164.all;

entity counter is
    port (
        clk : in std_logic
    );
end entity counter;

architecture rtl of counter is
begin
end architecture rtl;`;

            const result = formatVhdl(input, OPTIONS);
            assert.strictEqual(result, formatVhdl(result, OPTIONS));
        });
    });
});
