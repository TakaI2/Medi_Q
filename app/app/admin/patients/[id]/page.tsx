'use client';

import { useEffect, useState, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import QRCode from 'qrcode';
import { APP_NAME } from '@/config/constants';
import { Patient, ApiResponse } from '@/types';

export default function PatientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  // 編集フォームデータ
  const [editName, setEditName] = useState('');
  const [editNameKana, setEditNameKana] = useState('');

  // 患者情報取得
  const fetchPatient = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/patients/${id}`);
      const data: ApiResponse<Patient> = await res.json();

      if (data.success && data.data) {
        setPatient(data.data);
        setEditName(data.data.name);
        setEditNameKana(data.data.nameKana);

        // QRコード生成
        const qrUrl = await QRCode.toDataURL(data.data.patientCode, {
          width: 200,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#ffffff',
          },
        });
        setQrCodeUrl(qrUrl);
      } else {
        setError('患者が見つかりません');
      }
    } catch (err) {
      console.error('Failed to fetch patient:', err);
      setError('患者情報の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [id]);

  // 初期化
  useEffect(() => {
    const init = async () => {
      try {
        const sessionRes = await fetch('/api/auth/session');
        const sessionData = await sessionRes.json();

        if (!sessionData.success || !sessionData.authenticated) {
          router.push('/admin/login');
          return;
        }

        await fetchPatient();
      } catch {
        router.push('/admin/login');
      }
    };

    init();
  }, [router, fetchPatient]);

  // 編集保存
  const handleSave = async () => {
    if (!patient) return;
    setError(null);

    if (!editName || !editNameKana) {
      setError('氏名とふりがなは必須です');
      return;
    }

    setSaving(true);

    try {
      const res = await fetch(`/api/patients/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName,
          nameKana: editNameKana,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setPatient(data.data);
        setEditing(false);
      } else {
        setError(data.error?.message || '保存に失敗しました');
      }
    } catch {
      setError('保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  // 編集キャンセル
  const handleCancel = () => {
    if (patient) {
      setEditName(patient.name);
      setEditNameKana(patient.nameKana);
    }
    setEditing(false);
    setError(null);
  };

  // QRコードダウンロード
  const handleDownloadQR = () => {
    if (!qrCodeUrl || !patient) return;

    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = `QR_${patient.patientCode}.png`;
    link.click();
  };

  // QRコード印刷
  const handlePrintQR = () => {
    if (!qrCodeUrl || !patient) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>診察券 - ${patient.name}</title>
          <style>
            body {
              font-family: 'Hiragino Sans', 'Meiryo', sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              padding: 20px;
            }
            .card {
              border: 2px solid #333;
              border-radius: 12px;
              padding: 24px;
              text-align: center;
              max-width: 300px;
            }
            .title {
              font-size: 18px;
              font-weight: bold;
              margin-bottom: 16px;
              color: #333;
            }
            .qr-code {
              margin: 16px 0;
            }
            .qr-code img {
              width: 150px;
              height: 150px;
            }
            .patient-code {
              font-family: monospace;
              font-size: 20px;
              font-weight: bold;
              margin: 8px 0;
            }
            .patient-name {
              font-size: 16px;
              color: #666;
            }
            @media print {
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="title">${APP_NAME} 診察券</div>
            <div class="qr-code">
              <img src="${qrCodeUrl}" alt="QR Code" />
            </div>
            <div class="patient-code">${patient.patientCode}</div>
            <div class="patient-name">${patient.name} 様</div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() { window.close(); };
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">{error || '患者が見つかりません'}</p>
          <a href="/admin/patients" className="text-blue-600 hover:text-blue-800">
            ← 患者一覧に戻る
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <a href="/admin/patients" className="text-gray-500 hover:text-gray-700">
              ← 戻る
            </a>
            <div>
              <h1 className="text-2xl font-bold text-blue-600">{APP_NAME}</h1>
              <p className="text-sm text-gray-500">患者詳細</p>
            </div>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-4xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 左側: 患者情報 */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-gray-900">患者情報</h2>
                {!editing && (
                  <button
                    onClick={() => setEditing(true)}
                    className="px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    編集
                  </button>
                )}
              </div>

              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                  {error}
                </div>
              )}

              {editing ? (
                /* 編集モード */
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      患者コード
                    </label>
                    <p className="px-4 py-2 bg-gray-100 rounded-lg font-mono text-gray-600">
                      {patient.patientCode}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      患者コードは変更できません
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      氏名 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ふりがな <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={editNameKana}
                      onChange={(e) => setEditNameKana(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400"
                    >
                      {saving ? '保存中...' : '保存'}
                    </button>
                    <button
                      onClick={handleCancel}
                      className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      キャンセル
                    </button>
                  </div>
                </div>
              ) : (
                /* 表示モード */
                <div className="space-y-4">
                  <div>
                    <span className="text-sm text-gray-500">患者コード</span>
                    <p className="font-mono text-lg font-medium">{patient.patientCode}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">氏名</span>
                    <p className="text-lg font-medium">{patient.name}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">ふりがな</span>
                    <p className="text-lg">{patient.nameKana}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">登録日</span>
                    <p>{new Date(patient.createdAt).toLocaleString('ja-JP')}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">最終更新</span>
                    <p>{new Date(patient.updatedAt).toLocaleString('ja-JP')}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 右側: QRコード */}
          <div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">診察券QRコード</h2>

              <div className="flex flex-col items-center">
                {qrCodeUrl && (
                  <div className="border-2 border-gray-200 rounded-lg p-4 mb-4">
                    <img src={qrCodeUrl} alt="QR Code" className="w-40 h-40" />
                  </div>
                )}

                <p className="text-center font-mono text-lg font-bold mb-4">
                  {patient.patientCode}
                </p>

                <div className="w-full space-y-2">
                  <button
                    onClick={handleDownloadQR}
                    className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                  >
                    ダウンロード
                  </button>
                  <button
                    onClick={handlePrintQR}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    印刷
                  </button>
                </div>
              </div>
            </div>

            {/* 予約を作成リンク */}
            <div className="mt-4">
              <a
                href={`/admin/schedules/new?patientId=${patient.id}`}
                className="block w-full px-4 py-3 bg-green-600 text-white text-center rounded-lg hover:bg-green-700 transition-colors"
              >
                この患者の予約を作成
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
