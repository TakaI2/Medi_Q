'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { APP_NAME } from '@/config/constants';

export default function NewPatientPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // フォームデータ
  const [patientCode, setPatientCode] = useState('');
  const [name, setName] = useState('');
  const [nameKana, setNameKana] = useState('');

  // 認証チェック
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/session');
        const data = await res.json();

        if (!data.success || !data.authenticated) {
          router.push('/admin/login');
          return;
        }
      } catch {
        router.push('/admin/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  // フォーム送信
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!patientCode || !name || !nameKana) {
      setError('全ての項目を入力してください');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientCode,
          name,
          nameKana,
        }),
      });

      const data = await res.json();

      if (data.success) {
        router.push(`/admin/patients/${data.data.id}`);
      } else {
        setError(data.error?.message || '登録に失敗しました');
      }
    } catch {
      setError('登録に失敗しました');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <a href="/admin/patients" className="text-gray-500 hover:text-gray-700">
              ← 戻る
            </a>
            <div>
              <h1 className="text-2xl font-bold text-blue-600">{APP_NAME}</h1>
              <p className="text-sm text-gray-500">新規患者登録</p>
            </div>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-3xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          {/* 患者コード */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              患者コード <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={patientCode}
              onChange={(e) => setPatientCode(e.target.value)}
              placeholder="例: P00004"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
            />
            <p className="mt-1 text-sm text-gray-500">
              QRコードに使用される一意のコードです
            </p>
          </div>

          {/* 氏名 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              氏名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例: 田中太郎"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* ふりがな */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ふりがな <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={nameKana}
              onChange={(e) => setNameKana(e.target.value)}
              placeholder="例: たなかたろう"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="mt-1 text-sm text-gray-500">
              音声案内で使用されます
            </p>
          </div>

          {/* ボタン */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed"
            >
              {submitting ? '登録中...' : '登録する'}
            </button>
            <a
              href="/admin/patients"
              className="px-6 py-3 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors text-center"
            >
              キャンセル
            </a>
          </div>
        </form>
      </main>
    </div>
  );
}
