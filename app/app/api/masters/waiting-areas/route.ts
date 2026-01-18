import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ApiResponse, WaitingArea, ErrorCode } from '@/types';

// GET /api/masters/waiting-areas - 待機場所一覧取得
export async function GET(): Promise<NextResponse<ApiResponse<WaitingArea[]>>> {
  try {
    const waitingAreas = await prisma.waitingArea.findMany({
      where: { isDeleted: false },
      orderBy: { id: 'asc' },
    });

    const response: WaitingArea[] = waitingAreas.map((w) => ({
      id: w.id,
      name: w.name,
      isDeleted: w.isDeleted,
      createdAt: w.createdAt.toISOString(),
      updatedAt: w.updatedAt.toISOString(),
    }));

    return NextResponse.json({ success: true, data: response });
  } catch (error) {
    console.error('GET /api/masters/waiting-areas error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: ErrorCode.DATABASE_ERROR,
          message: '待機場所一覧の取得に失敗しました',
        },
      },
      { status: 500 }
    );
  }
}

// POST /api/masters/waiting-areas - 待機場所登録
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<WaitingArea>>> {
  try {
    const body = await request.json();

    // バリデーション
    if (!body.name) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.VALIDATION_ERROR,
            message: '待機場所名は必須です',
          },
        },
        { status: 400 }
      );
    }

    // 重複チェック
    const existing = await prisma.waitingArea.findFirst({
      where: {
        name: body.name,
        isDeleted: false,
      },
    });

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.VALIDATION_ERROR,
            message: '同じ名前の待機場所が既に存在します',
          },
        },
        { status: 400 }
      );
    }

    const waitingArea = await prisma.waitingArea.create({
      data: {
        name: body.name,
      },
    });

    const response: WaitingArea = {
      id: waitingArea.id,
      name: waitingArea.name,
      isDeleted: waitingArea.isDeleted,
      createdAt: waitingArea.createdAt.toISOString(),
      updatedAt: waitingArea.updatedAt.toISOString(),
    };

    return NextResponse.json({ success: true, data: response }, { status: 201 });
  } catch (error) {
    console.error('POST /api/masters/waiting-areas error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: ErrorCode.DATABASE_ERROR,
          message: '待機場所の登録に失敗しました',
        },
      },
      { status: 500 }
    );
  }
}
