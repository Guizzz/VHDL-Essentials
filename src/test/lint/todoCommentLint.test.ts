import * as assert from 'node:assert';
import { extractTodoComments } from '../../lint/todoCommentLint';

suite('todoCommentLint', () =>
{
    test('no comment produces no diagnostics', () =>
    {
        const diags = extractTodoComments(
            'architecture rtl of top is\n' +
            'begin\n' +
            'end architecture;'
        );
        assert.strictEqual(diags.length, 0);
    });

    test('normal comment without marker produces no diagnostics', () =>
    {
        const diags = extractTodoComments(
            '-- this is a normal comment\n'
        );
        assert.strictEqual(diags.length, 0);
    });

    test('TODO marker is detected', () =>
    {
        const diags = extractTodoComments(
            '-- TODO: refactor this\n'
        );
        assert.strictEqual(diags.length, 1);
        assert.ok(diags[0].message.includes('TODO'));
        assert.ok(diags[0].message.includes('refactor this'));
        assert.strictEqual(diags[0].severity, 2); // Information
    });

    test('FIXME marker is detected', () =>
    {
        const diags = extractTodoComments(
            '-- FIXME: crash here\n'
        );
        assert.strictEqual(diags.length, 1);
        assert.ok(diags[0].message.includes('FIXME'));
        assert.ok(diags[0].message.includes('crash here'));
    });

    test('HACK marker is detected', () =>
    {
        const diags = extractTodoComments(
            '-- HACK: workaround\n'
        );
        assert.strictEqual(diags.length, 1);
    });

    test('XXX marker is detected', () =>
    {
        const diags = extractTodoComments(
            '-- XXX: known bug\n'
        );
        assert.strictEqual(diags.length, 1);
    });

    test('NOTE marker is detected', () =>
    {
        const diags = extractTodoComments(
            '-- NOTE: review this\n'
        );
        assert.strictEqual(diags.length, 1);
    });

    test('case insensitive detection', () =>
    {
        assert.strictEqual(extractTodoComments('-- todo: lowercase\n').length, 1);
        assert.strictEqual(extractTodoComments('-- Todo: capitalized\n').length, 1);
        assert.strictEqual(extractTodoComments('-- TODO: uppercase\n').length, 1);
    });

    test('multiple markers on same line are all detected', () =>
    {
        const diags = extractTodoComments(
            '-- TODO: fix this and FIXME: also this\n'
        );
        assert.strictEqual(diags.length, 2);
    });

    test('marker without colon is detected', () =>
    {
        const diags = extractTodoComments(
            '-- TODO fix this\n'
        );
        assert.strictEqual(diags.length, 1);
        assert.ok(diags[0].message.includes('fix this'));
    });

    test('marker in code does not produce diagnostic', () =>
    {
        const diags = extractTodoComments(
            'signal TODO : bit;\n'
        );
        assert.strictEqual(diags.length, 0);
    });

    test('marker after code comment is detected', () =>
    {
        const diags = extractTodoComments(
            'signal s1 : bit; -- TODO: rename later\n'
        );
        assert.strictEqual(diags.length, 1);
        assert.ok(diags[0].message.includes('rename later'));
    });

    test('marker at end of line without detail is detected', () =>
    {
        const diags = extractTodoComments(
            '-- TODO\n'
        );
        assert.strictEqual(diags.length, 1);
        assert.strictEqual(diags[0].message, 'TODO');
    });

    test('empty string produces no diagnostics', () =>
    {
        const diags = extractTodoComments('');
        assert.strictEqual(diags.length, 0);
    });

    test('multiple lines with markers are all detected', () =>
    {
        const diags = extractTodoComments(
            '-- TODO: first\n' +
            'signal s1 : bit;\n' +
            '-- FIXME: second\n'
        );
        assert.strictEqual(diags.length, 2);
        assert.ok(diags[0].message.includes('first'));
        assert.ok(diags[1].message.includes('second'));
    });
});
