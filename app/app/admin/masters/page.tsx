'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { APP_NAME } from '@/config/constants';

interface Department {
  id: number;
  name: string;
}

interface Doctor {
  id: number;
  name: string;
  departmentId: number;
  department?: Department;
}

interface WaitingArea {
  id: number;
  name: string;
}

interface Examination {
  id: number;
  name: string;
}

interface MastersData {
  departments: Department[];
  doctors: Doctor[];
  waitingAreas: WaitingArea[];
  examinations: Examination[];
}

export default function MastersPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [masters, setMasters] = useState<MastersData>({
    departments: [],
    doctors: [],
    waitingAreas: [],
    examinations: [],
  });

  useEffect(() => {
    const init = async () => {
      try {
        const sessionRes = await fetch('/api/auth/session');
        const sessionData = await sessionRes.json();

        if (!sessionData.success || !sessionData.authenticated) {
          router.push('/admin/login');
          return;
        }

        const res = await fetch('/api/masters');
        const data = await res.json();

        if (data.success) {
          setMasters(data.data);
        }
      } catch {
        router.push('/admin/login');
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [router]);

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
          <div className="flex items-center gap-4">
            <a href="/admin" className="text-gray-500 hover:text-gray-700">
              ← 戻る
            </a>
            <div>
              <h1 className="text-2xl font-bold text-blue-600">{APP_NAME}</h1>
              <p className="text-sm text-gray-500">マスタ管理</p>
            </div>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 診察科マスタ */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">診察科</h2>
              <span className="text-sm text-gray-500">
                {masters.departments.length}件
              </span>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {masters.departments.map((dept) => (
                <div
                  key={dept.id}
                  className="px-4 py-2 bg-gray-50 rounded-lg text-gray-700"
                >
                  {dept.name}
                </div>
              ))}
            </div>
            <p className="mt-4 text-sm text-gray-500">
              ※ マスタの追加・編集機能は今後実装予定です
            </p>
          </div>

          {/* 担当医マスタ */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">担当医</h2>
              <span className="text-sm text-gray-500">
                {masters.doctors.length}件
              </span>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {masters.doctors.map((doctor) => (
                <div
                  key={doctor.id}
                  className="px-4 py-2 bg-gray-50 rounded-lg"
                >
                  <div className="font-medium text-gray-900">{doctor.name}</div>
                  {doctor.department && (
                    <div className="text-sm text-gray-500">
                      {doctor.department.name}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <p className="mt-4 text-sm text-gray-500">
              ※ マスタの追加・編集機能は今後実装予定です
            </p>
          </div>

          {/* 待機場所マスタ */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">待機場所</h2>
              <span className="text-sm text-gray-500">
                {masters.waitingAreas.length}件
              </span>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {masters.waitingAreas.map((area) => (
                <div
                  key={area.id}
                  className="px-4 py-2 bg-gray-50 rounded-lg text-gray-700"
                >
                  {area.name}
                </div>
              ))}
            </div>
            <p className="mt-4 text-sm text-gray-500">
              ※ マスタの追加・編集機能は今後実装予定です
            </p>
          </div>

          {/* 検査項目マスタ */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">検査項目</h2>
              <span className="text-sm text-gray-500">
                {masters.examinations.length}件
              </span>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {masters.examinations.map((exam) => (
                <div
                  key={exam.id}
                  className="px-4 py-2 bg-gray-50 rounded-lg text-gray-700"
                >
                  {exam.name}
                </div>
              ))}
            </div>
            <p className="mt-4 text-sm text-gray-500">
              ※ マスタの追加・編集機能は今後実装予定です
            </p>
          </div>
        </div>

        {/* 注意書き */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>📝 開発状況:</strong> 現在はマスタデータの閲覧のみ可能です。追加・編集・削除機能は今後のバージョンで実装予定です。
            マスタデータの変更が必要な場合は、データベースを直接編集するか、シードデータを更新してください。
          </p>
        </div>
      </main>
    </div>
  );
}
