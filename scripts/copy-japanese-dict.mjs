import { existsSync, mkdirSync, readdirSync, copyFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const pkg = join(root, 'node_modules', 'kuromoji');
const source = join(pkg, 'dict');
const target = join(root, 'dict');
if (!existsSync(source)) throw new Error('Missing kuromoji dictionary: run npm install');
mkdirSync(target, { recursive: true });
const names = readdirSync(source).filter(name => name.endsWith('.dat.gz'));
if (names.length < 10) throw new Error('Incomplete kuromoji dictionary');
for (const name of names) copyFileSync(join(source, name), join(target, name));
mkdirSync(join(root, 'third-party'), { recursive: true });
for (const name of ['LICENSE-2.0.txt', 'NOTICE.md']) {
    const src = join(pkg, name);
    if (!existsSync(src)) throw new Error('Missing kuromoji attribution: ' + src);
    copyFileSync(src, join(root, 'third-party', name));
}
console.log('Included ' + names.length + ' kuromoji dictionary files');
