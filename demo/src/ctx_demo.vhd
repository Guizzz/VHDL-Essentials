library ieee;
use ieee.std_logic_1164.all;

context ctx_demo is
    use ieee.std_logic_1164.all;
    use ieee.numeric_std.all;
end context ctx_demo;

entity ctx_demo is
    port (
        clk : in  std_logic;
        rst : in  std_logic;
        q   : out std_logic
    );
end entity ctx_demo;
