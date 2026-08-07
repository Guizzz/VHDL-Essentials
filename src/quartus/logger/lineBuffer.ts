export class LineBuffer
{
    private pendingTail = '';

    push(chunk: string): string[]
    {
        const lines = (this.pendingTail + chunk).split(/\r?\n/);
        this.pendingTail = lines.pop() ?? '';
        return lines;
    }

    flush(): string[]
    {
        if (!this.pendingTail) { return []; }

        const lines = [this.pendingTail];
        this.pendingTail = '';
        return lines;
    }
}
