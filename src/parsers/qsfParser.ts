import * as vscode from 'vscode';
import { getTopLevelEntityFile } from '../quartus/quartusProject';
import { PinAssignment } from '../types/types';

interface TopLevel {
  entity: string
  path: vscode.Uri
}

export interface ProjectInfo {
    family?: string;
    device?: string;
    topLevel?: TopLevel;
    outputFolder?: string;
    pins: PinAssignment[];
}

export interface RawQsfPin {
    pin: string
    signal: string
    line: number
}

export interface RawQsfData {
    family?: string
    device?: string
    topLevelEntity?: string
    outputFolder?: string
    pins: RawQsfPin[]
}

export function parseQsfText(text: string): RawQsfData
{
    const lines = text.split(/\r?\n/);

    let family: string | undefined;
    let device: string | undefined;
    let topLevelEntity: string | undefined;
    let outputFolder: string | undefined;
    const pins: RawQsfPin[] = [];

    for (let i = 0; i < lines.length; i++)
    {
        const line = lines[i];

        if (line.trimStart().startsWith('#')) { continue; }

        let match = line.match(/set_global_assignment -name FAMILY "(.+?)"/);
        if (match) { family = match[1]; }

        match = line.match(/set_global_assignment -name DEVICE (.+)/);
        if (match) { device = match[1]; }

        match = line.match(/set_global_assignment -name TOP_LEVEL_ENTITY (.+)/);
        if (match) { topLevelEntity = match[1]; }

        match = line.match(/set_global_assignment -name PROJECT_OUTPUT_DIRECTORY (.+)/);
        if (match) { outputFolder = match[1]; }

        match = line.match(/set_location_assignment (PIN_[A-Z0-9]+) -to (\w+)/);
        if (match)
        {
            pins.push({ pin: match[1], signal: match[2], line: i });
        }
    }

    return { family, device, topLevelEntity, outputFolder, pins };
}

export async function parseQsf(fileUri: vscode.Uri) : Promise<ProjectInfo>
{
  const content = await vscode.workspace.fs.readFile(fileUri);
  const text = Buffer.from(content).toString('utf-8');

  const raw = parseQsfText(text);
  let topLevel: TopLevel | undefined;

  if (raw.topLevelEntity)
  {
      topLevel = await getTopLevelEntityFile(raw.topLevelEntity);
  }

  const pins: PinAssignment[] = raw.pins.map(p => {
      const position = new vscode.Position(p.line, 0);
      const location = new vscode.Location(fileUri, position);
      return { pin: p.pin, signal: p.signal, location };
  });

  return { family: raw.family, device: raw.device, topLevel, outputFolder: raw.outputFolder, pins };
}