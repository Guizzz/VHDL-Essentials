library ieee;
use ieee.std_logic_1164.all;

entity block_demo is
    port (
        clk  : in  std_logic;
        rst  : in  std_logic;
        d    : in  std_logic;
        q    : out std_logic
    );
end entity block_demo;

architecture rtl of block_demo is
begin
    sync_block : block (rising_edge(clk))
    begin
        q <= guarded d;
    end block sync_block;

    proc_label : process(clk, rst)
    begin
        proc_label : if rst = '1' then
            q <= '0';
        end if proc_label;
    end process proc_label;
end architecture rtl;
