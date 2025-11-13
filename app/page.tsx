'use client';

import { useState } from 'react';
import axios from 'axios';
import QRReader from '@/components/QRReader';
import { PatientInfo } from '@/types';
import { APP_NAME } from '@/config/constants';
import { format } from 'date-fns';

export default function Home() {
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [patientInfo, setPatientInfo] = useState<PatientInfo | null>(null);

  const handleScan = async (patientId: string) => {
    console.log('Patient ID scanned:', patientId);
    setError('');
    setLoading(true);

    try {
      // モックモード判定（開発用）
      const useMockData = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true' || !process.env.GOOGLE_CALENDAR_ID;

      if (useMockData) {
        // モックデータを使用
        console.log('📝 モックデータモードで動作中');
        await new Promise((resolve) => setTimeout(resolve, 1000)); // 1秒待機（APIっぽく）

        const mockInfo: PatientInfo = {
          patientId,
          patientName: '山田太郎',
          examDate: new Date().toISOString(),
          examinations: ['血液検査', 'MRI'],
          doctor: '田中花子',
          department: '内科',
          waitingArea: '2階待合室A',
          eventId: 'mock-event-id',
        };

        setPatientInfo(mockInfo);
        console.log('✅ モックデータ表示完了');
      } else {
        // 現在の日付を取得
        const today = format(new Date(), 'yyyy-MM-dd');

        // Googleカレンダーから患者情報を取得
        const response = await axios.post('/api/calendar/search', {
          patientId,
          date: today,
        });

        if (response.data.success) {
          const info = response.data.data as PatientInfo;
          setPatientInfo(info);

          // 来院通知を送信
          if (info.eventId) {
            await axios.post('/api/calendar/notify', {
              eventId: info.eventId,
              visitTime: new Date().toISOString(),
            });
          }
        } else {
          setError(response.data.error?.message || 'エラーが発生しました');
        }
      }
    } catch (err) {
      console.error('Error fetching patient info:', err);
      if (axios.isAxiosError(err) && err.response) {
        setError(err.response.data.error?.message || 'サーバーエラーが発生しました');
      } else {
        setError('ネットワークエラーが発生しました');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleError = (error: Error) => {
    console.error('QR Reader error:', error);
    setError(error.message);
  };

  const handleClose = () => {
    setPatientInfo(null);
    setError('');
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
        {!patientInfo && (
          <div className="mb-8">
            <QRReader onScan={handleScan} onError={handleError} />
          </div>
        )}

        {/* ローディング表示 */}
        {loading && (
          <div className="max-w-2xl mx-auto p-8 bg-white border border-gray-200 rounded-lg text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4" />
            <p className="text-gray-700 font-medium">患者情報を取得中...</p>
          </div>
        )}

        {/* 患者情報表示 */}
        {patientInfo && !loading && (
          <div className="max-w-3xl mx-auto">
            <div className="bg-white border-2 border-green-500 rounded-lg shadow-lg overflow-hidden">
              {/* ヘッダー */}
              <div className="bg-green-500 text-white px-6 py-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold">✅ 受付完了</h3>
                  <button
                    onClick={handleClose}
                    className="text-white hover:text-green-100 text-2xl"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* 患者情報 */}
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">患者名</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {patientInfo.patientName} 様
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">診察日時</p>
                    <p className="text-lg font-medium text-gray-900">
                      {new Date(patientInfo.examDate).toLocaleString('ja-JP', {
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">診察科</p>
                      <p className="text-lg font-medium text-gray-900">
                        {patientInfo.department}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">担当医</p>
                      <p className="text-lg font-medium text-gray-900">
                        {patientInfo.doctor} 先生
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">待機場所</p>
                      <p className="text-lg font-medium text-gray-900">
                        {patientInfo.waitingArea}
                      </p>
                    </div>
                    {patientInfo.examinations.length > 0 && (
                      <div>
                        <p className="text-sm text-gray-500 mb-1">検査内容</p>
                        <p className="text-lg font-medium text-gray-900">
                          {patientInfo.examinations.join(', ')}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* 案内メッセージ */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                  <p className="text-blue-900 font-medium">
                    🔊 {patientInfo.examinations.length > 0 ? '検査がある場合は' : ''}
                    <strong className="text-blue-700">{patientInfo.department}</strong>前に、
                    {patientInfo.examinations.length === 0 && ''}
                    無い場合は
                    <strong className="text-blue-700">{patientInfo.waitingArea}</strong>前に
                    お越しください。
                    <strong className="text-blue-700">{patientInfo.doctor}</strong>先生が担当します。
                  </p>
                </div>

                {/* ボタン */}
                <div className="flex gap-4 mt-6">
                  <button
                    onClick={handleClose}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                  >
                    次の患者
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                  >
                    🖨 診察票を印刷
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* エラー表示 */}
        {error && (
          <div className="max-w-2xl mx-auto p-4 bg-red-50 border border-red-200 rounded-lg mt-8">
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
