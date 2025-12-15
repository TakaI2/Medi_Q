'use client';

import { useState, useEffect, useRef } from 'react';

export interface VoicePlayerProps {
  text: string;
  autoPlay?: boolean;
  speaker?: number;
  speedScale?: number;
  volumeScale?: number;
  pitchScale?: number;
  onPlayStart?: () => void;
  onPlayEnd?: () => void;
  onError?: (error: Error) => void;
}

/**
 * VoicePlayer コンポーネント
 *
 * VOICEVOX APIを使用して音声を合成・再生します
 */
export default function VoicePlayer({
  text,
  autoPlay = false,
  speaker = 3,
  speedScale = 1.0,
  volumeScale = 1.0,
  pitchScale = 0.0,
  onPlayStart,
  onPlayEnd,
  onError,
}: VoicePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isPlayingRef = useRef(false); // 再生中フラグ（重複防止用）
  const hasPlayedRef = useRef(false); // 一度でも再生したかのフラグ

  /**
   * 音声を合成
   */
  const synthesizeAudio = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/voice/synthesize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          speaker,
          speedScale,
          volumeScale,
          pitchScale,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || '音声合成に失敗しました');
      }

      // 音声データをBlobとして取得
      const audioBlob = await response.blob();
      const url = URL.createObjectURL(audioBlob);
      setAudioUrl(url);

      return url;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '音声合成に失敗しました';
      setError(errorMessage);
      if (onError && err instanceof Error) {
        onError(err);
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 音声を再生
   */
  const playAudio = async () => {
    try {
      // 既に再生中の場合は何もしない（重複防止）
      if (isPlayingRef.current) {
        console.log('Already playing, skipping...');
        return;
      }

      // 既存の音声を停止
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current = null;
      }

      let url = audioUrl;

      // 音声データがまだない場合は合成
      if (!url) {
        url = await synthesizeAudio();
      }

      if (!url) {
        throw new Error('音声データが取得できませんでした');
      }

      // Audio要素を作成して再生
      const audio = new Audio(url);
      audioRef.current = audio;

      audio.onplay = () => {
        isPlayingRef.current = true;
        setIsPlaying(true);
        if (onPlayStart) {
          onPlayStart();
        }
      };

      audio.onended = () => {
        isPlayingRef.current = false;
        setIsPlaying(false);
        if (onPlayEnd) {
          onPlayEnd();
        }
      };

      audio.onerror = () => {
        isPlayingRef.current = false;
        setIsPlaying(false);
        const err = new Error('音声の再生に失敗しました');
        setError(err.message);
        if (onError) {
          onError(err);
        }
      };

      await audio.play();
    } catch (err) {
      isPlayingRef.current = false;
      setIsPlaying(false);
      const errorMessage = err instanceof Error ? err.message : '音声の再生に失敗しました';
      setError(errorMessage);
      if (onError && err instanceof Error) {
        onError(err);
      }
    }
  };

  /**
   * 音声を停止
   */
  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    isPlayingRef.current = false;
    setIsPlaying(false);
  };

  /**
   * 自動再生
   */
  useEffect(() => {
    // 自動再生が有効で、テキストがあり、まだ再生していない場合のみ再生
    if (autoPlay && text && !isPlayingRef.current && !hasPlayedRef.current) {
      console.log('🎵 Starting voice playback...');
      hasPlayedRef.current = true; // 再生フラグを立てる
      playAudio();
    }

    // クリーンアップ
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      isPlayingRef.current = false;
      setIsPlaying(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPlay, text]);

  /**
   * テキスト変更時に音声データをクリア
   */
  useEffect(() => {
    // 既存の音声を停止
    stopAudio();

    // 音声URLをクリア
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, speaker, speedScale, volumeScale, pitchScale]);

  return (
    <div className="voice-player">
      {/* 音声テキスト表示 */}
      <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            {isPlaying ? (
              <div className="w-6 h-6 bg-blue-500 rounded-full animate-pulse" />
            ) : (
              <svg
                className="w-6 h-6 text-blue-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                />
              </svg>
            )}
          </div>
          <div className="flex-1">
            <p className="text-lg text-gray-800">{text}</p>
            {isPlaying && (
              <p className="text-sm text-blue-600 mt-2 animate-pulse">🔊 再生中...</p>
            )}
          </div>
        </div>
      </div>

      {/* コントロールボタン */}
      {!autoPlay && (
        <div className="flex gap-2">
          <button
            onClick={playAudio}
            disabled={isLoading || isPlaying}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>音声を準備中...</span>
              </>
            ) : isPlaying ? (
              <>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>再生中</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>音声を再生</span>
              </>
            )}
          </button>

          {isPlaying && (
            <button
              onClick={stopAudio}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z"
                  clipRule="evenodd"
                />
              </svg>
              <span>停止</span>
            </button>
          )}
        </div>
      )}

      {/* エラー表示 */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-2">
            <svg
              className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <p className="text-sm font-medium text-red-800">音声案内エラー</p>
              <p className="text-sm text-red-600 mt-1">{error}</p>
              <p className="text-xs text-red-500 mt-2">
                VOICEVOX Engineが起動しているか確認してください。
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
