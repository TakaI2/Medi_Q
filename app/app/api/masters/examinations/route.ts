import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ApiResponse, Examination, ErrorCode } from '@/types';

// GET /api/masters/examinations - 検査項目一覧取得
export async function GET(): Promise<NextResponse<ApiResponse<Examination[]>>> {
  try {
    const examinations = await prisma.examination.findMany({
      where: { isDeleted: false },
      orderBy: { id: 'asc' },
    });

    const response: Examination[] = examinations.map((e) => ({
      id: e.id,
      name: e.name,
      isDeleted: e.isDeleted,
      createdAt: e.createdAt.toISOString(),
      updatedAt: e.updatedAt.toISOString(),
    }));

    return NextResponse.json({ success: true, data: response });
  } catch (error) {
    console.error('GET /api/masters/examinations error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: ErrorCode.DATABASE_ERROR,
          message: '検査項目一覧の取得に失敗しました',
        },
      },
      { status: 500 }
    );
  }
}

// POST /api/masters/examinations - 検査項目登録
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<Examination>>> {
  try {
    const body = await request.json();

    // バリデーション
    if (!body.name) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.VALIDATION_ERROR,
            message: '検査項目名は必須です',
          },
        },
        { status: 400 }
      );
    }

    // 重複チェック
    const existing = await prisma.examination.findFirst({
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
            message: '同じ名前の検査項目が既に存在します',
          },
        },
        { status: 400 }
      );
    }

    const examination = await prisma.examination.create({
      data: {
        name: body.name,
      },
    });

    const response: Examination = {
      id: examination.id,
      name: examination.name,
      isDeleted: examination.isDeleted,
      createdAt: examination.createdAt.toISOString(),
      updatedAt: examination.updatedAt.toISOString(),
    };

    return NextResponse.json({ success: true, data: response }, { status: 201 });
  } catch (error) {
    console.error('POST /api/masters/examinations error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: ErrorCode.DATABASE_ERROR,
          message: '検査項目の登録に失敗しました',
        },
      },
      { status: 500 }
    );
  }
}
