import * as vscode from 'vscode';
import { parseSignals } from '../parsers/variableParser';
import { parseTypeDeclarations, parseSubtypeDeclarations } from '../parsers/typeParser';
import { parseEntityGenerics } from '../parsers/entityParser';
import { parsePackages } from '../parsers/packageParser';
import { VHDL_KEYWORDS } from '../utils/vhdlKeywords';
import { offsetToPosition } from '../utils/positionUtils';
import { EntityIndexer } from '../services/entityIndexer';

export function findUndeclaredIdentifiers(
    text: string,
    resolveSymbol?: (name: string) => boolean
): vscode.Diagnostic[]
{
    const diagnostics: vscode.Diagnostic[] = [];

    const declaredNames = new Set(
        parseSignals(text).map(s => s.name.toLowerCase())
    );

    // Add type names, subtype names, and enum literals
    for (const t of parseTypeDeclarations(text))
    {
        declaredNames.add(t.name.toLowerCase());
    }
    for (const st of parseSubtypeDeclarations(text))
    {
        declaredNames.add(st.name.toLowerCase());
    }

    // Add entity generic names
    for (const g of parseEntityGenerics(text))
    {
        declaredNames.add(g.name.toLowerCase());
    }

    // Add package names
    for (const pkg of parsePackages(text))
    {
        declaredNames.add(pkg.name.toLowerCase());
    }

    // Add for-loop variable names (implicitly declared by "for ident in")
    const loopVarRegex = /\bfor\s+(\w+)\s+in\b/gi;
    let loopMatch: RegExpExecArray | null;

    while ((loopMatch = loopVarRegex.exec(text)) !== null)
    {
        // Skip if inside a comment
        const lineStart = text.lastIndexOf('\n', loopMatch.index) + 1;
        const beforeOnLine = text.substring(lineStart, loopMatch.index);

        if (!beforeOnLine.includes('--'))
        {
            declaredNames.add(loopMatch[1].toLowerCase());
        }
    }

    const identRegex = /\b([a-zA-Z_]\w*)\b/g;
    let match: RegExpExecArray | null;

    while ((match = identRegex.exec(text)) !== null)
    {
        const word = match[1];
        const wordLower = word.toLowerCase();
        const idx = match.index;

        // 1. Skip VHDL keywords and well-known types
        if (VHDL_KEYWORDS.has(wordLower)) { continue; }

        // 2. Skip declared identifiers
        if (declaredNames.has(wordLower)) { continue; }

        // 3. Skip built-in library names and well-known values
        if (wordLower === 'work' || wordLower === 'ieee' || wordLower === 'std' ||
            wordLower === 'true' || wordLower === 'false') { continue; }

        // 4. Check if inside a comment or string literal
        const lineStart = text.lastIndexOf('\n', idx) + 1;
        const textBeforeOnLine = text.substring(lineStart, idx);
        if (textBeforeOnLine.includes('--')) { continue; }
        const quotesBefore = (textBeforeOnLine.match(/"/g) || []).length;
        if (quotesBefore % 2 === 1) { continue; }

        // 5. Check full line context for special VHDL constructs
        const lineEnd = text.indexOf('\n', idx);
        const wholeLine = text.substring(lineStart, lineEnd >= 0 ? lineEnd : text.length).trim();

        if (/^(use|library|entity|configuration|component|architecture|package)\s/i.test(wholeLine))
        {
            continue;
        }

        // 6. Context checks using surrounding text
        const contextBefore = text.substring(Math.max(0, idx - 30), idx);
        const contextAfter = text.substring(
            idx + word.length,
            Math.min(text.length, idx + word.length + 15)
        );

        // After entity/configuration keyword (entity work.xxx)
        if (/entity\s+$/i.test(contextBefore) ||
            /configuration\s+$/i.test(contextBefore))
        {
            continue;
        }

        // After "package" keyword (package name / end package name)
        if (/package\s+$/i.test(contextBefore) ||
            /package\s+body\s+$/i.test(contextBefore))
        {
            continue;
        }

        // After "work." (entity work.xxx / use work.xxx.all)
        if (/work\.\s*$/i.test(contextBefore))
        {
            continue;
        }

        // Loop variable: "for ident in" or "for ident loop"
        if (/for\s+$/i.test(contextBefore) && /^\s*(in|loop)\b/i.test(contextAfter))
        {
            continue;
        }

        // Port map formal / case when target: "ident =>"
        if (/^\s*=>/.test(contextAfter))
        {
            continue;
        }

        // Attribute target: "ident'attribute"
        if (idx + word.length < text.length && text[idx + word.length] === "'")
        {
            continue;
        }

        // Attribute name: "signal'ident" — skip identifier after apostrophe
        if (idx > 0 && text[idx - 1] === "'")
        {
            continue;
        }

        // Literal prefix: x"", b"", o"", d""
        if ((wordLower === 'x' || wordLower === 'b' || wordLower === 'o' || wordLower === 'd') &&
            idx + word.length < text.length && text[idx + word.length] === '"')
        {
            continue;
        }

        // Label: "ident : entity" / "ident : component" / "ident : process" / "ident : for"
        if (/^\s*:\s*(entity|component|process|for)\s/i.test(contextAfter))
        {
            continue;
        }

        // 15. Check via external resolver (e.g. cross-file package symbols)
        if (resolveSymbol && resolveSymbol(word))
        {
            continue;
        }

        // === UNDECLARED IDENTIFIER ===
        const pos = offsetToPosition(text, idx);
        const range = new vscode.Range(pos, pos.translate(0, word.length));

        diagnostics.push(new vscode.Diagnostic(
            range,
            `Undeclared identifier '${word}'`,
            vscode.DiagnosticSeverity.Error
        ));
    }

    return diagnostics;
}

export class UndeclaredIdentifiersLinter
{
    private diagnostics = vscode.languages.createDiagnosticCollection('vhdl-undeclared');
    private debounceTimer: ReturnType<typeof setTimeout> | undefined;
    private indexer: EntityIndexer | undefined;

    constructor(
        context: vscode.ExtensionContext,
        indexer?: EntityIndexer
    )
    {
        this.indexer = indexer;

        if (vscode.window.activeTextEditor)
        {
            this.validate(vscode.window.activeTextEditor.document);
        }

        context.subscriptions.push(
            vscode.workspace.onDidOpenTextDocument(doc => this.validate(doc)),
            vscode.workspace.onDidChangeTextDocument(e => this.schedule(e.document))
        );
    }

    private schedule(document: vscode.TextDocument)
    {
        if (document.languageId !== 'vhdl') { return; }
        if (document.uri.scheme !== 'file') { return; }

        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(
            () => this.validate(document),
            400
        );
    }

    private validate(document: vscode.TextDocument)
    {
        if (document.languageId !== 'vhdl') { return; }
        if (document.uri.scheme !== 'file') { return; }

        const resolveSymbol = this.indexer
            ? (name: string) => this.indexer!.getSymbol(name) !== undefined
            : undefined;

        const diags = findUndeclaredIdentifiers(document.getText(), resolveSymbol);
        this.diagnostics.set(document.uri, diags);
    }

    dispose(): void
    {
        clearTimeout(this.debounceTimer);
        this.diagnostics.dispose();
    }
}
