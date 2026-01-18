import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ApiResponse, Department, ErrorCode } from '@/types';

// GET /api/masters/departments - 診察科一覧取得
export async function GET(): Promise<NextResponse<ApiResponse<Department[]>>> {
  try {
    const departments = await prisma.department.findMany({
      where: { isDeleted: false },
      orderBy: { id: 'asc' },
      include: {
        doctors: {
          where: { isDeleted: false },
        },
      },
    });

    const response: Department[] = departments.map((d) => ({
      id: d.id,
      name: d.name,
      isDeleted: d.isDeleted,
      createdAt: d.createdAt.toISOString(),
      updatedAt: d.updatedAt.toISOString(),
      doctors: d.doctors?.map((doc) => ({
        id: doc.id,
        name: doc.name,
        departmentId: doc.departmentId,
        isDeleted: doc.isDeleted,
        createdAt: doc.createdAt.toISOString(),
        updatedAt: doc.updatedAt.toISOString(),
      })),
    }));

    return NextResponse.json({ success: true, data: response });
  } catch (error) {
    console.error('GET /api/masters/departments error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: ErrorCode.DATABASE_ERROR,
          message: '診察科一覧の取得に失敗しました',
        },
      },
      { status: 500 }
    );
  }
}

// POST /api/masters/departments - 診察科登録
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<Department>>> {
  try {
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

    // 重複チェック
    const existing = await prisma.department.findFirst({
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
            message: '同じ名前の診察科が既に存在します',
          },
        },
        { status: 400 }
      );
    }

    const department = await prisma.department.create({
      data: {
        name: body.name,
      },
    });

    const response: Department = {
      id: department.id,
      name: department.name,
      isDeleted: department.isDeleted,
      createdAt: department.createdAt.toISOString(),
      updatedAt: department.updatedAt.toISOString(),
    };

    return NextResponse.json({ success: true, data: response }, { status: 201 });
  } catch (error) {
    console.error('POST /api/masters/departments error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: ErrorCode.DATABASE_ERROR,
          message: '診察科の登録に失敗しました',
        },
      },
      { status: 500 }
    );
  }
}
