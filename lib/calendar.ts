import { google } from 'googleapis';
import { CalendarEvent, PatientInfo } from '@/types';
import { GOOGLE_CALENDAR_ID, CALENDAR_COLORS } from '@/config/constants';

// Google Calendar APIクライアントの初期化
function getCalendarClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/calendar'],
  });

  return google.calendar({ version: 'v3', auth });
}

/**
 * 患者IDから診察予定を検索
 * @param patientId 患者ID（例: P12345）
 * @param date 検索日（YYYY-MM-DD形式）
 * @returns 患者情報
 */
export async function searchPatientByIdAndDate(
  patientId: string,
  date: string
): Promise<PatientInfo | null> {
  try {
    const calendar = getCalendarClient();

    // 日付の開始・終了時刻を設定
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // カレンダーからイベントを取得
    const response = await calendar.events.list({
      calendarId: GOOGLE_CALENDAR_ID || process.env.GOOGLE_CALENDAR_ID,
      timeMin: startOfDay.toISOString(),
      timeMax: endOfDay.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    });

    const events = response.data.items || [];

    // 患者IDに一致するイベントを検索
    const targetEvent = events.find((event) => {
      // extendedPropertiesから患者IDを取得
      const eventPatientId =
        event.extendedProperties?.private?.patientId;

      // または説明文から患者IDを抽出
      const descriptionMatch = event.description?.match(
        /患者ID:\s*([A-Z]\d+)/i
      );
      const descriptionPatientId = descriptionMatch
        ? descriptionMatch[1]
        : null;

      return eventPatientId === patientId || descriptionPatientId === patientId;
    });

    if (!targetEvent) {
      return null;
    }

    // CalendarEventからPatientInfoに変換
    return convertEventToPatientInfo(targetEvent as CalendarEvent);
  } catch (error) {
    console.error('Error searching patient:', error);
    throw error;
  }
}

/**
 * CalendarEventをPatientInfoに変換
 */
function convertEventToPatientInfo(event: CalendarEvent): PatientInfo {
  const props = event.extendedProperties?.private;

  // 患者名の抽出（イベントタイトルまたはextendedProperties）
  const patientName =
    props?.patientName || extractPatientNameFromSummary(event.summary);

  // 検査内容の抽出
  const examinationsStr = props?.examinations || '';
  const examinations = examinationsStr
    ? examinationsStr.split(',').map((e) => e.trim())
    : [];

  return {
    patientId: props?.patientId || '',
    patientName,
    examDate: event.start.dateTime,
    examinations,
    doctor: props?.doctor || '',
    department: props?.department || '',
    waitingArea: props?.waitingArea || '',
    eventId: event.id,
  };
}

/**
 * イベントタイトルから患者名を抽出
 * 例: "山田太郎 様 - 定期健診" → "山田太郎"
 */
function extractPatientNameFromSummary(summary: string): string {
  const match = summary.match(/^(.+?)\s*様/);
  return match ? match[1].trim() : summary;
}

/**
 * 来院通知を送信（イベントの色を変更し、来院時刻を追記）
 * @param eventId カレンダーイベントID
 * @param visitTime 来院時刻（ISO 8601形式）
 */
export async function notifyArrival(
  eventId: string,
  visitTime: string
): Promise<void> {
  try {
    const calendar = getCalendarClient();

    // 既存のイベントを取得
    const event = await calendar.events.get({
      calendarId: GOOGLE_CALENDAR_ID || process.env.GOOGLE_CALENDAR_ID,
      eventId,
    });

    if (!event.data) {
      throw new Error('Event not found');
    }

    // イベントを更新
    await calendar.events.patch({
      calendarId: GOOGLE_CALENDAR_ID || process.env.GOOGLE_CALENDAR_ID,
      eventId,
      requestBody: {
        // 色を変更（来院済み = 緑）
        colorId: CALENDAR_COLORS.AFTER_VISIT,

        // 説明欄に来院時刻を追記
        description: `${event.data.description || ''}\n\n✅ 来院時刻: ${new Date(
          visitTime
        ).toLocaleString('ja-JP', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        })}`,

        // extendedPropertiesを更新
        extendedProperties: {
          private: {
            ...event.data.extendedProperties?.private,
            visited: 'true',
            visitTime,
          },
        },
      },
    });
  } catch (error) {
    console.error('Error notifying arrival:', error);
    throw error;
  }
}

/**
 * テスト用：カレンダーイベントを作成
 * （開発・テスト時のみ使用）
 */
export async function createTestEvent(patientInfo: PatientInfo): Promise<string> {
  try {
    const calendar = getCalendarClient();

    const response = await calendar.events.insert({
      calendarId: GOOGLE_CALENDAR_ID || process.env.GOOGLE_CALENDAR_ID,
      requestBody: {
        summary: `${patientInfo.patientName} 様 - 診察`,
        description: `患者ID: ${patientInfo.patientId}\n検査内容: ${patientInfo.examinations.join(', ')}`,
        start: {
          dateTime: patientInfo.examDate,
          timeZone: 'Asia/Tokyo',
        },
        end: {
          dateTime: new Date(
            new Date(patientInfo.examDate).getTime() + 60 * 60 * 1000
          ).toISOString(), // 1時間後
          timeZone: 'Asia/Tokyo',
        },
        colorId: CALENDAR_COLORS.BEFORE_VISIT,
        extendedProperties: {
          private: {
            patientId: patientInfo.patientId,
            patientName: patientInfo.patientName,
            examinations: patientInfo.examinations.join(', '),
            department: patientInfo.department,
            doctor: patientInfo.doctor,
            waitingArea: patientInfo.waitingArea,
            visited: 'false',
          },
        },
      },
    });

    return response.data.id || '';
  } catch (error) {
    console.error('Error creating test event:', error);
    throw error;
  }
}
