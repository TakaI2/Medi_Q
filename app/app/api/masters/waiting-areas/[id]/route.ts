import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ApiResponse, WaitingArea, ErrorCode } from '@/types';

type RouteContext = {
  params: Promise<{ id: string }>;
};

// GET /api/masters/waiting-areas/[id] - 待機場所詳細取得
export async function GET(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse<ApiResponse<WaitingArea>>> {
  try {
    const { id } = await context.params;
    const waitingAreaId = parseInt(id, 10);

    if (isNaN(waitingAreaId)) {
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

    const waitingArea = await prisma.waitingArea.findFirst({
      where: {
        id: waitingAreaId,
        isDeleted: false,
      },
    });

    if (!waitingArea) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.NOT_FOUND,
            message: '待機場所が見つかりません',
          },
        },
        { status: 404 }
      );
    }

    const response: WaitingArea = {
      id: waitingArea.id,
      name: waitingArea.name,
      isDeleted: waitingArea.isDeleted,
      createdAt: waitingArea.createdAt.toISOString(),
      updatedAt: waitingArea.updatedAt.toISOString(),
    };

    return NextResponse.json({ success: true, data: response });
  } catch (error) {
    console.error('GET /api/masters/waiting-areas/[id] error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: ErrorCode.DATABASE_ERROR,
          message: '待機場所の取得に失敗しました',
        },
      },
      { status: 500 }
    );
  }
}

// PUT /api/masters/waiting-areas/[id] - 待機場所更新
export async function PUT(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse<ApiResponse<WaitingArea>>> {
  try {
    const { id } = await context.params;
    const waitingAreaId = parseInt(id, 10);

    if (isNaN(waitingAreaId)) {
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
            message: '待機場所名は必須です',
          },
        },
        { status: 400 }
      );
    }

    // 既存チェック
    const existing = await prisma.waitingArea.findFirst({
      where: {
        id: waitingAreaId,
        isDeleted: false,
      },
    });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.NOT_FOUND,
            message: '待機場所が見つかりません',
          },
        },
        { status: 404 }
      );
    }

    // 重複チェック（自身を除く）
    const duplicate = await prisma.waitingArea.findFirst({
      where: {
        name: body.name,
        isDeleted: false,
        NOT: { id: waitingAreaId },
      },
    });

    if (duplicate) {
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

    const waitingArea = await prisma.waitingArea.update({
      where: { id: waitingAreaId },
      data: { name: body.name },
    });

    const response: WaitingArea = {
      id: waitingArea.id,
      name: waitingArea.name,
      isDeleted: waitingArea.isDeleted,
      createdAt: waitingArea.createdAt.toISOString(),
      updatedAt: waitingArea.updatedAt.toISOString(),
    };

    return NextResponse.json({ success: true, data: response });
  } catch (error) {
    console.error('PUT /api/masters/waiting-areas/[id] error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: ErrorCode.DATABASE_ERROR,
          message: '待機場所の更新に失敗しました',
        },
      },
      { status: 500 }
    );
  }
}

// DELETE /api/masters/waiting-areas/[id] - 待機場所削除（論理削除）
export async function DELETE(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse<ApiResponse<{ deleted: boolean }>>> {
  try {
    const { id } = await context.params;
    const waitingAreaId = parseInt(id, 10);

    if (isNaN(waitingAreaId)) {
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
    const existing = await prisma.waitingArea.findFirst({
      where: {
        id: waitingAreaId,
        isDeleted: false,
      },
    });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.NOT_FOUND,
            message: '待機場所が見つかりません',
          },
        },
        { status: 404 }
      );
    }

    // 使用中チェック（予約）
    const usedInSchedules = await prisma.schedule.findFirst({
      where: {
        waitingAreaId,
        isDeleted: false,
      },
    });

    if (usedInSchedules) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.VALIDATION_ERROR,
            message: 'この待機場所は予約で使用されているため削除できません',
          },
        },
        { status: 400 }
      );
    }

    // 論理削除
    await prisma.waitingArea.update({
      where: { id: waitingAreaId },
      data: { isDeleted: true },
    });

    return NextResponse.json({ success: true, data: { deleted: true } });
  } catch (error) {
    console.error('DELETE /api/masters/waiting-areas/[id] error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: ErrorCode.DATABASE_ERROR,
          message: '待機場所の削除に失敗しました',
        },
      },
      { status: 500 }
    );
  }
}
