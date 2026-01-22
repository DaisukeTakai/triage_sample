# 緊急度判定AI支援（試作）

通報内容（テキスト）を入力すると、判定フローを順次可視化し、最後に緊急度（赤/橙/黄/緑/白）を出力する **試作品** です。

## 免責
このアプリは医療判断の代替ではありません。緊急時は **119番** を優先してください。

## 動かし方（ローカル）

```bash
cd web
npm install
npm run dev
```

## 使い方

1. `通報内容（テキスト）` に日本語で状況を入力
2. `判定` を押す

### モード

- **ダミー（ローカル判定）**: OpenAI API を使わず、ローカルの簡易ルールで「それっぽい」判定フローを生成します（試作確認用）。
- **Azure OpenAI（JSONフロー生成）**: Azure OpenAI をブラウザから直接呼び出し、モデルに JSON を生成させます。
  - 入力が必要: `Endpoint` / `Deployment` / `api-version` / `API Key`
  - APIキーは保存しません（ブラウザ入力のみ）。
  - GitHub Pages のような静的ホスティングで動かす想定のため、ブラウザから Azure OpenAI に直接リクエストします。

#### デフォルト値
- Deployment: `gpt-5.2`
- api-version: `2024-02-15-preview`

#### 注意（CORS）
環境/設定によっては、ブラウザから Azure OpenAI へ直接アクセスする際に CORS 等で失敗する場合があります。
その場合は「サーバレスProxy（Cloudflare Workers / Functions 等）」を挟む構成に切り替えてください（DB不要）。

## GitHub Pages でのデプロイ

Vite の `base` を GitHub Pages 用に指定して build してください。

例: リポジトリ名が `triage_sample` の場合

```bash
cd web
GITHUB_PAGES_BASE=/triage_sample/ npm run build
```

生成物は `web/dist` に出ます。GitHub Pages の公開方法（例）:

- `gh-pages` ブランチに `dist` を置く
- もしくは GitHub Actions で `dist` を Pages にデプロイ

（必要なら Actions のワークフローも追加します）

## 実装メモ

- JSONスキーマ: `src/lib/triageSchema.ts`
- ダミー判定: `src/lib/dummyProtocol.ts`
- Azure OpenAI クライアント（ブラウザ直叩き）: `src/lib/azureOpenAiClient.ts`
- システムプロンプト: `src/lib/systemPrompt.ts`
