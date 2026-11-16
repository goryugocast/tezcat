# Tezcat JA — 日本語キーワード検索試作

Tezcat 2.0.0 の公開フォークに kuromoji.js / IPADIC による日本語形態素解析を追加する試用版です。元の Tezcat のデータとは分けるため、Obsidian プラグインIDは `tezcat-ja` です。

## Macでの試用

1. このブランチを取得し `npm install` → `npm run build` → `npm test`。
2. `dist/tezcat-ja/` の全内容を、テストVaultの `.obsidian/plugins/tezcat-ja/` にコピー。
3. Obsidian（デスクトップ 1.11.4以降）のコミュニティプラグインから Tezcat JA を有効にする。
4. 「本人が本を読んだ」と「本を読む人の記録」を別ノートに書き、キーワード検索・自動候補表示を試す。
5. 英語のみ、日本語のみ、日英混在、固有名詞、動詞活用も比較する。

キーワード検索はオフラインで動作する設計です。意味検索の設定は従来どおり任意です。辞書やトークン化処理を変更した場合は `Tezcat: Rebuild index` で再構築します。

**検証状況**：試作コードのブランチ反映のみ。依存パッケージを使ったフルビルド、Obsidian実機検証は別途必要です。初めは普段のVaultではなくテストVaultで試してください。

ライセンス: 元の Tezcat の `LICENSE` は GPL-3.0。kuromoji.js は Apache-2.0、IPADICのNOTICEを使用します。ビルドで辞書とライセンス表記を試用版に含めます。

作業管理: [goryugo-media Issue #107](https://github.com/goryugocast/goryugo-media/issues/107)。
