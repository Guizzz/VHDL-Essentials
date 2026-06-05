import * as vscode from 'vscode';
import { parseEntities } from '../parsers/entityParser';
import { EntityInfo, EntityPort, PackageInfo, PackageSymbolInfo } from '../types/types';
import { parsePackages } from '../parsers/packageParser';

export class EntityIndexer 
{
    
    private entityMap = new Map<string, EntityInfo>();
    private fileEntities = new Map<string, string[]>();
    
    private packageMap   = new Map<string, PackageInfo>();
    private filePackages = new Map<string, string[]>();

    async buildIndex(): Promise<void>
    {
        this.entityMap.clear();
        this.packageMap.clear();
        this.fileEntities.clear();
        this.filePackages.clear();

        const files = await vscode.workspace.findFiles( '**/*.{vhd,vhdl}' );

        await Promise.all( files.map(file => this.indexFile(file)) );
    }

    async indexFile(file: vscode.Uri) 
    {
        const path = file.fsPath;
        this.removeFile(path);

        let doc: vscode.TextDocument;

        try 
        {
            doc = await vscode.workspace.openTextDocument(file);
        } 
        catch (err) 
        {
            const msg = err instanceof Error ? err.message : String(err);
            console.error(`Failed to open ${path}: ${msg}`);
            return;
        }

        const text = doc.getText();

        const entities = parseEntities(text);
        const entityNames: string[] = [];

        for (const entity of entities)
        {
            entityNames.push(entity.name);
            const pos = doc.positionAt(entity.offset);

            const location = new vscode.Location(
                file,
                new vscode.Range(pos, pos)
            );

            // convert ports to map
            const ports = new Map<string, EntityPort>();

            for (const port of entity.ports)
            {
                ports.set(port.name, port);
            }

            this.entityMap.set(
                entity.name,
                {
                    location,
                    ports
                }
            );
        }

        this.fileEntities.set(path, entityNames);

        const packages = parsePackages(text);
        const packageNames: string[] = [];

        for (const pkg of packages) 
        {
            packageNames.push(pkg.name);

            const pkgPos = doc.positionAt(pkg.offset);
            const pkgLocation = new vscode.Location(file, new vscode.Range(pkgPos, pkgPos) );
            const symbols = new Map< string,{
                    location: vscode.Location;
                    type: string;
                    kind: string;
                    value?: string;
                }
            >();

            for (const symbol of pkg.symbols) 
            {
                const symbolPos = doc.positionAt(symbol.offset);
                const symbolLocation =
                    new vscode.Location(
                        file,
                        new vscode.Range(symbolPos, symbolPos)
                    );

                symbols.set(
                    symbol.name,
                    {
                        location: symbolLocation,
                        type: symbol.type,
                        kind: symbol.kind,
                        value: symbol.value
                    }
                );
            }

            this.packageMap.set(
                pkg.name,
                {
                    location: pkgLocation,
                    symbols
                }
            );
        }

        this.filePackages.set(path, packageNames);
    }

    removeFile(path: string) 
    {
        const entities = this.fileEntities.get(path);

        if (!entities) {return;}

        for (const entity of entities) 
        {
            this.entityMap.delete(entity);
        }

        this.fileEntities.delete(path);
    }

    getEntityLocation(name: string) 
    {
        return this.entityMap.get(name)?.location;
    }

    hasEntity(name: string) 
    {
        return this.entityMap.has(name);
    }

    getAllEntities() 
    {
        return [ ...this.entityMap.keys()];
    }

    getPackage(name: string)
    {
        return this.packageMap.get(name);
    }

    hasPackage(name: string) 
    {
        return this.packageMap.has(name);
    }

    getPackageLocation(name: string) 
    {
        return this.packageMap.get(name)?.location;
    }

    getPackageSymbolLocation( packageName: string, symbolName: string ) 
    {
        const pkg = this.packageMap.get(packageName);

        if (!pkg) 
        {
            return undefined;
        }
        
        return pkg.symbols.get(symbolName)?.location;
    }

    getAllPackages() 
    {
        return [...this.packageMap.keys()];
    }

    getSymbol( name: string ): { packageName: string; symbol: PackageSymbolInfo } | undefined 
    {
        for (const [packageName, pkg] of this.packageMap) 
        {
            const symbol = pkg.symbols.get(name);

            if (symbol) 
            {
                return {
                    packageName,
                    symbol
                };
            }
        }

        return undefined;
    }

    getEntity(name: string) 
    {
        return this.entityMap.get(name);
    }
}