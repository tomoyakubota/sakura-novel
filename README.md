# 🌸 桜色の約束 ─ Sakura-iro no Yakusoku

AIが紡ぐ恋愛ノベルゲーム。自由な対話でキャラクターとの物語が変化していきます。

## 🎮 特徴

- **3人のヒロイン** — 陽菜（元気系）、凛（クール系）、咲良（不思議系）
- **全5章構成** — 出会い → 近づく距離 → 揺れる心 → すれ違い → 桜色の約束
- **自由入力AI会話** — テキスト入力に対してAIがキャラクターとして応答
- **好感度システム** — 会話内容で好感度が変動、ストーリー展開に影響
- **動的エンディング** — 会話の蓄積から結末をリアルタイム生成

## 🚀 デプロイ手順（Vercel）

### 1. 準備

- [GitHub](https://github.com) アカウント
- [Vercel](https://vercel.com) アカウント（GitHub連携で無料登録）
- [Anthropic API Key](https://console.anthropic.com/)

### 2. GitHubにリポジトリ作成

```bash
# このフォルダで初期化
cd sakura-novel
git init
git add .
git commit -m "initial commit"

# GitHubでリポジトリを作成後
git remote add origin https://github.com/YOUR_NAME/sakura-novel.git
git branch -M main
git push -u origin main
```

### 3. Vercelでデプロイ

1. [vercel.com](https://vercel.com) にログイン
2. 「Add New → Project」をクリック
3. 先ほどのGitHubリポジトリを選択して「Import」
4. **Environment Variables** に以下を追加:
   - Key: `ANTHROPIC_API_KEY`
   - Value: `sk-ant-xxxxxxxxx`（あなたのAPIキー）
5. 「Deploy」をクリック

→ 数分で `https://sakura-novel-xxx.vercel.app` のようなURLが発行されます。

### 4. 完了

以降はGitHubにpushするだけで自動デプロイされます。

## 🔧 ローカル開発

```bash
# 依存パッケージのインストール
npm install

# .envファイルを作成
cp .env.example .env.local
# .env.local にAPIキーを記入

# 開発サーバー起動
npm run dev
```

http://localhost:3000 でアクセスできます。

## 📁 ファイル構成

```
sakura-novel/
├── app/
│   ├── api/chat/
│   │   └── route.ts    ← APIプロキシ（キーをサーバーに隠す）
│   ├── layout.tsx       ← HTMLレイアウト
│   └── page.tsx         ← ゲーム本体
├── .env.example         ← 環境変数テンプレート
├── .gitignore
├── next.config.js
├── package.json
├── tsconfig.json
└── README.md
```

## 💰 コストについて

- **Vercel**: 無料プラン（Hobby）で十分動作します
- **Anthropic API**: 従量課金（1ゲームプレイ ≈ $0.05〜0.15程度）
  - 大量アクセスが想定される場合はレートリミットの調整を推奨

## ⚙️ カスタマイズ

- **キャラクター追加**: `CHARACTERS` オブジェクトに追加
- **章構成の変更**: `CHAPTERS` 配列を編集
- **ターン数調整**: 各章の `maxTurns` を変更
- **レートリミット**: `app/api/chat/route.ts` の `RATE_LIMIT` を調整
