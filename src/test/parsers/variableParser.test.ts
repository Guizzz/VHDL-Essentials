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
            text.substring(result[0].offset, result[0].offset + 11),
            'signal tick'
        );
    });
});
