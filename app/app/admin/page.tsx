'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { APP_NAME } from '@/config/constants';
import { ApiResponse } from '@/types';

interface User {
  id: number;
  username: string;
}

interface Department {
  id: number;
  name: string;
}

interface Doctor {
  id: number;
  name: string;
}

interface Patient {
  id: number;
  patientCode: string;
  name: string;
  nameKana: string;
}

interface Schedule {
  id: number;
  date: string;
  time: string;
  status: 'scheduled' | 'visited' | 'in_progress' | 'completed' | 'cancelled';
  patient: Patient;
  department: Department;
  doctor: Doctor;
}

interface VisitSummary {
  total: number;
  scheduled: number;
  visited: number;
  inProgress: number;
  completed: number;
  cancelled: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [todaySchedules, setTodaySchedules] = useState<Schedule[]>([]);
  const [summary, setSummary] = useState<VisitSummary>({
    total: 0,
    scheduled: 0,
    visited: 0,
    inProgress: 0,
    completed: 0,
    cancelled: 0,
  });

  // 本日の予約を取得
  const fetchTodaySchedules = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const res = await fetch(`/api/schedules?startDate=${today}&endDate=${today}`);
      const data: ApiResponse<Schedule[]> = await res.json();

      if (data.success && data.data) {
        const schedules = data.data;
        setTodaySchedules(schedules);

        // サマリーを計算
        const newSummary: VisitSummary = {
          total: schedules.length,
          scheduled: schedules.filter(s => s.status === 'scheduled').length,
          visited: schedules.filter(s => s.status === 'visited').length,
          inProgress: schedules.filter(s => s.status === 'in_progress').length,
          completed: schedules.filter(s => s.status === 'completed').length,
          cancelled: schedules.filter(s => s.status === 'cancelled').length,
        };
        setSummary(newSummary);
      }
    } catch (err) {
      console.error('Failed to fetch today schedules:', err);
    }
  };

  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch('/api/auth/session');
        const data = await response.json();

        if (data.success && data.authenticated) {
          setUser(data.user);
          await fetchTodaySchedules();
        } else {
          router.push('/admin/login');
        }
      } catch {
        router.push('/admin/login');
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // 30秒ごとに予約データを再取得
    const interval = setInterval(() => {
      fetchTodaySchedules();
    }, 30000);

    return () => clearInterval(interval);
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/admin/login');
      router.refresh();
    } catch {
      console.error('Logout failed');
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
            <div>
              <h1 className="text-2xl font-bold text-blue-600">{APP_NAME}</h1>
              <p className="text-sm text-gray-500">管理画面</p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                ログイン中: <strong>{user?.username}</strong>
              </span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                ログアウト
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6">ダッシュボード</h2>

        {/* 来院状況サマリー */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-sm text-gray-500 mb-1">本日の予約</div>
            <div className="text-2xl font-bold text-gray-900">{summary.total}件</div>
          </div>
          <div className="bg-blue-50 rounded-lg shadow-sm border border-blue-200 p-4">
            <div className="text-sm text-blue-600 mb-1">予約済み</div>
            <div className="text-2xl font-bold text-blue-700">{summary.scheduled}件</div>
          </div>
          <div className="bg-green-50 rounded-lg shadow-sm border border-green-200 p-4">
            <div className="text-sm text-green-600 mb-1">来院済み</div>
            <div className="text-2xl font-bold text-green-700">{summary.visited}件</div>
          </div>
          <div className="bg-yellow-50 rounded-lg shadow-sm border border-yellow-200 p-4">
            <div className="text-sm text-yellow-600 mb-1">診察中</div>
            <div className="text-2xl font-bold text-yellow-700">{summary.inProgress}件</div>
          </div>
          <div className="bg-gray-50 rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-sm text-gray-500 mb-1">診察完了</div>
            <div className="text-2xl font-bold text-gray-700">{summary.completed}件</div>
          </div>
          <div className="bg-red-50 rounded-lg shadow-sm border border-red-200 p-4">
            <div className="text-sm text-red-600 mb-1">キャンセル</div>
            <div className="text-2xl font-bold text-red-700">{summary.cancelled}件</div>
          </div>
        </div>

        {/* クイックアクション */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <a
            href="/admin/patients"
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="text-3xl mb-2">👤</div>
            <h3 className="font-bold text-gray-900">患者管理</h3>
            <p className="text-sm text-gray-500">患者情報の登録・編集</p>
          </a>

          <a
            href="/admin/schedules"
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="text-3xl mb-2">📅</div>
            <h3 className="font-bold text-gray-900">予約管理</h3>
            <p className="text-sm text-gray-500">予約の登録・確認</p>
          </a>

          <a
            href="/admin/masters"
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="text-3xl mb-2">⚙️</div>
            <h3 className="font-bold text-gray-900">マスタ管理</h3>
            <p className="text-sm text-gray-500">診察科・担当医など</p>
          </a>

          <a
            href="/admin/settings"
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="text-3xl mb-2">🔧</div>
            <h3 className="font-bold text-gray-900">設定</h3>
            <p className="text-sm text-gray-500">パスワード変更など</p>
          </a>
        </div>

        {/* 本日の予約一覧 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">本日の予約一覧</h3>
              <a
                href="/admin/schedules"
                className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
              >
                すべて表示 →
              </a>
            </div>

            {todaySchedules.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                本日の予約はありません
              </div>
            ) : (
              <div className="space-y-2">
                {todaySchedules.map((schedule) => {
                  // ステータス別スタイル
                  const statusStyles = {
                    scheduled: 'bg-blue-50 border-blue-200 text-blue-700',
                    visited: 'bg-green-50 border-green-200 text-green-700',
                    in_progress: 'bg-yellow-50 border-yellow-200 text-yellow-700',
                    completed: 'bg-gray-50 border-gray-200 text-gray-500',
                    cancelled: 'bg-red-50 border-red-200 text-red-700',
                  };

                  const statusLabels = {
                    scheduled: '予約済み',
                    visited: '来院済み',
                    in_progress: '診察中',
                    completed: '完了',
                    cancelled: 'キャンセル',
                  };

                  return (
                    <a
                      key={schedule.id}
                      href={`/admin/schedules/${schedule.id}`}
                      className={`block px-4 py-3 border rounded-lg hover:shadow-md transition-shadow ${
                        statusStyles[schedule.status]
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-lg">{schedule.time}</span>
                            <span className="font-medium">{schedule.patient.name}</span>
                            <span className="text-sm">({schedule.patient.patientCode})</span>
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-sm">
                            <span>{schedule.department.name}</span>
                            <span>•</span>
                            <span>{schedule.doctor.name} 先生</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="inline-block px-3 py-1 text-xs font-medium rounded-full bg-white bg-opacity-70">
                            {statusLabels[schedule.status]}
                          </span>
                        </div>
                      </div>
                    </a>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* 受付画面リンク */}
        <div className="text-center">
          <a
            href="/"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
          >
            <span>←</span>
            <span>受付画面を開く</span>
          </a>
        </div>
      </main>
    </div>
  );
}
