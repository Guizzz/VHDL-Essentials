import * as vscode from 'vscode';

interface VhdlBlock
{
    type: 'entity' | 'architecture' | 'package';
    name: string;
    startOffset: number;
    endOffset: number;
    bodyStart: number;
}

export class VhdlDocumentSymbolProvider implements vscode.DocumentSymbolProvider
{
    provideDocumentSymbols(
        document: vscode.TextDocument
    ): vscode.DocumentSymbol[]
    {
        const text = document.getText();
        const symbols: vscode.DocumentSymbol[] = [];

        const blocks = this._scanTopLevel(text);

        for (const block of blocks)
        {
            const sym = this._buildSymbol(block, text, document);

            if (sym) { symbols.push(sym); }
        }

        return symbols;
    }

    private _scanTopLevel(text: string): VhdlBlock[]
    {
        const blocks: VhdlBlock[] = [];
        const re = /\b(entity|architecture|package)\s+(\w+)/gi;
        let match: RegExpExecArray | null;

        while ((match = re.exec(text)) !== null)
        {
            const keyword = match[1].toLowerCase();
            const name = match[2];
            const start = match.index;

            if (this._isInsideComment(text, start)) { continue; }

            const endIdx = this._findBlockEnd(text, start, keyword);

            if (endIdx < 0) { continue; }

            const bodyStart = this._findBodyStart(text, start, keyword);

            blocks.push({ type: keyword as VhdlBlock['type'], name, startOffset: start, endOffset: endIdx, bodyStart });
        }

        return blocks;
    }

    private _findBlockEnd(text: string, fromIdx: number, keyword: string): number
    {
        // Try "end [keyword] [name];" first
        const endRe = new RegExp(`\\bend\\s+${keyword}\\s*(?:\\w+)?\\s*;`, 'gi');
        let match: RegExpExecArray | null;

        while ((match = endRe.exec(text)) !== null)
        {
            if (this._isInsideComment(text, match.index)) { continue; }

            if (match.index <= fromIdx) { continue; }

            return match.index + match[0].length;
        }

        // Fallback: bare "end;" (may match nested ends, but handles simple cases)
        const bareRe = /\bend\s*;/gi;

        while ((match = bareRe.exec(text)) !== null)
        {
            if (this._isInsideComment(text, match.index)) { continue; }

            if (match.index <= fromIdx) { continue; }

            return match.index + match[0].length;
        }

        return -1;
    }

    private _findBodyStart(text: string, fromIdx: number, keyword: string): number
    {
        const bodyRe = keyword === 'architecture'
            ? /\bbegin\b/gi
            : /\bis\b/gi;
        let match: RegExpExecArray | null;

        while ((match = bodyRe.exec(text)) !== null)
        {
            const pos = match.index;

            if (this._isInsideComment(text, pos)) { continue; }

            if (pos > fromIdx && pos < this._findBlockEnd(text, fromIdx, keyword))
            {
                return pos + match[0].length;
            }

            break;
        }

        return fromIdx;
    }

    private _buildSymbol(
        block: VhdlBlock,
        text: string,
        document: vscode.TextDocument
    ): vscode.DocumentSymbol | null
    {
        const blockText = text.substring(block.startOffset, block.endOffset);
        const clean = this._stripComments(blockText);

        const startPos = document.positionAt(block.startOffset);
        const endPos = document.positionAt(block.endOffset);
        const range = new vscode.Range(startPos, endPos);

        const namePos = document.positionAt(
            block.startOffset + clean.indexOf(block.name)
        );
        const selRange = new vscode.Range(namePos, namePos.translate(0, block.name.length));

        const children: vscode.DocumentSymbol[] = [];

        switch (block.type)
        {
            case 'entity':
                children.push(...this._parseEntityPorts(clean, block.startOffset, document));
                children.push(...this._parseGenerics(clean, block.startOffset, document));
                break;
            case 'architecture':
                children.push(...this._parseArchitectureBody(clean, block.startOffset, document));
                break;
            case 'package':
                children.push(...this._parsePackageBody(clean, block.startOffset, document));
                break;
        }

        const kind = this._kindFor(block.type);
        const sym = new vscode.DocumentSymbol(block.name, '', kind, range, selRange);
        sym.children = children;

        return sym;
    }

