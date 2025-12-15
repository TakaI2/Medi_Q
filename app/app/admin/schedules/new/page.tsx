'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { format } from 'date-fns';
import { APP_NAME } from '@/config/constants';
import { Patient, ApiResponse, CreateScheduleRequest } from '@/types';

interface MasterData {
  departments: { id: number; name: string }[];
  doctors: { id: number; name: string; departmentId: number }[];
  waitingAreas: { id: number; name: string }[];
  examinations: { id: number; name: string }[];
}

function NewScheduleForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dateParam = searchParams.get('date');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // マスタデータ
  const [masters, setMasters] = useState<MasterData | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientSearch, setPatientSearch] = useState('');
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);

  // フォームデータ
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [date, setDate] = useState(dateParam || format(new Date(), 'yyyy-MM-dd'));
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('');
  const [departmentId, setDepartmentId] = useState<number | ''>('');
  const [doctorId, setDoctorId] = useState<number | ''>('');
  const [waitingAreaId, setWaitingAreaId] = useState<number | ''>('');
  const [examinationIds, setExaminationIds] = useState<number[]>([]);
  const [note, setNote] = useState('');

  // 診察科に紐づく担当医をフィルタ
  const filteredDoctors = masters?.doctors.filter(
    (d) => departmentId === '' || d.departmentId === departmentId
  ) || [];

  // 初期化
  useEffect(() => {
    const init = async () => {
      try {
        // 認証チェック
        const sessionRes = await fetch('/api/auth/session');
        const sessionData = await sessionRes.json();

        if (!sessionData.success || !sessionData.authenticated) {
          router.push('/admin/login');
          return;
        }

        // マスタデータ取得
        const mastersRes = await fetch('/api/masters');
        const mastersData: ApiResponse<MasterData> = await mastersRes.json();

        if (mastersData.success && mastersData.data) {
          setMasters(mastersData.data);
        }

        // 患者一覧取得
        const patientsRes = await fetch('/api/patients');
        const patientsData: ApiResponse<Patient[]> = await patientsRes.json();

        if (patientsData.success && patientsData.data) {
          setPatients(patientsData.data);
        }
      } catch {
        router.push('/admin/login');
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [router]);

  // 患者検索
  const searchPatients = useCallback(async (query: string) => {
    if (!query) {
      const res = await fetch('/api/patients');
      const data: ApiResponse<Patient[]> = await res.json();
      if (data.success && data.data) {
        setPatients(data.data);
      }
      return;
    }

    const res = await fetch(`/api/patients?search=${encodeURIComponent(query)}`);
    const data: ApiResponse<Patient[]> = await res.json();
    if (data.success && data.data) {
      setPatients(data.data);
    }
  }, []);

  // 患者検索入力
  const handlePatientSearchChange = useCallback((value: string) => {
    setPatientSearch(value);
    setShowPatientDropdown(true);
    searchPatients(value);
  }, [searchPatients]);

  // 患者選択
  const handleSelectPatient = useCallback((patient: Patient) => {
    setSelectedPatient(patient);
    setPatientSearch(`${patient.patientCode} - ${patient.name}`);
    setShowPatientDropdown(false);
  }, []);

  // 診察科変更時に担当医をリセット
  const handleDepartmentChange = useCallback((value: number | '') => {
    setDepartmentId(value);
    setDoctorId('');
  }, []);

  // 検査項目のトグル
  const handleExaminationToggle = useCallback((id: number) => {
    setExaminationIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  }, []);

  // フォーム送信
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedPatient) {
      setError('患者を選択してください');
      return;
    }

    if (departmentId === '' || doctorId === '' || waitingAreaId === '') {
      setError('診察科、担当医、待機場所は必須です');
      return;
    }

    setSubmitting(true);

    try {
      const requestBody: CreateScheduleRequest = {
        patientId: selectedPatient.id,
        date,
        startTime,
        endTime: endTime || undefined,
        departmentId: departmentId as number,
        doctorId: doctorId as number,
        waitingAreaId: waitingAreaId as number,
        note: note || undefined,
        examinationIds: examinationIds.length > 0 ? examinationIds : undefined,
      };

      const res = await fetch('/api/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const data = await res.json();

      if (data.success) {
        router.push('/admin/schedules');
      } else {
        setError(data.error?.message || '予約の登録に失敗しました');
      }
    } catch {
      setError('予約の登録に失敗しました');
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
            <a href="/admin/schedules" className="text-gray-500 hover:text-gray-700">
              ← 戻る
            </a>
            <div>
              <h1 className="text-2xl font-bold text-blue-600">{APP_NAME}</h1>
              <p className="text-sm text-gray-500">新規予約登録</p>
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

          {/* 患者選択 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              患者 <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={patientSearch}
                onChange={(e) => handlePatientSearchChange(e.target.value)}
                onFocus={() => setShowPatientDropdown(true)}
                placeholder="患者コードまたは氏名で検索..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {showPatientDropdown && patients.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                  {patients.map((patient) => (
                    <button
                      key={patient.id}
                      type="button"
                      onClick={() => handleSelectPatient(patient)}
                      className="w-full px-4 py-2 text-left hover:bg-gray-100 flex justify-between items-center"
                    >
                      <span className="font-medium">{patient.name}</span>
                      <span className="text-sm text-gray-500">{patient.patientCode}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {selectedPatient && (
              <p className="mt-1 text-sm text-green-600">
                選択中: {selectedPatient.name} ({selectedPatient.patientCode})
              </p>
            )}
          </div>

          {/* 日付・時間 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                予約日 <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                開始時刻 <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                終了時刻
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* 診察科・担当医・待機場所 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                診察科 <span className="text-red-500">*</span>
              </label>
              <select
                value={departmentId}
                onChange={(e) => handleDepartmentChange(e.target.value ? Number(e.target.value) : '')}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">選択してください</option>
                {masters?.departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                担当医 <span className="text-red-500">*</span>
              </label>
              <select
                value={doctorId}
                onChange={(e) => setDoctorId(e.target.value ? Number(e.target.value) : '')}
                required
                disabled={departmentId === ''}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">選択してください</option>
                {filteredDoctors.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                待機場所 <span className="text-red-500">*</span>
              </label>
              <select
                value={waitingAreaId}
                onChange={(e) => setWaitingAreaId(e.target.value ? Number(e.target.value) : '')}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">選択してください</option>
                {masters?.waitingAreas.map((area) => (
                  <option key={area.id} value={area.id}>
                    {area.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 検査項目 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              検査項目
            </label>
            <div className="flex flex-wrap gap-2">
              {masters?.examinations.map((exam) => (
                <label
                  key={exam.id}
                  className={`inline-flex items-center px-3 py-2 rounded-lg border cursor-pointer transition-colors ${
                    examinationIds.includes(exam.id)
                      ? 'bg-blue-100 border-blue-500 text-blue-700'
                      : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={examinationIds.includes(exam.id)}
                    onChange={() => handleExaminationToggle(exam.id)}
                    className="sr-only"
                  />
                  <span className="text-sm">{exam.name}</span>
                </label>
              ))}
              {masters?.examinations.length === 0 && (
                <span className="text-sm text-gray-500">検査項目が登録されていません</span>
              )}
            </div>
          </div>

          {/* メモ */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              メモ
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="任意のメモを入力..."
            />
          </div>

          {/* ボタン */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed"
            >
              {submitting ? '登録中...' : '予約を登録'}
            </button>
            <a
              href="/admin/schedules"
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

export default function NewSchedulePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <NewScheduleForm />
    </Suspense>
  );
}
