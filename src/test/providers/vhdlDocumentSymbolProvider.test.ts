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
        assert.strictEqual(symbols[0].kind, vscode.SymbolKind.Class);

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
        assert.strictEqual(instSym.kind, vscode.SymbolKind.Class);
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
        assert.strictEqual(instSym.kind, vscode.SymbolKind.Class);
    });

    test('should extract local variables inside a process', async () =>
    {
        const doc = await vscode.workspace.openTextDocument({
            content: [
                'architecture rtl of counter is',
                '  signal cnt : unsigned(7 downto 0);',
                'begin',
                '  proc_main : process(clk, rst)',
                '    variable tmp : std_logic_vector(7 downto 0);',
                '    constant DELAY : integer := 5;',
                '  begin',
                '    if rising_edge(clk) then',
                '      cnt <= cnt + 1;',
                '    end if;',
                '  end process;',
                'end architecture rtl;'
            ].join('\n'),
            language: 'vhdl'
        });

        const provider = new VhdlDocumentSymbolProvider();
        const symbols = await provider.provideDocumentSymbols(doc);

        assert.strictEqual(symbols.length, 1);

        const children = symbols[0].children;
        const procSym = children.find(c => c.name === 'proc_main');
        assert.ok(procSym, 'proc_main process should exist');
        assert.strictEqual(procSym.kind, vscode.SymbolKind.Function);

        const procChildren = procSym.children;
        assert.ok(procChildren, 'process should have children');
        assert.strictEqual(procChildren.length, 2, 'should have 2 local declarations');

        const tmpSym = procChildren.find(c => c.name === 'tmp');
        assert.ok(tmpSym, 'variable tmp should exist');
        assert.strictEqual(tmpSym.kind, vscode.SymbolKind.Variable);

        const delaySym = procChildren.find(c => c.name === 'DELAY');
        assert.ok(delaySym, 'constant DELAY should exist');
        assert.strictEqual(delaySym.kind, vscode.SymbolKind.Constant);

        // Architecture-level signal should still be a sibling, not child of process
        const cntSym = children.find(c => c.name === 'cnt');
        assert.ok(cntSym, 'signal cnt should exist at architecture level');
    });

    test('should extract function parameters in package', async () =>
    {
        const doc = await vscode.workspace.openTextDocument({
            content: [
                'package utils is',
                '  function to_string(val : integer) return string;',
                '  function max(a : integer; b : integer) return integer;',
                'end package utils;'
            ].join('\n'),
            language: 'vhdl'
        });

        const provider = new VhdlDocumentSymbolProvider();
        const symbols = await provider.provideDocumentSymbols(doc);

        assert.strictEqual(symbols.length, 1);

        const children = symbols[0].children;

        const toStrSym = children.find(c => c.name === 'to_string');
        assert.ok(toStrSym, 'function to_string should exist');
        assert.strictEqual(toStrSym.kind, vscode.SymbolKind.Function);
        assert.ok(toStrSym.detail?.includes('return string'), 'should show return type');

        // to_string has one parameter
        const toStrParams = toStrSym.children;
        assert.ok(toStrParams, 'to_string should have parameter children');
        assert.strictEqual(toStrParams.length, 1, 'to_string should have 1 parameter');
        assert.strictEqual(toStrParams[0].name, 'val');
        assert.strictEqual(toStrParams[0].kind, vscode.SymbolKind.Field);

        // max has two parameters
        const maxSym = children.find(c => c.name === 'max');
        assert.ok(maxSym, 'function max should exist');
        const maxParams = maxSym.children;
        assert.strictEqual(maxParams.length, 2, 'max should have 2 parameters');
        assert.strictEqual(maxParams[0].name, 'a');
        assert.strictEqual(maxParams[1].name, 'b');
    });

    test('should extract procedure parameters in package', async () =>
    {
        const doc = await vscode.workspace.openTextDocument({
            content: [
                'package utils is',
                '  procedure reset_all(signal rst : out std_logic; constant cycles : integer);',
                'end package utils;'
            ].join('\n'),
            language: 'vhdl'
        });

        const provider = new VhdlDocumentSymbolProvider();
        const symbols = await provider.provideDocumentSymbols(doc);

        assert.strictEqual(symbols.length, 1);

        const resetProc = symbols[0].children.find(c => c.name === 'reset_all');
        assert.ok(resetProc, 'procedure reset_all should exist');
        assert.strictEqual(resetProc.kind, vscode.SymbolKind.Method);

        const params = resetProc.children;
        assert.strictEqual(params.length, 2, 'reset_all should have 2 parameters');

        const rstParam = params.find(p => p.name === 'rst');
        assert.ok(rstParam, 'param rst should exist');
        assert.ok(rstParam.detail?.includes('out'), 'rst should show direction');

        const cyclesParam = params.find(p => p.name === 'cycles');
        assert.ok(cyclesParam, 'param cycles should exist');
    });
});
