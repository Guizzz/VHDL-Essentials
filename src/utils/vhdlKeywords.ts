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
    // VHDL keyword missing from list
    'abs', 'alias',
    // VHDL-2008 context keyword
    'context',
    // Predefined file open kinds
    'read_mode', 'write_mode', 'append_mode',
    // Time units
    'fs', 'ps', 'ns', 'us', 'ms', 'sec', 'min', 'hr',
    // Severity levels
    'note', 'warning', 'error', 'failure',
]);
