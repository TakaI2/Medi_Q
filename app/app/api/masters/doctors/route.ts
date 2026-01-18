import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ApiResponse, Doctor, ErrorCode } from '@/types';

// GET /api/masters/doctors - 担当医一覧取得
export async function GET(): Promise<NextResponse<ApiResponse<Doctor[]>>> {
  try {
    const doctors = await prisma.doctor.findMany({
      where: { isDeleted: false },
      orderBy: { id: 'asc' },
      include: {
        department: true,
      },
    });

    const response: Doctor[] = doctors
      .filter((d) => !d.department.isDeleted)
      .map((d) => ({
        id: d.id,
        name: d.name,
        departmentId: d.departmentId,
        isDeleted: d.isDeleted,
        createdAt: d.createdAt.toISOString(),
        updatedAt: d.updatedAt.toISOString(),
        department: {
          id: d.department.id,
          name: d.department.name,
          isDeleted: d.department.isDeleted,
          createdAt: d.department.createdAt.toISOString(),
          updatedAt: d.department.updatedAt.toISOString(),
        },
      }));

    return NextResponse.json({ success: true, data: response });
  } catch (error) {
    console.error('GET /api/masters/doctors error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: ErrorCode.DATABASE_ERROR,
          message: '担当医一覧の取得に失敗しました',
        },
      },
      { status: 500 }
    );
  }
}

// POST /api/masters/doctors - 担当医登録
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<Doctor>>> {
  try {
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

    const doctor = await prisma.doctor.create({
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

    return NextResponse.json({ success: true, data: response }, { status: 201 });
  } catch (error) {
    console.error('POST /api/masters/doctors error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: ErrorCode.DATABASE_ERROR,
          message: '担当医の登録に失敗しました',
        },
      },
      { status: 500 }
    );
  }
}
