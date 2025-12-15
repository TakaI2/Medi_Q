'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import { BrowserQRCodeReader } from '@zxing/library';
import { QR_CODE_SCAN_INTERVAL, QR_CODE_VALID_PREFIX, ERROR_MESSAGES } from '@/config/constants';

interface QRReaderProps {
  onScan: (patientId: string) => void;
  onError: (error: Error) => void;
}

export default function QRReader({ onScan, onError }: QRReaderProps) {
  const webcamRef = useRef<Webcam>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [lastScan, setLastScan] = useState<string>('');
  const [cameraError, setCameraError] = useState<string>('');
  const [isMounted, setIsMounted] = useState(false);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const codeReaderRef = useRef<BrowserQRCodeReader | null>(null);
  const isProcessingRef = useRef<boolean>(false); // 処理中フラグ

  // クライアントサイドでのみ実行
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // カメラデバイス一覧を取得
  const getDevices = async () => {
    try {
      const deviceInfos = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = deviceInfos.filter(
        (device) => device.kind === 'videoinput'
      );
      setDevices(videoDevices);
      if (videoDevices.length > 0 && !selectedDevice) {
        setSelectedDevice(videoDevices[0].deviceId);
      }
    } catch (err) {
      console.error('デバイス取得エラー:', err);
    }
  };

  // QRコードリーダーの初期化
  useEffect(() => {
    codeReaderRef.current = new BrowserQRCodeReader();
    return () => {
      // クリーンアップ
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
      }
    };
  }, []);

  // QRコード検出時の処理
  const handleQRCodeDetected = useCallback((qrText: string) => {
    // 既に処理中の場合は無視
    if (isProcessingRef.current) {
      console.log('⚠️ Already processing, skipping...');
      return;
    }

    // 患者IDの検証
    if (isValidPatientId(qrText)) {
      // 処理中フラグを立てる
      isProcessingRef.current = true;

      console.log('✅ Valid QR code detected:', qrText);

      // 成功音を再生
      playBeep(true);

      // スキャンを完全に停止
      setIsScanning(false);
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
        scanIntervalRef.current = null;
      }

      // コールバック実行
      onScan(qrText);

      // 処理中フラグは外部からリセットされるまで維持
      // （「次の患者」ボタンクリック時にリセット）
    } else {
      // 無効なQRコード
      playBeep(false);
      onError(new Error(ERROR_MESSAGES.INVALID_QR_CODE));
    }
  }, [onScan, onError]);

  // QRコードをスキャンする関数
  const scanQRCode = useCallback(async () => {
    if (!webcamRef.current || !codeReaderRef.current) return;

    // 処理中の場合はスキャンしない
    if (isProcessingRef.current) return;

    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return;

    try {
      // 画像をImageElementに変換
      const img = new Image();
      img.src = imageSrc;

      await new Promise((resolve) => {
        img.onload = resolve;
      });

      // QRコードをデコード
      const result = await codeReaderRef.current.decodeFromImageElement(img);
      const qrText = result.getText();

      // 同じQRコードを連続してスキャンしないようにする
      if (qrText && qrText !== lastScan && !isProcessingRef.current) {
        setLastScan(qrText);
        handleQRCodeDetected(qrText);
      }
    } catch {
      // QRコードが見つからない場合は何もしない（エラーではない）
      // console.log('QR code not found in frame');
    }
  }, [lastScan, handleQRCodeDetected]);

  // 患者IDの検証
  const isValidPatientId = (qrText: string): boolean => {
    // 患者IDは "P" で始まる5桁以上の文字列
    const regex = new RegExp(`^${QR_CODE_VALID_PREFIX}\\d{4,}$`);
    return regex.test(qrText);
  };

  // ビープ音を再生（多重再生防止）
  const audioContextRef = useRef<AudioContext | null>(null);
  const playBeep = useCallback((success: boolean) => {
    try {
      // 既存のAudioContextを再利用（初回のみ作成）
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }

      const audioContext = audioContextRef.current;
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // 成功音: 800Hz、失敗音: 400Hz
      oscillator.frequency.value = success ? 800 : 400;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
    } catch (err) {
      console.error('Beep sound error:', err);
    }
  }, []);

  // スキャン開始
  const startScanning = useCallback(() => {
    setIsScanning(true);
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
    }
    scanIntervalRef.current = setInterval(scanQRCode, QR_CODE_SCAN_INTERVAL);
  }, [scanQRCode]);

  // カメラ準備完了時
  const handleUserMedia = () => {
    setCameraError('');
    startScanning();
    getDevices();
  };

  // カメラエラー時
  const handleUserMediaError = (error: string | DOMException) => {
    console.error('Camera error:', error);
    setCameraError(ERROR_MESSAGES.CAMERA_PERMISSION);
    onError(new Error(ERROR_MESSAGES.CAMERA_PERMISSION));
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      {/* カメラ映像 */}
      <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
        {isMounted ? (
          <Webcam
            ref={webcamRef}
            audio={false}
            screenshotFormat="image/jpeg"
            videoConstraints={
              selectedDevice
                ? {
                    deviceId: { exact: selectedDevice },
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                  }
                : {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                  }
            }
            onUserMedia={handleUserMedia}
            onUserMediaError={handleUserMediaError}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4" />
              <p>カメラを初期化中...</p>
            </div>
          </div>
        )}

        {/* スキャンガイドフレーム */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative w-64 h-64">
            {/* 四隅のコーナーマーク */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-blue-500" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-blue-500" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-blue-500" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-blue-500" />

            {/* スキャン中のアニメーション */}
            {isScanning && (
              <div className="absolute inset-0">
                <div className="w-full h-1 bg-blue-500 animate-scan-line" />
              </div>
            )}
          </div>
        </div>

        {/* ステータス表示 */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 px-4 py-2 bg-black bg-opacity-70 rounded-lg">
          <p className="text-white text-sm font-medium">
            {isScanning ? '📷 QRコードをかざしてください' : '⏸ スキャン一時停止中'}
          </p>
        </div>
      </div>

      {/* エラーメッセージ */}
      {cameraError && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">{cameraError}</p>
          <p className="text-red-600 text-xs mt-2">
            ブラウザの設定でカメラへのアクセスを許可してください。
          </p>
        </div>
      )}

      {/* カメラ選択 */}
      {devices.length > 1 && (
        <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h3 className="text-gray-900 font-bold mb-2">📷 カメラ選択</h3>
          <div className="space-y-2">
            {devices.map((device, index) => (
              <button
                key={device.deviceId}
                onClick={() => setSelectedDevice(device.deviceId)}
                className={`w-full text-left px-4 py-2 rounded-lg border transition-colors ${
                  selectedDevice === device.deviceId
                    ? 'bg-blue-50 border-blue-500 text-blue-700'
                    : 'bg-white border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="font-medium text-sm">
                  カメラ {index + 1}: {device.label || '名称不明'}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 使用方法 */}
      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="text-blue-900 font-bold mb-2">📖 使い方</h3>
        <ul className="text-blue-800 text-sm space-y-1">
          <li>• 診察券のQRコードをカメラの枠内にかざしてください</li>
          <li>• QRコードが自動的に読み取られます</li>
          <li>• 読み取り成功時は音でお知らせします</li>
        </ul>
      </div>
    </div>
  );
}
