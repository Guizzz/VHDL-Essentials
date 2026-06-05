import * as assert from 'node:assert';
import { validateSyntax } from '../../lint/syntaxLint';

const BLINKY_VHD =
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

const CLK_DIV_VHD =
`library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity clk_div is
    port (
        clk      : in  std_logic;
        rst      : in  std_logic;
        max_cnt  : in  std_logic_vector(31 downto 0);
        pulse    : out std_logic
    );
end entity clk_div;

architecture rtl of clk_div is
    signal counter : unsigned(31 downto 0);
    signal done    : std_logic;
begin
    process(clk, rst)
        variable temp : unsigned(31 downto 0);
    begin
        if rst = '1' then
            counter <= (others => '0');
            done    <= '0';
        elsif rising_edge(clk) then
            if counter >= unsigned(max_cnt) then
                counter <= (others => '0');
                done    <= '1';
            else
                counter <= counter + 1;
                done    <= '0';
            end if;
        end if;
    end process;

    pulse <= done;
end architecture rtl;`;

suite('syntaxLint', () =>
{
    suite('valid VHDL files produce no errors', () =>
    {
        test('blinky.vhd has no syntax errors', () =>
        {
            const diags = validateSyntax(BLINKY_VHD);
            const errors = diags.filter(d => d.severity === 0 || d.severity === 1);
            assert.strictEqual(errors.length, 0, `Got errors: ${diags.map(d => d.message).join(', ')}`);
        });

        test('clk_div.vhd has no syntax errors', () =>
        {
            const diags = validateSyntax(CLK_DIV_VHD);
            const errors = diags.filter(d => d.severity === 0 || d.severity === 1);
            assert.strictEqual(errors.length, 0, `Got errors: ${diags.map(d => d.message).join(', ')}`);
        });

        test('empty string has no errors', () =>
        {
            const diags = validateSyntax('');
            assert.strictEqual(diags.length, 0);
        });
    });

    suite('scope detection', () =>
    {
        test('unclosed entity is detected', () =>
        {
            const diags = validateSyntax(
                'entity top is\n' +
                '    port (x : in bit);\n'
            );
            const unclosed = diags.find(d => d.message.includes('Unclosed'));
            assert.ok(unclosed, 'Should detect unclosed entity');
            assert.ok(unclosed!.message.includes('entity'));
        });

        test('unclosed architecture is detected', () =>
        {
            const diags = validateSyntax(
                'entity top is end entity;\n' +
                'architecture rtl of top is\n' +
                'begin\n'
            );
            const unclosed = diags.find(d => d.message.includes('Unclosed'));
            assert.ok(unclosed, 'Should detect unclosed architecture');
        });

        test('end without matching scope is detected', () =>
        {
            const diags = validateSyntax(
                'end entity;\n'
            );
            const noMatch = diags.find(d => d.message.includes('without matching'));
            assert.ok(noMatch);
        });

        test('bare end with space closes only the innermost scope', () =>
        {
            const diags = validateSyntax(
                'architecture rtl of top is\n' +
                'begin\n' +
                '  process(clk) is\n' +
                '  begin\n' +
                '    x <= y;\n' +
                '  end ;\n' +
                'end architecture rtl;'
            );
            const errors = diags.filter(d => d.severity === 0 || d.severity === 1);
            assert.strictEqual(errors.length, 0, `Got: ${diags.map(d => d.message).join(', ')}`);
        });
    });

    suite('scope type mismatch', () =>
    {
        test('end entity mismatched with architecture', () =>
        {
            const diags = validateSyntax(
                'entity top is\n' +
                'begin\n' +
                'end entity;\n' +
                'architecture rtl of top is\n' +
                'begin\n' +
                'end entity;'
            );
            const mismatch = diags.find(d => d.message.includes("does not match"));
            assert.ok(mismatch);
        });

        test('end names must match', () =>
        {
            const diags = validateSyntax(
                'entity top is\n' +
                'end entity top;\n' +
                'architecture rtl of top is\n' +
                'begin\n' +
                'end architecture rtl;'
            );
            const errors = diags.filter(d => d.severity === 0 || d.severity === 1);
            assert.strictEqual(errors.length, 0, `Got: ${diags.map(d => d.message).join(', ')}`);
        });
    });

    suite('begin detection', () =>
    {
        test('architecture without begin is warned', () =>
        {
            const diags = validateSyntax(
                'entity top is end entity;\n' +
                'architecture rtl of top is\n' +
                'end architecture rtl;'
            );
            const noBegin = diags.find(d => d.message.includes("without 'begin'"));
            assert.ok(noBegin);
        });

        test('process without begin is detected', () =>
        {
            const diags = validateSyntax(
                'entity top is end entity;\n' +
                'architecture rtl of top is\n' +
                'begin\n' +
                '    process(clk) is\n' +
                '    end process;\n' +
                'end architecture rtl;'
            );
            const noBegin = diags.find(d => d.message.includes("process") && d.message.includes("without 'begin'"));
            assert.ok(noBegin);
        });

        test('begin outside any scope is warned', () =>
        {
            const diags = validateSyntax('begin');
            const outside = diags.find(d => d.message.includes("outside any scope"));
            assert.ok(outside);
        });
    });

    suite('else / elsif / when', () =>
    {
        test('else without if is detected', () =>
        {
            const diags = validateSyntax(
                'entity top is end entity;\n' +
                'architecture rtl of top is\n' +
                'begin\n' +
                '    else\n' +
                'end architecture rtl;'
            );
            const noIf = diags.find(d => d.message.includes("else") && d.message.includes("without"));
            assert.ok(noIf);
        });

        test('elsif without if is detected', () =>
        {
            const diags = validateSyntax(
                'elsif x = 1 then'
            );
            const noIf = diags.find(d => d.message.includes("elsif") && d.message.includes("without"));
            assert.ok(noIf);
        });

        test('when outside case/generate is detected', () =>
        {
            const diags = validateSyntax(
                'entity top is end entity;\n' +
                'architecture rtl of top is\n' +
                'begin\n' +
                '    when idle =>\n' +
                'end architecture rtl;'
            );
            const outside = diags.find(d => d.message.includes("'when' outside"));
            assert.ok(outside);
        });
    });

    suite('parentheses balancing', () =>
    {
        test('unbalanced open paren is detected', () =>
        {
            const diags = validateSyntax(
                'entity top is\n' +
                '    port ( x : in bit;\n' +
                'end entity;'
            );
            const unbalanced = diags.find(d => d.message.includes('Unbalanced'));
            assert.ok(unbalanced);
        });

        test('balanced parentheses produce no error', () =>
        {
            const diags = validateSyntax(
                'signal x : std_logic_vector(7 downto 0);'
            );
            const unbalanced = diags.find(d => d.message.includes('Unbalanced'));
            assert.strictEqual(unbalanced, undefined);
        });
    });

    suite('missing semicolon', () =>
    {
        test('missing semicolon on assignment is detected', () =>
        {
            const diags = validateSyntax(
                'entity top is end entity;\n' +
                'architecture rtl of top is\n' +
                'begin\n' +
                '    x <= y\n' +
                'end architecture rtl;'
            );
            const missing = diags.find(d => d.message.includes("Missing ';'"));
            assert.ok(missing);
        });

        test('lines ending with comma or bracket are not flagged', () =>
        {
            const diags = validateSyntax(
                'port (\n' +
                '    x : in bit;\n' +
                '    y : in bit\n' +
                ');'
            );
            const missing = diags.find(d => d.message.includes("Missing ';'"));
            assert.strictEqual(missing, undefined);
        });

        test('library/use statements are not flagged', () =>
        {
            const diags = validateSyntax(
                'library ieee\n' +
                'use ieee.std_logic_1164.all\n'
            );
            const missing = diags.find(d => d.message.includes("Missing ';'"));
            assert.strictEqual(missing, undefined);
        });

        test('entity/component label lines are not flagged', () =>
        {
            const diags = validateSyntax(
                'u_inst : entity work.top\n'
            );
            const missing = diags.find(d => d.message.includes("Missing ';'"));
            assert.strictEqual(missing, undefined);
        });
    });

    suite('assert blocks are skipped', () =>
    {
        test('assert with report and severity does not trigger errors', () =>
        {
            const diags = validateSyntax(
                'architecture sim of tb is\n' +
                'begin\n' +
                '    assert false\n' +
                '        report "done"\n' +
                '        severity note;\n' +
                'end architecture sim;'
            );
            const errors = diags.filter(d => d.severity === 0 || d.severity === 1);
            assert.strictEqual(errors.length, 0);
        });
    });

    suite('entity missing "is" is detected', () =>
    {
        test('entity without is is flagged', () =>
        {
            const diags = validateSyntax(
                'entity top\n' +
                'end entity;'
            );
            const missing = diags.find(d => d.message.includes("missing 'is'"));
            assert.ok(missing);
        });
    });

    suite('unknown end type', () =>
    {
        test('end widget is flagged as unknown', () =>
        {
            const diags = validateSyntax(
                'entity top is\n' +
                'end widget;'
            );
            const unknown = diags.find(d => d.message.includes("Unknown 'end' type"));
            assert.ok(unknown);
        });
    });
});
