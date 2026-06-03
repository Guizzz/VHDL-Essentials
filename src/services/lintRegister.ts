import * as vscode from 'vscode';
import { TopLevelPortLint } from '../lint/portLint';
import { DuplicateSignalLinter } from '../lint/duplicateSignalsLint';
import { QsfLint } from '../lint/qsfLint';
import { SyntaxLinter } from '../lint/syntaxLint';

export function registerLintFeature(context: vscode.ExtensionContext)
{
    const topLevelPortLint = new TopLevelPortLint(context);
    const duplicateLint = new DuplicateSignalLinter(context);
    const qsfLint = new QsfLint(context);
    const syntaxLint = new SyntaxLinter(context);

    context.subscriptions.push(
        topLevelPortLint,
        duplicateLint,
        qsfLint,
        syntaxLint
    );

}