    private _parseEntityPorts(
        clean: string,
        baseOffset: number,
        document: vscode.TextDocument
    ): vscode.DocumentSymbol[]
    {
        const symbols: vscode.DocumentSymbol[] = [];
        const portMatch = /port\s*\(((?:[^()]|\([^()]*\))*)\)\s*;/i.exec(clean);

        if (!portMatch) { return symbols; }

        const portContent = portMatch[1];
        const portBase = baseOffset + portMatch.index + portMatch[0].indexOf(portContent);
        const portRe = /(\w+(?:\s*,\s*\w+)*)\s*:\s*(in|out|inout|buffer)\s+([^;]+?)(?:;|$)/gi;
        let m: RegExpExecArray | null;

        while ((m = portRe.exec(portContent)) !== null)
        {
            const names = m[1].split(',').map(n => n.trim());
            const direction = m[2];
            const portType = m[3].trim();
            const detail = `${direction} : ${portType}`;

            for (const name of names)
            {
                const offset = portBase + m[1].indexOf(name);
                const pos = document.positionAt(offset);
                const range = new vscode.Range(pos, pos.translate(0, Math.max(name.length, 1)));

                symbols.push(
                    new vscode.DocumentSymbol(name, detail, vscode.SymbolKind.Field, range, range)
                );
            }
        }

        return symbols;
    }

    private _parseGenerics(
        clean: string,
        baseOffset: number,
        document: vscode.TextDocument
    ): vscode.DocumentSymbol[]
    {
        const symbols: vscode.DocumentSymbol[] = [];
        const genMatch = /generic\s*\(((?:[^()]|\([^()]*\))*)\)\s*;/i.exec(clean);

        if (!genMatch) { return symbols; }

        const genContent = genMatch[1];
        const genBase = baseOffset + genMatch.index + genMatch[0].indexOf(genContent);
        const genRe = /(\w+(?:\s*,\s*\w+)*)\s*:\s*([^;:=]+?)(?:\s*:=\s*[^;]+)?(?:;|$)/gi;
        let m: RegExpExecArray | null;

        while ((m = genRe.exec(genContent)) !== null)
        {
            const names = m[1].split(',').map(n => n.trim());
            const genType = m[2].trim();
            const detail = genType;

            for (const name of names)
            {
                const offset = genBase + m[1].indexOf(name);
                const pos = document.positionAt(offset);
                const range = new vscode.Range(pos, pos.translate(0, Math.max(name.length, 1)));

                symbols.push(
                    new vscode.DocumentSymbol(name, detail, vscode.SymbolKind.Field, range, range)
                );
            }
        }

        return symbols;
    }

