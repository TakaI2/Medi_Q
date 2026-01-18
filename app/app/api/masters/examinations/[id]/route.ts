import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ApiResponse, Examination, ErrorCode } from '@/types';

type RouteContext = {
  params: Promise<{ id: string }>;
};

// GET /api/masters/examinations/[id] - 検査項目詳細取得
export async function GET(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse<ApiResponse<Examination>>> {
  try {
    const { id } = await context.params;
    const examinationId = parseInt(id, 10);

    if (isNaN(examinationId)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.VALIDATION_ERROR,
            message: '無効なIDです',
          },
        },
        { status: 400 }
      );
    }

    const examination = await prisma.examination.findFirst({
      where: {
        id: examinationId,
        isDeleted: false,
      },
    });

    if (!examination) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.NOT_FOUND,
            message: '検査項目が見つかりません',
          },
        },
        { status: 404 }
      );
    }

    const response: Examination = {
      id: examination.id,
      name: examination.name,
      isDeleted: examination.isDeleted,
      createdAt: examination.createdAt.toISOString(),
      updatedAt: examination.updatedAt.toISOString(),
    };

    return NextResponse.json({ success: true, data: response });
  } catch (error) {
    console.error('GET /api/masters/examinations/[id] error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: ErrorCode.DATABASE_ERROR,
          message: '検査項目の取得に失敗しました',
        },
      },
      { status: 500 }
    );
  }
}

// PUT /api/masters/examinations/[id] - 検査項目更新
export async function PUT(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse<ApiResponse<Examination>>> {
  try {
    const { id } = await context.params;
    const examinationId = parseInt(id, 10);

    if (isNaN(examinationId)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.VALIDATION_ERROR,
            message: '無効なIDです',
          },
        },
        { status: 400 }
      );
    }

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

    // 既存チェック
    const existing = await prisma.examination.findFirst({
      where: {
        id: examinationId,
        isDeleted: false,
      },
    });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.NOT_FOUND,
            message: '検査項目が見つかりません',
          },
        },
        { status: 404 }
      );
    }

    // 重複チェック（自身を除く）
    const duplicate = await prisma.examination.findFirst({
      where: {
        name: body.name,
        isDeleted: false,
        NOT: { id: examinationId },
      },
    });

    if (duplicate) {
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

    const examination = await prisma.examination.update({
      where: { id: examinationId },
      data: { name: body.name },
    });

    const response: Examination = {
      id: examination.id,
      name: examination.name,
      isDeleted: examination.isDeleted,
      createdAt: examination.createdAt.toISOString(),
      updatedAt: examination.updatedAt.toISOString(),
    };

    return NextResponse.json({ success: true, data: response });
  } catch (error) {
    console.error('PUT /api/masters/examinations/[id] error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: ErrorCode.DATABASE_ERROR,
          message: '検査項目の更新に失敗しました',
        },
      },
      { status: 500 }
    );
  }
}

// DELETE /api/masters/examinations/[id] - 検査項目削除（論理削除）
export async function DELETE(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse<ApiResponse<{ deleted: boolean }>>> {
  try {
    const { id } = await context.params;
    const examinationId = parseInt(id, 10);

    if (isNaN(examinationId)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.VALIDATION_ERROR,
            message: '無効なIDです',
          },
        },
        { status: 400 }
      );
    }

    // 既存チェック
    const existing = await prisma.examination.findFirst({
      where: {
        id: examinationId,
        isDeleted: false,
      },
    });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.NOT_FOUND,
            message: '検査項目が見つかりません',
          },
        },
        { status: 404 }
      );
    }

    // 使用中チェック（予約の検査項目）
    const usedInSchedules = await prisma.scheduleExamination.findFirst({
      where: {
        examinationId,
        schedule: {
          isDeleted: false,
        },
      },
    });

    if (usedInSchedules) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.VALIDATION_ERROR,
            message: 'この検査項目は予約で使用されているため削除できません',
          },
        },
        { status: 400 }
      );
    }

    // 論理削除
    await prisma.examination.update({
      where: { id: examinationId },
      data: { isDeleted: true },
    });

    return NextResponse.json({ success: true, data: { deleted: true } });
  } catch (error) {
    console.error('DELETE /api/masters/examinations/[id] error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: ErrorCode.DATABASE_ERROR,
          message: '検査項目の削除に失敗しました',
        },
      },
      { status: 500 }
    );
  }
}
