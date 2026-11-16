import { FileSystemAdapter } from 'obsidian';
import { resolve } from 'path';
import * as kuromoji from 'kuromoji';
import type { App } from 'obsidian';
import { setJapaneseAnalyzer } from './text';

/** Load IPADIC before the keyword index is constructed. */
export async function initializeJapaneseTokenizer(app: App, pluginDir: string): Promise<void> {
    if (!(app.vault.adapter instanceof FileSystemAdapter)) throw new Error('Desktop vault required');
    const dictionary = resolve(app.vault.adapter.getBasePath(), pluginDir, 'dict');
    const tokenizer = await new Promise<kuromoji.Tokenizer>((resolveTokenizer, reject) => {
        kuromoji.builder({ dicPath: dictionary }).build((error, ready) => {
            if (error || !ready) reject(error ?? new Error('Could not load kuromoji dictionary'));
            else resolveTokenizer(ready);
        });
    });
    setJapaneseAnalyzer(text => tokenizer.tokenize(text));
}
