import * as assert from 'node:assert';
import { extractMessage, formatMessage } from '../../quartus/logger/outputParser';

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
});
