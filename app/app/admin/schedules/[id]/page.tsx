'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { APP_NAME } from '@/config/constants';
import {
  ScheduleData,
  DepartmentData,
  DoctorData,
  WaitingAreaData,
  ExaminationData,
  ApiResponse,
} from '@/types';

export default function ScheduleDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  const [schedule, setSchedule] = useState<ScheduleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // マスタデータ
  const [departments, setDepartments] = useState<DepartmentData[]>([]);
  const [doctors, setDoctors] = useState<DoctorData[]>([]);
  const [waitingAreas, setWaitingAreas] = useState<WaitingAreaData[]>([]);
  const [examinations, setExaminations] = useState<ExaminationData[]>([]);

  // 編集フォームデータ
  const [editDate, setEditDate] = useState('');
  const [editStartTime, setEditStartTime] = useState('');
  const [editEndTime, setEditEndTime] = useState('');
  const [editDepartmentId, setEditDepartmentId] = useState<number>(0);
  const [editDoctorId, setEditDoctorId] = useState<number>(0);
  const [editWaitingAreaId, setEditWaitingAreaId] = useState<number>(0);
  const [editNote, setEditNote] = useState('');
  const [editExaminationIds, setEditExaminationIds] = useState<number[]>([]);

  // マスタデータ取得
  const fetchMasters = useCallback(async () => {
    try {
      const res = await fetch('/api/masters');
      const data: ApiResponse<{
        departments: DepartmentData[];
        doctors: DoctorData[];
        waitingAreas: WaitingAreaData[];
        examinations: ExaminationData[];
      }> = await res.json();

      if (data.success && data.data) {
        setDepartments(data.data.departments);
        setDoctors(data.data.doctors);
        setWaitingAreas(data.data.waitingAreas);
        setExaminations(data.data.examinations);
      }
    } catch (err) {
      console.error('Failed to fetch masters:', err);
    }
  }, []);

  // 予約情報取得
  const fetchSchedule = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/schedules/${id}`);
      const data: ApiResponse<ScheduleData> = await res.json();

      if (data.success && data.data) {
        setSchedule(data.data);

        // 編集フォームデータ設定
        const scheduleDate = new Date(data.data.date);
        const dateStr = scheduleDate.toISOString().split('T')[0];
        setEditDate(dateStr);
        setEditStartTime(data.data.startTime);
        setEditEndTime(data.data.endTime || '');
        setEditDepartmentId(data.data.departmentId);
        setEditDoctorId(data.data.doctorId);
        setEditWaitingAreaId(data.data.waitingAreaId);
        setEditNote(data.data.note || '');
        setEditExaminationIds(data.data.examinations?.map((e) => e.id) || []);
      } else {
        setError('予約が見つかりません');
      }
    } catch (err) {
      console.error('Failed to fetch schedule:', err);
      setError('予約情報の取得に失敗しました');
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

        await fetchMasters();
        await fetchSchedule();
      } catch {
        router.push('/admin/login');
      }
    };

    init();
  }, [router, fetchMasters, fetchSchedule]);

  // 診察科に属する医師のフィルタリング
  const filteredDoctors = doctors.filter((d) => d.departmentId === editDepartmentId);

  // 編集保存
  const handleSave = async () => {
    if (!schedule) return;
    setError(null);

    if (!editDate || !editStartTime || !editDepartmentId || !editDoctorId || !editWaitingAreaId) {
      setError('必須項目を入力してください');
      return;
    }

    setSaving(true);

    try {
      const res = await fetch(`/api/schedules/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: editDate,
          startTime: editStartTime,
          endTime: editEndTime || null,
          departmentId: editDepartmentId,
          doctorId: editDoctorId,
          waitingAreaId: editWaitingAreaId,
          note: editNote || null,
          examinationIds: editExaminationIds,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setSchedule(data.data);
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
    if (schedule) {
      const scheduleDate = new Date(schedule.date);
      const dateStr = scheduleDate.toISOString().split('T')[0];
      setEditDate(dateStr);
      setEditStartTime(schedule.startTime);
      setEditEndTime(schedule.endTime || '');
      setEditDepartmentId(schedule.departmentId);
      setEditDoctorId(schedule.doctorId);
      setEditWaitingAreaId(schedule.waitingAreaId);
      setEditNote(schedule.note || '');
      setEditExaminationIds(schedule.examinations?.map((e) => e.id) || []);
    }
    setEditing(false);
    setError(null);
  };

  // 予約キャンセル
  const handleCancelSchedule = async () => {
    if (!schedule) return;

    if (!confirm('この予約をキャンセルしますか？')) {
      return;
    }

    try {
      const res = await fetch(`/api/schedules/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'cancelled',
        }),
      });

      const data = await res.json();

      if (data.success) {
        setSchedule(data.data);
      } else {
        setError(data.error?.message || 'キャンセルに失敗しました');
      }
    } catch {
      setError('キャンセルに失敗しました');
    }
  };

  // 検査項目の選択トグル
  const toggleExamination = (examinationId: number) => {
    setEditExaminationIds((prev) => {
      if (prev.includes(examinationId)) {
        return prev.filter((id) => id !== examinationId);
      } else {
        return [...prev, examinationId];
      }
    });
  };

  // ステータス表示
  const getStatusBadge = (status: string) => {
    const colors = {
      scheduled: 'bg-blue-500',
      visited: 'bg-green-500',
      cancelled: 'bg-gray-500',
    };
    const labels = {
      scheduled: '予約済み',
      visited: '来院済み',
      cancelled: 'キャンセル',
    };
    return (
      <span className={`inline-block px-3 py-1 rounded-full text-white text-sm ${colors[status as keyof typeof colors] || 'bg-gray-500'}`}>
        {labels[status as keyof typeof labels] || status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!schedule) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">{error || '予約が見つかりません'}</p>
          <a href="/admin/schedules" className="text-blue-600 hover:text-blue-800">
            ← カレンダーに戻る
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
            <a href="/admin/schedules" className="text-gray-500 hover:text-gray-700">
              ← 戻る
            </a>
            <div>
              <h1 className="text-2xl font-bold text-blue-600">{APP_NAME}</h1>
              <p className="text-sm text-gray-500">予約詳細</p>
            </div>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-4xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900">予約情報</h2>
            {!editing && schedule.status === 'scheduled' && (
              <div className="flex gap-2">
                <button
                  onClick={() => setEditing(true)}
                  className="px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  編集
                </button>
                <button
                  onClick={handleCancelSchedule}
                  className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  キャンセル
                </button>
              </div>
            )}
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          {editing ? (
            /* 編集モード */
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    予約日 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    開始時刻 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={editStartTime}
                    onChange={(e) => setEditStartTime(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    診察科 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={editDepartmentId}
                    onChange={(e) => {
                      const newDeptId = parseInt(e.target.value, 10);
                      setEditDepartmentId(newDeptId);
                      // 診察科が変わったら担当医をリセット
                      if (editDoctorId) {
                        const currentDoctor = doctors.find((d) => d.id === editDoctorId);
                        if (currentDoctor && currentDoctor.departmentId !== newDeptId) {
                          setEditDoctorId(0);
                        }
                      }
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value={0}>選択してください</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    担当医 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={editDoctorId}
                    onChange={(e) => setEditDoctorId(parseInt(e.target.value, 10))}
                    disabled={!editDepartmentId}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                  >
                    <option value={0}>選択してください</option>
                    {filteredDoctors.map((doctor) => (
                      <option key={doctor.id} value={doctor.id}>
                        {doctor.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    待機場所 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={editWaitingAreaId}
                    onChange={(e) => setEditWaitingAreaId(parseInt(e.target.value, 10))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value={0}>選択してください</option>
                    {waitingAreas.map((area) => (
                      <option key={area.id} value={area.id}>
                        {area.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    終了時刻（任意）
                  </label>
                  <input
                    type="time"
                    value={editEndTime}
                    onChange={(e) => setEditEndTime(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  検査項目（任意）
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {examinations.map((exam) => (
                    <label
                      key={exam.id}
                      className="flex items-center space-x-2 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50"
                    >
                      <input
                        type="checkbox"
                        checked={editExaminationIds.includes(exam.id)}
                        onChange={() => toggleExamination(exam.id)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm">{exam.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  メモ（任意）
                </label>
                <textarea
                  value={editNote}
                  onChange={(e) => setEditNote(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="備考やメモを入力してください"
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
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <span className="text-sm text-gray-500">患者</span>
                  <p className="text-lg font-medium">
                    <a
                      href={`/admin/patients/${schedule.patient?.id}`}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      {schedule.patient?.name || '-'}
                    </a>
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">ステータス</span>
                  <div className="mt-1">{getStatusBadge(schedule.status)}</div>
                </div>
                <div>
                  <span className="text-sm text-gray-500">予約日</span>
                  <p className="text-lg font-medium">
                    {new Date(schedule.date).toLocaleDateString('ja-JP', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      weekday: 'short',
                    })}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">時刻</span>
                  <p className="text-lg font-medium">
                    {schedule.startTime}
                    {schedule.endTime && ` 〜 ${schedule.endTime}`}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">診察科</span>
                  <p className="text-lg font-medium">{schedule.department?.name || '-'}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">担当医</span>
                  <p className="text-lg font-medium">{schedule.doctor?.name || '-'}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">待機場所</span>
                  <p className="text-lg font-medium">{schedule.waitingArea?.name || '-'}</p>
                </div>
                {schedule.examinations && schedule.examinations.length > 0 && (
                  <div>
                    <span className="text-sm text-gray-500">検査項目</span>
                    <p className="text-lg font-medium">
                      {schedule.examinations.map((e) => e.name).join(', ')}
                    </p>
                  </div>
                )}
                {schedule.note && (
                  <div className="md:col-span-2">
                    <span className="text-sm text-gray-500">メモ</span>
                    <p className="text-base whitespace-pre-wrap">{schedule.note}</p>
                  </div>
                )}
                {schedule.visitedAt && (
                  <div>
                    <span className="text-sm text-gray-500">来院日時</span>
                    <p className="text-base">
                      {new Date(schedule.visitedAt).toLocaleString('ja-JP')}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
