import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

export const transcriptOutput = vscode.window.createOutputChannel('Questa Transcript', { log: true });

export class TranscriptWatcher
{
    private _running = false;
    private _watcher: fs.FSWatcher | null = null;
    private _watchInterval: ReturnType<typeof setInterval> | null = null;
    private _lastSize = 0;
    private _filePath: string | null = null;

    start(workspaceRoot: string): void
    {
        if (this._running) { return; }

        this._running = true;
        this._filePath = path.join(workspaceRoot, 'transcript');
        this._lastSize = 0;

        transcriptOutput.show(true);

        try
        {
            this._watcher = fs.watch(this._filePath, () =>
            {
                this._readNewLines();
            });
        }
        catch
        {
            this._watcher = null;
            this._watchInterval = setInterval(() =>
            {
                this._readNewLines();
            }, 500);
        }
    }

    stop(): void
    {
        this._running = false;
        this._lastSize = 0;

        if (this._watcher)
        {
            this._watcher.close();
            this._watcher = null;
        }

        if (this._watchInterval)
        {
            clearInterval(this._watchInterval);
            this._watchInterval = null;
        }
    }

    private _writeLine(line: string): void
    {
        if (line.includes('** Error') || line.includes('** Failure'))
        {
            transcriptOutput.error(line);
        }
        else if (line.includes('** Warning') || line.includes('** Critical Warning'))
        {
            transcriptOutput.warn(line);
        }
        else
        {
            transcriptOutput.info(line);
        }
    }

    private _readNewLines(): void
    {
        if (!this._running || !this._filePath) { return; }

        try
        {
            const stats = fs.statSync(this._filePath);

            if (stats.size <= this._lastSize) { return; }

            const fd = fs.openSync(this._filePath, 'r');
            const buf = Buffer.alloc(stats.size - this._lastSize);
            fs.readSync(fd, buf, 0, buf.length, this._lastSize);
            fs.closeSync(fd);

            this._lastSize = stats.size;

            const content = buf.toString('utf-8');

            for (const line of content.split(/\r?\n/))
            {
                if (line) { this._writeLine(line); }
            }
        }
        catch
        {
            // File not ready yet — will retry on next tick
        }
    }
}
