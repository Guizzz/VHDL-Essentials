import * as assert from 'node:assert';
import { parsePortMaps } from '../../parsers/portMapParser';
import { validatePortMaps } from '../../lint/portMapLint';
import { EntityPort } from '../../types/types';

const BLINKY_TB = `library ieee;
use ieee.std_logic_1164.all;

entity blinky_tb is
end entity blinky_tb;

architecture sim of blinky_tb is
    signal clk : std_logic := '0';
    signal rst : std_logic := '0';
    signal led : std_logic;

    component blinky is
        port (
            clk : in  std_logic;
            rst : in  std_logic;
            led : out std_logic
        );
    end component blinky;

begin
    uut : blinky
        port map (
            clk => clk,
            rst => rst,
            led => led
        );

    clk <= not clk after 10 ns;

    process
    begin
        rst <= '1';
        wait for 100 ns;
        rst <= '0';
        wait for 2000 ns;
        wait;
    end process;
end architecture sim;`;

const BLINKY_SRC = `library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use work.demo_pkg.all;

entity blinky is
    port (
        clk : in  std_logic;
        rst : in  std_logic;
        led : out std_logic
    );
end entity blinky;

architecture rtl of blinky is
    component clk_div is
        port (
            clk      : in  std_logic;
            rst      : in  std_logic;
            max_cnt  : in  std_logic_vector(31 downto 0);
            pulse    : out std_logic
        );
    end component clk_div;

    signal pulse_500ms : std_logic;
    signal led_reg     : std_logic;
begin
    u_clk_div : clk_div
        port map (
            clk     => clk,
            rst     => rst,
            max_cnt => std_logic_vector(to_unsigned(MAX_COUNT, 32)),
            pulse   => pulse_500ms
        );

    process(clk, rst)
    begin
        if rst = '1' then
            led_reg <= '0';
        elsif rising_edge(clk) then
            if pulse_500ms = '1' then
                led_reg <= not led_reg;
            end if;
        end if;
    end process;

    led <= led_reg;
end architecture rtl;`;

const COUNTER_VHD = `library ieee;
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

suite('portMapParser', () =>
{
    suite('parsePortMaps', () =>
    {
        test('blinky_tb: parses simple port map', () =>
        {
            const clauses = parsePortMaps(BLINKY_TB);
            assert.strictEqual(clauses.length, 1);
            assert.strictEqual(clauses[0].entityName, 'blinky');
            assert.strictEqual(clauses[0].label, 'uut');
            assert.strictEqual(clauses[0].mappings.length, 3);
        });

        test('blinky_tb: mappings are correct', () =>
        {
            const clauses = parsePortMaps(BLINKY_TB);
            const mappings = clauses[0].mappings;
            assert.strictEqual(mappings[0].formal, 'clk');
            assert.strictEqual(mappings[0].actual, 'clk');
            assert.strictEqual(mappings[1].formal, 'rst');
            assert.strictEqual(mappings[1].actual, 'rst');
            assert.strictEqual(mappings[2].formal, 'led');
            assert.strictEqual(mappings[2].actual, 'led');
        });

        test('blinky.vhd: parses port map with function call in actual', () =>
        {
            const clauses = parsePortMaps(BLINKY_SRC);
            assert.strictEqual(clauses.length, 1);
            assert.strictEqual(clauses[0].entityName, 'clk_div');
            assert.strictEqual(clauses[0].label, 'u_clk_div');
            assert.strictEqual(clauses[0].mappings.length, 4);
        });

        test('blinky.vhd: function call actual is captured fully', () =>
        {
            const clauses = parsePortMaps(BLINKY_SRC);
            const maxCnt = clauses[0].mappings.find(m => m.formal === 'max_cnt');
            assert.ok(maxCnt);
            assert.strictEqual(
                maxCnt.actual,
                'std_logic_vector(to_unsigned(MAX_COUNT, 32))'
            );
        });

        test('counter.vhd: no port maps returns empty array', () =>
        {
            const clauses = parsePortMaps(COUNTER_VHD);
            assert.strictEqual(clauses.length, 0);
        });

        test('empty string returns empty array', () =>
        {
            const clauses = parsePortMaps('');
            assert.strictEqual(clauses.length, 0);
        });

        test('no port map keyword returns empty array', () =>
        {
            const clauses = parsePortMaps('entity top is end entity;');
            assert.strictEqual(clauses.length, 0);
        });

        test('entity work.xxx syntax is parsed correctly', () =>
        {
            const text = `architecture rtl of top is
