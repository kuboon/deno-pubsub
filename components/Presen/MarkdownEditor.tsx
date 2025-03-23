import { signal } from "@preact/signals";

export const markdownSignal = signal(`# Markdown Presentation Tool

このツールを使って、簡単にプレゼンテーションを作成できます！

## 基本的な使い方

1. 左側のエディタにMarkdownを入力
2. "Build Presentation"ボタンをクリック
3. フルスクリーンプレゼンテーションの開始

---

# ナビゲーション方法

## キーボード操作

- → キー: 次のページ
- ← キー: 前のページ
- ↑ キー: 前のセクション
- ↓ キー: 次のセクション

## マウス操作

画面右下のボタンでページ移動ができます

---

# Markdownの書き方

## 見出しの使い方

- # 見出し1
- ## 見出し2
- ### 見出し3

## リストの書き方

1. 番号付きリスト
2. このように書きます

- 箇条書きリスト
- このように書きます

---

# コードとテーブル

## コードブロック

\`\`\`javascript
function hello() {
  console.log("Hello, World!");
}
\`\`\`

## テーブル

| 項目 | 説明 |
|------|------|
| ページ区切り | \`<hr>\` タグを使用 |
| ナビゲーション | キーボードまたはボタン |

---

# スタイリング

## テキストスタイル

- **太字** は \`**text**\`
- *斜体* は \`*text*\`
- ~~打ち消し線~~ は \`~~text~~\`

## 引用

> 引用文は
> このように表示されます`);

export function MarkdownEditor() {
  return (
    <textarea
      class="textarea textarea-bordered w-full h-full"
      value={markdownSignal.value}
      onInput={(e) => (markdownSignal.value = e.currentTarget.value)}
      placeholder="Edit your markdown here..."
    >
    </textarea>
  );
}
