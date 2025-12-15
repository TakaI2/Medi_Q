import { VoiceTemplate } from '@/types';

// アプリケーション情報
export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'Medi_Q';
export const APP_VERSION = '1.0.0';

// 自動クリア時間（秒）
export const AUTO_CLEAR_SECONDS = parseInt(
  process.env.NEXT_PUBLIC_AUTO_CLEAR_SECONDS || '30',
  10
);

// VOICEVOX 設定
export const VOICEVOX_API_URL =
  process.env.VOICEVOX_API_URL || 'http://localhost:50021';
export const DEFAULT_SPEAKER_ID = 1; // ずんだもん（ノーマル）

// QRコード設定
export const QR_CODE_SCAN_INTERVAL = 500; // QRコードスキャン間隔（ミリ秒）
export const QR_CODE_VALID_PREFIX = 'P'; // 患者IDの接頭辞

// 音声案内テンプレート
export const VOICE_TEMPLATES: VoiceTemplate = {
  welcome: 'ようこそ。',
  guidance:
    '検査がある場合は{department}前に、無い場合は{waitingArea}前にお越しください。{doctor}先生が担当します。',
  closing: 'お待ちしております。',
};

// エラーコード
export enum ErrorCode {
  INVALID_REQUEST = 'INVALID_REQUEST',
  INVALID_QR_CODE = 'INVALID_QR_CODE',
  NOT_FOUND = 'NOT_FOUND',
  DATABASE_ERROR = 'DATABASE_ERROR',
  VOICE_ERROR = 'VOICE_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  CAMERA_PERMISSION = 'CAMERA_PERMISSION',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

// エラーメッセージ
export const ERROR_MESSAGES = {
  INVALID_QR_CODE: '無効なQRコードです。正しい診察券をかざしてください。',
  NOT_FOUND:
    '本日の診察予定が見つかりませんでした。受付スタッフにお声がけください。',
  DATABASE_ERROR:
    'データベースエラーが発生しました。しばらくしてから再度お試しください。',
  VOICE_ERROR: '音声案内を再生できませんでした。',
  NETWORK_ERROR:
    'ネットワークエラーが発生しました。接続を確認してください。',
  CAMERA_PERMISSION:
    'カメラへのアクセスが許可されていません。ブラウザの設定を確認してください。',
  UNKNOWN_ERROR: 'エラーが発生しました。受付スタッフにお声がけください。',
};

// 成功メッセージ
export const SUCCESS_MESSAGES = {
  CHECK_IN_COMPLETE: '受付が完了しました。',
};

// 印刷設定
export const PRINT_CONFIG = {
  PAGE_SIZE: 'A5',
  MARGIN: '10mm',
};
