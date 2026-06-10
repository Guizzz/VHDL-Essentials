import * as assert from 'node:assert';
import * as vscode from 'vscode';

import { VhdlDocumentSymbolProvider } from '../../providers/vhdlDocumentSymbolProvider';

suite('VhdlDocumentSymbolProvider', () =>
{
    test('should return symbols for entity with ports and generics', async () =>
    {
        const doc = await vscode.workspace.openTextDocument({
            content: [
                'entity counter is',
                '  generic (',
                '    WIDTH : integer := 8',
                '  );',
                '  port (',
                '    clk   : in  std_logic;',
                '    rst   : in  std_logic;',
                '    data  : out std_logic_vector(WIDTH-1 downto 0);',
                '    valid : out std_logic',
                '  );',
                'end entity counter;'
            ].join('\n'),
            language: 'vhdl'
        });

        const provider = new VhdlDocumentSymbolProvider();
        const symbols = await provider.provideDocumentSymbols(doc);

        assert.ok(symbols);
        assert.strictEqual(symbols.length, 1);
        assert.strictEqual(symbols[0].name, 'counter');
        assert.strictEqual(symbols[0].kind, vscode.SymbolKind.Struct);

        const children = symbols[0].children;

        const widthSym = children.find(c => c.name === 'WIDTH');
        assert.ok(widthSym, 'WIDTH generic should exist');
        assert.ok(widthSym.detail?.includes('integer'), 'WIDTH should have integer type');

        const clkSym = children.find(c => c.name === 'clk');
        assert.ok(clkSym, 'clk port should exist');
        assert.ok(clkSym.detail?.includes('in'), 'clk should be in direction');

        const dataSym = children.find(c => c.name === 'data');
        assert.ok(dataSym, 'data port should exist');
        assert.ok(dataSym.detail?.includes('out'), 'data should be out direction');
    });

    test('should return symbols for architecture with signals and processes', async () =>
    {
        const doc = await vscode.workspace.openTextDocument({
            content: [
                'architecture rtl of counter is',
                '  signal count : unsigned(7 downto 0);',
                '  constant MAX : integer := 255;',
                '  type state_t is (idle, active, done);',
                'begin',
                '  proc_main : process(clk, rst)',
                '  begin',
                '    if rising_edge(clk) then',
                '      null;',
                '    end if;',
                '  end process;',
                '',
                '  count_proc : process(clk)',
                '  begin',
                '    null;',
                '  end process;',
                'end architecture rtl;'
            ].join('\n'),
            language: 'vhdl'
        });

        const provider = new VhdlDocumentSymbolProvider();
        const symbols = await provider.provideDocumentSymbols(doc);

        assert.ok(symbols);
        assert.strictEqual(symbols.length, 1);
        assert.strictEqual(symbols[0].name, 'rtl');
        assert.strictEqual(symbols[0].kind, vscode.SymbolKind.Module);

        const children = symbols[0].children;

        // signal count
        const countSym = children.find(c => c.name === 'count');
        assert.ok(countSym, 'signal count should exist');
        assert.strictEqual(countSym.kind, vscode.SymbolKind.Variable);

        // constant MAX
        const maxSym = children.find(c => c.name === 'MAX');
        assert.ok(maxSym, 'constant MAX should exist');
        assert.strictEqual(maxSym.kind, vscode.SymbolKind.Constant);

        // type state_t
        const stateSym = children.find(c => c.name === 'state_t');
        assert.ok(stateSym, 'type state_t should exist');
        assert.strictEqual(stateSym.kind, vscode.SymbolKind.Interface);

        // processes
        const procMain = children.find(c => c.name === 'proc_main');
        assert.ok(procMain, 'proc_main process should exist');
        assert.strictEqual(procMain.kind, vscode.SymbolKind.Function);

        const countProc = children.find(c => c.name === 'count_proc');
        assert.ok(countProc, 'count_proc process should exist');
    });

    test('should skip comments when scanning', async () =>
    {
        const doc = await vscode.workspace.openTextDocument({
            content: [
                '-- entity comment_test is',
                'entity real_entity is',
                '  port (',
                '    clk : in std_logic',
                '  );',
                'end entity;'
            ].join('\n'),
            language: 'vhdl'
        });

        const provider = new VhdlDocumentSymbolProvider();
        const symbols = await provider.provideDocumentSymbols(doc);

        assert.ok(symbols);
        assert.strictEqual(symbols.length, 1);
        assert.strictEqual(symbols[0].name, 'real_entity');
    });

    test('should handle concurrent port names like "clk, rst : in std_logic"', async () =>
    {
        const doc = await vscode.workspace.openTextDocument({
            content: [
                'entity multi is',
                '  port (',
                '    clk, rst : in std_logic;',
                '    a, b, c  : out std_logic',
                '  );',
                'end entity;'
            ].join('\n'),
            language: 'vhdl'
        });

        const provider = new VhdlDocumentSymbolProvider();
        const symbols = await provider.provideDocumentSymbols(doc);

        assert.strictEqual(symbols.length, 1);

        const children = symbols[0].children;
        assert.strictEqual(children.length, 5);

        assert.ok(children.find(c => c.name === 'clk'));
        assert.ok(children.find(c => c.name === 'rst'));
        assert.ok(children.find(c => c.name === 'a'));
        assert.ok(children.find(c => c.name === 'b'));
        assert.ok(children.find(c => c.name === 'c'));
    });

    test('should return empty array for file with no VHDL constructs', async () =>
    {
        const doc = await vscode.workspace.openTextDocument({
            content: [
                '-- just a comment',
                'library ieee;',
                'use ieee.std_logic_1164.all;'
            ].join('\n'),
            language: 'vhdl'
        });

        const provider = new VhdlDocumentSymbolProvider();
        const symbols = await provider.provideDocumentSymbols(doc);

        assert.ok(symbols);
        assert.strictEqual(symbols.length, 0);
    });

    test('should return package symbols', async () =>
    {
        const doc = await vscode.workspace.openTextDocument({
            content: [
                'package utils is',
                '  constant VERSION : string := "1.0";',
                '  type color_t is (red, green, blue);',
                '  function to_string(val : integer) return string;',
                'end package utils;'
            ].join('\n'),
            language: 'vhdl'
        });

        const provider = new VhdlDocumentSymbolProvider();
        const symbols = await provider.provideDocumentSymbols(doc);

        assert.strictEqual(symbols.length, 1);
        assert.strictEqual(symbols[0].name, 'utils');
        assert.strictEqual(symbols[0].kind, vscode.SymbolKind.Package);

        const children = symbols[0].children;
        assert.ok(children.find(c => c.name === 'VERSION' && c.kind === vscode.SymbolKind.Constant));
        assert.ok(children.find(c => c.name === 'color_t' && c.kind === vscode.SymbolKind.Interface));
        assert.ok(children.find(c => c.name === 'to_string'));
    });

    test('should handle multiple top-level constructs', async () =>
    {
        const doc = await vscode.workspace.openTextDocument({
            content: [
                'package pkg is',
                '  constant C : integer := 1;',
                'end package;',
                '',
                'entity top is',
                '  port ( x : in std_logic );',
                'end entity;',
                '',
                'architecture rtl of top is',
                'begin',
                'end architecture;'
            ].join('\n'),
            language: 'vhdl'
        });

        const provider = new VhdlDocumentSymbolProvider();
        const symbols = await provider.provideDocumentSymbols(doc);

        assert.strictEqual(symbols.length, 3);
        assert.strictEqual(symbols[0].name, 'pkg');
        assert.strictEqual(symbols[1].name, 'top');
        assert.strictEqual(symbols[2].name, 'rtl');
    });

    test('should handle component declarations in architecture', async () =>
    {
        const doc = await vscode.workspace.openTextDocument({
            content: [
                'architecture structural of top is',
                '  component pll is',
                '    port (',
                '      inclk : in  std_logic;',
                '      outclk : out std_logic',
                '    );',
                '  end component pll;',
                'begin',
                'end architecture;'
            ].join('\n'),
            language: 'vhdl'
        });

        const provider = new VhdlDocumentSymbolProvider();
        const symbols = await provider.provideDocumentSymbols(doc);

        assert.strictEqual(symbols.length, 1);

        const pllSym = symbols[0].children.find(c => c.name === 'pll');
        assert.ok(pllSym, 'component pll should exist');
        assert.strictEqual(pllSym.kind, vscode.SymbolKind.Class);
    });

    test('should detect direct entity instantiations in architecture', async () =>
    {
        const doc = await vscode.workspace.openTextDocument({
            content: [
                'architecture structural of top is',
                '  signal clk : std_logic;',
                'begin',
                '  spi_slave_in: entity work.spi_slave',
                '    port map(',
                '      SPI_CLK  => clk,',
                '      data_rx  => data_out',
                '    );',
                'end architecture;'
            ].join('\n'),
            language: 'vhdl'
        });

        const provider = new VhdlDocumentSymbolProvider();
        const symbols = await provider.provideDocumentSymbols(doc);

        assert.strictEqual(symbols.length, 1);
        assert.strictEqual(symbols[0].name, 'structural');

        const instSym = symbols[0].children.find(c => c.name === 'spi_slave_in');
        assert.ok(instSym, 'entity instantiation should exist');
        assert.strictEqual(instSym.kind, vscode.SymbolKind.Object);
        assert.ok(instSym.detail?.includes('spi_slave'), 'detail should mention entity name');
    });

    test('should detect component instantiations in architecture', async () =>
    {
        const doc = await vscode.workspace.openTextDocument({
            content: [
                'architecture structural of top is',
                '  component pll is',
                '    port ( inclk : in std_logic; outclk : out std_logic );',
                '  end component;',
                '  signal clk, pll_out : std_logic;',
                'begin',
                '  pll_inst : pll',
                '    port map(',
                '      inclk  => clk,',
                '      outclk => pll_out',
                '    );',
                'end architecture;'
            ].join('\n'),
            language: 'vhdl'
        });

        const provider = new VhdlDocumentSymbolProvider();
        const symbols = await provider.provideDocumentSymbols(doc);

        assert.strictEqual(symbols.length, 1);

        const instSym = symbols[0].children.find(c => c.name === 'pll_inst');
        assert.ok(instSym, 'component instantiation should exist');
        assert.strictEqual(instSym.kind, vscode.SymbolKind.Class);
        assert.strictEqual(instSym.detail, 'pll');
    });

    test('should not confuse labelled processes with component instantiations', async () =>
    {
        const doc = await vscode.workspace.openTextDocument({
            content: [
                'architecture rtl of top is',
                'begin',
                '  main : process(clk, rst)',
                '  begin',
                '    if rising_edge(clk) then',
                '      null;',
                '    end if;',
                '  end process;',
                '',
                '  spi_inst : entity work.spi_master',
                '    port map(',
                '      clk => clk',
                '    );',
                'end architecture;'
            ].join('\n'),
            language: 'vhdl'
        });

        const provider = new VhdlDocumentSymbolProvider();
        const symbols = await provider.provideDocumentSymbols(doc);

        assert.strictEqual(symbols.length, 1);
        const children = symbols[0].children;

        const procSym = children.find(c => c.name === 'main');
        assert.ok(procSym, 'labelled process should exist');
        assert.strictEqual(procSym.kind, vscode.SymbolKind.Function);

        const instSym = children.find(c => c.name === 'spi_inst');
        assert.ok(instSym, 'entity instantiation should exist');
        assert.strictEqual(instSym.kind, vscode.SymbolKind.Object);
    });
});
