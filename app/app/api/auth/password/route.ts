import { NextRequest, NextResponse } from 'next/server';
import { getSession, changePassword } from '@/lib/auth';

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { success: false, error: '認証が必要です' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { success: false, error: '現在のパスワードと新しいパスワードは必須です' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { success: false, error: 'パスワードは6文字以上で入力してください' },
        { status: 400 }
      );
    }

    const result = await changePassword(session.userId, currentPassword, newPassword);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Password change API error:', error);
    return NextResponse.json(
      { success: false, error: 'パスワード変更中にエラーが発生しました' },
      { status: 500 }
    );
  }
}
