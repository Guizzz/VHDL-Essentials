library ieee;
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
end architecture rtl;
