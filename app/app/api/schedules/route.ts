import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import {
  ApiResponse,
  ScheduleData,
  CreateScheduleRequest,
  ErrorCode,
  ScheduleStatus,
} from '@/types';

// Prisma の include 結果の型
type ScheduleWithRelations = Prisma.ScheduleGetPayload<{
  include: {
    patient: true;
    department: true;
    doctor: true;
    waitingArea: true;
    examinations: {
      include: {
        examination: true;
      };
    };
  };
}>;

// Prisma の結果を ScheduleData 型に変換
function toScheduleResponse(schedule: ScheduleWithRelations | null): ScheduleData | null {
  if (!schedule) return null;

  return {
    id: schedule.id,
    patientId: schedule.patientId,
    date: schedule.date.toISOString(),
    startTime: schedule.startTime,
    endTime: schedule.endTime,
    departmentId: schedule.departmentId,
    doctorId: schedule.doctorId,
    waitingAreaId: schedule.waitingAreaId,
    note: schedule.note,
    status: schedule.status as ScheduleStatus,
    visitedAt: schedule.visitedAt?.toISOString() ?? null,
    patient: schedule.patient
      ? {
          id: schedule.patient.id,
          patientCode: schedule.patient.patientCode,
          name: schedule.patient.name,
          nameKana: schedule.patient.nameKana,
          voiceTemplate: schedule.patient.voiceTemplate,
          printTemplate: schedule.patient.printTemplate,
          isDeleted: schedule.patient.isDeleted,
          createdAt: schedule.patient.createdAt.toISOString(),
          updatedAt: schedule.patient.updatedAt.toISOString(),
        }
      : undefined,
    department: schedule.department
      ? {
          id: schedule.department.id,
          name: schedule.department.name,
          isDeleted: schedule.department.isDeleted,
        }
      : undefined,
    doctor: schedule.doctor
      ? {
          id: schedule.doctor.id,
          name: schedule.doctor.name,
          departmentId: schedule.doctor.departmentId,
          isDeleted: schedule.doctor.isDeleted,
        }
      : undefined,
    waitingArea: schedule.waitingArea
      ? {
          id: schedule.waitingArea.id,
          name: schedule.waitingArea.name,
          isDeleted: schedule.waitingArea.isDeleted,
        }
      : undefined,
    examinations: schedule.examinations?.map((se) => ({
      id: se.examination.id,
      name: se.examination.name,
      isDeleted: se.examination.isDeleted,
    })),
  };
}

// GET /api/schedules - スケジュール一覧取得
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<ScheduleData[]>>> {
  try {
    const { searchParams } = new URL(request.url);

    // クエリパラメータ取得
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const patientId = searchParams.get('patientId');
    const departmentId = searchParams.get('departmentId');
    const doctorId = searchParams.get('doctorId');
    const status = searchParams.get('status') as ScheduleStatus | null;

    // フィルタ条件構築
    const where: Prisma.ScheduleWhereInput = {
      isDeleted: false,
    };

    if (startDate) {
      where.date = {
        ...((where.date as object) ?? {}),
        gte: new Date(startDate),
      };
    }

    if (endDate) {
      where.date = {
        ...((where.date as object) ?? {}),
        lte: new Date(endDate),
      };
    }

    if (patientId) {
      where.patientId = parseInt(patientId, 10);
    }

    if (departmentId) {
      where.departmentId = parseInt(departmentId, 10);
    }

    if (doctorId) {
      where.doctorId = parseInt(doctorId, 10);
    }

    if (status) {
      where.status = status;
    }

    const schedules = await prisma.schedule.findMany({
      where,
      include: {
        patient: true,
        department: true,
        doctor: true,
        waitingArea: true,
        examinations: {
          include: {
            examination: true,
          },
        },
      },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    });

    const response: ScheduleData[] = schedules
      .map((s) => toScheduleResponse(s))
      .filter((s): s is ScheduleData => s !== null);

    return NextResponse.json({ success: true, data: response });
  } catch (error) {
    console.error('GET /api/schedules error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: ErrorCode.DATABASE_ERROR,
          message: 'スケジュールの取得に失敗しました',
        },
      },
      { status: 500 }
    );
  }
}

// POST /api/schedules - スケジュール作成
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<ScheduleData>>> {
  try {
    const body: CreateScheduleRequest = await request.json();

    // バリデーション
    if (!body.patientId || !body.date || !body.startTime || !body.departmentId || !body.doctorId || !body.waitingAreaId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.VALIDATION_ERROR,
            message: '必須項目が不足しています',
          },
        },
        { status: 400 }
      );
    }

    // 患者存在確認
    const patient = await prisma.patient.findUnique({
      where: { id: body.patientId, isDeleted: false },
    });

    if (!patient) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.NOT_FOUND,
            message: '指定された患者が見つかりません',
          },
        },
        { status: 404 }
      );
    }

    // スケジュール作成
    const schedule = await prisma.schedule.create({
      data: {
        patientId: body.patientId,
        date: new Date(body.date),
        startTime: body.startTime,
        endTime: body.endTime ?? null,
        departmentId: body.departmentId,
        doctorId: body.doctorId,
        waitingAreaId: body.waitingAreaId,
        note: body.note ?? null,
        status: 'scheduled',
        examinations: body.examinationIds
          ? {
              create: body.examinationIds.map((examinationId) => ({
                examinationId,
              })),
            }
          : undefined,
      },
      include: {
        patient: true,
        department: true,
        doctor: true,
        waitingArea: true,
        examinations: {
          include: {
            examination: true,
          },
        },
      },
    });

    const response = toScheduleResponse(schedule);

    if (!response) {
      throw new Error('Failed to convert schedule response');
    }

    return NextResponse.json({ success: true, data: response }, { status: 201 });
  } catch (error) {
    console.error('POST /api/schedules error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: ErrorCode.DATABASE_ERROR,
          message: 'スケジュールの作成に失敗しました',
        },
      },
      { status: 500 }
    );
  }
}
