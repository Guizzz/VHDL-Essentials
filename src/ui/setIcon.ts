import * as vscode from 'vscode';

export async function setupMaterialIcons() {
    const config = vscode.workspace.getConfiguration();

    // read existing associations
    const current = config.get<Record<string, string>>( 'material-icon-theme.files.associations' ) || {};

    // add/override
    current['*.qsf'] = 'settings';
    current['*.qpf'] = '3d';

    // save to user settings
    await config.update(
        'material-icon-theme.files.associations',
        current,
        vscode.ConfigurationTarget.Global
    );
}