import * as assert from 'node:assert';
import { extractPackageDeclaredNames, extractPackageImplementedNames } from '../../lint/packageBodyLint';

const COMMON_PKG =
`library ieee;
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

const DEMO_PKG =
`library ieee;
use ieee.std_logic_1164.all;

package demo_pkg is
    constant CLK_FREQ : positive := 50_000_000;
    constant BLINK_MS : positive := 500;
    constant MAX_COUNT : positive := CLK_FREQ * BLINK_MS / 1000;

    subtype led_state_t is std_logic;

    signal global_reset : std_logic;
end package demo_pkg;`;

suite('packageBodyLint', () =>
{
    suite('extractPackageDeclaredNames', () =>
    {
        test('find function declared in package', () =>
        {
            const declared = extractPackageDeclaredNames(COMMON_PKG);
            assert.strictEqual(declared.size, 1);
            assert.ok(declared.has('clog2'));
        });

        test('no functions declared returns empty map', () =>
        {
            const declared = extractPackageDeclaredNames(DEMO_PKG);
            assert.strictEqual(declared.size, 0);
        });

        test('empty string returns empty map', () =>
        {
            const declared = extractPackageDeclaredNames('');
            assert.strictEqual(declared.size, 0);
        });

        test('no package declaration returns empty map', () =>
        {
            const declared = extractPackageDeclaredNames(
                'architecture rtl of top is begin end;'
            );
            assert.strictEqual(declared.size, 0);
        });

        test('multiple packages each contribute declarations', () =>
        {
            const text =
                'package pkg_a is function f1(x : integer) return integer; end package;' +
                'package pkg_b is procedure p1; end package;';
            const declared = extractPackageDeclaredNames(text);
            assert.strictEqual(declared.size, 2);
            assert.ok(declared.has('f1'));
            assert.ok(declared.has('p1'));
        });

        test('duplicate function name in same package only recorded once', () =>
        {
            const text =
                'package pkg is\n' +
                '    function foo(x : integer) return integer;\n' +
                '    function foo(y : integer) return integer;\n' +
                'end package;';
            const declared = extractPackageDeclaredNames(text);
            assert.strictEqual(declared.size, 1);
        });
    });

    suite('extractPackageImplementedNames', () =>
    {
        test('find function implemented in package body', () =>
        {
            const implemented = extractPackageImplementedNames(COMMON_PKG);
            assert.strictEqual(implemented.size, 1);
            assert.ok(implemented.has('clog2'));
        });

        test('no package body returns empty set', () =>
        {
            const implemented = extractPackageImplementedNames(DEMO_PKG);
            assert.strictEqual(implemented.size, 0);
        });

        test('empty string returns empty set', () =>
        {
            const implemented = extractPackageImplementedNames('');
            assert.strictEqual(implemented.size, 0);
        });

        test('package body with multiple functions', () =>
        {
            const text =
                'package body pkg is\n' +
                '    function f1 return integer is begin return 0; end function;\n' +
                '    procedure p1 is begin null; end procedure;\n' +
                'end package body;';
            const implemented = extractPackageImplementedNames(text);
            assert.strictEqual(implemented.size, 2);
            assert.ok(implemented.has('f1'));
            assert.ok(implemented.has('p1'));
        });
    });

    suite('integration: declared vs implemented', () =>
    {
        test('common_pkg: all declared functions are implemented', () =>
        {
            const declared = extractPackageDeclaredNames(COMMON_PKG);
            const implemented = extractPackageImplementedNames(COMMON_PKG);

            for (const key of declared.keys())
            {
                assert.ok(implemented.has(key), `'${key}' declared but not implemented`);
            }
        });

        test('demo_pkg: nothing declared means nothing to implement', () =>
        {
            const declared = extractPackageDeclaredNames(DEMO_PKG);
            const implemented = extractPackageImplementedNames(DEMO_PKG);

            assert.strictEqual(declared.size, 0);
            assert.strictEqual(implemented.size, 0);
        });

        test('missing implementation is detected', () =>
        {
            const text =
                'package pkg is\n' +
                '    function missing_func return integer;\n' +
                'end package;\n' +
                'package body pkg is\n' +
                '    -- missing_func not implemented\n' +
                'end package body;';
            const declared = extractPackageDeclaredNames(text);
            const implemented = extractPackageImplementedNames(text);

            assert.strictEqual(declared.size, 1);
            assert.strictEqual(implemented.size, 0);
        });
    });
});
