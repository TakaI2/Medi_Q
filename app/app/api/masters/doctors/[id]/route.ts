import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ApiResponse, Doctor, ErrorCode } from '@/types';

type RouteContext = {
  params: Promise<{ id: string }>;
};

// GET /api/masters/doctors/[id] - 担当医詳細取得
export async function GET(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse<ApiResponse<Doctor>>> {
  try {
    const { id } = await context.params;
    const doctorId = parseInt(id, 10);

    if (isNaN(doctorId)) {
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

    const doctor = await prisma.doctor.findFirst({
      where: {
        id: doctorId,
        isDeleted: false,
      },
      include: {
        department: true,
      },
    });

    if (!doctor) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.NOT_FOUND,
            message: '担当医が見つかりません',
          },
        },
        { status: 404 }
      );
    }

    const response: Doctor = {
      id: doctor.id,
      name: doctor.name,
      departmentId: doctor.departmentId,
      isDeleted: doctor.isDeleted,
      createdAt: doctor.createdAt.toISOString(),
      updatedAt: doctor.updatedAt.toISOString(),
      department: {
        id: doctor.department.id,
        name: doctor.department.name,
        isDeleted: doctor.department.isDeleted,
        createdAt: doctor.department.createdAt.toISOString(),
        updatedAt: doctor.department.updatedAt.toISOString(),
      },
    };

    return NextResponse.json({ success: true, data: response });
  } catch (error) {
    console.error('GET /api/masters/doctors/[id] error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: ErrorCode.DATABASE_ERROR,
          message: '担当医の取得に失敗しました',
        },
      },
      { status: 500 }
    );
  }
}

// PUT /api/masters/doctors/[id] - 担当医更新
export async function PUT(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse<ApiResponse<Doctor>>> {
  try {
    const { id } = await context.params;
    const doctorId = parseInt(id, 10);

    if (isNaN(doctorId)) {
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
    if (!body.name || !body.departmentId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.VALIDATION_ERROR,
            message: '担当医名と診察科は必須です',
          },
        },
        { status: 400 }
      );
    }

    // 既存チェック
    const existing = await prisma.doctor.findFirst({
      where: {
        id: doctorId,
        isDeleted: false,
      },
    });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.NOT_FOUND,
            message: '担当医が見つかりません',
          },
        },
        { status: 404 }
      );
    }

    // 診察科の存在確認
    const department = await prisma.department.findFirst({
      where: {
        id: body.departmentId,
        isDeleted: false,
      },
    });

    if (!department) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.VALIDATION_ERROR,
            message: '指定された診察科が見つかりません',
          },
        },
        { status: 400 }
      );
    }

    const doctor = await prisma.doctor.update({
      where: { id: doctorId },
      data: {
        name: body.name,
        departmentId: body.departmentId,
      },
      include: {
        department: true,
      },
    });

    const response: Doctor = {
      id: doctor.id,
      name: doctor.name,
      departmentId: doctor.departmentId,
      isDeleted: doctor.isDeleted,
      createdAt: doctor.createdAt.toISOString(),
      updatedAt: doctor.updatedAt.toISOString(),
      department: {
        id: doctor.department.id,
        name: doctor.department.name,
        isDeleted: doctor.department.isDeleted,
        createdAt: doctor.department.createdAt.toISOString(),
        updatedAt: doctor.department.updatedAt.toISOString(),
      },
    };

    return NextResponse.json({ success: true, data: response });
  } catch (error) {
    console.error('PUT /api/masters/doctors/[id] error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: ErrorCode.DATABASE_ERROR,
          message: '担当医の更新に失敗しました',
        },
      },
      { status: 500 }
    );
  }
}

// DELETE /api/masters/doctors/[id] - 担当医削除（論理削除）
export async function DELETE(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse<ApiResponse<{ deleted: boolean }>>> {
  try {
    const { id } = await context.params;
    const doctorId = parseInt(id, 10);

    if (isNaN(doctorId)) {
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
    const existing = await prisma.doctor.findFirst({
      where: {
        id: doctorId,
        isDeleted: false,
      },
    });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.NOT_FOUND,
            message: '担当医が見つかりません',
          },
        },
        { status: 404 }
      );
    }

    // 使用中チェック（予約）
    const usedInSchedules = await prisma.schedule.findFirst({
      where: {
        doctorId,
        isDeleted: false,
      },
    });

    if (usedInSchedules) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.VALIDATION_ERROR,
            message: 'この担当医は予約で使用されているため削除できません',
          },
        },
        { status: 400 }
      );
    }

    // 論理削除
    await prisma.doctor.update({
      where: { id: doctorId },
      data: { isDeleted: true },
    });

    return NextResponse.json({ success: true, data: { deleted: true } });
  } catch (error) {
    console.error('DELETE /api/masters/doctors/[id] error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: ErrorCode.DATABASE_ERROR,
          message: '担当医の削除に失敗しました',
        },
      },
      { status: 500 }
    );
  }
}
