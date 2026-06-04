library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity blinky_tb is
end entity blinky_tb;

architecture sim of blinky_tb is
    signal clk : std_logic := '0';
    signal rst : std_logic := '0';
    signal led : std_logic;

    component blinky is
        port (
            clk : in  std_logic;
            rst : in  std_logic;
            led : out std_logic
        );
    end component blinky;

begin
    uut : blinky
        port map (
            clk => clk,
            rst => rst,
            led => led
        );

    clk <= not clk after 10 ns;

    process
    begin
        rst <= '1';
        wait for 100 ns;
        rst <= '0';
        wait for 2000 ns;
        wait;
    end process;
end architecture sim;
