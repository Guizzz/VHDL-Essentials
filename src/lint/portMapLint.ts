import * as vscode from 'vscode';
import { PortMapClause, parsePortMaps } from '../parsers/portMapParser';
import { EntityPort } from '../types/types';
import { EntityIndexer } from '../services/entityIndexer';
import { offsetToPosition } from '../utils/positionUtils';

export function validatePortMaps(
    text: string,
    portMaps: PortMapClause[],
    entityPorts: Map<string, EntityPort> | undefined
): vscode.Diagnostic[]
{
    const diags: vscode.Diagnostic[] = [];
    if (!entityPorts || entityPorts.size === 0) { return diags; }

    for (const clause of portMaps)
    {
        const mappedFormals = new Set<string>();
        const isOpen = new Set<string>();

        for (const m of clause.mappings)
        {
            const key = m.formal.toLowerCase();
            mappedFormals.add(key);
            if (m.actual.toLowerCase() === 'open')
            {
                isOpen.add(key);
            }
        }

        for (const [portName, port] of entityPorts)
        {
            if (mappedFormals.has(portName.toLowerCase())) { continue; }

            const pos = offsetToPosition(text, clause.entityOffset);
            const range = new vscode.Range(pos, pos.translate(0, clause.entityName.length));
            const d = new vscode.Diagnostic(
                range,
                `Missing port '${portName}' (${port.direction} ${port.type})`,
                vscode.DiagnosticSeverity.Warning
            );
            d.source = 'VHDL Essentials';
            diags.push(d);
        }

        for (const mapping of clause.mappings)
        {
            if (entityPorts.has(mapping.formal)) { continue; }

            const pos = offsetToPosition(text, mapping.offset);
            const range = new vscode.Range(pos, pos.translate(0, mapping.formal.length));
            const d = new vscode.Diagnostic(
                range,
                `Port '${mapping.formal}' not found in entity '${clause.entityName}'`,
                vscode.DiagnosticSeverity.Error
            );
            d.source = 'VHDL Essentials';
            diags.push(d);
        }
    }

    return diags;
}

export class PortMapLinter
{
    private diagnostics = vscode.languages.createDiagnosticCollection('vhdl-portmap');
    private debounceTimer: ReturnType<typeof setTimeout> | undefined;

    constructor(
        private indexer: EntityIndexer,
        context: vscode.ExtensionContext
    )
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

    private getEntityPorts(entityName: string): Map<string, EntityPort> | undefined
    {
        const info = this.indexer.getEntity(entityName);
        if (info) { return info.ports; }

        const all = this.indexer.getAllEntities();
        const found = all.find(
            n => n.toLowerCase() === entityName.toLowerCase()
        );
        if (!found) { return undefined; }

        return this.indexer.getEntity(found)?.ports;
    }

    private validate(document: vscode.TextDocument)
    {
        if (document.languageId !== 'vhdl') { return; }

        const text = document.getText();
        const portMaps = parsePortMaps(text);

        const allDiags: vscode.Diagnostic[] = [];
        const seenEntities = new Map<string, Map<string, EntityPort> | undefined>();

        for (const clause of portMaps)
        {
            let entityPorts = seenEntities.get(clause.entityName.toLowerCase());
            if (entityPorts === undefined)
            {
                entityPorts = this.getEntityPorts(clause.entityName);
                seenEntities.set(clause.entityName.toLowerCase(), entityPorts);
            }

            const diags = validatePortMaps(text, [clause], entityPorts);
            allDiags.push(...diags);
        }

        this.diagnostics.set(document.uri, allDiags);
    }

    dispose(): void
    {
        clearTimeout(this.debounceTimer);
        this.diagnostics.dispose();
    }
}
