import * as assert from 'node:assert';
import { parseEntities } from '../../parsers/entityParser';

suite('entityParser', () =>
{
    test('parse single entity with ports', () =>
    {
        const result = parseEntities(`entity counter is
            port (
                clk : in std_logic;
                rst : in std_logic;
                count : out std_logic_vector(7 downto 0)
            );
        end entity;`);

        assert.strictEqual(result.length, 1);
        assert.strictEqual(result[0].name, 'counter');
        assert.strictEqual(result[0].ports.length, 3);

        const clk = result[0].ports[0];
        assert.strictEqual(clk.name, 'clk');
        assert.strictEqual(clk.direction, 'in');
        assert.strictEqual(clk.type, 'std_logic');

        const count = result[0].ports[2];
        assert.strictEqual(count.name, 'count');
        assert.strictEqual(count.direction, 'out');
        assert.strictEqual(count.type, 'std_logic_vector(7 downto 0)');
    });

    test('parse entity with inout and buffer ports', () =>
    {
        const result = parseEntities(`entity bidirectional is
            port (
                data : inout std_logic_vector(15 downto 0);
                flag : buffer std_logic
            );
        end entity bidirectional;`);

        assert.strictEqual(result.length, 1);
        assert.strictEqual(result[0].ports.length, 2);
        assert.strictEqual(result[0].ports[0].direction, 'inout');
        assert.strictEqual(result[0].ports[1].direction, 'buffer');
    });

    test('parse entity with no ports', () =>
    {
        const result = parseEntities(`entity empty is
        end entity;`);

        assert.strictEqual(result.length, 1);
        assert.strictEqual(result[0].name, 'empty');
        assert.strictEqual(result[0].ports.length, 0);
    });

    test('parse multiple entities in same file', () =>
    {
        const result = parseEntities(`-- first entity
        entity alu is
            port ( a : in std_logic_vector(7 downto 0) );
        end entity;

        -- second entity
        entity control is
            port ( clk : in std_logic; rst : in std_logic );
        end entity control;`);

        assert.strictEqual(result.length, 2);
        assert.strictEqual(result[0].name, 'alu');
        assert.strictEqual(result[1].name, 'control');
    });

    test('parse entity with comma-separated port names', () =>
    {
        const result = parseEntities(`entity bus_if is
            port (
                a, b, c : in std_logic;
                d, e : out std_logic_vector(3 downto 0)
            );
        end entity;`);

        assert.strictEqual(result.length, 1);
        assert.strictEqual(result[0].ports.length, 5);
        assert.strictEqual(result[0].ports[0].name, 'a');
        assert.strictEqual(result[0].ports[1].name, 'b');
        assert.strictEqual(result[0].ports[2].name, 'c');
        assert.strictEqual(result[0].ports[0].direction, 'in');
        assert.strictEqual(result[0].ports[3].direction, 'out');
    });

    test('return empty array for non-VHDL text', () =>
    {
        const result = parseEntities(`module counter(input clk); endmodule`);
        assert.strictEqual(result.length, 0);
    });

    test('return empty array for empty string', () =>
    {
        const result = parseEntities('');
        assert.strictEqual(result.length, 0);
    });

    test('parse entity with type having parentheses', () =>
    {
        const result = parseEntities(`entity complex is
            port (
                addr : out std_logic_vector(31 downto 0);
                data : inout std_logic_vector(15 downto 0)
            );
        end entity;`);

        assert.strictEqual(result.length, 1);
        assert.strictEqual(result[0].ports[0].type, 'std_logic_vector(31 downto 0)');
        assert.strictEqual(result[0].ports[1].type, 'std_logic_vector(15 downto 0)');
    });

    test('comments inside port block are stripped from names', () =>
    {
        const result = parseEntities(`entity attenuator_manager is
    port(
        -- Clock principale CPLD
        CLK_CPLD : in std_logic;

        -- Segnale di controllo
        PULSE    : in std_logic;

        -- SPI da micro (SLAVE)
        MICRO_SPI_CLK  : in std_logic;
        MICRO_SPI_SS   : in std_logic;
        MICRO_SPI_MOSI : in std_logic;

        -- SPI verso attenuatore (MASTER)
        ACT_SPI_CLK  : out std_logic;
        ACT_SPI_SS   : out std_logic;
        ACT_SPI_MOSI : out std_logic
    );
end entity;`);

        assert.strictEqual(result.length, 1);
        assert.strictEqual(result[0].ports.length, 8);

        const names = result[0].ports.map(p => p.name);
        assert.ok(names.includes('CLK_CPLD'), 'CLK_CPLD should be a port name');
        assert.ok(names.includes('PULSE'), 'PULSE should be a port name');
        assert.ok(names.includes('MICRO_SPI_CLK'), 'MICRO_SPI_CLK should be a port name');
        assert.ok(names.includes('MICRO_SPI_SS'), 'MICRO_SPI_SS should be a port name');
        assert.ok(names.includes('MICRO_SPI_MOSI'), 'MICRO_SPI_MOSI should be a port name');
        assert.ok(names.includes('ACT_SPI_CLK'), 'ACT_SPI_CLK should be a port name');
        assert.ok(names.includes('ACT_SPI_SS'), 'ACT_SPI_SS should be a port name');
        assert.ok(names.includes('ACT_SPI_MOSI'), 'ACT_SPI_MOSI should be a port name');

        // no port name should contain comment text
        assert.ok(names.every(n => !n.includes('Clock') && !n.includes('principale')));
        assert.ok(names.every(n => !n.includes('Segnale') && !n.includes('controllo')));
        assert.ok(names.every(n => !n.includes('SLAVE') && !n.includes('MASTER')));
    });

    test('preserve offset values', () =>
    {
        const text = `library ieee;
        entity positioned is
            port ( x : in std_logic );
        end entity;`;
        const result = parseEntities(text);

        assert.strictEqual(result.length, 1);
        assert.ok(result[0].offset >= 0);
        assert.strictEqual(text.substring(result[0].offset, result[0].offset + 10), 'positioned');
    });
});
