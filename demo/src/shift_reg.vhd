library ieee;
use ieee.std_logic_1164.all;

entity shift_reg is
    generic (
        WIDTH : positive := 8
    );
    port (
        clk   : in  std_logic;
        rst   : in  std_logic;
        din   : in  std_logic;
        dout  : out std_logic
    );
end entity shift_reg;

architecture rtl of shift_reg is
    signal shift_chain : std_logic_vector(WIDTH - 1 downto 0);
begin
    shift_chain(0) <= din;

    gen_stages : for i in 0 to WIDTH - 2 generate
        shift_chain(i + 1) <= shift_chain(i);
    end generate gen_stages;

    process(clk, rst)
    begin
        if rst = '1' then
            shift_chain <= (others => '0');
        elsif rising_edge(clk) then
            shift_chain <= shift_chain;
        end if;
    end process;

    dout <= shift_chain(WIDTH - 1);
end architecture rtl;
