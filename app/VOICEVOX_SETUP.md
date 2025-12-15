# VOICEVOX Engine セットアップガイド

このガイドでは、Medi_Qの音声案内機能に必要なVOICEVOX Engineのセットアップ方法を説明します。

## 📋 前提条件

- Docker Desktop（推奨）またはWindows 10/11
- インターネット接続
- メモリ 4GB以上

---

## 🐳 方法1: Dockerを使用（推奨）

### 1. Docker Desktopのインストール

Docker Desktopがインストールされていない場合は、公式サイトからダウンロードしてインストールします。

- [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop/)

### 2. VOICEVOX Engine Dockerイメージの取得

コマンドプロンプトまたはPowerShellで以下のコマンドを実行します。

```bash
docker pull voicevox/voicevox_engine:cpu-ubuntu20.04-latest
```

### 3. VOICEVOX Engineの起動

```bash
docker run --rm -p 50021:50021 voicevox/voicevox_engine:cpu-ubuntu20.04-latest
```

**起動成功のメッセージ例:**
```
INFO:     Started server process [1]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:50021 (Press CTRL+C to quit)
```

### 4. 動作確認

ブラウザで以下のURLにアクセスし、バージョン情報が表示されることを確認します。

```
http://localhost:50021/version
```

**正常な場合の表示例:**
```json
"0.14.0"
```

---

## 💻 方法2: 実行ファイルを使用（Windows）

### 1. VOICEVOX Engineのダウンロード

VOICEVOX Engineの公式リリースページから最新版をダウンロードします。

- [VOICEVOX Engine リリースページ](https://github.com/VOICEVOX/voicevox_engine/releases)

**ダウンロードするファイル:**
- `voicevox_engine-windows-directml-<version>.zip`（GPU対応）
- または `voicevox_engine-windows-cpu-<version>.zip`（CPU版）

### 2. 解凍

ダウンロードしたZIPファイルを任意のフォルダに解凍します。

例: `C:\VOICEVOX\`

### 3. 起動

解凍したフォルダ内の `run.exe` をダブルクリックして起動します。

コマンドプロンプトで起動する場合:

```cmd
cd C:\VOICEVOX\voicevox_engine
.\run.exe
```

### 4. 動作確認

ブラウザで以下のURLにアクセスし、バージョン情報が表示されることを確認します。

```
http://localhost:50021/version
```

---

## 🔧 Medi_Qの環境変数設定

### 1. `.env.local` ファイルの編集

`app/.env.local` ファイルに以下の設定があることを確認します。

```env
VOICEVOX_API_URL=http://localhost:50021
```

### 2. 設定の反映

開発サーバーを再起動します。

```bash
npm run dev
```

---

## 🧪 音声合成のテスト

### 1. Medi_Qアプリケーションにアクセス

ブラウザで `http://localhost:3000` を開きます。

### 2. システム状態の確認

画面下部の「システム状態」セクションで、音声が「利用可能」と表示されていることを確認します。

### 3. QRコードスキャンのテスト

1. `/test-qr` ページでテスト用QRコードを生成
2. メインページでQRコードをスキャン
3. 患者情報が表示されると同時に音声案内が自動再生される

**期待される音声内容:**
```
ようこそ。検査がある場合は内科前に、無い場合は2階待合室A前にお越しください。田中花子先生が担当します。お待ちしております。
```

---

## 📖 API リファレンス

### エンドポイント: GET /api/voice/synthesize

VOICEVOX Engineの状態を確認します。

**レスポンス例:**
```json
{
  "success": true,
  "data": {
    "available": true,
    "url": "http://localhost:50021"
  }
}
```

### エンドポイント: POST /api/voice/synthesize

テキストから音声を合成します。

**リクエスト:**
```json
{
  "text": "ようこそ。検査がある場合は内科前に...",
  "speaker": 3,
  "speedScale": 1.0,
  "volumeScale": 1.0,
  "pitchScale": 0.0
}
```

**レスポンス:**
- Content-Type: `audio/wav`
- Body: 音声データ（WAVファイル）

---

## 🎙️ 利用可能な話者

| 話者ID | キャラクター名 | スタイル |
|--------|--------------|---------|
| 3 | ずんだもん | ノーマル（デフォルト） |
| 1 | ずんだもん | あまあま |
| 2 | 四国めたん | ノーマル |
| 8 | 春日部つむぎ | ノーマル |

**話者を変更する場合:**

`app/app/page.tsx` の245行目を編集します。

```tsx
<VoicePlayer text={voiceText} autoPlay={true} speaker={3} />
                                                        ↑
                                            話者IDを変更
```

---

## ❗ トラブルシューティング

### 問題1: VOICEVOX Engineが起動しない

**原因:** ポート50021が既に使用されている

**解決策:**
1. 他のプロセスを終了
2. または別のポートを使用:
   ```bash
   docker run --rm -p 50022:50021 voicevox/voicevox_engine:cpu-ubuntu20.04-latest
   ```
   `.env.local`を更新:
   ```env
   VOICEVOX_API_URL=http://localhost:50022
   ```

### 問題2: 音声が再生されない

**確認事項:**
1. VOICEVOX Engineが起動しているか確認
   ```
   http://localhost:50021/version
   ```
2. ブラウザの音量設定を確認
3. ブラウザのコンソールでエラーを確認

### 問題3: 「VOICEVOX Engineが起動していません」と表示される

**原因:** ネットワーク接続またはEngine未起動

**解決策:**
1. VOICEVOX Engineを起動
2. ファイアウォール設定を確認
3. 開発サーバーを再起動

---

## 🔄 本番環境での運用

### 自動起動設定（Windows）

1. スタートアップフォルダにショートカットを配置
   - `Win + R` → `shell:startup`
   - `run.exe` のショートカットを作成して配置

### バックグラウンド実行（Docker）

```bash
docker run -d --name voicevox --restart=always -p 50021:50021 voicevox/voicevox_engine:cpu-ubuntu20.04-latest
```

停止:
```bash
docker stop voicevox
docker rm voicevox
```

---

## 📚 参考リンク

- [VOICEVOX公式サイト](https://voicevox.hiroshiba.jp/)
- [VOICEVOX Engine GitHub](https://github.com/VOICEVOX/voicevox_engine)
- [VOICEVOX Engine API ドキュメント](https://voicevox.github.io/voicevox_engine/api/)

---

## ℹ️ ライセンス

VOICEVOX Engineは無料で商用利用可能です。詳細は公式サイトをご確認ください。

---

**作成日**: 2025-11-14
**対象バージョン**: VOICEVOX Engine 0.14.0+
