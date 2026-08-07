import * as assert from 'node:assert';
import { LineBuffer } from '../../quartus/logger/lineBuffer';

suite('LineBuffer', () =>
{
    test('returns complete lines from a single chunk', () =>
    {
        const buffer = new LineBuffer();

        assert.deepStrictEqual(buffer.push('a\nb\n'), ['a', 'b']);
        assert.deepStrictEqual(buffer.flush(), []);
    });

    test('buffers a line split across chunks', () =>
    {
        const buffer = new LineBuffer();

        assert.deepStrictEqual(buffer.push('Error (1'), []);
        assert.deepStrictEqual(buffer.push('002): msg\n'), ['Error (1002): msg']);
    });

    test('reassembles a message split mid-token', () =>
    {
        const buffer = new LineBuffer();

        assert.deepStrictEqual(buffer.push('msg_tcl_post_message "Warn'), []);
        assert.deepStrictEqual(
            buffer.push('ing" "CODE" "Stage" "text"\nnext\n'),
            ['msg_tcl_post_message "Warning" "CODE" "Stage" "text"', 'next']
        );
    });

    test('accumulates a partial tail across multiple chunks', () =>
    {
        const buffer = new LineBuffer();

        buffer.push('Error (1');
        buffer.push('00');
        assert.deepStrictEqual(buffer.push('2): x\n'), ['Error (1002): x']);
    });

    test('flush returns the pending tail and clears it', () =>
    {
        const buffer = new LineBuffer();

        buffer.push('line without newline');
        assert.deepStrictEqual(buffer.flush(), ['line without newline']);
        assert.deepStrictEqual(buffer.flush(), []);
    });

    test('empty chunks produce no lines', () =>
    {
        const buffer = new LineBuffer();

        assert.deepStrictEqual(buffer.push(''), []);
        assert.deepStrictEqual(buffer.flush(), []);
    });

    test('handles CRLF line endings', () =>
    {
        const buffer = new LineBuffer();

        assert.deepStrictEqual(buffer.push('a\r\nb\r\n'), ['a', 'b']);
    });
});
