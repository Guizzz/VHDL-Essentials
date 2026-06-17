import * as assert from 'node:assert';
import { parseSignals } from '../../parsers/variableParser';

suite('variableParser', () =>
{
    test('parse signal declarations', () =>
    {
        const result = parseSignals(`
            signal clk : std_logic;
            signal data_bus : std_logic_vector(7 downto 0);
            signal counter : integer range 0 to 255;
        `);

        assert.strictEqual(result.length, 3);
        assert.strictEqual(result[0].name, 'clk');
        assert.strictEqual(result[0].kind, 'signal');
        assert.strictEqual(result[0].type, 'std_logic');

        assert.strictEqual(result[1].name, 'data_bus');
        assert.strictEqual(result[1].type, 'std_logic_vector(7 downto 0)');

        assert.strictEqual(result[2].name, 'counter');
        assert.strictEqual(result[2].type, 'integer range 0 to 255');
    });

    test('parse variable declarations', () =>
    {
        const result = parseSignals(`
            variable temp : std_logic_vector(15 downto 0);
            variable idx : integer;
        `);

        assert.strictEqual(result.length, 2);
        assert.strictEqual(result[0].name, 'temp');
        assert.strictEqual(result[0].kind, 'variable');
        assert.strictEqual(result[1].name, 'idx');
        assert.strictEqual(result[1].kind, 'variable');
    });

    test('parse constant declarations', () =>
    {
        const result = parseSignals(`
            constant WIDTH : positive := 32;
            constant RESET_ACTIVE : std_logic := '1';
        `);

        assert.strictEqual(result.length, 2);
        assert.strictEqual(result[0].name, 'WIDTH');
        assert.strictEqual(result[0].kind, 'constant');
        assert.strictEqual(result[1].name, 'RESET_ACTIVE');
        assert.strictEqual(result[1].kind, 'constant');
    });

    test('parse entity port declarations', () =>
    {
        const result = parseSignals(`entity counter is
            port (
                clk : in std_logic;
                rst : in std_logic;
                count : out std_logic_vector(7 downto 0)
            );
        end entity;`);

        const ports = result.filter(s => s.kind === 'port');
        assert.strictEqual(ports.length, 3);
        assert.strictEqual(ports[0].name, 'clk');
        assert.strictEqual(ports[0].direction, 'in');
        assert.strictEqual(ports[0].type, 'std_logic');
        assert.strictEqual(ports[2].name, 'count');
        assert.strictEqual(ports[2].direction, 'out');
        assert.strictEqual(ports[2].type, 'std_logic_vector(7 downto 0)');
    });

    test('parse mixed declarations', () =>
    {
        const result = parseSignals(`
            signal internal : std_logic;
            variable tmp : integer;
            constant SIZE : natural := 16;
            port sig : in std_logic;
        `);

        assert.strictEqual(result.length, 4);
        assert.strictEqual(result[0].kind, 'signal');
        assert.strictEqual(result[1].kind, 'variable');
        assert.strictEqual(result[2].kind, 'constant');
        assert.strictEqual(result[3].kind, 'port');
    });

    test('return empty array for empty string', () =>
    {
        const result = parseSignals('');
        assert.strictEqual(result.length, 0);
    });

    test('return empty array for non-declaration text', () =>
    {
        const result = parseSignals(`-- just a comment
        begin
        end process;`);
        assert.strictEqual(result.length, 0);
    });

    test('case insensitive matching', () =>
    {
        const result = parseSignals(`
            SIGNAL clk : STD_LOGIC;
            Variable tmp : Integer;
        `);

        assert.strictEqual(result.length, 2);
        assert.strictEqual(result[0].kind, 'signal');
        assert.strictEqual(result[1].kind, 'variable');
    });

    test('preserve offset values', () =>
    {
        const text = `library ieee;
        signal tick : std_logic;`;
        const result = parseSignals(text);

        assert.strictEqual(result.length, 1);
        assert.strictEqual(result[0].name, 'tick');
        assert.ok(result[0].offset >= 0);
        assert.strictEqual(
            text.substring(result[0].offset, result[0].offset + result[0].name.length),
            result[0].name
        );
    });

    test('parse comma-separated signal declarations', () =>
    {
        const result = parseSignals(`
            signal dv_sync_0, dv_sync_1 : std_logic;
        `);

        assert.strictEqual(result.length, 2);
        assert.strictEqual(result[0].name, 'dv_sync_0');
        assert.strictEqual(result[0].kind, 'signal');
        assert.strictEqual(result[0].type, 'std_logic');
        assert.strictEqual(result[1].name, 'dv_sync_1');
        assert.strictEqual(result[1].kind, 'signal');
        assert.strictEqual(result[1].type, 'std_logic');
    });

    test('parse comma-separated port declarations', () =>
    {
        const result = parseSignals(`
            entity ports is
                port (
                    clk, rst : in std_logic;
                    a, b, c  : out std_logic
                );
            end entity;
        `);

        const ports = result.filter(s => s.kind === 'port');
        assert.strictEqual(ports.length, 5);
        assert.strictEqual(ports[0].name, 'clk');
        assert.strictEqual(ports[1].name, 'rst');
        assert.strictEqual(ports[2].name, 'a');
        assert.strictEqual(ports[3].name, 'b');
        assert.strictEqual(ports[4].name, 'c');
    });

    test('parse comma-separated variable declarations', () =>
    {
        const result = parseSignals(`
            variable x, y, z : integer;
        `);

        assert.strictEqual(result.length, 3);
        assert.strictEqual(result[0].name, 'x');
        assert.strictEqual(result[1].name, 'y');
        assert.strictEqual(result[2].name, 'z');
    });

    test('parse comma-separated constant declarations', () =>
    {
        const result = parseSignals(`
            constant MIN, MAX : positive := 1;
        `);

        assert.strictEqual(result.length, 2);
        assert.strictEqual(result[0].name, 'MIN');
        assert.strictEqual(result[0].kind, 'constant');
        assert.strictEqual(result[1].name, 'MAX');
        assert.strictEqual(result[1].kind, 'constant');
    });

    test('mixed single and comma-separated declarations', () =>
    {
        const result = parseSignals(`
            signal single_sig : std_logic;
            signal multi_a, multi_b : std_logic_vector(7 downto 0);
            variable v1, v2 : integer;
        `);

        assert.strictEqual(result.length, 5);
        assert.strictEqual(result[0].name, 'single_sig');
        assert.strictEqual(result[1].name, 'multi_a');
        assert.strictEqual(result[2].name, 'multi_b');
        assert.strictEqual(result[3].name, 'v1');
        assert.strictEqual(result[4].name, 'v2');
    });
});
