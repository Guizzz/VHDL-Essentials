import * as assert from 'node:assert';
import { getIcon } from '../../utils/hoverIcon';

suite('hoverIcon', () =>
{
    test('signal maps to symbol-variable', () =>
    {
        assert.strictEqual(getIcon('signal'), 'symbol-variable');
    });

    test('variable maps to symbol-field', () =>
    {
        assert.strictEqual(getIcon('variable'), 'symbol-field');
    });

    test('constant maps to symbol-constant', () =>
    {
        assert.strictEqual(getIcon('constant'), 'symbol-constant');
    });

    test('port maps to symbol-interface', () =>
    {
        assert.strictEqual(getIcon('port'), 'symbol-interface');
    });

    test('unknown kind maps to default symbol-variable', () =>
    {
        assert.strictEqual(getIcon('function'), 'symbol-variable');
        assert.strictEqual(getIcon('procedure'), 'symbol-variable');
        assert.strictEqual(getIcon(''), 'symbol-variable');
    });

    test('case sensitivity (expects lowercase)', () =>
    {
        assert.strictEqual(getIcon('Signal'), 'symbol-variable');
        assert.strictEqual(getIcon('SIGNAL'), 'symbol-variable');
    });
});
