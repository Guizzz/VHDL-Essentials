library ieee;
use ieee.std_logic_1164.all;

package demo_pkg is
    constant CLK_FREQ : positive := 50_000_000;
    constant BLINK_MS : positive := 500;
    constant MAX_COUNT : positive := CLK_FREQ * BLINK_MS / 1000;

    subtype led_state_t is std_logic;

    signal global_reset : std_logic;
end package demo_pkg;
