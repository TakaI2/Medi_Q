'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { APP_NAME } from '@/config/constants';
import { Patient, ApiResponse } from '@/types';

export default function PatientsPage() {
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Patient | null>(null);

  // 患者一覧取得
  const fetchPatients = useCallback(async (query?: string) => {
    try {
      setLoading(true);
      const url = query
        ? `/api/patients?search=${encodeURIComponent(query)}`
        : '/api/patients';
      const res = await fetch(url);
      const data: ApiResponse<Patient[]> = await res.json();

      if (data.success && data.data) {
        setPatients(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch patients:', error);
    } finally {
      setLoading(false);
    }
  }, []);

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

        await fetchPatients();
      } catch {
        router.push('/admin/login');
      }
    };

    init();
  }, [router, fetchPatients]);

  // 検索実行
  const handleSearch = useCallback(() => {
    fetchPatients(search);
  }, [fetchPatients, search]);

  // Enterキーで検索
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleSearch();
      }
    },
    [handleSearch]
  );

  // 削除実行
  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      const res = await fetch(`/api/patients/${deleteTarget.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (data.success) {
        setPatients((prev) => prev.filter((p) => p.id !== deleteTarget.id));
        setDeleteTarget(null);
      } else {
        alert(data.error?.message || '削除に失敗しました');
      }
    } catch {
      alert('削除に失敗しました');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <a href="/admin" className="text-gray-500 hover:text-gray-700">
                ← 戻る
              </a>
              <div>
                <h1 className="text-2xl font-bold text-blue-600">{APP_NAME}</h1>
                <p className="text-sm text-gray-500">患者管理</p>
              </div>
            </div>
            <a
              href="/admin/patients/new"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              新規登録
            </a>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* 検索 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="患者コード、氏名、ふりがなで検索..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              onClick={handleSearch}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              検索
            </button>
            <button
              onClick={() => {
                setSearch('');
                fetchPatients();
              }}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              クリア
            </button>
          </div>
        </div>

        {/* 患者一覧 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : patients.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-gray-500">
              患者が見つかりません
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                    患者コード
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                    氏名
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                    ふりがな
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                    登録日
                  </th>
                  <th className="px-6 py-3 text-right text-sm font-medium text-gray-700">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {patients.map((patient) => (
                  <tr key={patient.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-mono text-gray-900">
                      {patient.patientCode}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {patient.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {patient.nameKana}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(patient.createdAt).toLocaleDateString('ja-JP')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <a
                          href={`/admin/patients/${patient.id}`}
                          className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                        >
                          詳細
                        </a>
                        <button
                          onClick={() => setDeleteTarget(patient)}
                          className="px-3 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                        >
                          削除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* 件数表示 */}
        {!loading && patients.length > 0 && (
          <div className="mt-4 text-sm text-gray-600 text-right">
            {patients.length} 件表示
          </div>
        )}
      </main>

      {/* 削除確認モーダル */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">削除確認</h3>
            <p className="text-gray-600 mb-6">
              以下の患者を削除してもよろしいですか？
              <br />
              <strong className="text-gray-900">
                {deleteTarget.name}（{deleteTarget.patientCode}）
              </strong>
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                削除する
              </button>
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
