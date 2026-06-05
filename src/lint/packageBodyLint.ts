import * as vscode from 'vscode';

export function extractPackageDeclaredNames(text: string): Map<string, number>
{
    const names = new Map<string, number>();
    const pkgRegex = /package\s+(?!body\b)(\w+)\s+is([\s\S]*?)end\s+package\s*(?:\w+\s*)?;/gi;
    let match: RegExpExecArray | null;

    while ((match = pkgRegex.exec(text)) !== null)
    {
        const body = match[2];
        const bodyOffset = match.index + match[0].indexOf(body);
        const itemRegex = /\b(function|procedure)\s+(\w+)\s*(?:\(|;|\breturn\b|\bis\b)/gi;
        let itemMatch: RegExpExecArray | null;

        while ((itemMatch = itemRegex.exec(body)) !== null)
        {
            const name = itemMatch[2];
            const key = name.toLowerCase();

            if (!names.has(key))
            {
                names.set(key, bodyOffset + itemMatch.index);
            }
        }
    }

    return names;
}

export function extractPackageImplementedNames(text: string): Set<string>
{
    const names = new Set<string>();
    const bodyRegex = /package\s+body\s+(\w+)\s+is([\s\S]*?)end\s+package\s+body\s*(?:\w+\s*)?;/gi;
    let match: RegExpExecArray | null;

    while ((match = bodyRegex.exec(text)) !== null)
    {
        const body = match[2];
        const itemRegex = /\b(function|procedure)\s+(\w+)\s*(?:\(|;|\breturn\b|\bis\b)/gi;
        let itemMatch: RegExpExecArray | null;

        while ((itemMatch = itemRegex.exec(body)) !== null)
        {
            names.add(itemMatch[2].toLowerCase());
        }
    }

    return names;
}

export class PackageBodyLint
{
    private diagnostics: vscode.DiagnosticCollection;
    private debounceTimer: ReturnType<typeof setTimeout> | undefined;

    constructor(context: vscode.ExtensionContext)
    {
        this.diagnostics = vscode.languages.createDiagnosticCollection('vhdl-pkg-body');

        if (vscode.window.activeTextEditor)
        {
            this.validate(vscode.window.activeTextEditor.document);
        }

        context.subscriptions.push(
            vscode.workspace.onDidOpenTextDocument(doc => this.validate(doc)),
            vscode.workspace.onDidChangeTextDocument(e => this.schedule(e.document)),
            vscode.workspace.onDidCloseTextDocument(doc => this.diagnostics.delete(doc.uri))
        );
    }

    private schedule(document: vscode.TextDocument)
    {
        if (document.languageId !== 'vhdl') { return; }

        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(
            () => this.validate(document),
            400
        );
    }

    private validate(document: vscode.TextDocument)
    {
        if (document.languageId !== 'vhdl') { return; }

        const text = document.getText();
        const diags: vscode.Diagnostic[] = [];

        const declared = this.extractDeclaredNames(text);
        if (declared.size === 0) { return; }

        const implemented = this.extractImplementedNames(text);

        for (const [key, offset] of declared)
        {
            if (implemented.has(key)) { continue; }

            const pos = document.positionAt(offset);
            const range = new vscode.Range(pos, pos.translate(0, 20));
            diags.push(new vscode.Diagnostic(
                range,
                `Function/procedure declared in package but not implemented in package body`,
                vscode.DiagnosticSeverity.Warning
            ));
        }

        this.diagnostics.set(document.uri, diags);
    }

    private extractDeclaredNames(text: string): Map<string, number>
    {
        return extractPackageDeclaredNames(text);
    }

    private extractImplementedNames(text: string): Set<string>
    {
        return extractPackageImplementedNames(text);
    }

    dispose(): void
    {
        clearTimeout(this.debounceTimer);
        this.diagnostics.dispose();
    }
}
