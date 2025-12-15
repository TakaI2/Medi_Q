'use client';

import { useState, useEffect, useRef } from 'react';
import QRReader from '@/components/QRReader';
import { PatientInfo } from '@/types';
import { APP_NAME } from '@/config/constants';
import { generateVoiceText } from '@/lib/voice';

export default function Home() {
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [patientInfo, setPatientInfo] = useState<PatientInfo | null>(null);
  const [voiceText, setVoiceText] = useState<string>('');
  const [voiceAvailable, setVoiceAvailable] = useState<boolean>(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null); // 合成済み音声URL

  // VOICEVOX Engineの状態確認
  useEffect(() => {
    const checkVoiceEngine = async () => {
      try {
        const response = await fetch('/api/voice/synthesize');
        const data = await response.json();
        setVoiceAvailable(data.success && data.data?.available);
      } catch {
        setVoiceAvailable(false);
      }
    };
    checkVoiceEngine();
  }, []);

  // 患者情報が表示されたら音声テキストを生成し、音声合成（一度だけ実行）
  const synthesizingRef = useRef<boolean>(false);
  useEffect(() => {
    const synthesizeVoiceAudio = async () => {
      if (!patientInfo || !voiceAvailable) return;

      // 既に音声合成中の場合は実行しない
      if (synthesizingRef.current) {
        console.log('⚠️ Already synthesizing, skipping...');
        return;
      }

      // 患者IDをキーとして、同じ患者の音声を二重に合成しないようにする
      const patientKey = `${patientInfo.patientId}-${patientInfo.examDate}`;
      const lastPatientKey = sessionStorage.getItem('lastPatientKey');

      if (lastPatientKey === patientKey) {
        console.log('⚠️ Same patient, skipping voice synthesis...');
        return;
      }

      sessionStorage.setItem('lastPatientKey', patientKey);
      synthesizingRef.current = true;

      const text = generateVoiceText(
        patientInfo.patientName,
        patientInfo.department,
        patientInfo.doctor,
        patientInfo.waitingArea,
        patientInfo.examinations
      );
      setVoiceText(text);

      // 既存の音声URLをクリーンアップ
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
        setAudioUrl(null);
      }

      try {
        console.log('🎵 Synthesizing voice once...');
        const response = await fetch('/api/voice/synthesize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, speaker: 3 }),
        });

        if (response.ok) {
          const audioBlob = await response.blob();
          const url = URL.createObjectURL(audioBlob);
          setAudioUrl(url);
          console.log('✅ Voice synthesis complete');
        }
      } catch (err) {
        console.error('❌ Voice synthesis failed:', err);
      } finally {
        synthesizingRef.current = false;
      }
    };

    synthesizeVoiceAudio();

    // クリーンアップ
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [patientInfo, voiceAvailable]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleScan = async (patientId: string) => {
    console.log('Patient ID scanned:', patientId);
    setError('');
    setLoading(true);

    try {
      // TODO: Phase 3でSQLite APIに置き換え予定
      // 現在はモックデータモードで動作
      console.log('📝 モックデータモードで動作中（Phase 3でSQLite API実装予定）');
      await new Promise((resolve) => setTimeout(resolve, 500));

      const mockInfo: PatientInfo = {
        patientId,
        patientName: '山田太郎',
        examDate: new Date().toISOString(),
        examinations: ['血液検査', 'MRI'],
        doctor: '田中花子',
        department: '内科',
        waitingArea: '2階待合室A',
      };

      setPatientInfo(mockInfo);
      console.log('✅ モックデータ表示完了');
    } catch (err) {
      console.error('Error fetching patient info:', err);
      setError('データ取得エラーが発生しました');
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
    setAudioUrl(null);
    sessionStorage.removeItem('lastPatientKey'); // 次の患者用にキーをクリア
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

                {/* 音声案内 */}
                {voiceAvailable && voiceText && audioUrl && (
                  <div className="mt-4">
                    <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                          🔊
                        </div>
                        <div className="flex-1">
                          <p className="text-lg text-gray-800">{voiceText}</p>
                        </div>
                      </div>
                    </div>
                    <audio
                      key={patientInfo.patientId + patientInfo.examDate}
                      src={audioUrl}
                      autoPlay
                      onPlay={() => console.log('🔊 Audio playing')}
                      onEnded={() => console.log('✅ Audio ended')}
                    />
                  </div>
                )}
                {!voiceAvailable && (
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
                )}

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
                <span className="text-2xl">🗄️</span>
                <div>
                  <p className="text-xs text-gray-500">データベース</p>
                  <p className="font-medium text-yellow-600">モックモード</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <span className="text-2xl">🔊</span>
                <div>
                  <p className="text-xs text-gray-500">音声</p>
                  <p className={`font-medium ${voiceAvailable ? 'text-green-600' : 'text-gray-500'}`}>
                    {voiceAvailable ? '利用可能' : '未起動'}
                  </p>
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
