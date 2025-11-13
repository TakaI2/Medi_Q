'use client';

import { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import Link from 'next/link';

export default function TestQRPage() {
  const [patientId, setPatientId] = useState('P12345');
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  // QRコード生成
  const generateQRCode = async (id: string) => {
    try {
      const url = await QRCode.toDataURL(id, {
        width: 400,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });
      setQrCodeUrl(url);
    } catch (error) {
      console.error('QRコード生成エラー:', error);
    }
  };

  // 初回レンダリング時とpatientId変更時にQRコード生成
  useEffect(() => {
    if (patientId) {
      generateQRCode(patientId);
    }
  }, [patientId]);

  // サンプル患者データ
  const samplePatients = [
    { id: 'P12345', name: '山田太郎' },
    { id: 'P23456', name: '佐藤花子' },
    { id: 'P34567', name: '鈴木次郎' },
    { id: 'P45678', name: '高橋美咲' },
    { id: 'P56789', name: '田中一郎' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* ヘッダー */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
          >
            ← メイン画面に戻る
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🧪 QRコード生成ツール（テスト用）
          </h1>
          <p className="text-gray-600">
            患者IDを入力してQRコードを生成し、スマホで表示してカメラでスキャンできます
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 左側: 入力エリア */}
          <div className="space-y-6">
            {/* 患者ID入力 */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                患者ID入力
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    患者ID（P + 4桁以上の数字）
                  </label>
                  <input
                    type="text"
                    value={patientId}
                    onChange={(e) => setPatientId(e.target.value.toUpperCase())}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-mono"
                    placeholder="P12345"
                  />
                </div>
                <button
                  onClick={() => generateQRCode(patientId)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                >
                  QRコードを生成
                </button>
              </div>
            </div>

            {/* サンプル患者 */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                サンプル患者
              </h2>
              <div className="space-y-2">
                {samplePatients.map((patient) => (
                  <button
                    key={patient.id}
                    onClick={() => setPatientId(patient.id)}
                    className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                      patientId === patient.id
                        ? 'bg-blue-50 border-blue-500 text-blue-700'
                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <div className="font-mono font-bold">{patient.id}</div>
                    <div className="text-sm text-gray-600">{patient.name}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 使い方 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-bold text-blue-900 mb-2">📖 使い方</h3>
              <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                <li>患者IDを入力またはサンプルから選択</li>
                <li>QRコードが右側に表示されます</li>
                <li>スマホでこのページを開いてQRコードを表示</li>
                <li>PCのカメラでスキャンしてテスト</li>
              </ol>
            </div>
          </div>

          {/* 右側: QRコード表示 */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-lg border-2 border-gray-300 p-6 sticky top-8">
              <h2 className="text-lg font-bold text-gray-900 mb-4 text-center">
                生成されたQRコード
              </h2>

              {qrCodeUrl ? (
                <div className="space-y-4">
                  {/* QRコード画像 */}
                  <div className="bg-white p-6 rounded-lg border-2 border-gray-200">
                    <img
                      src={qrCodeUrl}
                      alt="QR Code"
                      className="w-full h-auto"
                    />
                  </div>

                  {/* 患者ID表示 */}
                  <div className="text-center">
                    <p className="text-sm text-gray-500 mb-1">患者ID</p>
                    <p className="text-2xl font-bold font-mono text-gray-900">
                      {patientId}
                    </p>
                  </div>

                  {/* アクション */}
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        const link = document.createElement('a');
                        link.download = `qr-${patientId}.png`;
                        link.href = qrCodeUrl;
                        link.click();
                      }}
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                    >
                      📥 QRコードをダウンロード
                    </button>

                    <button
                      onClick={() => window.print()}
                      className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                    >
                      🖨 印刷
                    </button>
                  </div>

                  {/* ヒント */}
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-xs text-yellow-800">
                      💡 <strong>ヒント:</strong> スマホでこのページを開き、このQRコードを表示して、
                      PCのカメラでスキャンできます
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-400">
                  QRコードを生成してください
                </div>
              )}
            </div>

            {/* 開発者向け情報 */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="font-bold text-gray-900 mb-2 text-sm">
                🔧 開発者向け情報
              </h3>
              <div className="text-xs text-gray-600 space-y-1">
                <p>• モックモード: 自動有効（.env.local未設定時）</p>
                <p>• 有効な形式: P + 4桁以上の数字（例: P12345）</p>
                <p>• モックデータ: 山田太郎、内科、田中花子先生</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 印刷用スタイル */}
      <style jsx>{`
        @media print {
          body {
            margin: 0;
          }
          .sticky {
            position: static !important;
          }
          @page {
            size: A4;
            margin: 20mm;
          }
        }
      `}</style>
    </div>
  );
}
