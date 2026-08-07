import * as assert from 'node:assert';
import { checkSensitivityList } from '../../lint/sensitivityLint';

const COUNTER_VHD =
`library ieee;
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

suite('sensitivityLint', () =>
{
    suite('valid sensitivity lists', () =>
    {
        test('counter.vhd: synchronous process with clk, rst in sensitivity list', () =>
        {
            const diags = checkSensitivityList(COUNTER_VHD);
            const warnings = diags.filter(d => d.severity === 1 || d.severity === 3);
            assert.strictEqual(warnings.length, 0, `Got: ${diags.map(d => d.message).join(', ')}`);
        });

        test('process with (all) is skipped', () =>
        {
            const diags = checkSensitivityList(
                'process(all) begin x <= y; end process;'
            );
            assert.strictEqual(diags.length, 0);
        });

        test('no process means no diagnostics', () =>
        {
            const diags = checkSensitivityList(
                'entity top is end entity;'
            );
            assert.strictEqual(diags.length, 0);
        });

        test('empty string has no diagnostics', () =>
        {
            const diags = checkSensitivityList('');
            assert.strictEqual(diags.length, 0);
        });

        test('combinatorial process with complete sensitivity list', () =>
        {
            const diags = checkSensitivityList(
                'entity top is end entity;\n' +
                'architecture rtl of top is\n' +
                '  signal a, b, c : bit;\n' +
                'begin\n' +
                '  process(a, b)\n' +
                '  begin\n' +
                '    c <= a and b;\n' +
                '  end process;\n' +
                'end architecture;'
            );
            const warnings = diags.filter(d => d.severity === 1);
            assert.strictEqual(warnings.length, 0, `Got: ${diags.map(d => d.message).join(', ')}`);
        });
    });

    suite('missing signals in sensitivity list', () =>
    {
        test('combinatorial process missing a read signal', () =>
        {
            const diags = checkSensitivityList(
                'entity top is end entity;\n' +
                'architecture rtl of top is\n' +
                '  signal a, b, c : bit;\n' +
                'begin\n' +
                '  process(a)\n' +
                '  begin\n' +
                '    c <= a and b;\n' +
                '  end process;\n' +
                'end architecture;'
            );
            const missing = diags.find(d => d.message.includes("missing"));
            assert.ok(missing, 'Should detect missing signal');
            assert.ok(missing!.message.includes('b'));
        });

        test('sync process extra signal in sensitivity list is not flagged as unnecessary', () =>
        {
            const diags = checkSensitivityList(
                'entity top is end entity;\n' +
                'architecture rtl of top is\n' +
                '  signal clk, rst, en : bit;\n' +
                'begin\n' +
                '  process(clk, rst, en)\n' +
                '  begin\n' +
                '    if rising_edge(clk) then\n' +
                '      if en = \'1\' then\n' +
                '        null;\n' +
                '      end if;\n' +
                '    end if;\n' +
                '  end process;\n' +
                'end architecture;'
            );
            const unnecessary = diags.find(d => d.message.includes('Unnecessary'));
            assert.strictEqual(unnecessary, undefined, 'Extra signal in sync process sensitivity list is not flagged');
        });

        test('if condition signals are detected in combinatorial process', () =>
        {
            const diags = checkSensitivityList(
                'entity top is end entity;\n' +
                'architecture rtl of top is\n' +
                '  signal a, b, c : bit;\n' +
                'begin\n' +
                '  process(a)\n' +
                '  begin\n' +
                '    if a = \'1\' and b = \'1\' then\n' +
                '      c <= \'1\';\n' +
                '    end if;\n' +
                '  end process;\n' +
                'end architecture;'
            );
            const missing = diags.find(d => d.message.includes('b'));
            assert.ok(missing, 'If condition signals should be in sensitivity list');
        });
    });

    suite('unnecessary signals in sensitivity list', () =>
    {
        test('combinatorial process with unused signal in list', () =>
        {
            const diags = checkSensitivityList(
                'entity top is end entity;\n' +
                'architecture rtl of top is\n' +
                '  signal a, b, c, d : bit;\n' +
                'begin\n' +
                '  process(a, b, d)\n' +
                '  begin\n' +
                '    c <= a and b;\n' +
                '  end process;\n' +
                'end architecture;'
            );
            const unnecessary = diags.find(d => d.message.includes('Unnecessary'));
            assert.ok(unnecessary, 'Should flag unused signal in sensitivity list');
            assert.ok(unnecessary!.message.includes('d'));
        });

        test('sync process skips unnecessary check', () =>
        {
            const diags = checkSensitivityList(
                'entity top is end entity;\n' +
                'architecture rtl of top is\n' +
                '  signal clk, rst, junk : bit;\n' +
                'begin\n' +
                '  process(clk, rst, junk)\n' +
                '  begin\n' +
                '    if rising_edge(clk) then\n' +
                '      null;\n' +
                '    end if;\n' +
                '  end process;\n' +
                'end architecture;'
            );
            const unnecessary = diags.find(d => d.message.includes('Unnecessary'));
            assert.strictEqual(unnecessary, undefined, 'Sync processes skip unnecessary signal check');
        });
    });

    suite('case statement in combinatorial', () =>
    {
        test('case expression signal in sensitivity list is sufficient', () =>
        {
            const diags = checkSensitivityList(
                'entity top is end entity;\n' +
                'architecture rtl of top is\n' +
                '  signal sel, a, b, c : bit;\n' +
                'begin\n' +
                '  process(sel, a, b)\n' +
                '  begin\n' +
                '    case sel is\n' +
                '      when \'0\' => c <= a;\n' +
                '      when \'1\' => c <= b;\n' +
                '    end case;\n' +
                '  end process;\n' +
                'end architecture;'
            );
            const missing = diags.filter(d => d.message.includes('missing'));
            assert.strictEqual(missing.length, 0, 'All read signals are in sensitivity list');
        });

        test('case expression signal missing from sensitivity list', () =>
        {
            const diags = checkSensitivityList(
                'entity top is end entity;\n' +
                'architecture rtl of top is\n' +
                '  signal sel, c : bit;\n' +
                'begin\n' +
                '  process()\n' +
                '  begin\n' +
                '    case sel is\n' +
                '      when \'0\' => c <= \'1\';\n' +
                '      when \'1\' => c <= \'0\';\n' +
                '    end case;\n' +
                '  end process;\n' +
                'end architecture;'
            );
            const missing = diags.find(d => d.message.includes('sel'));
            assert.ok(missing, 'sel should be detected as missing from sensitivity list');
        });
    });

    suite('labelled processes', () =>
    {
        test('labelled process is handled correctly', () =>
        {
            const diags = checkSensitivityList(
                'entity top is end entity;\n' +
                'architecture rtl of top is\n' +
                '  signal clk, rst, q : bit;\n' +
                'begin\n' +
                '  seq_proc : process(clk, rst)\n' +
                '  begin\n' +
                '    if rising_edge(clk) then\n' +
                '      q <= \'1\';\n' +
                '    end if;\n' +
                '  end process;\n' +
                'end architecture;'
            );
            const warnings = diags.filter(d => d.severity === 1);
            assert.strictEqual(warnings.length, 0);
        });
    });

    suite('attribute expressions and character literals', () =>
    {
        test('attribute target/name (integer\'image) is not treated as a signal read', () =>
        {
            const diags = checkSensitivityList(
                'entity tb is end entity;\n' +
                'architecture sim of tb is\n' +
                '  signal cnt : integer;\n' +
                '  signal out_str : string;\n' +
                'begin\n' +
                '  process()\n' +
                '  begin\n' +
                '    out_str <= integer\'image(cnt);\n' +
                '  end process;\n' +
                'end architecture;'
            );
            const missing = diags.map(d => d.message);
            assert.ok(missing.some(m => m.includes('cnt')),
                `cnt is a real read signal: ${missing.join(', ')}`);
            assert.ok(!missing.some(m => m.includes('integer') || m.includes('image')),
                `Attribute target/name should not be flagged: ${missing.join(', ')}`);
        });

        test('character literals are not treated as signal reads', () =>
        {
            const diags = checkSensitivityList(
                'entity tb is end entity;\n' +
                'architecture sim of tb is\n' +
                '  signal a : bit;\n' +
                '  signal c : bit;\n' +
                'begin\n' +
                '  process(a)\n' +
                '  begin\n' +
                '    c <= a;\n' +
                '    if a = \'x\' then\n' +
                '      null;\n' +
                '    end if;\n' +
                '  end process;\n' +
                'end architecture;'
            );
            const warnings = diags.filter(d => d.severity === 1);
            assert.strictEqual(warnings.length, 0, `Got: ${diags.map(d => d.message).join(', ')}`);
        });

        test('clk\'event still reads clk via the edge comparison', () =>
        {
            const diags = checkSensitivityList(
                'entity tb is end entity;\n' +
                'architecture sim of tb is\n' +
                '  signal clk : bit;\n' +
                '  signal q : bit;\n' +
                'begin\n' +
                '  process(clk)\n' +
                '  begin\n' +
                '    if clk\'event and clk = \'1\' then\n' +
                '      q <= \'1\';\n' +
                '    end if;\n' +
                '  end process;\n' +
                'end architecture;'
            );
            const warnings = diags.filter(d => d.severity === 1);
            assert.strictEqual(warnings.length, 0, `Got: ${diags.map(d => d.message).join(', ')}`);
        });
    });
});
