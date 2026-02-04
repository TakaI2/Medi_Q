'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { APP_NAME } from '@/config/constants';
import { ApiResponse } from '@/types';

interface Department {
  id: number;
  name: string;
}

interface Doctor {
  id: number;
  name: string;
  departmentId: number;
  department?: Department;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function DoctorsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [departmentId, setDepartmentId] = useState<number | ''>('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // データ取得
  const fetchDoctors = async () => {
    try {
      const res = await fetch('/api/masters/doctors');
      const data: ApiResponse<Doctor[]> = await res.json();

      if (data.success && data.data) {
        setDoctors(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch doctors:', err);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await fetch('/api/masters/departments');
      const data: ApiResponse<Department[]> = await res.json();

      if (data.success && data.data) {
        setDepartments(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch departments:', err);
    }
  };

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

        await Promise.all([fetchDoctors(), fetchDepartments()]);
      } catch {
        router.push('/admin/login');
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [router]);

  // 新規追加モーダルを開く
  const openAddModal = () => {
    setEditingId(null);
    setName('');
    setDepartmentId('');
    setError(null);
    setShowModal(true);
  };

  // 編集モーダルを開く
  const openEditModal = (doctor: Doctor) => {
    setEditingId(doctor.id);
    setName(doctor.name);
    setDepartmentId(doctor.departmentId);
    setError(null);
    setShowModal(true);
  };

  // モーダルを閉じる
  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setName('');
    setDepartmentId('');
    setError(null);
  };

  // 保存
  const handleSave = async () => {
    if (!name.trim()) {
      setError('担当医名を入力してください');
      return;
    }

    if (!departmentId) {
      setError('診察科を選択してください');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const url = editingId
        ? `/api/masters/doctors/${editingId}`
        : '/api/masters/doctors';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          departmentId: Number(departmentId)
        }),
      });

      const data = await res.json();

      if (data.success) {
        await fetchDoctors();
        closeModal();
      } else {
        setError(data.error?.message || '保存に失敗しました');
      }
    } catch {
      setError('保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  // 削除
  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`「${name}」を削除しますか？`)) {
      return;
    }

    try {
      const res = await fetch(`/api/masters/doctors/${id}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (data.success) {
        await fetchDoctors();
      } else {
        alert(data.error?.message || '削除に失敗しました');
      }
    } catch {
      alert('削除に失敗しました');
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
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <a href="/admin/masters" className="text-gray-500 hover:text-gray-700">
                ← 戻る
              </a>
              <div>
                <h1 className="text-2xl font-bold text-blue-600">{APP_NAME}</h1>
                <p className="text-sm text-gray-500">担当医マスタ管理</p>
              </div>
            </div>
            <button
              onClick={openAddModal}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              + 新規追加
            </button>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">担当医一覧</h2>
              <span className="text-sm text-gray-500">{doctors.length}件</span>
            </div>

            {doctors.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                担当医が登録されていません
              </div>
            ) : (
              <div className="space-y-2">
                {doctors.map((doctor) => (
                  <div
                    key={doctor.id}
                    className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div>
                      <div className="font-medium text-gray-900">{doctor.name}</div>
                      {doctor.department && (
                        <div className="text-sm text-gray-500 mt-1">
                          {doctor.department.name}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditModal(doctor)}
                        className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      >
                        編集
                      </button>
                      <button
                        onClick={() => handleDelete(doctor.id, doctor.name)}
                        className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded transition-colors"
                      >
                        削除
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* モーダル */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                {editingId ? '担当医の編集' : '担当医の新規追加'}
              </h3>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  担当医名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="例: 山田太郎"
                  autoFocus
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  診察科 <span className="text-red-500">*</span>
                </label>
                <select
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">選択してください</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400"
                >
                  {saving ? '保存中...' : '保存'}
                </button>
                <button
                  onClick={closeModal}
                  disabled={saving}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:bg-gray-300"
                >
                  キャンセル
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
