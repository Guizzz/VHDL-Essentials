import * as assert from 'node:assert';
import * as vscode from 'vscode';
import { checkUnassignedPorts } from '../../lint/portLint';
import { ProjectInfo } from '../../parsers/qsfParser';

function makeQsf(pins: string[]): ProjectInfo
{
    return {
        pins: pins.map((signal, i) => ({
            pin: `PIN_${i + 1}`,
            signal,
            location: new vscode.Location(
                vscode.Uri.file('fake.qsf'),
                new vscode.Position(0, 0)
            )
        }))
    };
}

suite('portLint', () =>
{
    test('unassigned port produces a warning', () =>
    {
        const text =
            'entity top is\n' +
            '    port (\n' +
            '        clk : in std_logic\n' +
            '    );\n' +
            'end entity top;\n';

        const diags = checkUnassignedPorts(text, makeQsf([]));

        assert.strictEqual(diags.length, 1);
        assert.strictEqual(diags[0].severity, vscode.DiagnosticSeverity.Warning);
        assert.strictEqual(diags[0].code, 'portlinter.unassigned-port');
        assert.ok(diags[0].message.includes('clk'));
    });

    test('assigned port produces no diagnostic', () =>
    {
        const text =
            'entity top is\n' +
            '    port (\n' +
            '        clk : in std_logic\n' +
            '    );\n' +
            'end entity top;\n';

        const diags = checkUnassignedPorts(text, makeQsf(['clk']));

        assert.strictEqual(diags.length, 0);
    });

    test('bus port matched against indexed QSF pin produces no diagnostic', () =>
    {
        const text =
            'entity top is\n' +
            '    port (\n' +
            '        data : in std_logic_vector(7 downto 0)\n' +
            '    );\n' +
            'end entity top;\n';

        const diags = checkUnassignedPorts(text, makeQsf(['data[0]']));

        assert.strictEqual(diags.length, 0);
    });

    test('diagnostic lands on the entity port line even if the same signature appears earlier', () =>
    {
        // Regression for the text.indexOf(match[0]) bug: the same port
        // signature appears in a comment before the actual port block.
        const text =
            '-- clk : in std_logic\n' +
            'entity top is\n' +
            '    port (\n' +
            '        clk : in std_logic\n' +
            '    );\n' +
            'end entity top;\n';

        const diags = checkUnassignedPorts(text, makeQsf([]));

        assert.strictEqual(diags.length, 1);
        assert.strictEqual(diags[0].range.start.line, 3);
        assert.ok(diags[0].message.includes('clk'));
    });

    test('multi-line port block positions each diagnostic on its own line', () =>
    {
        const text =
            'entity top is\n' +
            '    port (\n' +
            '        a : in std_logic;\n' +
            '        b : out std_logic;\n' +
            '        c : out std_logic\n' +
            '    );\n' +
            'end entity top;\n';

        const diags = checkUnassignedPorts(text, makeQsf(['b']));

        assert.strictEqual(diags.length, 2);
        assert.strictEqual(diags[0].range.start.line, 2);
        assert.strictEqual(diags[1].range.start.line, 4);
    });

    test('comma-separated ports get diagnostics at their own column', () =>
    {
        const text =
            'entity top is\n' +
            '    port (\n' +
            '        clk, rst : in std_logic\n' +
            '    );\n' +
            'end entity top;\n';

        const diags = checkUnassignedPorts(text, makeQsf([]));

        assert.strictEqual(diags.length, 2);
        const clk = diags.find(d => d.message.includes('clk'))!;
        const rst = diags.find(d => d.message.includes('rst'))!;
        assert.ok(clk, 'clk should be flagged');
        assert.ok(rst, 'rst should be flagged');
        assert.strictEqual(clk.range.start.character, 8);
        assert.strictEqual(rst.range.start.character, 13);
    });

    test('port declared inside a commented-out block is not flagged', () =>
    {
        const text =
            'entity top is\n' +
            '    port (\n' +
            '        -- legacy : in std_logic\n' +
            '        clk : in std_logic\n' +
            '    );\n' +
            'end entity top;\n';

        const diags = checkUnassignedPorts(text, makeQsf([]));

        assert.strictEqual(diags.length, 1);
        assert.ok(diags[0].message.includes('clk'));
        assert.ok(!diags[0].message.includes('legacy'));
    });
});
