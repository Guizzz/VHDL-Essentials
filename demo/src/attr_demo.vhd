library ieee;
use ieee.std_logic_1164.all;

entity attr_demo is
    port (
        clk  : in  std_logic;
        rst  : in  std_logic;
        data : in  std_logic;
        q    : out std_logic
    );
end entity attr_demo;

architecture rtl of attr_demo is
    signal my_signal : std_logic;

    attribute keep : boolean;
    attribute keep of my_signal : signal is true;

    signal internal_wire : std_logic;
begin
    q <= my_signal;
    my_signal <= data;
end architecture rtl;
