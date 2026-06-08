import * as assert from 'node:assert';
import * as vscode from 'vscode';
import { findUnusedSignals } from '../../lint/unusedSignalsLint';

suite('unusedSignalsLint', () =>
{
    test('signal used in assignment produces no diagnostic', () =>
    {
        const diags = findUnusedSignals(
            'architecture rtl of top is\n' +
            '  signal s1 : bit;\n' +
            'begin\n' +
            '  s1 <= \'1\';\n' +
            'end architecture;'
        );
        assert.strictEqual(diags.length, 0);
    });

    test('unused signal produces warning', () =>
    {
        const diags = findUnusedSignals(
            'architecture rtl of top is\n' +
            '  signal s1 : bit;\n' +
            'begin\n' +
            'end architecture;'
        );
        assert.strictEqual(diags.length, 1);
        assert.ok(diags[0].message.includes('Unused'));
        assert.ok(diags[0].message.includes('s1'));
        assert.strictEqual(diags[0].severity, vscode.DiagnosticSeverity.Warning);
    });

    test('variable used in process produces no diagnostic', () =>
    {
        const diags = findUnusedSignals(
            'entity top is end entity;\n' +
            'architecture rtl of top is\n' +
            'begin\n' +
            '  process\n' +
            '    variable v1 : integer;\n' +
            '  begin\n' +
            '    v1 := 5;\n' +
            '  end process;\n' +
            'end architecture;'
        );
        assert.strictEqual(diags.length, 0);
    });

    test('unused variable produces warning', () =>
    {
        const diags = findUnusedSignals(
            'entity top is end entity;\n' +
            'architecture rtl of top is\n' +
            'begin\n' +
            '  process\n' +
            '    variable v1 : integer;\n' +
            '  begin\n' +
            '    null;\n' +
            '  end process;\n' +
            'end architecture;'
        );
        assert.strictEqual(diags.length, 1);
        assert.ok(diags[0].message.includes('Unused'));
        assert.ok(diags[0].message.includes('v1'));
    });

    test('constant used in expression produces no diagnostic', () =>
    {
        const diags = findUnusedSignals(
            'architecture rtl of top is\n' +
            '  constant C1 : integer := 5;\n' +
            '  signal s1 : integer;\n' +
            'begin\n' +
            '  s1 <= C1;\n' +
            'end architecture;'
        );
        assert.strictEqual(diags.length, 0);
    });

    test('unused constant produces warning', () =>
    {
        const diags = findUnusedSignals(
            'architecture rtl of top is\n' +
            '  constant C1 : integer := 5;\n' +
            'begin\n' +
            'end architecture;'
        );
        assert.strictEqual(diags.length, 1);
        assert.ok(diags[0].message.includes('Unused'));
        assert.ok(diags[0].message.includes('C1'));
    });

    test('mixed used and unused signals only flags unused', () =>
    {
        const diags = findUnusedSignals(
            'architecture rtl of top is\n' +
            '  signal used_sig : bit;\n' +
            '  signal unused_sig : bit;\n' +
            'begin\n' +
            '  used_sig <= \'1\';\n' +
            'end architecture;'
        );
        assert.strictEqual(diags.length, 1);
        assert.ok(diags[0].message.includes('unused_sig'));
    });

    test('port declarations are skipped', () =>
    {
        const diags = findUnusedSignals(
            'entity top is\n' +
            '  port (clk : in bit; rst : in bit);\n' +
            'end entity;\n' +
            'architecture rtl of top is\n' +
            'begin\n' +
            'end architecture;'
        );
        assert.strictEqual(diags.length, 0);
    });

    test('case-insensitive usage is detected', () =>
    {
        const diags = findUnusedSignals(
            'architecture rtl of top is\n' +
            '  signal DATA : bit;\n' +
            'begin\n' +
            '  data <= \'1\';\n' +
            'end architecture;'
        );
        assert.strictEqual(diags.length, 0);
    });

    test('signal used in port map is detected', () =>
    {
        const diags = findUnusedSignals(
            'architecture rtl of top is\n' +
            '  signal clk_in : bit;\n' +
            '  signal rst_in : bit;\n' +
            'begin\n' +
            '  uut : entity work.ent\n' +
            '    port map (clk => clk_in, rst => rst_in);\n' +
            'end architecture;'
        );
        assert.strictEqual(diags.length, 0);
    });

    test('signal used in sensitivity list is detected', () =>
    {
        const diags = findUnusedSignals(
            'architecture rtl of top is\n' +
            '  signal clk : bit;\n' +
            '  signal rst : bit;\n' +
            'begin\n' +
            '  process(clk, rst)\n' +
            '  begin\n' +
            '  end process;\n' +
            'end architecture;'
        );
        assert.strictEqual(diags.length, 0);
    });

    test('usage in comment does not count', () =>
    {
        const diags = findUnusedSignals(
            'architecture rtl of top is\n' +
            '  signal s1 : bit;\n' +
            'begin\n' +
            '  -- s1 is used here (but only in comment)\n' +
            'end architecture;'
        );
        assert.strictEqual(diags.length, 1);
    });

    test('signal used in if condition is detected', () =>
    {
        const diags = findUnusedSignals(
            'architecture rtl of top is\n' +
            '  signal rst : bit;\n' +
            'begin\n' +
            '  process\n' +
            '  begin\n' +
            '    if rst = \'1\' then\n' +
            '      null;\n' +
            '    end if;\n' +
            '  end process;\n' +
            'end architecture;'
        );
        assert.strictEqual(diags.length, 0);
    });

    test('empty text produces no diagnostics', () =>
    {
        const diags = findUnusedSignals('');
        assert.strictEqual(diags.length, 0);
    });

    test('no declarations produces no diagnostics', () =>
    {
        const diags = findUnusedSignals(
            '-- just a comment\n'
        );
        assert.strictEqual(diags.length, 0);
    });

    test('signal with keyword name is skipped', () =>
    {
        const diags = findUnusedSignals(
            'architecture rtl of top is\n' +
            '  signal all : bit;\n' +
            'begin\n' +
            'end architecture;'
        );
        assert.strictEqual(diags.length, 0);
    });
});
