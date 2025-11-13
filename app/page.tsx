'use client';

import { useState } from 'react';
import QRReader from '@/components/QRReader';
import { APP_NAME } from '@/config/constants';

export default function Home() {
  const [error, setError] = useState<string>('');

  const handleScan = (patientId: string) => {
    console.log('Patient ID scanned:', patientId);
    // TODO: Googleカレンダーから患者情報を取得する処理を追加
    alert(`患者ID: ${patientId} を読み取りました！\n\n（次のステップ: カレンダー連携で患者情報を取得）`);
  };

  const handleError = (error: Error) => {
    console.error('QR Reader error:', error);
    setError(error.message);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-blue-600">{APP_NAME}</h1>
              <p className="text-sm text-gray-600 mt-1">
                QRコード来院者管理システム
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium text-green-700">
                  システム稼働中
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* タイトル */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            診察券のQRコードをかざしてください
          </h2>
          <p className="text-gray-600">
            QRコードを読み取ると、自動的に受付を行います
          </p>
        </div>

        {/* QRリーダー */}
        <div className="mb-8">
          <QRReader onScan={handleScan} onError={handleError} />
        </div>

        {/* エラー表示 */}
        {error && (
          <div className="max-w-2xl mx-auto p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <h3 className="font-bold text-red-900 mb-1">エラー</h3>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* システム情報 */}
        <div className="mt-12 max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              システム状態
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <span className="text-2xl">📷</span>
                <div>
                  <p className="text-xs text-gray-500">カメラ</p>
                  <p className="font-medium text-gray-900">準備完了</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <span className="text-2xl">📅</span>
                <div>
                  <p className="text-xs text-gray-500">カレンダー</p>
                  <p className="font-medium text-gray-900">未設定</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <span className="text-2xl">🔊</span>
                <div>
                  <p className="text-xs text-gray-500">音声</p>
                  <p className="font-medium text-gray-900">未設定</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* フッター */}
      <footer className="mt-16 bg-gray-50 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500">
            © 2025 {APP_NAME}. Built with Next.js
          </p>
        </div>
      </footer>
    </div>
  );
}