begin
    u_inst : entity work.counter
        port map (
            clk => clk,
            rst => rst
        );
end architecture rtl;`;
            const clauses = parsePortMaps(text);
            assert.strictEqual(clauses.length, 1);
            assert.strictEqual(clauses[0].entityName, 'counter');
            assert.strictEqual(clauses[0].label, 'u_inst');
        });

        test('multiple instantiations are all found', () =>
        {
            const text = `architecture rtl of top is
begin
    u1 : counter
        port map (clk => clk, rst => rst);
    u2 : counter
        port map (clk => clk, rst => rst);
end architecture rtl;`;
            const clauses = parsePortMaps(text);
            assert.strictEqual(clauses.length, 2);
            assert.strictEqual(clauses[0].label, 'u1');
            assert.strictEqual(clauses[1].label, 'u2');
        });

        test('open port is handled correctly', () =>
        {
            const text = `architecture rtl of top is
begin
    u_inst : counter
        port map (
            clk => clk,
            rst => open
        );
end architecture rtl;`;
            const clauses = parsePortMaps(text);
            assert.strictEqual(clauses.length, 1);
            const rst = clauses[0].mappings.find(m => m.formal === 'rst');
            assert.ok(rst);
            assert.strictEqual(rst.actual, 'open');
        });

        test('single-line port map works', () =>
        {
            const text = `architecture rtl of top is
begin
    u : counter port map (clk => clk, rst => rst);
end architecture rtl;`;
            const clauses = parsePortMaps(text);
            assert.strictEqual(clauses.length, 1);
            assert.strictEqual(clauses[0].mappings.length, 2);
        });

        test('mapping offsets are within text bounds', () =>
        {
            const clauses = parsePortMaps(BLINKY_TB);
            for (const mapping of clauses[0].mappings)
            {
                assert.ok(mapping.offset >= 0);
                assert.ok(mapping.offset < BLINKY_TB.length);
            }
        });

        test('case insensitive matching works', () =>
        {
            const text = `architecture rtl of top is
begin
    u : COUNTER
        PORT MAP (
            CLK => clk
        );
end architecture rtl;`;
            const clauses = parsePortMaps(text);
            assert.strictEqual(clauses.length, 1);
            assert.strictEqual(clauses[0].entityName, 'COUNTER');
        });

        test('comments inside port map body are ignored', () =>
        {
            const text = `architecture rtl of top is
begin
    u : attenuator_manager
        port map(
            -- Clock principale CPLD

            -- Segnale di controllo
            PULSE    => pulse_buffered,

            -- SPI da micro (SLAVE)
            MICRO_SPI_CLK  => SPI2_CLK,
            MICRO_SPI_SS   => SPI2_CS,
            MICRO_SPI_MOSI => SPI2_SDI,

            -- SPI verso attenuatore (MASTER)
            ACT_SPI_CLK  => SPI_HMPD_CLK,
            ACT_SPI_SS   => SPI_HMPD_LE,
            ACT_SPI_MOSI => SPI_HMPD_SDO
        );
