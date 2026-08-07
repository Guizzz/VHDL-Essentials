import { defineConfig } from '@vscode/test-cli';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
	files: '../out/test/**/*.test.js',
	extensionDevelopmentPath: path.resolve(__dirname, '..'),
});
