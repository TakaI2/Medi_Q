import { NextRequest, NextResponse } from 'next/server';
import { searchPatientByIdAndDate } from '@/lib/calendar';
import { CalendarSearchRequest, CalendarSearchResponse } from '@/types';
import { ERROR_MESSAGES, ErrorCode } from '@/config/constants';

export async function POST(request: NextRequest) {
  try {
    // リクエストボディを取得
    const body: CalendarSearchRequest = await request.json();
    const { patientId, date } = body;

    // バリデーション
    if (!patientId || !date) {
      const response: CalendarSearchResponse = {
        success: false,
        error: {
          code: ErrorCode.INVALID_QR_CODE,
          message: 'Patient ID and date are required',
        },
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Googleカレンダーから患者情報を検索
    const patientInfo = await searchPatientByIdAndDate(patientId, date);

    if (!patientInfo) {
      // 患者情報が見つからない
      const response: CalendarSearchResponse = {
        success: false,
        error: {
          code: ErrorCode.NOT_FOUND,
          message: ERROR_MESSAGES.NOT_FOUND,
        },
      };
      return NextResponse.json(response, { status: 404 });
    }

    // 成功レスポンス
    const response: CalendarSearchResponse = {
      success: true,
      data: patientInfo,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Calendar search error:', error);

    // エラーレスポンス
    const response: CalendarSearchResponse = {
      success: false,
      error: {
        code: ErrorCode.CALENDAR_ERROR,
        message: ERROR_MESSAGES.CALENDAR_ERROR,
      },
    };

    return NextResponse.json(response, { status: 500 });
  }
}
