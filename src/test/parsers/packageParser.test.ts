import * as assert from 'node:assert';
import { parsePackages } from '../../parsers/packageParser';

suite('packageParser', () =>
{
    test('parse package with constants', () =>
    {
        const result = parsePackages(`package cpu_pkg is
            constant WIDTH : positive := 32;
            constant VERSION : string := "2.0";
        end package;`);

        assert.strictEqual(result.length, 1);
        assert.strictEqual(result[0].name, 'cpu_pkg');
        assert.strictEqual(result[0].symbols.length, 2);
        assert.strictEqual(result[0].symbols[0].kind, 'constant');
        assert.strictEqual(result[0].symbols[0].name, 'WIDTH');
        assert.strictEqual(result[0].symbols[0].type, 'positive');
        assert.strictEqual(result[0].symbols[0].value, '32');
    });

    test('parse package with types and subtypes', () =>
    {
        const result = parsePackages(`package types_pkg is
            type state_t is (idle, active, done);
            subtype word_t is std_logic_vector(31 downto 0);
        end package;`);

        assert.strictEqual(result.length, 1);
        assert.strictEqual(result[0].symbols.length, 2);
        assert.strictEqual(result[0].symbols[0].kind, 'type');
        assert.strictEqual(result[0].symbols[0].name, 'state_t');
        assert.strictEqual(result[0].symbols[1].kind, 'subtype');
        assert.strictEqual(result[0].symbols[1].name, 'word_t');
    });

    test('parse package with signals', () =>
    {
        const result = parsePackages(`package global_sigs is
            signal sys_clk : std_logic;
            signal sys_rst : std_logic;
        end package global_sigs;`);

        assert.strictEqual(result.length, 1);
        assert.strictEqual(result[0].symbols.length, 2);
        assert.strictEqual(result[0].symbols[0].kind, 'signal');
        assert.strictEqual(result[0].symbols[0].name, 'sys_clk');
    });

    test('parse package with functions and procedures', () =>
    {
        const result = parsePackages(`package utils is
            function clog2 (x : positive) return natural;
            procedure reset_all (signal rst : out std_logic);
        end package;`);

        assert.strictEqual(result.length, 1);
        assert.strictEqual(result[0].symbols.length, 2);
        assert.strictEqual(result[0].symbols[0].kind, 'function');
        assert.strictEqual(result[0].symbols[0].name, 'clog2');
        assert.strictEqual(result[0].symbols[1].kind, 'procedure');
        assert.strictEqual(result[0].symbols[1].name, 'reset_all');
    });

    test('parse multiple packages in same file', () =>
    {
        const result = parsePackages(`package pkg_a is
            constant A : natural := 1;
        end package;

        package pkg_b is
            constant B : natural := 2;
        end package;`);

        assert.strictEqual(result.length, 2);
        assert.strictEqual(result[0].name, 'pkg_a');
        assert.strictEqual(result[1].name, 'pkg_b');
    });

    test('skip symbols outside package blocks', () =>
    {
        const result = parsePackages(`library ieee;
            signal dangling : std_logic;
            package my_pkg is
                constant OK : boolean := true;
            end package;
            variable orphan : integer;`);

        assert.strictEqual(result.length, 1);
        assert.strictEqual(result[0].symbols.length, 1);
        assert.strictEqual(result[0].symbols[0].name, 'OK');
    });

    test('return empty array for empty string', () =>
    {
        const result = parsePackages('');
        assert.strictEqual(result.length, 0);
    });

    test('return empty array for text without packages', () =>
    {
        const result = parsePackages(`entity not_a_package is end entity;`);
        assert.strictEqual(result.length, 0);
    });

    test('preserve offset values', () =>
    {
        const text = `library ieee;
        package offset_pkg is
            constant X : natural := 0;
        end package;`;
        const result = parsePackages(text);

        assert.strictEqual(result.length, 1);
        assert.ok(result[0].offset >= 0);
        assert.strictEqual(
            text.substring(result[0].offset, result[0].offset + 7),
            'package'
        );
    });
});
