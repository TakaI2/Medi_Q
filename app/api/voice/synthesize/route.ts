import { NextRequest, NextResponse } from 'next/server';
import { synthesizeVoice, checkVoicevoxEngine } from '@/lib/voice';

export const runtime = 'nodejs';

/**
 * POST /api/voice/synthesize
 *
 * テキストから音声を合成するAPIエンドポイント
 *
 * Request Body:
 * {
 *   "text": "ようこそ。検査がある場合は内科前に...",
 *   "speaker": 3,        // optional, default: 3 (ずんだもん)
 *   "speedScale": 1.0,   // optional, default: 1.0
 *   "volumeScale": 1.0,  // optional, default: 1.0
 *   "pitchScale": 0.0    // optional, default: 0.0
 * }
 *
 * Response:
 * - Success: audio/wav (音声データ)
 * - Error: JSON { success: false, error: { code, message } }
 */
export async function POST(request: NextRequest) {
  try {
    // リクエストボディの解析
    const body = await request.json();
    const { text, speaker, speedScale, volumeScale, pitchScale } = body;

    // バリデーション
    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: 'テキストが指定されていません。',
          },
        },
        { status: 400 }
      );
    }

    if (text.length > 1000) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'TEXT_TOO_LONG',
            message: 'テキストが長すぎます（最大1000文字）。',
          },
        },
        { status: 400 }
      );
    }

    // VOICEVOX Engineの起動確認
    const isEngineRunning = await checkVoicevoxEngine();
    if (!isEngineRunning) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VOICEVOX_NOT_AVAILABLE',
            message: 'VOICEVOX Engineが起動していません。',
          },
        },
        { status: 503 }
      );
    }

    // 音声合成
    const audioBlob = await synthesizeVoice(text, {
      speaker: speaker !== undefined ? Number(speaker) : 3,
      speedScale: speedScale !== undefined ? Number(speedScale) : 1.0,
      volumeScale: volumeScale !== undefined ? Number(volumeScale) : 1.0,
      pitchScale: pitchScale !== undefined ? Number(pitchScale) : 0.0,
    });

    // Blobを Buffer に変換
    const buffer = Buffer.from(await audioBlob.arrayBuffer());

    // 音声データを返す
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/wav',
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('Voice synthesis API error:', error);

    // エラーレスポンス
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SYNTHESIS_FAILED',
          message: error instanceof Error ? error.message : '音声合成に失敗しました。',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/voice/synthesize
 *
 * VOICEVOX Engineの状態を確認
 */
export async function GET() {
  try {
    const isEngineRunning = await checkVoicevoxEngine();

    return NextResponse.json({
      success: true,
      data: {
        available: isEngineRunning,
        url: process.env.VOICEVOX_API_URL || 'http://localhost:50021',
      },
    });
  } catch (error) {
    console.error('Voice status check error:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'STATUS_CHECK_FAILED',
          message: 'ステータス確認に失敗しました。',
        },
      },
      { status: 500 }
    );
  }
}
