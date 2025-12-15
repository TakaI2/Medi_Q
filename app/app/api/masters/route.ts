import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ApiResponse, ErrorCode } from '@/types';

// マスタデータ一括取得レスポンス型
interface MasterData {
  departments: { id: number; name: string }[];
  doctors: { id: number; name: string; departmentId: number }[];
  waitingAreas: { id: number; name: string }[];
  examinations: { id: number; name: string }[];
}

// GET /api/masters - マスタデータ一括取得
export async function GET(): Promise<NextResponse<ApiResponse<MasterData>>> {
  try {
    const [departments, doctors, waitingAreas, examinations] = await Promise.all([
      prisma.department.findMany({
        where: { isDeleted: false },
        select: { id: true, name: true },
        orderBy: { id: 'asc' },
      }),
      prisma.doctor.findMany({
        where: { isDeleted: false },
        select: { id: true, name: true, departmentId: true },
        orderBy: { id: 'asc' },
      }),
      prisma.waitingArea.findMany({
        where: { isDeleted: false },
        select: { id: true, name: true },
        orderBy: { id: 'asc' },
      }),
      prisma.examination.findMany({
        where: { isDeleted: false },
        select: { id: true, name: true },
        orderBy: { id: 'asc' },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        departments,
        doctors,
        waitingAreas,
        examinations,
      },
    });
  } catch (error) {
    console.error('GET /api/masters error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: ErrorCode.DATABASE_ERROR,
          message: 'マスタデータの取得に失敗しました',
        },
      },
      { status: 500 }
    );
  }
}
