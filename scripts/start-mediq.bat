@echo off
chcp 65001 > nul
title Medi_Q - QRコード来院者管理システム

echo ========================================
echo   Medi_Q 起動中...
echo ========================================
echo.

REM カレントディレクトリを取得
set "SCRIPT_DIR=%~dp0"
set "APP_DIR=%SCRIPT_DIR%..\app"

REM Node.jsのパスを設定（システムのNode.jsを使用）
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [エラー] Node.jsがインストールされていません
    echo.
    echo Node.js 18以上をインストールしてください
    echo ダウンロード: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

REM Node.jsのバージョン確認
echo [1/4] Node.jsバージョン確認中...
node -v
echo.

REM データベースディレクトリの確認
echo [2/4] データベースディレクトリ確認中...
if not exist "%APP_DIR%\prisma\medi_q.db" (
    echo [警告] データベースファイルが見つかりません
    echo 初回起動時に自動作成されます
    echo.
)

REM アプリケーションディレクトリに移動
cd /d "%APP_DIR%"

REM 環境変数の設定
set "NODE_ENV=production"
set "PORT=3000"

REM 初回起動チェック（node_modulesが存在しない場合）
if not exist "node_modules" (
    echo [3/4] 初回起動: 依存パッケージをインストール中...
    echo この処理には数分かかる場合があります
    echo.
    call npm install --production
    if %errorlevel% neq 0 (
        echo [エラー] パッケージのインストールに失敗しました
        pause
        exit /b 1
    )
    echo.
    echo [3/4] データベースを初期化中...
    call npm run db:seed
    echo.
) else (
    echo [3/4] 依存パッケージ: OK
    echo.
)

REM アプリケーション起動
echo [4/4] Medi_Qを起動中...
echo.
echo ========================================
echo   起動完了！
echo ========================================
echo.
echo   アクセスURL: http://localhost:3000
echo.
echo   管理画面: http://localhost:3000/admin
echo   ログイン: admin / admin123
echo.
echo   終了するには、このウィンドウを閉じてください
echo.
echo ========================================
echo.

REM ブラウザを自動起動（5秒待機）
timeout /t 5 /nobreak > nul
start http://localhost:3000

REM Next.jsアプリケーション起動
call npm start

REM 終了時の処理
echo.
echo ========================================
echo   Medi_Qを終了しました
echo ========================================
pause
