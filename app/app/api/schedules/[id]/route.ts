import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import {
  ApiResponse,
  Schedule,
  UpdateScheduleRequest,
  ErrorCode,
  ScheduleStatus,
} from '@/types';

type RouteContext = {
  params: Promise<{ id: string }>;
};

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

// Prisma の結果を Schedule 型に変換
function toScheduleResponse(schedule: ScheduleWithRelations | null): Schedule | null {
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
    createdAt: schedule.createdAt.toISOString(),
    updatedAt: schedule.updatedAt.toISOString(),
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

// GET /api/schedules/[id] - スケジュール詳細取得
export async function GET(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse<ApiResponse<Schedule>>> {
  try {
    const { id } = await context.params;
    const scheduleId = parseInt(id, 10);

    if (isNaN(scheduleId)) {
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

    const schedule = await prisma.schedule.findFirst({
      where: {
        id: scheduleId,
        isDeleted: false,
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

    if (!schedule) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.NOT_FOUND,
            message: 'スケジュールが見つかりません',
          },
        },
        { status: 404 }
      );
    }

    const response = toScheduleResponse(schedule);

    if (!response) {
      throw new Error('Failed to convert schedule response');
    }

    return NextResponse.json({ success: true, data: response });
  } catch (error) {
    console.error('GET /api/schedules/[id] error:', error);
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

// PUT /api/schedules/[id] - スケジュール更新
export async function PUT(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse<ApiResponse<Schedule>>> {
  try {
    const { id } = await context.params;
    const scheduleId = parseInt(id, 10);

    if (isNaN(scheduleId)) {
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

    // 既存スケジュール確認
    const existing = await prisma.schedule.findFirst({
      where: {
        id: scheduleId,
        isDeleted: false,
      },
    });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.NOT_FOUND,
            message: 'スケジュールが見つかりません',
          },
        },
        { status: 404 }
      );
    }

    const body: UpdateScheduleRequest = await request.json();

    // 更新データ構築
    const updateData: Parameters<typeof prisma.schedule.update>[0]['data'] = {};

    if (body.date !== undefined) {
      updateData.date = new Date(body.date);
    }
    if (body.startTime !== undefined) {
      updateData.startTime = body.startTime;
    }
    if (body.endTime !== undefined) {
      updateData.endTime = body.endTime;
    }
    if (body.departmentId !== undefined) {
      updateData.departmentId = body.departmentId;
    }
    if (body.doctorId !== undefined) {
      updateData.doctorId = body.doctorId;
    }
    if (body.waitingAreaId !== undefined) {
      updateData.waitingAreaId = body.waitingAreaId;
    }
    if (body.note !== undefined) {
      updateData.note = body.note;
    }
    if (body.status !== undefined) {
      updateData.status = body.status;
      // visited に変更時は visitedAt を設定
      if (body.status === 'visited' && !existing.visitedAt) {
        updateData.visitedAt = new Date();
      }
    }

    // 検査項目の更新（指定された場合は全置換）
    if (body.examinationIds !== undefined) {
      // 既存の検査項目を削除
      await prisma.scheduleExamination.deleteMany({
        where: { scheduleId },
      });

      // 新しい検査項目を追加
      if (body.examinationIds.length > 0) {
        await prisma.scheduleExamination.createMany({
          data: body.examinationIds.map((examinationId) => ({
            scheduleId,
            examinationId,
          })),
        });
      }
    }

    // スケジュール更新
    const schedule = await prisma.schedule.update({
      where: { id: scheduleId },
      data: updateData,
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

    return NextResponse.json({ success: true, data: response });
  } catch (error) {
    console.error('PUT /api/schedules/[id] error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: ErrorCode.DATABASE_ERROR,
          message: 'スケジュールの更新に失敗しました',
        },
      },
      { status: 500 }
    );
  }
}

// DELETE /api/schedules/[id] - スケジュール削除（論理削除）
export async function DELETE(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse<ApiResponse<{ deleted: boolean }>>> {
  try {
    const { id } = await context.params;
    const scheduleId = parseInt(id, 10);

    if (isNaN(scheduleId)) {
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

    // 既存スケジュール確認
    const existing = await prisma.schedule.findFirst({
      where: {
        id: scheduleId,
        isDeleted: false,
      },
    });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.NOT_FOUND,
            message: 'スケジュールが見つかりません',
          },
        },
        { status: 404 }
      );
    }

    // 論理削除
    await prisma.schedule.update({
      where: { id: scheduleId },
      data: { isDeleted: true },
    });

    return NextResponse.json({ success: true, data: { deleted: true } });
  } catch (error) {
    console.error('DELETE /api/schedules/[id] error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: ErrorCode.DATABASE_ERROR,
          message: 'スケジュールの削除に失敗しました',
        },
      },
      { status: 500 }
    );
  }
}