    private _parseArchitectureBody(
        clean: string,
        baseOffset: number,
        document: vscode.TextDocument
    ): vscode.DocumentSymbol[]
    {
        const symbols: vscode.DocumentSymbol[] = [];

        // Find the body text between first begin and end architecture
        const bodyStartMatch = /\bbegin\b/i.exec(clean);

        if (!bodyStartMatch) { return symbols; }

        const declText = clean.substring(0, bodyStartMatch.index);
        const procText = clean.substring(bodyStartMatch.index);

        // Signal / variable / constant declarations
        const declRe = /\b(signal|variable|constant)\s+(\w+)\s*:\s*([^;]+)/gi;
        let m: RegExpExecArray | null;

        while ((m = declRe.exec(declText)) !== null)
        {
            const kind = m[1].toLowerCase();
            const name = m[2];
            const declType = m[3].trim();
            const kindMap: Record<string, vscode.SymbolKind> = {
                signal: vscode.SymbolKind.Variable,
                variable: vscode.SymbolKind.Variable,
                constant: vscode.SymbolKind.Constant
            };
            const offset = baseOffset + m.index + m[0].indexOf(name);
            const pos = document.positionAt(offset);
            const range = new vscode.Range(pos, pos.translate(0, Math.max(name.length, 1)));

            symbols.push(
                new vscode.DocumentSymbol(name, declType, kindMap[kind] ?? vscode.SymbolKind.Variable, range, range)
            );
        }

        // Type declarations
        const typeRe = /\btype\s+(\w+)\s+is\s+/gi;

        while ((m = typeRe.exec(declText)) !== null)
        {
            const name = m[1];
            const offset = baseOffset + m.index + m[0].indexOf(name);
            const pos = document.positionAt(offset);
            const range = new vscode.Range(pos, pos.translate(0, Math.max(name.length, 1)));

            symbols.push(
                new vscode.DocumentSymbol(name, '', vscode.SymbolKind.Interface, range, range)
            );
        }

        // Direct entity instantiations: label : entity [work.]name [generic map(...)] [port map(...)];
        const entityInstRe = /(\w+)\s*:\s*entity\s+(?:work\.)?(\w+)/gi;

        while ((m = entityInstRe.exec(procText)) !== null)
        {
            const label = m[1];
            const entityName = m[2];
            const detail = `entity work.${entityName}`;
            const offset = baseOffset + bodyStartMatch.index + m.index + m[0].indexOf(label);
            const pos = document.positionAt(offset);
            const range = new vscode.Range(pos, pos.translate(0, Math.max(label.length, 1)));

            symbols.push(
                new vscode.DocumentSymbol(label, detail, vscode.SymbolKind.Class, range, range)
            );
        }

        // Component instantiations: label : component_name port map(...)
        // Must NOT match process, entity, component, for (generate), or VHDL keywords
        const compInstRe = /(\w+)\s*:\s*(?!entity|process|component|for|if|while)\s*(\w+)\s+(?:generic\s+map|port\s+map)\s*\(/gi;

        while ((m = compInstRe.exec(procText)) !== null)
        {
            const label = m[1];
            const compName = m[2];
            const detail = compName;
            const offset = baseOffset + bodyStartMatch.index + m.index + m[0].indexOf(label);
            const pos = document.positionAt(offset);
            const range = new vscode.Range(pos, pos.translate(0, Math.max(label.length, 1)));

            symbols.push(
                new vscode.DocumentSymbol(label, detail, vscode.SymbolKind.Class, range, range)
            );
        }

        // Process statements (inside architecture body, after begin)
        const procRe = /(\w+)\s*:\s*process\s*(?:\(([^)]*)\))?\s*(?:is\b)?/gi;

        while ((m = procRe.exec(procText)) !== null)
        {
            const label = m[1];
            const sensitivity = (m[2] || '').trim();
            const detail = sensitivity ? `(${sensitivity})` : '';

            // Find end of this process to delimit its body
            const procEnd = this._findProcessEnd(procText, m.index + m[0].length);

            if (procEnd < 0) { continue; }

            const procFullText = procText.substring(m.index, procEnd);
            const procBeginRe = /\bbegin\b/i;
            const beginM = procBeginRe.exec(procFullText);

            const procChildren: vscode.DocumentSymbol[] = [];

            if (beginM)
            {
                const procDeclText = procFullText.substring(m[0].length, beginM.index);
                const procDeclRe = /\b(variable|constant)\s+(\w+)\s*:\s*([^;]+)/gi;
                let dm: RegExpExecArray | null;

                while ((dm = procDeclRe.exec(procDeclText)) !== null)
                {
                    const dKind = dm[1].toLowerCase();
                    const dName = dm[2];
                    const dType = dm[3].trim();
                    const dKindMap: Record<string, vscode.SymbolKind> = {
                        variable: vscode.SymbolKind.Variable,
                        constant: vscode.SymbolKind.Constant
                    };
                    const dOffset = baseOffset + bodyStartMatch.index + m.index + m[0].length
                        + dm.index + dm[0].indexOf(dName);
                    const dPos = document.positionAt(dOffset);
                    const dRange = new vscode.Range(dPos, dPos.translate(0, Math.max(dName.length, 1)));

                    procChildren.push(
                        new vscode.DocumentSymbol(
                            dName,
                            dType,
                            dKindMap[dKind] ?? vscode.SymbolKind.Variable,
                            dRange,
                            dRange
                        )
                    );
                }
            }

            const offset = baseOffset + bodyStartMatch.index + m.index + m[0].indexOf(label);
            const pos = document.positionAt(offset);
            const range = new vscode.Range(pos, pos.translate(0, Math.max(label.length, 1)));

            const procSym = new vscode.DocumentSymbol(
                label,
                detail,
                vscode.SymbolKind.Function,
                range,
                range
            );

            procSym.children = procChildren;
            symbols.push(procSym);
        }

        // Component declarations
        const compRe = /component\s+(\w+)\s+is/gi;

        while ((m = compRe.exec(clean)) !== null)
        {
            const name = m[1];
            const offset = baseOffset + m.index + m[0].indexOf(name);
            const pos = document.positionAt(offset);
            const range = new vscode.Range(pos, pos.translate(0, Math.max(name.length, 1)));

            symbols.push(
                new vscode.DocumentSymbol(name, '', vscode.SymbolKind.Class, range, range)
            );
        }

        return symbols;
    }

