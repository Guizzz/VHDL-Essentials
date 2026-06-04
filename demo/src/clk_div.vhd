library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity clk_div is
    port (
        clk      : in  std_logic;
        rst      : in  std_logic;
        max_cnt  : in  std_logic_vector(31 downto 0);
        pulse    : out std_logic
    );
end entity clk_div;

architecture rtl of clk_div is
    signal counter : unsigned(31 downto 0);
    signal done    : std_logic;
begin
    process(clk, rst)
        variable temp : unsigned(31 downto 0);
    begin
        if rst = '1' then
            counter <= (others => '0');
            done    <= '0';
        elsif rising_edge(clk) then
            if counter >= unsigned(max_cnt) then
                counter <= (others => '0');
                done    <= '1';
            else
                counter <= counter + 1;
                done    <= '0';
            end if;
        end if;
    end process;

    pulse <= done;
end architecture rtl;
