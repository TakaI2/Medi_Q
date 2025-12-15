import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { success: false, authenticated: false },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      authenticated: true,
      user: {
        id: session.userId,
        username: session.username,
      },
    });
  } catch (error) {
    console.error('Session API error:', error);
    return NextResponse.json(
      { success: false, error: 'セッション確認中にエラーが発生しました' },
      { status: 500 }
    );
  }
}
