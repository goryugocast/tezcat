import { describe, it, expect, afterEach } from 'vitest';
import { setJapaneseAnalyzer, contentTerms, normalizedWords, processTerm, queryTerms, signature, stripMarkdown, tokenize } from '../src/text';

describe('stripMarkdown', () => {
    it('keeps link text and drops link targets', () => {
        expect(stripMarkdown('see [[Raven|the poem]] and [docs](https://x.y/z)')).toMatch(/see\s+the poem\s+and\s+docs\s*$/);
        expect(stripMarkdown('[[Notes/Annabel Lee#Stanza 2]]').trim()).toBe('Notes/Annabel Lee');
    });

    it('drops code, URLs, block ids and structural markers', () => {
        const out = stripMarkdown('# Title\n> quote\n- item `code` https://e.x ^abc-1\n```\nfn()\n```');
        expect(out).not.toMatch(/[#>`]|https|abc-1|fn\(\)/);
        expect(out).toMatch(/Title[\s\S]*quote[\s\S]*item/);
    });
});

describe('tokenize', () => {
    it('lowercases and splits on punctuation, keeping inner apostrophes', () => {
        expect(tokenize("Nevermore! Quoth the Raven's ghost—once.")).toEqual(['nevermore', 'quoth', 'the', "raven's", 'ghost', 'once']);
    });

    it('handles non-Latin letters and digits', () => {
        expect(tokenize('Café 1849 Ελλάδα')).toEqual(['café', '1849', 'ελλάδα']);
    });
});

describe('processTerm', () => {
    it('drops stopwords and very short terms', () => {
        expect(processTerm('the')).toBeNull();
        expect(processTerm('a')).toBeNull();
        expect(processTerm('Raven')).toBe('raven');
    });
});

describe('queryTerms', () => {
    it('returns distinct content terms in order', () => {
        expect(queryTerms('The raven, the RAVEN and the lost Lenore')).toEqual(['raven', 'lost', 'lenore']);
    });

    it('never produces query syntax, whatever the input', () => {
        expect(queryTerms('foo - bar: (baz) "qux" OR NEAR*')).toEqual(['foo', 'bar', 'baz', 'qux', 'near']);
    });

    it('caps the number of terms', () => {
        const text = Array.from({ length: 100 }, (_, i) => `word${i}`).join(' ');
        expect(queryTerms(text, 10)).toHaveLength(10);
    });
});

describe('signature', () => {
    it('ignores formatting, case, punctuation and numbers', () => {
        expect(signature('_**by Edgar Allan Poe** (published 1849)_')).toBe('by edgar allan poe published #');
        expect(signature('*by Edgar Allan Poe* *(published 1842)*')).toBe('by edgar allan poe published #');
    });

    it('keeps the words, so different text has a different signature', () => {
        expect(signature('by Edgar Allan Poe')).not.toBe(signature('by Mary Shelley'));
        expect(signature('*   *   *')).toBe('');
    });
});

describe('normalizedWords / contentTerms', () => {
    it('replaces digit runs inside and around words', () => {
        expect(normalizedWords('Chapter 12, v2.0 in 1849')).toEqual(['chapter', '#', 'v#', '#', 'in', '#']);
    });

    it('keeps distinct content words and the number placeholder, without stopwords', () => {
        expect([...contentTerms('The raven, the RAVEN, in 1845 and 1849')].sort()).toEqual(['#', 'raven']);
    });
});


describe('Japanese keyword pilot', () => {
    afterEach(() => setJapaneseAnalyzer(null));
    it('keeps 本人 distinct from 本 and converts 読んだ to 読む', () => {
        setJapaneseAnalyzer(text => text === '本人が本を読んだ' ? [
            { surface_form: '本人', basic_form: '本人', pos: '名詞' },
            { surface_form: 'が', pos: '助詞' },
            { surface_form: '本', basic_form: '本', pos: '名詞' },
            { surface_form: 'を', pos: '助詞' },
            { surface_form: '読ん', basic_form: '読む', pos: '動詞' },
            { surface_form: 'だ', pos: '助動詞' },
        ] : []);
        expect(tokenize('本人が本を読んだ')).toEqual(['本人', '本', '読む']);
        expect(queryTerms('本人が本を読んだ')).toEqual(['本人', '本', '読む']);
        expect(processTerm('人')).toBe('人');
        expect(processTerm('が')).toBeNull();
    });
    it('preserves Japanese proper nouns', () => {
        setJapaneseAnalyzer(() => [{ surface_form: '東京都', basic_form: '東京都', pos: '名詞' }]);
        expect(queryTerms('東京都')).toEqual(['東京都']);
    });
    it('preserves mixed Japanese/English text', () => {
        setJapaneseAnalyzer(text => [{ surface_form: text, pos: '名詞' }]);
        expect(queryTerms('ObsidianでAI検索')).toEqual(['obsidian', 'ai', '検索']);
    });
});