end architecture rtl;`;
            const clauses = parsePortMaps(text);
            assert.strictEqual(clauses.length, 1);
            assert.strictEqual(clauses[0].entityName, 'attenuator_manager');
            assert.strictEqual(clauses[0].mappings.length, 7);

            const names = clauses[0].mappings.map(m => m.formal);
            assert.ok(names.includes('PULSE'));
            assert.ok(names.includes('MICRO_SPI_CLK'));
            assert.ok(names.includes('MICRO_SPI_SS'));
            assert.ok(names.includes('MICRO_SPI_MOSI'));
            assert.ok(names.includes('ACT_SPI_CLK'));
            assert.ok(names.includes('ACT_SPI_SS'));
            assert.ok(names.includes('ACT_SPI_MOSI'));
        });
    });
});

suite('portMapLint', () =>
{
    const blinkyPorts = new Map<string, EntityPort>([
        ['clk',  { name: 'clk',  direction: 'in',  type: 'std_logic', offset: 0 }],
        ['rst',  { name: 'rst',  direction: 'in',  type: 'std_logic', offset: 0 }],
        ['led',  { name: 'led',  direction: 'out', type: 'std_logic', offset: 0 }],
    ]);

    suite('validatePortMaps', () =>
    {
        test('all ports present produces no diagnostics', () =>
        {
            const portMaps = parsePortMaps(BLINKY_TB);
            const diags = validatePortMaps(BLINKY_TB, portMaps, blinkyPorts);
            assert.strictEqual(diags.length, 0);
        });

        test('missing port produces warning', () =>
        {
            const text = `architecture rtl of top is
begin
    u : blinky
        port map (
            clk => clk
        );
end architecture rtl;`;
            const portMaps = parsePortMaps(text);
            const diags = validatePortMaps(text, portMaps, blinkyPorts);
            const missing = diags.filter(d => d.message.includes('Missing'));
            assert.strictEqual(missing.length, 2);
            assert.ok(missing.some(d => d.message.includes('rst')));
            assert.ok(missing.some(d => d.message.includes('led')));
        });

        test('extra port produces error', () =>
        {
            const text = `architecture rtl of top is
begin
    u : blinky
        port map (
            clk  => clk,
            rst  => rst,
            led  => led,
            junk => '0'
        );
end architecture rtl;`;
            const portMaps = parsePortMaps(text);
            const diags = validatePortMaps(text, portMaps, blinkyPorts);
            const extra = diags.filter(d => d.message.includes('not found'));
            assert.strictEqual(extra.length, 1);
            assert.ok(extra[0].message.includes('junk'));
        });

        test('open port does not produce missing warning', () =>
        {
            const text = `architecture rtl of top is
begin
    u : blinky
        port map (
            clk => clk,
            rst => open,
            led => led
        );
end architecture rtl;`;
            const portMaps = parsePortMaps(text);
            const diags = validatePortMaps(text, portMaps, blinkyPorts);
            assert.strictEqual(diags.length, 0);
        });

        test('undefined entity ports returns no diagnostics', () =>
        {
            const portMaps = parsePortMaps(BLINKY_TB);
            const diags = validatePortMaps(BLINKY_TB, portMaps, undefined);
            assert.strictEqual(diags.length, 0);
        });

        test('empty ports returns no diagnostics', () =>
        {
            const portMaps = parsePortMaps(BLINKY_TB);
            const diags = validatePortMaps(BLINKY_TB, portMaps, new Map());
            assert.strictEqual(diags.length, 0);
        });

        test('empty port maps returns no diagnostics', () =>
        {
            const diags = validatePortMaps('', [], blinkyPorts);
            assert.strictEqual(diags.length, 0);
        });

        test('each diagnostic has source VHDL Essentials', () =>
        {
            const text = `architecture rtl of top is
begin
    u : blinky
        port map (
            clk  => clk,
            junk => '0'
        );
end architecture rtl;`;
            const portMaps = parsePortMaps(text);
            const diags = validatePortMaps(text, portMaps, blinkyPorts);
            for (const d of diags)
            {
                assert.strictEqual(d.source, 'VHDL Essentials');
            }
        });
    });
});

// Regression tests — verify offsets with comments in entity port block
// and entity work.xxx instantiation syntax
suite('portMapOffsets', () =>
{
    const ENTITY_CODE = `library ieee;
use ieee.std_logic_1164.all;

entity attenuator_manager is
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
end entity;

