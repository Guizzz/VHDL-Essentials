import * as assert from 'node:assert';
import { findDuplicateSignals } from '../../lint/duplicateSignalsLint';

suite('duplicateSignalsLint', () =>
{
    test('no duplicates produces no diagnostics', () =>
    {
        const diags = findDuplicateSignals(
            'entity top is\n' +
            '  port (clk : in bit; rst : in bit);\n' +
            'end entity;\n' +
            'architecture rtl of top is\n' +
            '  signal s1 : bit;\n' +
            '  signal s2 : bit;\n' +
            'begin\n' +
            'end architecture;'
        );
        assert.strictEqual(diags.length, 0);
    });

    test('duplicate signal declaration is detected', () =>
    {
        const diags = findDuplicateSignals(
            'architecture rtl of top is\n' +
            '  signal s1 : bit;\n' +
            '  signal s1 : bit;\n' +
            'begin\n' +
            'end architecture;'
        );
        assert.strictEqual(diags.length, 1);
        assert.ok(diags[0].message.includes('Duplicate'));
        assert.ok(diags[0].message.includes('s1'));
    });

    test('case-insensitive duplicate is detected', () =>
    {
        const diags = findDuplicateSignals(
            'architecture rtl of top is\n' +
            '  signal S1 : bit;\n' +
            '  signal s1 : bit;\n' +
            'begin\n' +
            'end architecture;'
        );
        assert.strictEqual(diags.length, 1);
    });

    test('duplicate variable is detected', () =>
    {
        const diags = findDuplicateSignals(
            'entity top is end entity;\n' +
            'architecture rtl of top is\n' +
            'begin\n' +
            '  process\n' +
            '    variable v1 : integer;\n' +
            '    variable v1 : integer;\n' +
            '  begin\n' +
            '  end process;\n' +
            'end architecture;'
        );
        assert.strictEqual(diags.length, 1);
    });

    test('duplicate port is detected', () =>
    {
        const diags = findDuplicateSignals(
            'entity top is\n' +
            '  port (clk : in bit; clk : out bit);\n' +
            'end entity;'
        );
        assert.strictEqual(diags.length, 1);
    });

    test('same name different kinds is still a duplicate', () =>
    {
        const diags = findDuplicateSignals(
            'entity top is\n' +
            '  port (clk : in bit);\n' +
            'end entity;\n' +
            'architecture rtl of top is\n' +
            '  signal clk : bit;\n' +
            'begin\n' +
            'end architecture;'
        );
        assert.strictEqual(diags.length, 1);
    });

    test('only the second occurrence is flagged', () =>
    {
        const diags = findDuplicateSignals(
            'architecture rtl of top is\n' +
            '  signal first : bit;\n' +
            '  signal second : bit;\n' +
            '  signal FIRST : bit;\n' +
            'begin\n' +
            'end architecture;'
        );
        assert.strictEqual(diags.length, 1, 'Only the third signal (case-insensitive duplicate) should be flagged');
        assert.ok(diags[0].message.includes('FIRST'));
    });

    test('unique constants are not flagged', () =>
    {
        const diags = findDuplicateSignals(
            'architecture rtl of top is\n' +
            '  constant C1 : integer := 1;\n' +
            '  constant C2 : integer := 2;\n' +
            'begin\n' +
            'end architecture;'
        );
        assert.strictEqual(diags.length, 0);
    });

    test('empty string produces no diagnostics', () =>
    {
        const diags = findDuplicateSignals('');
        assert.strictEqual(diags.length, 0);
    });

    test('no declarations produces no diagnostics', () =>
    {
        const diags = findDuplicateSignals(
            '-- just a comment\n'
        );
        assert.strictEqual(diags.length, 0);
    });
});
