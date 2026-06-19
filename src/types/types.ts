import * as vscode from 'vscode';

export interface PinAssignment {
    signal: string;
    pin: string;
    location: vscode.Location;
}

export interface EntityPort
{
    name: string;
    direction: string;
    type: string;
    offset: number;
}

export interface EntitySymbol
{
    name: string;
    offset: number;
    ports: EntityPort[];
}

export interface EntityInfo
{
    location: vscode.Location;
    ports: Map<string, EntityPort>;
}

export interface ParsedPackage {
    name: string;
    offset: number;
    symbols: ParsedPackageSymbol[];
}

export interface ParsedPackageSymbol {
    kind: string;
    name: string;
    offset: number;
    type: string;
    value?: string;
}

export interface PackageSymbolInfo {
    location: vscode.Location;
    type: string;
    kind: string;
    value?: string;
}

export interface PackageInfo {
    location: vscode.Location;
    symbols: Map<string, PackageSymbolInfo>;
}

export interface FitSummaryEntry
{
    label: string
    used: number
    total: number
    percent: number
}

export interface FitSummaryData
{
    status?: string
    entries: FitSummaryEntry[]
}

export interface ParsedSignalLike
{
    kind: string;
    name: string;
    type: string;
    direction?: string;
    offset: number;
}