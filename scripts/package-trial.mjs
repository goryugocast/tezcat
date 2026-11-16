import { cpSync, existsSync, mkdirSync, copyFileSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const output = join(root, 'dist', 'tezcat-ja');
rmSync(output, { recursive: true, force: true });
mkdirSync(output, { recursive: true });
for (const name of ['main.js', 'manifest.json', 'styles.css']) {
    if (!existsSync(join(root, name))) throw new Error('Missing plugin output: ' + name);
    copyFileSync(join(root, name), join(output, name));
}
for (const name of ['dict', 'third-party']) cpSync(join(root, name), join(output, name), { recursive: true });
copyFileSync(join(root, 'LICENSE'), join(output, 'LICENSE'));
console.log('Trial plugin directory: ' + output);
