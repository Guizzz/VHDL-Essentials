
import * as vscode from 'vscode';
import { EntityIndexer } from '../services/entityIndexer';
import { findUnusedSignals } from '../lint/unusedSignalsLint';

export class VhdlHighlightProvider implements vscode.Disposable 
{
    private entityDecorationType: vscode.TextEditorDecorationType;
    private packageDecorationType: vscode.TextEditorDecorationType;
    private symbolsDecorationType: vscode.TextEditorDecorationType;
    private unusedDecorationType: vscode.TextEditorDecorationType;
    private disposables: vscode.Disposable[] = [];

    private entityRegex = /entity\s+work\.(\w+)/gi;
    private packageRegex = /use\s+work\.(\w+)\.all\s*;/gi;

    constructor(private indexer: EntityIndexer)
    {
        this.entityDecorationType = vscode.window.createTextEditorDecorationType({ color: new vscode.ThemeColor('symbolIcon.classForeground') });
        this.symbolsDecorationType = vscode.window.createTextEditorDecorationType({ color: new vscode.ThemeColor('symbolIcon.variableForeground') });
        this.packageDecorationType = vscode.window.createTextEditorDecorationType({ color: new vscode.ThemeColor('symbolIcon.moduleForeground') });
        this.unusedDecorationType = vscode.window.createTextEditorDecorationType({ opacity: '0.4' });
    }

    activate() 
    {
        this.disposables.push(
            vscode.window.onDidChangeActiveTextEditor(
                () => this.refresh()
            )
        );

        this.disposables.push(
            vscode.workspace.onDidChangeTextDocument(
                () => this.refresh()
            )
        );

        this.refresh();
    }

    private refresh() 
    {
        const editor = vscode.window.activeTextEditor;

        if (!editor) { return;}
        if (editor.document.languageId !== 'vhdl') {return;}

        this.update(editor);
    }

    private getEntityMatch(editor: vscode.TextEditor , text: string): vscode.DecorationOptions[]
    {
        const entityDecorations: vscode.DecorationOptions[] = [];
        let entityMatch:RegExpExecArray | null;

        while ( (entityMatch = this.entityRegex.exec(text)) !== null) 
        {
            const entityName = entityMatch[1];
            const location = this.indexer.getEntityLocation(entityName);
            if (!location) {continue;}

            const startOffset = entityMatch.index + entityMatch[0].lastIndexOf(entityName);
            const start = editor.document.positionAt(startOffset);
            const end = editor.document.positionAt( startOffset + entityName.length);

            entityDecorations.push({ range: new vscode.Range( start, end ) });
        }

        return entityDecorations;
    }

    private getPackageMatch(editor: vscode.TextEditor , text: string)
    {
        const packageDecorations: vscode.DecorationOptions[] = [];
        let packageMatch: RegExpExecArray | null;
        const importedPackages: string[] = [];

        while ( (packageMatch = this.packageRegex.exec(text)) !== null) 
        {
            const packageName = packageMatch[1];
            importedPackages.push(packageName);
            const location = this.indexer.getPackageLocation(packageName);
            if (!location) {continue;}

            const startOffset = packageMatch.index + packageMatch[0].indexOf(packageName);
            const start = editor.document.positionAt(startOffset);
            const end = editor.document.positionAt(startOffset + packageName.length);
            packageDecorations.push({ range: new vscode.Range( start, end ) });
        }

        return {packageDecorations, importedPackages};
    }

    private getSymbolMatch(editor: vscode.TextEditor , text: string, importedPackages: string[]): vscode.DecorationOptions[]
    {   
        const symbolsDecorations: vscode.DecorationOptions[] = [];

        for ( const packageName of importedPackages ) 
        {
            const pkg = this.indexer.getPackage(packageName);
            if (!pkg) {continue;}

            for (const symbolName of pkg.symbols.keys()) 
            {
                const symbolRegex = new RegExp(`\\b${symbolName}\\b`, 'gi');
                let symbolMatch: RegExpExecArray | null;

                while ((symbolMatch = symbolRegex.exec(text)) !== null) 
                {
                    const startOffset = symbolMatch.index;
                    const start = editor.document.positionAt( startOffset );
                    const end = editor.document.positionAt( startOffset + symbolName.length );
                    symbolsDecorations.push({ range: new vscode.Range( start, end ) });
                }
            }
        }
        
        return symbolsDecorations;
    }

    private update( editor: vscode.TextEditor) 
    {
        const text = editor.document.getText();
        
        const {
            packageDecorations,
            importedPackages
        }: {
            packageDecorations: vscode.DecorationOptions[],
            importedPackages: string[]
        } = this.getPackageMatch(editor, text);
        
        const symbolsDecorations: vscode.DecorationOptions[] = this.getSymbolMatch(editor, text, importedPackages);
        const entityDecorations: vscode.DecorationOptions[] = this.getEntityMatch(editor, text);
        
        editor.setDecorations(this.entityDecorationType, entityDecorations);
        editor.setDecorations(this.packageDecorationType, packageDecorations);
        editor.setDecorations(this.symbolsDecorationType, symbolsDecorations);

        const unusedDiags = findUnusedSignals(text);
        const unusedOptions = unusedDiags.map(d => ({ range: d.range }));
        editor.setDecorations(this.unusedDecorationType, unusedOptions);
    }

    dispose() 
    {
        this.entityDecorationType.dispose();
        this.symbolsDecorationType.dispose();
        this.unusedDecorationType.dispose();
        for (const d of this.disposables) 
        {
            d.dispose();
        }
    }
}