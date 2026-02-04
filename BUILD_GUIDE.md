# Medi_Q ポータブル版ビルドガイド

**バージョン**: 1.0.0
**作成日**: 2026-02-04

---

## 📦 概要

このガイドでは、Medi_Qのポータブル版（配布用ZIPファイル）をビルドする手順を説明します。

---

## 🎯 ビルドの目的

ポータブル版ビルドは以下を実現します：
- ✅ インストール不要で動作する配布パッケージの作成
- ✅ 完全オフライン動作可能なスタンドアロン版の生成
- ✅ ZIP形式での配布により、簡単なデプロイを実現

---

## 📋 前提条件

### 必要な環境
- **OS**: Windows 10 / 11 (64bit)
- **Node.js**: 18.0.0 以上
- **npm**: 9.0.0 以上
- **ディスク空き容量**: 2GB以上

### 確認コマンド
```bash
# Node.jsバージョン確認
node -v

# npmバージョン確認
npm -v
```

---

## 🚀 ビルド手順

### 方法1: 自動ビルドスクリプト（推奨）

#### 1. ビルドスクリプトの実行

**Windowsエクスプローラーから実行:**
```
1. エクスプローラーでプロジェクトフォルダを開く
2. scripts フォルダに移動
3. build-portable.bat をダブルクリック
```

**コマンドプロンプトから実行:**
```cmd
cd C:\Users\USER\Programs\Medi_Q\scripts
build-portable.bat
```

#### 2. ビルド処理の流れ

ビルドスクリプトは以下の7ステップを自動実行します：

**[1/7] 既存ファイルのクリーンアップ**
- 既存の `dist` フォルダを削除
- 新しい出力ディレクトリを作成

**[2/7] 依存パッケージのインストール**
```bash
npm install
```
- すべての必要なパッケージをインストール
- 本番用・開発用の両方をインストール

**[3/7] Prisma Clientの生成**
```bash
npx prisma generate
```
- データベースアクセス用のクライアントコードを生成
- schema.prismaから自動生成

**[4/7] Next.jsアプリケーションのビルド**
```bash
npm run build
```
- Next.jsをstandaloneモードでビルド
- 最適化された本番用ファイルを生成
- この処理に最も時間がかかります（3-5分）

**[5/7] Standaloneファイルのコピー**
- `.next/standalone` フォルダを出力先にコピー
- `.next/static` フォルダをコピー
- `public` フォルダをコピー

**[6/7] データベース関連ファイルのコピー**
- `prisma/schema.prisma` をコピー
- `prisma/seed.ts` をコピー
- 環境設定ファイル `.env.portable` を `.env.local` としてコピー

**[7/7] 配布パッケージの作成**
- 起動スクリプト `start-mediq.bat` をコピー
- ユーザーマニュアル `README_PORTABLE.txt` をコピー
- PowerShellを使用してZIPファイルを作成

#### 3. ビルド完了の確認

ビルドが成功すると、以下のメッセージが表示されます：
```
========================================
  ビルド完了！
========================================

  出力先: C:\Users\USER\Programs\Medi_Q\dist
  - Medi_Q_Portable\ （フォルダ）
  - Medi_Q_Portable_v1.0.zip （配布用）
```

自動的にエクスプローラーで出力フォルダが開きます。

---

### 方法2: 手動ビルド（トラブルシューティング用）

自動スクリプトが動作しない場合、以下の手順で手動ビルドします。

#### 1. クリーンアップ
```cmd
cd C:\Users\USER\Programs\Medi_Q
rmdir /s /q dist
mkdir dist\Medi_Q_Portable
```

#### 2. アプリケーションディレクトリに移動
```cmd
cd app
```

#### 3. 依存パッケージのインストール
```cmd
npm install
```

#### 4. Prisma Clientの生成
```cmd
npx prisma generate
```

#### 5. Next.jsのビルド
```cmd
npm run build
```

#### 6. ファイルのコピー（PowerShell）
```powershell
# Standaloneファイル
xcopy /s /e /i /y ".next\standalone" "..\dist\Medi_Q_Portable\app"
xcopy /s /e /i /y ".next\static" "..\dist\Medi_Q_Portable\app\.next\static"
xcopy /s /e /i /y "public" "..\dist\Medi_Q_Portable\app\public"

# Prismaファイル
mkdir "..\dist\Medi_Q_Portable\app\prisma"
copy /y "prisma\schema.prisma" "..\dist\Medi_Q_Portable\app\prisma\"
copy /y "prisma\seed.ts" "..\dist\Medi_Q_Portable\app\prisma\"

# 設定ファイル
copy /y "package.json" "..\dist\Medi_Q_Portable\app\"
copy /y ".env.portable" "..\dist\Medi_Q_Portable\app\.env.local"

# 起動スクリプトとドキュメント
copy /y "..\scripts\start-mediq.bat" "..\dist\Medi_Q_Portable\Medi_Q起動.bat"
copy /y "..\README_PORTABLE.txt" "..\dist\Medi_Q_Portable\README.txt"
```

#### 7. ZIPファイルの作成（PowerShell）
```powershell
cd ..\dist
Compress-Archive -Path "Medi_Q_Portable\*" -DestinationPath "Medi_Q_Portable_v1.0.zip" -Force
```

---

## 📂 出力ファイル構成