architecture rtl of top is
begin
    uut : entity work.attenuator_manager
        port map(
            -- Clock principale CPLD

            -- Segnale di controllo
            PULSE    => pulse_buffered,

            -- SPI da micro (SLAVE)
            MICRO_SPI_CLK  => SPI2_CLK,
            MICRO_SPI_SS   => SPI2_CS,
            MICRO_SPI_MOSI => SPI2_SDI,

            -- SPI verso attenuatore (MASTER)
            ACT_SPI_CLK  => SPI_HMPD_CLK,
            ACT_SPI_SS   => SPI_HMPD_LE,
            ACT_SPI_MOSI => SPI_HMPD_SDO
        );
end architecture rtl;`;

    test('entityOffset points to entity name in instantiation', () =>
    {
        const clauses = parsePortMaps(ENTITY_CODE);
        assert.strictEqual(clauses.length, 1);

        const clause = clauses[0];
        const entityAtOffset = ENTITY_CODE.substring(
            clause.entityOffset,
            clause.entityOffset + clause.entityName.length
        );
        assert.strictEqual(entityAtOffset, clause.entityName);
        assert.ok(clause.entityOffset >= clause.offset);
    });

    test('mapping offsets point to formal port names', () =>
    {
        const clauses = parsePortMaps(ENTITY_CODE);
        assert.strictEqual(clauses.length, 1);

        for (const m of clauses[0].mappings)
        {
            const formalAtOffset = ENTITY_CODE.substring(
                m.offset,
                m.offset + m.formal.length
            );
            assert.strictEqual(
                formalAtOffset,
                m.formal,
                `offset should point to "${m.formal}", got "${formalAtOffset}"`
            );
        }
    });

    test('all 7 ports parsed from comments-laden port map', () =>
    {
        const clauses = parsePortMaps(ENTITY_CODE);
        assert.strictEqual(clauses.length, 1);
        assert.strictEqual(clauses[0].mappings.length, 7);

        const names = clauses[0].mappings.map(m => m.formal);
        assert.ok(names.includes('PULSE'));
        assert.ok(names.includes('MICRO_SPI_CLK'));
        assert.ok(names.includes('MICRO_SPI_SS'));
        assert.ok(names.includes('MICRO_SPI_MOSI'));
        assert.ok(names.includes('ACT_SPI_CLK'));
        assert.ok(names.includes('ACT_SPI_SS'));
        assert.ok(names.includes('ACT_SPI_MOSI'));
    });

    test('missing port diagnostic underlines entity name', () =>
    {
        const portMaps = parsePortMaps(ENTITY_CODE);
        const partialPorts = new Map<string, import('../../types/types').EntityPort>([
            ['CLK_CPLD', { name: 'CLK_CPLD', direction: 'in', type: 'std_logic', offset: 0 }],
        ]);
        const diags = validatePortMaps(ENTITY_CODE, portMaps, partialPorts);

        const missing = diags.filter(d => d.message.includes('Missing'));
        assert.ok(missing.length > 0);

        for (const d of missing)
        {
            const lineText = ENTITY_CODE.split('\n')[d.range.start.line];
            if (lineText)
            {
                const snippet = lineText.substring(d.range.start.character, d.range.end.character);
                assert.strictEqual(
                    snippet,
                    'attenuator_manager',
                    `missing-port diagnostic should underline entity name, got "${snippet}"`
                );
            }
        }
    });

    test('extra port diagnostic underlines formal name', () =>
    {
        const portMaps = parsePortMaps(ENTITY_CODE);
        const smallPorts = new Map<string, import('../../types/types').EntityPort>([
            ['CLK_CPLD', { name: 'CLK_CPLD', direction: 'in', type: 'std_logic', offset: 0 }],
        ]);
        const diags = validatePortMaps(ENTITY_CODE, portMaps, smallPorts);

        const extras = diags.filter(d => d.message.includes('not found'));
        assert.ok(extras.length > 0);

        for (const d of extras)
        {
            const lineText = ENTITY_CODE.split('\n')[d.range.start.line];
            if (lineText)
            {
                const snippet = lineText.substring(d.range.start.character, d.range.end.character);
                assert.strictEqual(
                    snippet,
                    d.message.match(/'([^']+)'/)?.[1] ?? '',
                    `extra-port diagnostic should underline "${d.message.match(/'([^']+)'/)?.[1]}", got "${snippet}"`
                );
            }
        }
    });
});
