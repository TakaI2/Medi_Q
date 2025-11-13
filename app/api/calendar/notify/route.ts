import { NextRequest, NextResponse } from 'next/server';
import { notifyArrival } from '@/lib/calendar';
import { CalendarNotifyRequest, CalendarNotifyResponse } from '@/types';
import { ERROR_MESSAGES, SUCCESS_MESSAGES, ErrorCode } from '@/config/constants';

export async function POST(request: NextRequest) {
  try {
    // リクエストボディを取得
    const body: CalendarNotifyRequest = await request.json();
    const { eventId, visitTime } = body;

    // バリデーション
    if (!eventId || !visitTime) {
      const response: CalendarNotifyResponse = {
        success: false,
        error: {
          code: ErrorCode.CALENDAR_ERROR,
          message: 'Event ID and visit time are required',
        },
      };
      return NextResponse.json(response, { status: 400 });
    }

    // 来院通知を送信（カレンダーイベントを更新）
    await notifyArrival(eventId, visitTime);

    // 成功レスポンス
    const response: CalendarNotifyResponse = {
      success: true,
      message: SUCCESS_MESSAGES.NOTIFICATION_SENT,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Calendar notify error:', error);

    // エラーレスポンス
    const response: CalendarNotifyResponse = {
      success: false,
      error: {
        code: ErrorCode.CALENDAR_ERROR,
        message: ERROR_MESSAGES.CALENDAR_ERROR,
      },
    };

    return NextResponse.json(response, { status: 500 });
  }
}
