declare module 'kuromoji' {
    export interface Token { surface_form: string; basic_form?: string; pos: string; pos_detail_1?: string }
    export interface Tokenizer { tokenize(text: string): Token[] }
    export interface Builder { build(callback: (error: Error | null, tokenizer?: Tokenizer) => void): void }
    export function builder(opts: { dicPath: string }): Builder;
}
