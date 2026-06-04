library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use work.demo_pkg.all;

entity blinky is
    port (
        clk : in  std_logic;
        rst : in  std_logic;
        led : out std_logic
    );
end entity blinky;

architecture rtl of blinky is
    component clk_div is
        port (
            clk      : in  std_logic;
            rst      : in  std_logic;
            max_cnt  : in  std_logic_vector(31 downto 0);
            pulse    : out std_logic
        );
    end component clk_div;

    signal pulse_500ms : std_logic;
    signal led_reg     : std_logic;
begin
    u_clk_div : clk_div
        port map (
            clk     => clk,
            rst     => rst,
            max_cnt => std_logic_vector(to_unsigned(MAX_COUNT, 32)),
            pulse   => pulse_500ms
        );

    process(clk, rst)
    begin
        if rst = '1' then
            led_reg <= '0';
        elsif rising_edge(clk) then
            if pulse_500ms = '1' then
                led_reg <= not led_reg;
            end if;
        end if;
    end process;

    led <= led_reg;
end architecture rtl;