    private _parsePackageBody(
        clean: string,
        baseOffset: number,
        document: vscode.TextDocument
    ): vscode.DocumentSymbol[]
    {
        const symbols: vscode.DocumentSymbol[] = [];

        // constant / signal / type / subtype (not function/procedure, handled separately)
        const declRe = /\b(constant|signal|type|subtype)\s+(\w+)/gi;
        let m: RegExpExecArray | null;

        while ((m = declRe.exec(clean)) !== null)
        {
            const kind = m[1].toLowerCase();
            const name = m[2];
            const kindMap: Record<string, vscode.SymbolKind> = {
                constant: vscode.SymbolKind.Constant,
                signal: vscode.SymbolKind.Variable,
                type: vscode.SymbolKind.Interface,
                subtype: vscode.SymbolKind.Interface
            };
            const offset = baseOffset + m.index + m[0].indexOf(name);
            const pos = document.positionAt(offset);
            const range = new vscode.Range(pos, pos.translate(0, Math.max(name.length, 1)));

            symbols.push(
                new vscode.DocumentSymbol(name, '', kindMap[kind] ?? vscode.SymbolKind.Variable, range, range)
            );
        }

        // Function declarations with parameters and optional return type
        const funcRe = /(\bfunction)\s+(\w+)\s*(?:\(([^)]*)\))?\s*(?:return\s+(\w+(?:\s+\w+)*))?/gi;
        let fm: RegExpExecArray | null;

        while ((fm = funcRe.exec(clean)) !== null)
        {
            const name = fm[2];
            const params = (fm[3] || '').trim();
            const returnType = (fm[4] || '').trim();
            const detail = returnType ? `return ${returnType}` : '';

            const fnChildren: vscode.DocumentSymbol[] = [];

            if (params)
            {
                const paramRe = /(\w+(?:\s*,\s*\w+)*)\s*:\s*(?:(in|out|inout)\s+)?(\w+(?:\s+\w+)*)/gi;
                let pm: RegExpExecArray | null;

                while ((pm = paramRe.exec(params)) !== null)
                {
                    const pNames = pm[1].split(',').map((n: string) => n.trim());
                    const direction = (pm[2] || '').trim();
                    const pType = pm[3].trim();
                    const pDetail = direction ? `${direction} : ${pType}` : pType;
                    const pNameOffsetInParam = pm[0].indexOf(pm[1]);
                    const paramOffsetInClean = fm.index + fm[0].indexOf(fm[3] ?? '');

                    for (const pName of pNames)
                    {
                        const pOffset = baseOffset + paramOffsetInClean + pNameOffsetInParam
                            + pm[1].indexOf(pName);
                        const pPos = document.positionAt(pOffset);
                        const pRange = new vscode.Range(pPos, pPos.translate(0, Math.max(pName.length, 1)));

                        fnChildren.push(
                            new vscode.DocumentSymbol(pName, pDetail, vscode.SymbolKind.Field, pRange, pRange)
                        );
                    }
                }
            }

            const offset = baseOffset + fm.index + fm[0].indexOf(name);
            const pos = document.positionAt(offset);
            const range = new vscode.Range(pos, pos.translate(0, Math.max(name.length, 1)));

            const fnSym = new vscode.DocumentSymbol(name, detail, vscode.SymbolKind.Function, range, range);
            fnSym.children = fnChildren;
            symbols.push(fnSym);
        }

