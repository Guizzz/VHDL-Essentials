---
name: test-generation
description: Use when writing or modifying tests for parsers, linters, utilities, or providers in the QuartusAssistant project. Triggered by filenames matching *.test.ts or the test/ directory.
---

# Test Generation — QuartusAssistant

## Test framework
- **Runner**: Mocha (via `@vscode/test-cli` + `@vscode/test-electron`)
- **Assertion**: `node:assert` (NOT chai, NOT jest)
- **No VS Code mocking**: Tests call pure exported functions directly with string input
- **Location**: `src/test/<category>/<name>.test.ts` (mirrors `src/` structure)

## Test file structure
```ts
import * as assert from 'node:assert';
import { someFunction } from '../../path/to/module';

suite('<moduleName>', () =>
{
    test('<descriptive name>', () =>
    {
        const result = someFunction(input);
        assert.strictEqual(result.length, N);
        assert.strictEqual(result[0].prop, expected);
    });
});
```
- Use `suite()` (NOT `describe()`): Mocha `suite` is the default in this project
- Use `test()` (NOT `it()`)
- Tests are flat — no nested `suite()` blocks unless grouping by category

## Import path convention
From `src/test/<category>/foo.test.ts`:
- Linter: `../../lint/<linter>`
- Parser: `../../parsers/<parser>`
- Utils: `../../utils/<util>`
- Providers: `../../providers/<provider>`

## Linter test pattern
Call the pure validation function directly. Assert on diagnostic count, severity, message, range.
```ts
import * as assert from 'node:assert';
import { validateSyntax } from '../../lint/syntaxLint';

suite('syntaxLint', () =>
{
    test('valid entity has no errors', () =>
    {
        const diags = validateSyntax(`entity foo is end entity;`);
        const errors = diags.filter(d => d.severity === 0 || d.severity === 1);
        assert.strictEqual(errors.length, 0);
    });

    test('missing semicolon produces error', () =>
    {
        const diags = validateSyntax(`entity foo is end entity`);
        assert.ok(diags.some(d => d.message.includes('semicolon')));
    });
});
```
Diagnostic severity: `0` = Error, `1` = Warning, `2` = Information, `3` = Hint (from `vscode.DiagnosticSeverity`).

## Parser test pattern
Call the parse function, assert on returned data structure shape.
```ts
test('parse entity with ports', () =>
{
    const result = parseEntities(`entity counter is
        port ( clk : in std_logic; count : out std_logic_vector(7 downto 0) );
    end entity;`);

    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].name, 'counter');
    assert.strictEqual(result[0].ports.length, 2);
    assert.strictEqual(result[0].ports[0].direction, 'in');
});
```
Test edge cases: empty input, comments, multiple entities, ports with comma-separated names, unusual whitespace.

## Utility test pattern
Test format/parse functions, fixture helpers, and DO file generation.
```ts
test('generates correct DO file content', () =>
{
    const result = generateDoFile(params);
    assert.ok(result.includes('vsim work.top'));
    assert.ok(result.includes('run -all'));
});
```

## Fixture files
Located in `src/test/fixtures/` — `.vhd` files used by multiple tests. Import as template strings or read via `fs.readFileSync`.

## Running tests
```bash
npm run compile-tests   # compiles src/test/ → out/test/
npm test                # launches VS Code with compiled tests
```

## When adding a new test file
1. Place it in the correct subdirectory under `src/test/`
2. Match the module name: `src/lint/fooLint.ts` → `src/test/lint/fooLint.test.ts`
3. Export a public pure function from the source module (if not already exported)
4. Run `npm run compile-tests` to verify it compiles
