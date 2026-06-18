import * as vscode from 'vscode';
import { parseQsf, ProjectInfo } from '../parsers/qsfParser';
import { getSettingsFile } from '../quartus/quartusProject';

export class TopLevelPortLint
{
    private diagnostics = vscode.languages.createDiagnosticCollection('vhdl-qsf');
    private cachedQsf: ProjectInfo | null = null;

    constructor(context: vscode.ExtensionContext)
    {
        context.subscriptions.push(
            vscode.workspace.onDidOpenTextDocument(doc => this.validate(doc)),
            vscode.workspace.onDidChangeTextDocument(e => this.validate(e.document)),
            vscode.workspace.onDidSaveTextDocument(doc => {
                if (doc.fileName.endsWith('.qsf')) {
                    this.cachedQsf = null;
                }
            })
        );
    }

    async validate(document: vscode.TextDocument): Promise<void>
    {
        if (!document.fileName.endsWith('.vhd')) { return; }

        const text = document.getText();
        const entityMatch = text.match(/entity\s+(\w+)\s+is/i);
        if (!entityMatch) { return; }

        const entityName = entityMatch[1];

        if (!this.cachedQsf) {
            const qsfFile = await getSettingsFile();
            if (!qsfFile) { return; }
            this.cachedQsf = await parseQsf(qsfFile);
        }

        const qsf = this.cachedQsf;
        // check if file is the top-level entity
        if (!qsf.topLevel || qsf.topLevel.entity.toLowerCase() !== entityName.toLowerCase())
        {
            this.diagnostics.delete(document.uri);
            return;
        }

        const diags: vscode.Diagnostic[] = [];
        const portBlockMatch = text.match(/port\s*\(((?:[^()]|\([^()]*\))*)\)\s*;/im);
        
        if (!portBlockMatch)
        {
            this.diagnostics.set(document.uri, diags);
            return;
        }

        const portBlock = portBlockMatch[1];
        const portBlockOffset = portBlockMatch.index! + portBlockMatch[0].indexOf(portBlock);
        const portRegex = /(\w+(?:\s*,\s*\w+)*)\s*:\s*(in|out|inout)/gi;

        let match: RegExpExecArray | null;
        while ((match = portRegex.exec(portBlock)) !== null)
        {
            const absoluteOffset = portBlockOffset + match.index;
            const lineStart = text.lastIndexOf('\n', absoluteOffset) + 1;
            if (text.substring(lineStart, absoluteOffset).includes('--')) { continue; }

            const names = match[1].split(',').map(s => s.trim());
            for (const name of names)
            {
                const assigned = qsf.pins.some(p => p.signal === name || p.signal.startsWith(name + '[') );
                if (!assigned)
                {
                    const absoluteIndex = text.indexOf(match[0]);
                    const start = document.positionAt(absoluteIndex);
                    const end = start.translate(0, name.length);
                    const d = new vscode.Diagnostic(
                        new vscode.Range(start, end),
                        `No PIN assignment for '${name}'`,
                        vscode.DiagnosticSeverity.Warning
                    );
                    d.code = 'portlinter.unassigned-port';
                    diags.push(d);
                }
            }
        }
        this.diagnostics.set(document.uri, diags);
    }

    dispose(): void
    {
        this.diagnostics.dispose();
    }
}