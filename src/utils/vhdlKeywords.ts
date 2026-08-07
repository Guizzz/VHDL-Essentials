export const VHDL_KEYWORDS = new Set([
    'all', 'and', 'architecture', 'array', 'assert', 'attribute',
    'begin', 'block', 'body', 'buffer', 'bus', 'case', 'component',
    'configuration', 'constant', 'disconnect', 'downto', 'else', 'elsif',
    'end', 'entity', 'exit', 'file', 'for', 'function', 'generate',
    'generic', 'group', 'guarded', 'if', 'impure', 'in', 'inertial',
    'inout', 'is', 'label', 'library', 'linkage', 'literal', 'loop',
    'map', 'mod', 'nand', 'new', 'next', 'nor', 'not', 'null', 'of',
    'on', 'open', 'or', 'others', 'out', 'package', 'port', 'postponed',
    'procedure', 'process', 'pure', 'range', 'record', 'register',
    'reject', 'report', 'return', 'rol', 'ror', 'select', 'severity',
    'signal', 'shared', 'sla', 'sll', 'sra', 'srl', 'subtype', 'then',
    'to', 'transport', 'type', 'unaffected', 'units', 'until', 'use',
    'variable', 'wait', 'when', 'while', 'with', 'xnor', 'xor',
    'std_logic', 'std_logic_vector', 'integer', 'boolean', 'natural',
    'positive', 'bit', 'bit_vector', 'character', 'string', 'time',
    'real', 'signed', 'unsigned',
    'rising_edge', 'falling_edge', 'now',
    // IEEE numeric_std functions
    'to_signed', 'to_unsigned', 'to_integer', 'resize', 'std_match',
    'shift_left', 'shift_right', 'rotate_left', 'rotate_right',
    // IEEE std_logic_1164 additional functions
    'to_stdlogicvector', 'to_stdulogicvector', 'is_x',
    // Legacy Synopsys functions
    'conv_integer', 'conv_unsigned', 'conv_signed', 'conv_std_logic_vector',
    // VHDL-2008 predefined functions in std.standard
    'maximum', 'minimum',
    // VHDL keywords missing from list
    'abs', 'alias', 'after',
    // VHDL-2008 context keyword
    'context',
    // Predefined file open kinds
    'read_mode', 'write_mode', 'append_mode',
    // Time units
    'fs', 'ps', 'ns', 'us', 'ms', 'sec', 'min', 'hr',
    // Severity levels
    'note', 'warning', 'error', 'failure',
    // Standard library package names (std.textio, ieee.numeric_std, ...)
    'textio', 'env', 'standard', 'numeric_std', 'std_logic_1164',
    'std_logic_arith', 'std_logic_signed', 'std_logic_unsigned',
    'math_real', 'math_complex',
    // std.textio procedures and functions
    'read', 'readline', 'write', 'writeline', 'endfile', 'file_open',
    'file_close', 'flush', 'hread', 'hwrite', 'oread', 'owrite', 'tee',
    'deallocate',
    // std.textio types
    'text', 'line',
    // std.env procedures and functions
    'stop', 'finish', 'resolution_limit',
    // ieee.math_real functions
    'sin', 'cos', 'tan', 'arcsin', 'arccos', 'arctan', 'sinh', 'cosh',
    'tanh', 'arcsinh', 'arccosh', 'arctanh', 'exp', 'log', 'log2',
    'sqrt', 'cbrt', 'pow', 'floor', 'ceil', 'round', 'trunc', 'sign',
    'realmax', 'realmin',
    // ieee.math_real constants
    'math_e', 'math_1_over_e', 'math_pi', 'math_2_pi', 'math_1_over_pi',
    'math_pi_over_2', 'math_pi_over_3', 'math_pi_over_4', 'math_3_pi_over_2',
    'math_log_of_2', 'math_log_of_10', 'math_log_of_e', 'math_sqrt_2',
    'math_1_over_sqrt_2', 'math_sqrt_1_2',
    // VHDL-2008 std_logic_1164 / numeric_std helpers
    'to_01', 'to_x01', 'to_x01z', 'to_ux01', 'to_01z', 'to_string',
    'to_bstring', 'to_ostring', 'to_hstring', 'resolved',
]);