        // Procedure declarations with parameters
        const procRe_proc = /\b(procedure)\s+(\w+)\s*(?:\(([^)]*)\))?/gi;
        let pmProc: RegExpExecArray | null;

        while ((pmProc = procRe_proc.exec(clean)) !== null)
        {
            const name = pmProc[2];
            const params = (pmProc[3] || '').trim();
            const detail = params ? `(${params})` : '';

            const procChildren: vscode.DocumentSymbol[] = [];

            if (params)
            {
                const paramRe = /(\w+(?:\s*,\s*\w+)*)\s*:\s*(?:(in|out|inout)\s+)?(\w+(?:\s+\w+)*)/gi;
                let pm: RegExpExecArray | null;

                while ((pm = paramRe.exec(params)) !== null)
                {
                    const pNames = pm[1].split(',').map((n: string) => n.trim());
                    const direction = (pm[2] || '').trim();
                    const pType = pm[3].trim();
                    const pDetail = direction ? `${direction} : ${pType}` : pType;
                    const paramOffsetInClean = pmProc.index + pmProc[0].indexOf(pmProc[3] ?? '');

                    for (const pName of pNames)
                    {
                        const pOffset = baseOffset + paramOffsetInClean + pm[0].indexOf(pm[1])
                            + pm[1].indexOf(pName);
                        const pPos = document.positionAt(pOffset);
                        const pRange = new vscode.Range(pPos, pPos.translate(0, Math.max(pName.length, 1)));

                        procChildren.push(
                            new vscode.DocumentSymbol(pName, pDetail, vscode.SymbolKind.Field, pRange, pRange)
                        );
                    }
                }
            }

            const offset = baseOffset + pmProc.index + pmProc[0].indexOf(name);
            const pos = document.positionAt(offset);
            const range = new vscode.Range(pos, pos.translate(0, Math.max(name.length, 1)));

            const procSym = new vscode.DocumentSymbol(name, detail, vscode.SymbolKind.Method, range, range);
            procSym.children = procChildren;
            symbols.push(procSym);
        }

        return symbols;
    }

    private _findProcessEnd(text: string, fromIdx: number): number
    {
        const endRe = /\bend\s+process\s*(?:\w+)?\s*;/gi;
        let match: RegExpExecArray | null;

        while ((match = endRe.exec(text)) !== null)
        {
            if (this._isInsideComment(text, match.index)) { continue; }

            if (match.index <= fromIdx) { continue; }

            return match.index + match[0].length;
        }

        return -1;
    }

    private _isInsideComment(text: string, offset: number): boolean
    {
        const lineStart = text.lastIndexOf('\n', offset - 1) + 1;
        const lineEnd = text.indexOf('\n', offset);

        if (lineEnd < 0) { return false; }

        const line = text.substring(lineStart, lineEnd);
        const commentIdx = line.indexOf('--');

        if (commentIdx < 0) { return false; }

        const offsetInLine = offset - lineStart;

        return offsetInLine >= commentIdx;
    }

    private _stripComments(text: string): string
    {
        return text.replace(/--[^\n]*/g, '');
    }

    private _kindFor(type: string): vscode.SymbolKind
    {
        switch (type)
        {
            case 'entity':
                return vscode.SymbolKind.Class;
            case 'architecture':
                return vscode.SymbolKind.Module;
            case 'package':
                return vscode.SymbolKind.Package;
            default:
                return vscode.SymbolKind.Variable;
        }
    }
}
