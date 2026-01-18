@echo off
chcp 65001 > nul
title Medi_Q - ポータブル版ビルド

echo ========================================
echo   Medi_Q ポータブル版ビルド
echo ========================================
echo.

REM カレントディレクトリを取得
set "SCRIPT_DIR=%~dp0"
set "APP_DIR=%SCRIPT_DIR%..\app"
set "DIST_DIR=%SCRIPT_DIR%..\dist"
set "OUTPUT_DIR=%DIST_DIR%\Medi_Q_Portable"

REM distディレクトリをクリーンアップ
if exist "%DIST_DIR%" (
    echo [1/7] 既存のdistディレクトリを削除中...
    rmdir /s /q "%DIST_DIR%"
)
mkdir "%DIST_DIR%"
mkdir "%OUTPUT_DIR%"
echo.

REM アプリケーションディレクトリに移動
cd /d "%APP_DIR%"

REM 依存パッケージのインストール
echo [2/7] 依存パッケージをインストール中...
call npm install
if %errorlevel% neq 0 (
    echo [エラー] パッケージのインストールに失敗しました
    pause
    exit /b 1
)
echo.

REM Prisma Client生成
echo [3/7] Prisma Clientを生成中...
call npx prisma generate
if %errorlevel% neq 0 (
    echo [エラー] Prisma Clientの生成に失敗しました
    pause
    exit /b 1
)
echo.

REM Next.jsビルド（standalone）
echo [4/7] Next.jsアプリケーションをビルド中...
echo この処理には数分かかる場合があります
echo.
call npm run build
if %errorlevel% neq 0 (
    echo [エラー] ビルドに失敗しました
    pause
    exit /b 1
)
echo.

REM Standaloneファイルをコピー
echo [5/7] Standaloneファイルをコピー中...
xcopy /s /e /i /y ".next\standalone" "%OUTPUT_DIR%\app"
xcopy /s /e /i /y ".next\static" "%OUTPUT_DIR%\app\.next\static"
xcopy /s /e /i /y "public" "%OUTPUT_DIR%\app\public"
echo.

REM Prismaファイルをコピー
echo [6/7] データベースファイルをコピー中...
mkdir "%OUTPUT_DIR%\app\prisma"
copy /y "prisma\schema.prisma" "%OUTPUT_DIR%\app\prisma\"
copy /y "prisma\seed.ts" "%OUTPUT_DIR%\app\prisma\"
copy /y "prisma\medi_q.db" "%OUTPUT_DIR%\app\prisma\" 2>nul

REM 必要なファイルをコピー
copy /y "package.json" "%OUTPUT_DIR%\app\"
copy /y ".env.portable" "%OUTPUT_DIR%\app\.env.local"
echo.

REM 起動スクリプトとREADMEをコピー
echo [7/7] 起動スクリプトとドキュメントをコピー中...
copy /y "%SCRIPT_DIR%\start-mediq.bat" "%OUTPUT_DIR%\Medi_Q起動.bat"
copy /y "%SCRIPT_DIR%\..\README_PORTABLE.txt" "%OUTPUT_DIR%\README.txt"
echo.

REM ZIPファイル作成（PowerShellを使用）
echo [完了] ZIPファイルを作成中...
cd /d "%DIST_DIR%"
powershell -command "Compress-Archive -Path 'Medi_Q_Portable\*' -DestinationPath 'Medi_Q_Portable_v1.0.zip' -Force"
echo.

echo ========================================
echo   ビルド完了！
echo ========================================
echo.
echo   出力先: %DIST_DIR%
echo   - Medi_Q_Portable\ （フォルダ）
echo   - Medi_Q_Portable_v1.0.zip （配布用）
echo.
echo   配布方法:
echo   1. Medi_Q_Portable_v1.0.zip を配布
echo   2. ユーザーはZIPを解凍
echo   3. "Medi_Q起動.bat" をダブルクリック
echo.
echo ========================================

REM 出力フォルダを開く
explorer "%DIST_DIR%"

pause
