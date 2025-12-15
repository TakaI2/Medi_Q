/**
 * VOICEVOX音声合成ライブラリ
 *
 * VOICEVOX Engineと連携して音声合成を行う
 */

export interface VoiceOptions {
  speaker?: number; // 話者ID（デフォルト: 1 = ずんだもん ノーマル）
  speedScale?: number; // 話速（デフォルト: 1.0）
  volumeScale?: number; // 音量（デフォルト: 1.0）
  pitchScale?: number; // 音高（デフォルト: 0.0）
}

export interface VoiceTemplate {
  welcome: string;
  guidance: string;
  closing: string;
}

const DEFAULT_TEMPLATE: VoiceTemplate = {
  welcome: 'ようこそ。',
  guidance: '検査がある場合は{診察科}前に、無い場合は{待機場所}前にお越しください。{担当医}先生が担当します。',
  closing: 'お待ちしております。'
};

/**
 * 患者情報から音声案内テキストを生成
 */
export function generateVoiceText(
  patientName: string,
  department: string,
  doctor: string,
  waitingArea: string,
  examinations?: string[],
  template: VoiceTemplate = DEFAULT_TEMPLATE
): string {
  // 検査がある場合は検査名を列挙
  if (examinations && examinations.length > 0) {
    const examinationText = examinations.join('検査、') + '検査';
    return `${template.welcome}${patientName}さん、${examinationText}がありますので、${waitingArea}前でお待ちください。${doctor}先生が担当します。${template.closing}`;
  } else {
    // 検査がない場合
    const guidance = template.guidance
      .replace('{診察科}', department)
      .replace('{待機場所}', waitingArea)
      .replace('{担当医}', doctor);
    return `${template.welcome}${patientName}さん、${guidance}${template.closing}`;
  }
}

/**
 * VOICEVOX EngineのURL取得
 */
function getVoicevoxUrl(): string {
  return process.env.VOICEVOX_API_URL || 'http://localhost:50021';
}

/**
 * VOICEVOX Engineが起動しているか確認
 */
export async function checkVoicevoxEngine(): Promise<boolean> {
  try {
    const url = getVoicevoxUrl();
    const response = await fetch(`${url}/version`, {
      method: 'GET',
      signal: AbortSignal.timeout(3000), // 3秒タイムアウト
    });
    return response.ok;
  } catch (error) {
    console.error('VOICEVOX Engine check failed:', error);
    return false;
  }
}

/**
 * 音声クエリを作成
 */
async function createAudioQuery(
  text: string,
  speaker: number = 1
): Promise<Record<string, unknown>> {
  const url = getVoicevoxUrl();
  const response = await fetch(
    `${url}/audio_query?text=${encodeURIComponent(text)}&speaker=${speaker}`,
    {
      method: 'POST',
      signal: AbortSignal.timeout(10000), // 10秒タイムアウト
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to create audio query: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * 音声を合成
 */
async function synthesize(
  audioQuery: Record<string, unknown>,
  speaker: number = 1
): Promise<Blob> {
  const url = getVoicevoxUrl();
  const response = await fetch(`${url}/synthesis?speaker=${speaker}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(audioQuery),
    signal: AbortSignal.timeout(10000), // 10秒タイムアウト
  });

  if (!response.ok) {
    throw new Error(`Failed to synthesize audio: ${response.statusText}`);
  }

  return await response.blob();
}

/**
 * テキストから音声データを生成（メイン関数）
 */
export async function synthesizeVoice(
  text: string,
  options: VoiceOptions = {}
): Promise<Blob> {
  const { speaker = 1, speedScale = 1.0, volumeScale = 1.0, pitchScale = 0.0 } = options;

  try {
    // 1. 音声クエリを作成
    const audioQuery = await createAudioQuery(text, speaker);

    // 2. オプションを適用
    if (speedScale !== 1.0) {
      audioQuery.speedScale = speedScale;
    }
    if (volumeScale !== 1.0) {
      audioQuery.volumeScale = volumeScale;
    }
    if (pitchScale !== 0.0) {
      audioQuery.pitchScale = pitchScale;
    }

    // 3. 音声を合成
    const audioBlob = await synthesize(audioQuery, speaker);

    return audioBlob;
  } catch (error) {
    console.error('Voice synthesis failed:', error);
    throw error;
  }
}

/**
 * 利用可能な話者一覧を取得
 */
export async function getSpeakers(): Promise<Array<{
  name: string;
  speaker_uuid: string;
  styles: Array<{
    name: string;
    id: number;
  }>;
}>> {
  try {
    const url = getVoicevoxUrl();
    const response = await fetch(`${url}/speakers`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      throw new Error(`Failed to get speakers: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to get speakers:', error);
    return [];
  }
}

/**
 * 話者IDの定義（よく使うもの）
 */
export const SPEAKERS = {
  ZUNDAMON_NORMAL: 3,      // ずんだもん（ノーマル）
  ZUNDAMON_HAPPY: 1,       // ずんだもん（あまあま）
  METAN_NORMAL: 2,         // 四国めたん（ノーマル）
  TSUMUGI_NORMAL: 8,       // 春日部つむぎ（ノーマル）
} as const;
