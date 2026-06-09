import * as vscode from 'vscode';
import { parseSignals } from '../parsers/variableParser';
import { parseTypeDeclarations, parseSubtypeDeclarations } from '../parsers/typeParser';
import { parseEntityGenerics } from '../parsers/entityParser';
import { VHDL_KEYWORDS } from '../utils/vhdlKeywords';
import { offsetToPosition } from '../utils/positionUtils';

export function findUndeclaredIdentifiers(text: string): vscode.Diagnostic[]
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

        // 4. Check if inside a comment
        const lineStart = text.lastIndexOf('\n', idx) + 1;
        const textBeforeOnLine = text.substring(lineStart, idx);
        if (textBeforeOnLine.includes('--')) { continue; }

        // 5. Check full line context for special VHDL constructs
        const lineEnd = text.indexOf('\n', idx);
        const wholeLine = text.substring(lineStart, lineEnd >= 0 ? lineEnd : text.length).trim();

        if (/^(use|library|entity|configuration|component|architecture)\s/i.test(wholeLine))
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

        // Label: "ident : entity" / "ident : component" / "ident : process" / "ident : for"
        if (/^\s*:\s*(entity|component|process|for)\s/i.test(contextAfter))
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

    constructor(context: vscode.ExtensionContext)
    {
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

        const diags = findUndeclaredIdentifiers(document.getText());
        this.diagnostics.set(document.uri, diags);
    }

    dispose(): void
    {
        clearTimeout(this.debounceTimer);
        this.diagnostics.dispose();
    }
}
