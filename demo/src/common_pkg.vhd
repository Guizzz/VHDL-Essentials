library ieee;
use ieee.std_logic_1164.all;

package common_pkg is
    constant DATA_WIDTH : positive := 16;
    constant ADDR_WIDTH : positive := 8;
    constant VERSION : string := "2.1.0";

    subtype word_t is std_logic_vector(DATA_WIDTH - 1 downto 0);
    subtype addr_t is std_logic_vector(ADDR_WIDTH - 1 downto 0);

    type bus_state_t is (idle, request, grant, release);

    signal sys_clk : std_logic;
    signal sys_rst : std_logic;

    function clog(x : positive) return natural;
end package common_pkg;

package body common_pkg is
    function clog(x : positive) return natural is
        variable result : natural := 0;
        variable temp : positive := 1;
    begin
        while temp < x loop
            temp := temp * 2;
            result := result + 1;
        end loop;
        return result;
    end function;
end package body;
