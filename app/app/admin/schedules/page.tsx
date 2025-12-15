'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, dateFnsLocalizer, View, SlotInfo } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, startOfMonth, endOfMonth, addDays, subDays } from 'date-fns';
import { ja } from 'date-fns/locale';
import { APP_NAME } from '@/config/constants';
import { Schedule, ApiResponse } from '@/types';
import 'react-big-calendar/lib/css/react-big-calendar.css';

// date-fns localizer設定
const locales = { ja };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 0 }),
  getDay,
  locales,
});

// カレンダーイベント型
interface CalendarEvent {
  id: number;
  title: string;
  start: Date;
  end: Date;
  resource: Schedule;
}

// ステータス色マッピング
const statusColors: Record<string, string> = {
  scheduled: '#3b82f6', // blue
  visited: '#22c55e',   // green
  cancelled: '#9ca3af', // gray
};

export default function SchedulesPage() {
  const router = useRouter();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<View>('month');
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);

  // スケジュール取得
  const fetchSchedules = useCallback(async (date: Date) => {
    try {
      setLoading(true);
      // 現在の月の前後1週間を含めて取得
      const start = subDays(startOfMonth(date), 7);
      const end = addDays(endOfMonth(date), 7);

      const params = new URLSearchParams({
        startDate: format(start, 'yyyy-MM-dd'),
        endDate: format(end, 'yyyy-MM-dd'),
      });

      const response = await fetch(`/api/schedules?${params}`);
      const data: ApiResponse<Schedule[]> = await response.json();

      if (data.success && data.data) {
        setSchedules(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch schedules:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // 認証チェック & データ取得
  useEffect(() => {
    const init = async () => {
      try {
        const sessionRes = await fetch('/api/auth/session');
        const sessionData = await sessionRes.json();

        if (!sessionData.success || !sessionData.authenticated) {
          router.push('/admin/login');
          return;
        }

        await fetchSchedules(currentDate);
      } catch {
        router.push('/admin/login');
      }
    };

    init();
  }, [router, fetchSchedules, currentDate]);

  // カレンダーイベントに変換
  const events: CalendarEvent[] = useMemo(() => {
    return schedules.map((schedule) => {
      const dateStr = schedule.date.split('T')[0];
      const [hours, minutes] = schedule.startTime.split(':').map(Number);
      const start = new Date(dateStr);
      start.setHours(hours, minutes, 0, 0);

      let end: Date;
      if (schedule.endTime) {
        const [endHours, endMinutes] = schedule.endTime.split(':').map(Number);
        end = new Date(dateStr);
        end.setHours(endHours, endMinutes, 0, 0);
      } else {
        end = new Date(start);
        end.setMinutes(end.getMinutes() + 30);
      }

      return {
        id: schedule.id,
        title: `${schedule.patient?.name || '患者'} - ${schedule.department?.name || ''}`,
        start,
        end,
        resource: schedule,
      };
    });
  }, [schedules]);

  // イベントスタイル
  const eventStyleGetter = useCallback((event: CalendarEvent) => {
    const status = event.resource.status;
    return {
      style: {
        backgroundColor: statusColors[status] || statusColors.scheduled,
        borderRadius: '4px',
        opacity: status === 'cancelled' ? 0.6 : 1,
        color: 'white',
        border: 'none',
        fontSize: '12px',
      },
    };
  }, []);

  // イベントクリック
  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    setSelectedSchedule(event.resource);
  }, []);

  // スロットクリック（新規予約）
  const handleSelectSlot = useCallback((slotInfo: SlotInfo) => {
    const dateStr = format(slotInfo.start, 'yyyy-MM-dd');
    router.push(`/admin/schedules/new?date=${dateStr}`);
  }, [router]);

  // 日付変更
  const handleNavigate = useCallback((date: Date) => {
    setCurrentDate(date);
  }, []);

  // ビュー変更
  const handleViewChange = useCallback((newView: View) => {
    setView(newView);
  }, []);

  // モーダルを閉じる
  const closeModal = useCallback(() => {
    setSelectedSchedule(null);
  }, []);

  // ステータスラベル
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'scheduled': return '予約済み';
      case 'visited': return '来院済み';
      case 'cancelled': return 'キャンセル';
      default: return status;
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
                <p className="text-sm text-gray-500">予約管理</p>
              </div>
            </div>
            <a
              href="/admin/schedules/new"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              新規予約
            </a>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* 凡例 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
          <div className="flex items-center gap-6 text-sm">
            <span className="text-gray-600">凡例:</span>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded" style={{ backgroundColor: statusColors.scheduled }} />
              <span>予約済み</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded" style={{ backgroundColor: statusColors.visited }} />
              <span>来院済み</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded opacity-60" style={{ backgroundColor: statusColors.cancelled }} />
              <span>キャンセル</span>
            </div>
          </div>
        </div>

        {/* カレンダー */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          {loading ? (
            <div className="h-[600px] flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              style={{ height: 600 }}
              view={view}
              onView={handleViewChange}
              date={currentDate}
              onNavigate={handleNavigate}
              onSelectEvent={handleSelectEvent}
              onSelectSlot={handleSelectSlot}
              selectable
              eventPropGetter={eventStyleGetter}
              messages={{
                today: '今日',
                previous: '前へ',
                next: '次へ',
                month: '月',
                week: '週',
                day: '日',
                agenda: '一覧',
                noEventsInRange: 'この期間に予約はありません',
              }}
              formats={{
                monthHeaderFormat: (date: Date) => format(date, 'yyyy年M月', { locale: ja }),
                weekdayFormat: (date: Date) => format(date, 'E', { locale: ja }),
                dayHeaderFormat: (date: Date) => format(date, 'M月d日(E)', { locale: ja }),
                dayRangeHeaderFormat: ({ start, end }: { start: Date; end: Date }) =>
                  `${format(start, 'M月d日', { locale: ja })} - ${format(end, 'M月d日', { locale: ja })}`,
              }}
            />
          )}
        </div>
      </main>

      {/* 詳細モーダル */}
      {selectedSchedule && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">予約詳細</h3>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <span className="text-sm text-gray-500">患者名</span>
                  <p className="font-medium">{selectedSchedule.patient?.name || '-'}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">日時</span>
                  <p className="font-medium">
                    {format(new Date(selectedSchedule.date), 'yyyy年M月d日', { locale: ja })}
                    {' '}
                    {selectedSchedule.startTime}
                    {selectedSchedule.endTime && ` - ${selectedSchedule.endTime}`}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">診察科</span>
                  <p className="font-medium">{selectedSchedule.department?.name || '-'}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">担当医</span>
                  <p className="font-medium">{selectedSchedule.doctor?.name || '-'}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">待機場所</span>
                  <p className="font-medium">{selectedSchedule.waitingArea?.name || '-'}</p>
                </div>
                {selectedSchedule.examinations && selectedSchedule.examinations.length > 0 && (
                  <div>
                    <span className="text-sm text-gray-500">検査項目</span>
                    <p className="font-medium">
                      {selectedSchedule.examinations.map((e) => e.name).join(', ')}
                    </p>
                  </div>
                )}
                <div>
                  <span className="text-sm text-gray-500">ステータス</span>
                  <p className="font-medium">
                    <span
                      className="inline-block px-2 py-1 rounded text-white text-sm"
                      style={{
                        backgroundColor: statusColors[selectedSchedule.status],
                        opacity: selectedSchedule.status === 'cancelled' ? 0.6 : 1,
                      }}
                    >
                      {getStatusLabel(selectedSchedule.status)}
                    </span>
                  </p>
                </div>
                {selectedSchedule.note && (
                  <div>
                    <span className="text-sm text-gray-500">メモ</span>
                    <p className="font-medium">{selectedSchedule.note}</p>
                  </div>
                )}
              </div>

              <div className="mt-6 flex gap-3">
                <a
                  href={`/admin/schedules/${selectedSchedule.id}`}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white text-center rounded-lg hover:bg-blue-700 transition-colors"
                >
                  編集
                </a>
                <button
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  閉じる
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
