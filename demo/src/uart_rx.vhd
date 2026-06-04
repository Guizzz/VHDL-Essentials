library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity uart_rx is
    port (
        clk       : in  std_logic;
        rst       : in  std_logic;
        rx_line   : in  std_logic;
        data_out  : out std_logic_vector(7 downto 0);
        data_rdy  : out std_logic
    );
end entity;

architecture rtl of uart_rx is
    type state_t is (idle, start_bit, data_bits, stop_bit);
    signal state : state_t;
    signal bit_count : unsigned(2 downto 0);
    signal shift_reg : std_logic_vector(7 downto 0);
    signal clk_div : unsigned(15 downto 0);
    constant CLKS_PER_BIT : positive := 868;
begin
    process(clk, rst)
        variable temp : std_logic_vector(7 downto 0);
    begin
        if rst = '1' then
            state <= idle;
            data_rdy <= '0';
            clk_div <= (others => '0');
        elsif rising_edge(clk) then
            case state is
                when idle =>
                    data_rdy <= '0';
                    if rx_line = '0' then
                        state <= start_bit;
                        clk_div <= (others => '0');
                    end if;
                when start_bit =>
                    if clk_div = CLKS_PER_BIT / 2 then
                        if rx_line = '0' then
                            state <= data_bits;
                            bit_count <= (others => '0');
                            clk_div <= (others => '0');
                        else
                            state <= idle;
                        end if;
                    else
                        clk_div <= clk_div + 1;
                    end if;
                when data_bits =>
                    if clk_div = CLKS_PER_BIT then
                        shift_reg <= rx_line & shift_reg(7 downto 1);
                        clk_div <= (others => '0');
                        if bit_count = 7 then
                            state <= stop_bit;
                        else
                            bit_count <= bit_count + 1;
                        end if;
                    else
                        clk_div <= clk_div + 1;
                    end if;
                when stop_bit =>
                    if clk_div = CLKS_PER_BIT then
                        data_out <= shift_reg;
                        data_rdy <= '1';
                        state <= idle;
                    else
                        clk_div <= clk_div + 1;
                    end if;
            end case;
        end if;
    end process;
end architecture rtl;
