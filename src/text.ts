/**
 * Shared text processing for BM25 indexing and querying. Index and query must use the
 * same tokenizer and term processing, or terms won't match.
 */

// Common English function words. They add noise to OR-queries built from cursor context.
const STOPWORDS = new Set(`
a about above after again against all am an and any are aren't as at be because been before
being below between both but by can can't cannot could couldn't did didn't do does doesn't
doing don't down during each few for from further had hadn't has hasn't have haven't having he
he'd he'll he's her here here's hers herself him himself his how how's i i'd i'll i'm i've if
in into is isn't it it's its itself just let's me more most mustn't my myself no nor not now of
off on once only or other ought our ours ourselves out over own same shan't she she'd she'll
she's should shouldn't so some such than that that's the their theirs them themselves then
there there's these they they'd they'll they're they've this those through to too under until
up very was wasn't we we'd we'll we're we've were weren't what what's when when's where where's
which while who who's whom why why's will with won't would wouldn't you you'd you'll you're
you've your yours yourself yourselves also however may might must shall upon yet
`.trim().split(/\s+/));

/** Japanese tokenizer adapter: tests can supply an analyzer without loading a dictionary. */
export interface JapaneseToken { surface_form: string; basic_form?: string; pos: string }
let analyzer: ((text: string) => JapaneseToken[]) | null = null;
export function setJapaneseAnalyzer(next: ((text: string) => JapaneseToken[]) | null): void { analyzer = next; }
const JP_RUN = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}ー]+/gu;
const NON_JP_WORD = /[\p{L}\p{N}]+(?:'[\p{L}]+)*/gu;
const JP_DROP = new Set(['助詞','助動詞','記号','接続詞','感動詞','連体詞','フィラー']);
function japaneseWords(text: string): string[] {
    if (!analyzer) return text.match(NON_JP_WORD) ?? [];
    return analyzer(text)
       .filter(t => !JP_DROP.has(t.pos))
       .map(t => t.basic_form && t.basic_form !== '*' ? t.basic_form : t.surface_form)
       .filter(Boolean);
}

/** Strip Markdown syntax that shouldn't become search terms. */
export function stripMarkdown(text: string): string {
	return text
		.replace(/```[\s\S]*?```/g, ' ')                          // fenced code
		.replace(/`[^`]*`/g, ' ')                                  // inline code
		.replace(/!?\[\[([^\]|#^]+)(?:[#^][^\]|]*)?(?:\|([^\]]+))?\]\]/g, (_, target, alias) => ` ${alias ?? target} `) // wikilinks
		.replace(/!?\[([^\]]*)\]\([^)]*\)/g, ' $1 ')               // markdown links
		.replace(/https?:\/\/\S+/g, ' ')                           // bare URLs
		.replace(/\^[A-Za-z0-9-]+\s*$/gm, ' ')                     // block ids
		.replace(/^\s{0,3}(?:#{1,6}|>|[-*+]|\d+[.)])\s+/gm, ' ')    // heading/quote/list markers
		.replace(/\[![\w-]+\][+-]?/g, ' ')                         // callout markers
		.replace(/[*_~=]{1,3}/g, ' ');                             // emphasis/highlight marks
}

/** Tokenize Japanese with kuromoji and retain the upstream English behavior. */
export function tokenize(text: string): string[] {
    const cleaned = stripMarkdown(text).normalize('NFKC').toLowerCase();
    const words: string[] = [];
    let previousEnd = 0;
    for (const match of cleaned.matchAll(JP_RUN)) {
        const position = match.index ?? 0;
        words.push(...(cleaned.slice(previousEnd, position).match(NON_JP_WORD) ?? []));
        words.push(...japaneseWords(match[0]));
        previousEnd = position + match[0].length;
    }
    words.push(...(cleaned.slice(previousEnd).match(NON_JP_WORD) ?? []));
    return words;
}

/** MiniSearch `processTerm`: drop stopwords and very short/long terms. */
export function processTerm(term: string): string | null {
	const t = term.toLowerCase();
	// A one-character Han word (本, 人, 音) can be meaningful.
	if ((t.length < 2 && !/^[\p{Script=Han}]$/u.test(t)) || t.length > 40 || STOPWORDS.has(t)) return null;
	return t;
}

/**
 * Words with every run of digits replaced by `#`, so text that differs only in numbers
 * (years, dates, counts) normalises to the same words. Used to spot templated boilerplate;
 * the keyword index itself keeps numbers as typed, so they stay searchable.
 */
export function normalizedWords(text: string): string[] {
	return tokenize(text).map((w) => w.replace(/\p{N}+/gu, '#'));
}

/**
 * A block's template signature: its normalised words in order. Two blocks with the same
 * signature differ at most in Markdown formatting, case, punctuation and numbers.
 */
export function signature(text: string): string {
	return normalizedWords(text).join(' ');
}

/** Distinct normalised content words (stopwords dropped; `#` kept, standing for any number). */
export function contentTerms(text: string): Set<string> {
	const terms = new Set<string>();
	for (const w of normalizedWords(text)) {
		if (w === '#' || processTerm(w)) terms.add(w);
	}
	return terms;
}

/** Distinct query terms from free text (e.g. cursor context), in first-seen order. */
export function queryTerms(text: string, max = 48): string[] {
	const seen = new Set<string>();
	for (const tok of tokenize(text)) {
		const t = processTerm(tok);
		if (t && !seen.has(t)) {
			seen.add(t);
			if (seen.size >= max) break;
		}
	}
	return [...seen];
}
