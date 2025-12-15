'use client';

import { useState, useRef, useEffect } from 'react';
import Webcam from 'react-webcam';
import Link from 'next/link';

export default function CameraTestPage() {
  const webcamRef = useRef<Webcam>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [error, setError] = useState<string>('');
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const [isMounted, setIsMounted] = useState(false);
  const [browserInfo, setBrowserInfo] = useState({
    userAgent: '',
    platform: '',
    mediaDevices: '',
  });

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
      setError('カメラデバイスの取得に失敗しました');
    }
  };

  // カメラ準備完了
  const handleUserMedia = () => {
    console.log('✅ カメラ準備完了');
    setCameraReady(true);
    setError('');
    getDevices();
  };

  // カメラエラー
  const handleUserMediaError = (err: string | DOMException) => {
    console.error('❌ カメラエラー:', err);
    setCameraReady(false);

    let errorMessage = 'カメラの起動に失敗しました。';

    if (typeof err === 'string') {
      errorMessage = `⚠️ エラー: ${err}`;
    } else if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
      errorMessage = '⚠️ カメラの権限が拒否されました。ブラウザの設定でカメラへのアクセスを許可してください。';
    } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
      errorMessage = '⚠️ カメラが見つかりませんでした。カメラが接続されているか確認してください。';
    } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
      errorMessage = '⚠️ カメラが他のアプリケーションで使用中です。他のアプリを閉じてから再試行してください。';
    } else if (err.name === 'OverconstrainedError' || err.name === 'ConstraintNotSatisfiedError') {
      errorMessage = '⚠️ カメラの設定が対応していません。別のカメラを試してください。';
    } else {
      errorMessage = `⚠️ エラー: ${err.message}`;
    }

    setError(errorMessage);
  };

  // クライアントサイドでのみ実行
  useEffect(() => {
    setIsMounted(true);

    // ブラウザ情報を取得
    setBrowserInfo({
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      mediaDevices: navigator.mediaDevices ? '✅ 対応' : '❌ 非対応',
    });
  }, []);

  // スクリーンショット撮影
  const captureScreenshot = () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        const link = document.createElement('a');
        link.download = 'camera-test.jpg';
        link.href = imageSrc;
        link.click();
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* ヘッダー */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
          >
            ← メイン画面に戻る
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            📷 カメラテスト
          </h1>
          <p className="text-gray-600">
            カメラが正しく動作するかテストします
          </p>
        </div>

        <div className="space-y-6">
          {/* ステータス */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              システム状態
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <span className="text-2xl">
                  {cameraReady ? '✅' : '⏳'}
                </span>
                <div>
                  <p className="text-xs text-gray-500">カメラ</p>
                  <p className="font-medium text-gray-900">
                    {cameraReady ? '準備完了' : '起動中...'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <span className="text-2xl">
                  {devices.length > 0 ? '✅' : '❌'}
                </span>
                <div>
                  <p className="text-xs text-gray-500">デバイス</p>
                  <p className="font-medium text-gray-900">
                    {devices.length}台検出
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <span className="text-2xl">
                  {browserInfo.mediaDevices === '✅ 対応' ? '✅' : '❌'}
                </span>
                <div>
                  <p className="text-xs text-gray-500">ブラウザ</p>
                  <p className="font-medium text-gray-900">
                    {browserInfo.mediaDevices}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* カメラプレビュー */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              カメラプレビュー
            </h2>

            <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden mb-4">
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
            </div>

            {cameraReady && (
              <button
                onClick={captureScreenshot}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
              >
                📸 スクリーンショット撮影
              </button>
            )}
          </div>

          {/* エラー表示 */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h3 className="font-bold text-red-900 mb-2">エラー</h3>
              <p className="text-red-700 mb-4">{error}</p>

              <div className="bg-white rounded p-4 text-sm">
                <p className="font-bold text-gray-900 mb-2">解決方法:</p>
                <ol className="list-decimal list-inside space-y-2 text-gray-700">
                  <li>
                    <strong>カメラ権限を確認:</strong> アドレスバーの
                    <span className="inline-block mx-1 px-2 py-0.5 bg-gray-200 rounded">
                      🔒
                    </span>
                    をクリック → カメラを「許可」に設定
                  </li>
                  <li>
                    <strong>ページを再読み込み:</strong> F5キーまたは更新ボタンをクリック
                  </li>
                  <li>
                    <strong>他のアプリを確認:</strong> ZoomやTeamsなど、カメラを使用中のアプリを閉じる
                  </li>
                  <li>
                    <strong>ブラウザを再起動:</strong> ブラウザを完全に閉じて再起動
                  </li>
                  <li>
                    <strong>別のブラウザで試す:</strong> Chrome、Edge、Firefoxなど
                  </li>
                </ol>
              </div>
            </div>
          )}

          {/* デバイス一覧 */}
          {devices.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                検出されたカメラ
              </h2>
              <div className="space-y-2">
                {devices.map((device, index) => (
                  <button
                    key={device.deviceId}
                    onClick={() => setSelectedDevice(device.deviceId)}
                    className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                      selectedDevice === device.deviceId
                        ? 'bg-blue-50 border-blue-500 text-blue-700'
                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <div className="font-medium">
                      カメラ {index + 1}: {device.label || '名称不明'}
                    </div>
                    <div className="text-xs text-gray-500 font-mono mt-1">
                      {device.deviceId}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ブラウザ情報 */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="font-bold text-gray-900 mb-2 text-sm">
              ブラウザ情報
            </h3>
            <div className="text-xs text-gray-600 space-y-1 font-mono">
              <p>Platform: {browserInfo.platform}</p>
              <p>MediaDevices: {browserInfo.mediaDevices}</p>
              <p className="break-all">UserAgent: {browserInfo.userAgent}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
