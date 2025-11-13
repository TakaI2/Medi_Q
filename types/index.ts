// 患者情報
export interface PatientInfo {
  patientId: string;
  patientName: string;
  examDate: string; // ISO 8601形式
  examinations: string[];
  doctor: string;
  department: string;
  waitingArea: string;
  eventId?: string; // Googleカレンダーイベント ID
}

// QRコードデータ
export interface QRCodeData {
  type?: string;
  id: string;
  issued?: string;
}

// Googleカレンダーイベント
export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone?: string;
  };
  end: {
    dateTime: string;
    timeZone?: string;
  };
  extendedProperties?: {
    private?: {
      patientId?: string;
      patientName?: string;
      examinations?: string;
      department?: string;
      doctor?: string;
      waitingArea?: string;
      visited?: string;
    };
  };
  colorId?: string;
}

// API レスポンス型
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

// カレンダー検索 API リクエスト
export interface CalendarSearchRequest {
  patientId: string;
  date: string; // YYYY-MM-DD
}

// カレンダー検索 API レスポンス
export type CalendarSearchResponse = ApiResponse<PatientInfo>;

// 来院通知 API リクエスト
export interface CalendarNotifyRequest {
  eventId: string;
  visitTime: string; // ISO 8601形式
}

// 来院通知 API レスポンス
export interface CalendarNotifyResponse extends ApiResponse<null> {
  message?: string;
}

// 音声合成 API リクエスト
export interface VoiceSynthesizeRequest {
  text: string;
  speaker?: number; // VOICEVOX のスピーカー ID (デフォルト: 1)
}

// 音声テンプレート
export interface VoiceTemplate {
  welcome: string;
  guidance: string;
  closing: string;
}

// エラーコード
export enum ErrorCode {
  NOT_FOUND = 'NOT_FOUND',
  INVALID_QR_CODE = 'INVALID_QR_CODE',
  CALENDAR_ERROR = 'CALENDAR_ERROR',
  VOICE_ERROR = 'VOICE_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

// アプリケーション設定
export interface AppConfig {
  appName: string;
  autoClearSeconds: number;
  voicevoxApiUrl: string;
  googleCalendarId: string;
}
