// 患者情報
export interface PatientInfo {
  patientId: string;
  patientName: string;
  examDate: string; // ISO 8601形式
  examinations: string[];
  doctor: string;
  department: string;
  waitingArea: string;
  scheduleId?: number; // スケジュールID（SQLite）
}

// QRコードデータ
export interface QRCodeData {
  type?: string;
  id: string;
  issued?: string;
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
  DATABASE_ERROR = 'DATABASE_ERROR',
  VOICE_ERROR = 'VOICE_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

// スケジュールステータス
export type ScheduleStatus = 'scheduled' | 'visited' | 'cancelled';

// スケジュール（DB モデル用）
export interface Schedule {
  id: number;
  patientId: number;
  date: string; // ISO 8601
  startTime: string; // HH:mm
  endTime: string | null;
  departmentId: number;
  doctorId: number;
  waitingAreaId: number;
  note: string | null;
  status: ScheduleStatus;
  visitedAt: string | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  // リレーション
  patient?: Patient;
  department?: Department;
  doctor?: Doctor;
  waitingArea?: WaitingArea;
  examinations?: ScheduleExamination[];
}

// 患者（DB モデル用）
export interface Patient {
  id: number;
  patientCode: string;
  name: string;
  nameKana: string;
  voiceTemplate: string | null;
  printTemplate: string | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  // リレーション
  schedules?: Schedule[];
}

// 診察科
export interface Department {
  id: number;
  name: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  // リレーション
  doctors?: Doctor[];
  schedules?: Schedule[];
}

// 担当医
export interface Doctor {
  id: number;
  name: string;
  departmentId: number;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  // リレーション
  department?: Department;
  schedules?: Schedule[];
}

// 待機場所
export interface WaitingArea {
  id: number;
  name: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  // リレーション
  schedules?: Schedule[];
}

// 検査項目
export interface Examination {
  id: number;
  name: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  // リレーション
  schedules?: ScheduleExamination[];
}

// 予約-検査 中間テーブル
export interface ScheduleExamination {
  id: number;
  scheduleId: number;
  examinationId: number;
  // リレーション
  schedule?: Schedule;
  examination?: Examination;
}

// 管理者
export interface Admin {
  id: number;
  username: string;
  passwordHash: string;
  createdAt: string;
  updatedAt: string;
}

// スケジュール作成リクエスト
export interface CreateScheduleRequest {
  patientId: number;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime?: string;
  departmentId: number;
  doctorId: number;
  waitingAreaId: number;
  note?: string;
  examinationIds?: number[];
}

// スケジュール更新リクエスト
export interface UpdateScheduleRequest {
  date?: string;
  startTime?: string;
  endTime?: string | null;
  departmentId?: number;
  doctorId?: number;
  waitingAreaId?: number;
  note?: string | null;
  status?: ScheduleStatus;
  examinationIds?: number[];
}

// スケジュール一覧取得クエリ
export interface ScheduleListQuery {
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  patientId?: number;
  departmentId?: number;
  doctorId?: number;
  status?: ScheduleStatus;
}

// ページネーション
export interface PaginationQuery {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// アプリケーション設定
export interface AppConfig {
  appName: string;
  autoClearSeconds: number;
  voicevoxApiUrl: string;
}

// ===== APIレスポンス用の軽量型 =====

// API レスポンス用の診察科（createdAt/updatedAt不要）
export interface DepartmentData {
  id: number;
  name: string;
  isDeleted: boolean;
}

// API レスポンス用の担当医（createdAt/updatedAt不要）
export interface DoctorData {
  id: number;
  name: string;
  departmentId: number;
  isDeleted: boolean;
  department?: DepartmentData;
}

// API レスポンス用の待機場所（createdAt/updatedAt不要）
export interface WaitingAreaData {
  id: number;
  name: string;
  isDeleted: boolean;
}

// API レスポンス用の検査項目（createdAt/updatedAt不要）
export interface ExaminationData {
  id: number;
  name: string;
  isDeleted: boolean;
}

// API レスポンス用のスケジュール
export interface ScheduleData {
  id: number;
  patientId: number;
  date: string;
  startTime: string;
  endTime: string | null;
  departmentId: number;
  doctorId: number;
  waitingAreaId: number;
  note: string | null;
  status: ScheduleStatus;
  visitedAt: string | null;
  // リレーション（軽量型）
  patient?: Patient;
  department?: DepartmentData;
  doctor?: DoctorData;
  waitingArea?: WaitingAreaData;
  examinations?: ExaminationData[];
}
