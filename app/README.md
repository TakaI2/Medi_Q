# Medi_Q - QRコード来院者管理システム

医療施設向けQRコード来院者管理システム。診察券のQRコードをスキャンして、音声案内・診察情報印刷・来院通知を自動化します。

## 🚀 機能

- **QRコード受付**: Webカメラで診察券のQRコードを読み取り
- **音声案内**: VOICEVOX による自然な日本語音声で案内
- **診察情報印刷**: 来院者の診察情報を紙に印刷
- **カレンダー連携**: Googleカレンダーから診察予定を取得・来院通知を送信

## 📋 必要な環境

- Node.js 18.x以上
- npm
- Webカメラ（QRコード読取用）
- プリンタ（診察票印刷用）
- Googleアカウント（カレンダー連携用）
- VOICEVOX Engine（音声合成用）

## 🛠️ セットアップ

### 1. リポジトリのクローン

```bash
git clone https://github.com/TakaI2/Medi_Q.git
cd Medi_Q/app
```

### 2. 依存関係のインストール

```bash
npm install
```

### 3. 環境変数の設定

`.env.example` をコピーして `.env.local` を作成し、必要な情報を設定します。

```bash
cp .env.example .env.local
```

`.env.local` を編集：

```env
GOOGLE_CALENDAR_ID=your-calendar-id@group.calendar.google.com
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project-id.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour Private Key Here\n-----END PRIVATE KEY-----\n"
VOICEVOX_API_URL=http://localhost:50021
```

### 4. VOICEVOX Engine のセットアップ

#### Dockerを使用する場合（推奨）

```bash
docker pull voicevox/voicevox_engine:cpu-ubuntu20.04-latest
docker run --rm -p 50021:50021 voicevox/voicevox_engine:cpu-ubuntu20.04-latest
```

#### 実行ファイルを使用する場合

[VOICEVOX Engine リリースページ](https://github.com/VOICEVOX/voicevox_engine/releases)から最新版をダウンロードして起動します。

### 5. Google Calendar API の設定

1. [Google Cloud Console](https://console.cloud.google.com/)でプロジェクトを作成
2. Google Calendar APIを有効化
3. サービスアカウントを作成し、認証情報（JSON）をダウンロード
4. サービスアカウントのメールアドレスをGoogleカレンダーに共有設定
5. 認証情報を`.env.local`に設定

## 🏃 開発サーバーの起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開きます。

## 📦 本番ビルド

```bash
npm run build
npm start
```

## 🚢 デプロイ

### Vercel へのデプロイ

1. [Vercel](https://vercel.com) でアカウント作成
2. GitHubリポジトリと連携
3. 環境変数を設定
4. デプロイ

```bash
# Vercel CLI を使う場合
npm install -g vercel
vercel
```

## 📁 プロジェクト構造

```
app/
├── app/                  # Next.js App Router
│   ├── page.tsx         # メインページ（QRリーダー）
│   ├── layout.tsx       # レイアウト
│   ├── api/             # API Routes
│   │   ├── calendar/    # カレンダー連携API
│   │   └── voice/       # 音声合成API
│   └── print/           # 印刷ページ
├── components/          # Reactコンポーネント
├── lib/                 # ユーティリティ
├── types/               # TypeScript型定義
├── config/              # 設定ファイル
└── public/              # 静的ファイル
```

## 📚 ドキュメント

- [要件定義書](../.tmp/requirements.md)
- [設計書](../.tmp/design.md)
- [テスト設計書](../.tmp/test_design.md)
- [タスク分解](../.tmp/tasks.md)

## 🤝 コントリビューション

プルリクエストを歓迎します。大きな変更の場合は、まずissueを開いて変更内容を議論してください。

## 📄 ライセンス

このプロジェクトはMITライセンスの下でライセンスされています。

## 🙏 謝辞

- [Next.js](https://nextjs.org/)
- [VOICEVOX](https://voicevox.hiroshiba.jp/)
- [Google Calendar API](https://developers.google.com/calendar)
- [@zxing/library](https://github.com/zxing-js/library)

---

Built with [Next.js](https://nextjs.org)
🤖 Generated with [Claude Code](https://claude.com/claude-code)
