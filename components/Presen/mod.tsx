import { MarkdownEditor } from "./MarkdownEditor.tsx";
import { PresentationContent } from "./PresentationContent.tsx";
import { getMarkdown, setEndpoint } from "./connection.ts";

import { useState } from "preact/hooks";
import ReactionFrame from "./ReactionFrame.tsx";
import { markdownSignal } from "./signals.ts";

const defaultMarkdown = `# Markdown Presentation Tool
このツールを使って、簡単にプレゼンテーションを作成できます！
## キーボード操作
- → キー: 次のページ
- ← キー: 前のページ
- ↑ キー: 前のセクション
- ↓ キー: 次のセクション
## マウス操作
画面右下のボタンでページ移動ができます

---
# Markdown を編集
1. 左上の > アイコンをクリックして左パネルを開く
1. 左側のエディタにMarkdownを入力
2. "Build Presentation"ボタンをクリック
3. フルスクリーンプレゼンテーションの開始
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

## Mermaid
\`\`\`mermaid
graph LR
    A --- B
    B-->C[fa:fa-ban forbidden]
    B-->D(fa:fa-spinner);
\`\`\`

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
> このように表示されます`;

function JoinUrl({ url }: { url: string }) {
  return (
    <label class="input w-full">
      <span class="label">Join URL</span>
      <input
        id="join-url"
        type="text"
        class="w-full"
        value={url}
        readOnly
        onFocus={(e) => (e.target as HTMLInputElement).select()}
      />
    </label>
  );
}

export default function paramsLoader() {
  const url = new URL(location.href);
  const topicId = url.pathname.split("/").slice(-1)[0];
  const secret = url.searchParams.get("secret") || "";
  const endpoint = `${location.origin}/api/topics/${topicId}?secret=${secret}`;
  setEndpoint(endpoint);
  getMarkdown().then((markdown) => {
    markdownSignal.value = markdown || defaultMarkdown;
  });

  url.searchParams.delete("secret");
  return <Presen joinUrl={url.href} publisher={!!secret} />;
}

function Presen(
  { joinUrl, publisher }: { joinUrl: string; publisher: boolean },
) {
  const [showPanel, setShowPanel] = useState(publisher);

  return (
    <div
      id="presen"
      class={`w-screen h-screen ${showPanel ? "show-panel" : ""}`}
    >
      <div class="panel">
        <div class="p-8 w-full h-full max-w-2xl flex flex-col gap-4">
          <JoinUrl url={joinUrl} />
          <MarkdownEditor publisher={publisher} />
        </div>
      </div>
      <div class="center" onClick={() => setShowPanel(!showPanel)}>
        <button type="button" class="arrow" />
      </div>
      <div class="content bg-base-100 h-screen overflow-y-auto">
        <ReactionFrame>
          <PresentationContent />
        </ReactionFrame>
      </div>
    </div>
  );
}
