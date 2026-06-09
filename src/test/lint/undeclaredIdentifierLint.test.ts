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
            '  begin\n' +
            '    for i in 0 to 7 loop\n' +
            '      null;\n' +
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
});
