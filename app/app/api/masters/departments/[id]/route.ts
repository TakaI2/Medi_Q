import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ApiResponse, Department, ErrorCode } from '@/types';

type RouteContext = {
  params: Promise<{ id: string }>;
};

// GET /api/masters/departments/[id] - 診察科詳細取得
export async function GET(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse<ApiResponse<Department>>> {
  try {
    const { id } = await context.params;
    const departmentId = parseInt(id, 10);

    if (isNaN(departmentId)) {
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

    const department = await prisma.department.findFirst({
      where: {
        id: departmentId,
        isDeleted: false,
      },
      include: {
        doctors: {
          where: { isDeleted: false },
        },
      },
    });

    if (!department) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.NOT_FOUND,
            message: '診察科が見つかりません',
          },
        },
        { status: 404 }
      );
    }

    const response: Department = {
      id: department.id,
      name: department.name,
      isDeleted: department.isDeleted,
      createdAt: department.createdAt.toISOString(),
      updatedAt: department.updatedAt.toISOString(),
      doctors: department.doctors?.map((doc) => ({
        id: doc.id,
        name: doc.name,
        departmentId: doc.departmentId,
        isDeleted: doc.isDeleted,
        createdAt: doc.createdAt.toISOString(),
        updatedAt: doc.updatedAt.toISOString(),
      })),
    };

    return NextResponse.json({ success: true, data: response });
  } catch (error) {
    console.error('GET /api/masters/departments/[id] error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: ErrorCode.DATABASE_ERROR,
          message: '診察科の取得に失敗しました',
        },
      },
      { status: 500 }
    );
  }
}

// PUT /api/masters/departments/[id] - 診察科更新
export async function PUT(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse<ApiResponse<Department>>> {
  try {
    const { id } = await context.params;
    const departmentId = parseInt(id, 10);

    if (isNaN(departmentId)) {
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
            message: '診察科名は必須です',
          },
        },
        { status: 400 }
      );
    }

    // 既存チェック
    const existing = await prisma.department.findFirst({
      where: {
        id: departmentId,
        isDeleted: false,
      },
    });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.NOT_FOUND,
            message: '診察科が見つかりません',
          },
        },
        { status: 404 }
      );
    }

    // 重複チェック（自身を除く）
    const duplicate = await prisma.department.findFirst({
      where: {
        name: body.name,
        isDeleted: false,
        NOT: { id: departmentId },
      },
    });

    if (duplicate) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.VALIDATION_ERROR,
            message: '同じ名前の診察科が既に存在します',
          },
        },
        { status: 400 }
      );
    }

    const department = await prisma.department.update({
      where: { id: departmentId },
      data: { name: body.name },
    });

    const response: Department = {
      id: department.id,
      name: department.name,
      isDeleted: department.isDeleted,
      createdAt: department.createdAt.toISOString(),
      updatedAt: department.updatedAt.toISOString(),
    };

    return NextResponse.json({ success: true, data: response });
  } catch (error) {
    console.error('PUT /api/masters/departments/[id] error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: ErrorCode.DATABASE_ERROR,
          message: '診察科の更新に失敗しました',
        },
      },
      { status: 500 }
    );
  }
}

// DELETE /api/masters/departments/[id] - 診察科削除（論理削除）
export async function DELETE(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse<ApiResponse<{ deleted: boolean }>>> {
  try {
    const { id } = await context.params;
    const departmentId = parseInt(id, 10);

    if (isNaN(departmentId)) {
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
    const existing = await prisma.department.findFirst({
      where: {
        id: departmentId,
        isDeleted: false,
      },
    });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.NOT_FOUND,
            message: '診察科が見つかりません',
          },
        },
        { status: 404 }
      );
    }

    // 使用中チェック（予約・担当医）
    const usedInSchedules = await prisma.schedule.findFirst({
      where: {
        departmentId,
        isDeleted: false,
      },
    });

    if (usedInSchedules) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.VALIDATION_ERROR,
            message: 'この診察科は予約で使用されているため削除できません',
          },
        },
        { status: 400 }
      );
    }

    const usedInDoctors = await prisma.doctor.findFirst({
      where: {
        departmentId,
        isDeleted: false,
      },
    });

    if (usedInDoctors) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.VALIDATION_ERROR,
            message: 'この診察科には担当医が登録されているため削除できません',
          },
        },
        { status: 400 }
      );
    }

    // 論理削除
    await prisma.department.update({
      where: { id: departmentId },
      data: { isDeleted: true },
    });

    return NextResponse.json({ success: true, data: { deleted: true } });
  } catch (error) {
    console.error('DELETE /api/masters/departments/[id] error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: ErrorCode.DATABASE_ERROR,
          message: '診察科の削除に失敗しました',
        },
      },
      { status: 500 }
    );
  }
}
