import * as assert from 'node:assert';
import { extractMessage, formatMessage, parseRawLine } from '../../quartus/logger/outputParser';

suite('outputParser', () =>
{
    suite('extractMessage', () =>
    {
        test('extract info message', () =>
        {
            const result = extractMessage(
                'msg_tcl_post_message "Info" "IQEXE_ERROR_COUNT" "Analysis & Synthesis" "Analysis & Synthesis was successful (0 errors)"'
            );

            assert.ok(result !== null);
            assert.strictEqual(result.stage, 'Analysis & Synthesis');
            assert.strictEqual(result.severity, 'info');
            assert.strictEqual(result.code, 'IQEXE_ERROR_COUNT');
            assert.ok(result.text.includes('successful'));
        });

        test('extract warning message', () =>
        {
            const result = extractMessage(
                'msg_tcl_post_message "Warning" "WSTA_TIMING_NOT_MET" "Fitter" "Timing requirements not met"'
            );

            assert.ok(result !== null);
            assert.strictEqual(result.severity, 'warning');
            assert.strictEqual(result.code, 'WSTA_TIMING_NOT_MET');
        });

        test('extract critical warning', () =>
        {
            const result = extractMessage(
                'msg_tcl_post_message "Critical Warning" "WSTA_SDC_NOT_FOUND" "Fitter" "No SDC constraints file found"'
            );

            assert.ok(result !== null);
            assert.strictEqual(result.severity, 'critical');
        });

        test('extract error message', () =>
        {
            const result = extractMessage(
                'msg_tcl_post_message "Error" "EVRFX_VHDL_SYNTAX_ERROR" "Analysis & Synthesis" "VHDL syntax error at counter.vhd(12): unexpected identifier"'
            );

            assert.ok(result !== null);
            assert.strictEqual(result.severity, 'error');
            assert.strictEqual(result.code, 'EVRFX_VHDL_SYNTAX_ERROR');
        });

        test('return null for non-Quartus line', () =>
        {
            const result = extractMessage('This is just a normal log line');
            assert.strictEqual(result, null);
        });

        test('return null for empty string', () =>
        {
            const result = extractMessage('');
            assert.strictEqual(result, null);
        });

        test('handle escaped quotes in message text', () =>
        {
            const result = extractMessage(
                'msg_tcl_post_message "Info" "UNKNOWN" "Stage" "Found device \\"Cyclone IV\\" in database"'
            );

            assert.ok(result !== null);
            assert.ok(result.text.includes('Cyclone IV'));
        });
    });

    suite('formatMessage', () =>
    {
        test('format timing not met warning', () =>
        {
            const msg = {
                stage: 'Fitter',
                severity: 'warning' as const,
                code: 'WSTA_TIMING_NOT_MET',
                text: 'Timing requirements not met'
            };
            assert.strictEqual(formatMessage(msg), '\u26a0\ufe0f Timing requirements not met');
        });

        test('format success message', () =>
        {
            const msg = {
                stage: 'Analysis & Synthesis',
                severity: 'info' as const,
                code: 'IQEXE_ERROR_COUNT',
                text: 'Analysis & Synthesis was successful (0 errors)'
            };
            assert.strictEqual(formatMessage(msg), '\u2705 Analysis & Synthesis was successful (0 errors)\n');
        });

        test('format VHDL syntax error message', () =>
        {
            const msg = {
                stage: 'Analysis & Synthesis',
                severity: 'error' as const,
                code: 'EVRFX_VHDL_SYNTAX_ERROR',
                text: 'VHDL syntax error at counter.vhd(12)'
            };
            // code-specific prefix: ✍❌
            assert.strictEqual(formatMessage(msg), '\u270d\u274c VHDL syntax error at counter.vhd(12)');
        });

        test('format SDC not found warning (code-specific)', () =>
        {
            const msg = {
                stage: 'Fitter',
                severity: 'critical' as const,
                code: 'WSTA_SDC_NOT_FOUND',
                text: 'No SDC constraints file found'
            };
            // WSTA_SDC_NOT_FOUND has its own code path before severity switch
            assert.strictEqual(formatMessage(msg), '\u26a0\ufe0f No SDC constraints file found');
        });

        test('return empty string for processing info', () =>
        {
            const msg = {
                stage: 'Quartus',
                severity: 'info' as const,
                code: 'UNKNOWN',
                text: 'Processing started: Quartus Prime Analysis & Synthesis'
            };
            assert.strictEqual(formatMessage(msg), '');
        });

        test('add brackets for running quartus messages', () =>
        {
            const msg = {
                stage: 'Quartus',
                severity: 'info' as const,
                code: 'UNKNOWN',
                text: 'Running Quartus Prime Analysis & Synthesis'
            };
            assert.strictEqual(formatMessage(msg), '[Running Quartus Prime Analysis & Synthesis]\n');
        });

        test('pass through unknown text', () =>
        {
            const msg = {
                stage: 'Quartus',
                severity: 'info' as const,
                code: 'UNKNOWN',
                text: 'Some informational text'
            };
            assert.strictEqual(formatMessage(msg), 'Some informational text');
        });
    });

    suite('parseRawLine', () =>
    {
        test('parse "Error (NNNN): msg" format', () =>
        {
            const result = parseRawLine('Error (125095): Part name 5M40ZE64C4N is invalid');
            assert.ok(result !== null);
            assert.strictEqual(result.severity, 'error');
            assert.strictEqual(result.code, '125095');
            assert.strictEqual(result.text, 'Part name 5M40ZE64C4N is invalid');
            assert.strictEqual(result.stage, 'Quartus');
        });

        test('parse "Error: msg" format (no code)', () =>
        {
            const result = parseRawLine('Error: Quartus Prime Analysis & Synthesis was unsuccessful. 2 errors, 0 warnings');
            assert.ok(result !== null);
            assert.strictEqual(result.severity, 'error');
            assert.strictEqual(result.code, 'UNKNOWN');
            assert.strictEqual(result.text, 'Quartus Prime Analysis & Synthesis was unsuccessful. 2 errors, 0 warnings');
        });

        test('parse "Info: msg" format (no code)', () =>
        {
            const result = parseRawLine('Info: Running Quartus Prime Shell');
            assert.ok(result !== null);
            assert.strictEqual(result.severity, 'info');
            assert.strictEqual(result.code, 'UNKNOWN');
            assert.strictEqual(result.text, 'Running Quartus Prime Shell');
        });

        test('parse "Warning (NNNN): msg" format', () =>
        {
            const result = parseRawLine('Warning (10036): Design has unconstrained input ports');
            assert.ok(result !== null);
            assert.strictEqual(result.severity, 'warning');
            assert.strictEqual(result.code, '10036');
            assert.strictEqual(result.text, 'Design has unconstrained input ports');
        });

        test('parse "Critical Warning (NNNN): msg" format', () =>
        {
            const result = parseRawLine('Critical Warning (20001): No SDC constraints file found');
            assert.ok(result !== null);
            assert.strictEqual(result.severity, 'critical');
            assert.strictEqual(result.code, '20001');
        });

        test('return null for non-Quartus line', () =>
        {
            const result = parseRawLine('This is just a normal log line');
            assert.strictEqual(result, null);
        });

        test('return null for empty string', () =>
        {
            const result = parseRawLine('');
            assert.strictEqual(result, null);
        });

        test('return null for indented continuation lines', () =>
        {
            const result = parseRawLine('    Info: Version 25.1std.0 Build 1129');
            assert.strictEqual(result, null);
        });

        test('return null for report_status lines', () =>
        {
            // These are filtered by parseChunk, but parseRawLine should also not match
            const result = parseRawLine('report_status "passed"');
            assert.strictEqual(result, null);
        });
    });
});
