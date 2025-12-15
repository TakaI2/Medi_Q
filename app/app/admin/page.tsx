'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { APP_NAME } from '@/config/constants';

interface User {
  id: number;
  username: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch('/api/auth/session');
        const data = await response.json();

        if (data.success && data.authenticated) {
          setUser(data.user);
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

        {/* 案内メッセージ */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-bold text-blue-900 mb-2">Phase 2: 基盤構築完了</h3>
          <p className="text-blue-800 text-sm">
            認証機能が実装されました。次のフェーズで患者管理、予約管理、マスタ管理の各画面を実装します。
          </p>
        </div>

        {/* 受付画面リンク */}
        <div className="mt-8 text-center">
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
