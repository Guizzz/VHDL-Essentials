import * as vscode from 'vscode';

const TAG_PATTERN = /\b(TODO|FIXME|HACK|XXX|NOTE)\b/gi;

export function extractTodoComments(text: string): vscode.Diagnostic[]
{
    const diagnostics: vscode.Diagnostic[] = [];
    const lines = text.split(/\r?\n/);

    for (let lineNum = 0; lineNum < lines.length; lineNum++)
    {
        const line = lines[lineNum];
        const commentIdx = line.indexOf('--');

        if (commentIdx < 0) { continue; }

        const commentText = line.slice(commentIdx);
        TAG_PATTERN.lastIndex = 0;

        let match: RegExpExecArray | null;
        while ((match = TAG_PATTERN.exec(commentText)) !== null)
        {
            const tag = match[1];
            const tagAbsStart = commentIdx + match.index;
            const tagAbsEnd = tagAbsStart + tag.length;

            // Advance past delimiter (optional colon or whitespace)
            let afterTag = match.index + tag.length;
            const delimMatch = commentText.slice(afterTag).match(/^\s*:\s*|^\s+/);
            let detailStart = afterTag;
            if (delimMatch)
            {
                detailStart += delimMatch[0].length;
            }

            // Find the next tag on this line to determine detail end
            const nextTagRegex = new RegExp(`\\b(TODO|FIXME|HACK|XXX|NOTE)\\b`, 'gi');
            nextTagRegex.lastIndex = detailStart;
            const nextTag = nextTagRegex.exec(commentText);
            const detailEnd = nextTag ? nextTag.index : commentText.length;

            const detail = commentText.slice(detailStart, detailEnd).trim();
            const rangeEnd = detail.length > 0
                ? commentIdx + detailEnd
                : tagAbsEnd;

            const range = new vscode.Range(
                lineNum, tagAbsStart,
                lineNum, rangeEnd
            );

            const message = detail
                ? `${tag}: ${detail}`
                : `${tag}`;

            const diagnostic = new vscode.Diagnostic(
                range,
                message,
                vscode.DiagnosticSeverity.Information
            );
            diagnostic.source = 'VHDL Essentials';
            diagnostic.code = 'todo.tag';
            diagnostics.push(diagnostic);
        }
    }

    return diagnostics;
}

export class TodoCommentLinter
{
    private diagnostics = vscode.languages.createDiagnosticCollection('vhdl-todos');
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

        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(
            () => this.validate(document),
            400
        );
    }

    private validate(document: vscode.TextDocument)
    {
        if (document.languageId !== 'vhdl') { return; }

        const diags = extractTodoComments(document.getText());
        this.diagnostics.set(document.uri, diags);
    }

    dispose(): void
    {
        clearTimeout(this.debounceTimer);
        this.diagnostics.dispose();
    }
}