ビルド後の `dist` フォルダの構成：

```
dist\
├── Medi_Q_Portable\                    # 解凍後のフォルダ
│   ├── Medi_Q起動.bat                  # 起動スクリプト
│   ├── README.txt                      # ユーザーマニュアル
│   └── app\                            # アプリケーション本体
│       ├── .next\
│       │   ├── standalone\
│       │   └── static\
│       ├── prisma\
│       │   ├── schema.prisma
│       │   └── seed.ts
│       ├── public\
│       ├── package.json
│       ├── server.js
│       └── .env.local
│
└── Medi_Q_Portable_v1.0.zip            # 配布用ZIPファイル（約100MB）
```

---

## ✅ ビルド検証

ビルドが正しく完了したか確認します。

### 1. ファイル存在確認
```cmd
dir dist\Medi_Q_Portable\Medi_Q起動.bat
dir dist\Medi_Q_Portable\README.txt
dir dist\Medi_Q_Portable\app\package.json
dir dist\Medi_Q_Portable_v1.0.zip
```

すべてのファイルが存在することを確認してください。

### 2. 起動テスト

**新しいフォルダに解凍してテスト:**
```
1. dist\Medi_Q_Portable フォルダを別の場所にコピー
2. Medi_Q起動.bat をダブルクリック
3. ブラウザが開き、http://localhost:3000 にアクセスできることを確認
```

### 3. 機能テスト
- [ ] 受付画面が表示される
- [ ] 管理画面にログインできる（admin / admin123）
- [ ] ダッシュボードが表示される
- [ ] 患者登録ができる
- [ ] QRコードが生成される

---

## 🐛 トラブルシューティング

### 問題: ビルドが失敗する

**原因1: Node.jsのバージョンが古い**
```bash
# 解決: Node.js 18以上をインストール
node -v
# 18.0.0未満の場合は https://nodejs.org/ から最新版をインストール
```

**原因2: 依存パッケージのエラー**
```bash
# 解決: node_modulesを削除して再インストール
cd app
rmdir /s /q node_modules
rmdir /s /q .next
npm install
```

**原因3: ディスク容量不足**
```bash
# 解決: 2GB以上の空き容量を確保
```

### 問題: ZIPファイルが作成されない

**原因: PowerShellの実行ポリシー**
```powershell
# 解決: 実行ポリシーを確認
Get-ExecutionPolicy

# RemoteSigned に変更（管理者権限で実行）
Set-ExecutionPolicy RemoteSigned
```

### 問題: 起動テストで動作しない

**原因1: Node.jsがインストールされていない**
```bash
# 解決: Node.jsをインストール
https://nodejs.org/
```

**原因2: ポート3000が使用されている**
```cmd
# 解決: 使用中のポートを確認
netstat -ano | findstr :3000

# 該当プロセスを終了してから再起動
```

---

## 🔄 再ビルド

変更を加えた後に再ビルドする場合：

### クリーンビルド（推奨）
```cmd
# 既存のビルドを完全に削除してから再ビルド
cd C:\Users\USER\Programs\Medi_Q
rmdir /s /q dist
rmdir /s /q app\.next
rmdir /s /q app\node_modules

# ビルドスクリプトを実行
cd scripts
build-portable.bat
```

### 高速再ビルド
```cmd
# node_modulesを残したまま再ビルド（高速）
cd C:\Users\USER\Programs\Medi_Q
rmdir /s /q dist
cd scripts
build-portable.bat
```

---

## 📦 配布準備

ビルドが完了したら、配布の準備をします。

### 1. ZIPファイルの検証
```
1. dist\Medi_Q_Portable_v1.0.zip を別の場所にコピー
2. 解凍してフォルダ構成を確認
3. Medi_Q起動.bat で起動テスト
4. 全機能が正常に動作することを確認
```

### 2. ファイルサイズの確認
```
- ZIPファイル: 約100MB前後
- 解凍後: 約150MB前後
```

### 3. ウイルススキャン
```
- 配布前に必ずウイルススキャンを実施
- Windows Defender または他のアンチウイルスソフトを使用
```

### 4. ドキュメントの最終確認
```
- README.txt の内容が最新であることを確認
- バージョン番号が正しいことを確認
- 連絡先情報が記載されていることを確認
```

---

## 🚀 配布方法

### GitHub Releases（推奨）
```
1. GitHubリポジトリの "Releases" に移動
2. "Create a new release" をクリック
3. Tag: v1.0.0
4. Title: Medi_Q v1.0.0
5. Description: RELEASE_NOTES.mdの内容
6. ZIPファイルをアップロード
7. "Publish release" をクリック
```

### その他の配布方法
- クラウドストレージ（Google Drive、Dropbox等）
- 社内ファイルサーバー
- CD/USB（物理メディア）

---

## 📝 ビルド記録

ビルドを実行した際は、以下の情報を記録してください：

```
ビルド日時: __________
ビルド担当者: __________
ビルドバージョン: v1.0.0
Node.jsバージョン: __________
ビルド所要時間: __________
出力ZIPファイル名: Medi_Q_Portable_v1.0.zip
ファイルサイズ: __________
ビルド環境: Windows ____ (64bit)

備考:
（特記事項があれば記入）
```

---

**Medi_Q ポータブル版ビルドガイド v1.0**
**作成日**: 2026-02-04
