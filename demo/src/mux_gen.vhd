library ieee;
use ieee.std_logic_1164.all;

entity mux_gen is
    generic (
        WIDTH : positive := 8
    );
    port (
        sel   : in  std_logic;
        a     : in  std_logic_vector(WIDTH - 1 downto 0);
        b     : in  std_logic_vector(WIDTH - 1 downto 0);
        y     : out std_logic_vector(WIDTH - 1 downto 0)
    );
end entity mux_gen;

architecture rtl of mux_gen is
    alias narrow_a is a;
    alias narrow_b is b;
begin
    gen_wide : if WIDTH > 0 generate
        y <= a when sel = '1' else b;
    end generate gen_wide;

    gen_zero : if WIDTH = 0 generate
        y <= (others => '0');
    end generate gen_zero;

    narrow_a <= a;
    narrow_b <= b;
end architecture rtl;
