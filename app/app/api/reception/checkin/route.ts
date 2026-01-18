import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ApiResponse, ErrorCode } from '@/types';

interface CheckinData {
  patient: {
    id: number;
    patientCode: string;
    name: string;
    nameKana: string;
  };
  schedule: {
    id: number;
    date: string;
    startTime: string;
    endTime: string | null;
    department: string;
    doctor: string;
    waitingArea: string;
    examinations: string[];
  } | null;
  voiceText: string;
  visitedAt: string;
}

// POST /api/reception/checkin - 来院処理
export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<CheckinData>>> {
  try {
    const body = await request.json();

    if (!body.patientCode) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.VALIDATION_ERROR,
            message: '患者コードは必須です',
          },
        },
        { status: 400 }
      );
    }

    // 患者情報を取得
    const patient = await prisma.patient.findUnique({
      where: { patientCode: body.patientCode, isDeleted: false },
    });

    if (!patient) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.NOT_FOUND,
            message: '患者が見つかりません',
          },
        },
        { status: 404 }
      );
    }

    // 当日の予約を取得
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const schedule = await prisma.schedule.findFirst({
      where: {
        patientId: patient.id,
        date: today,
        isDeleted: false,
        status: { in: ['scheduled', 'visited'] }, // 既に来院済みでも表示
      },
      include: {
        department: true,
        doctor: true,
        waitingArea: true,
        examinations: {
          include: {
            examination: true,
          },
        },
      },
      orderBy: { startTime: 'asc' },
    });

    let scheduleData = null;
    let voiceText = '';

    if (schedule) {
      // 検査項目名を配列に変換
      const examinationNames = schedule.examinations.map(
        (se) => se.examination.name
      );

      scheduleData = {
        id: schedule.id,
        date: schedule.date.toISOString(),
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        department: schedule.department.name,
        doctor: schedule.doctor.name,
        waitingArea: schedule.waitingArea.name,
        examinations: examinationNames,
      };

      // 来院ステータスを更新（scheduled -> visited）
      if (schedule.status === 'scheduled') {
        await prisma.schedule.update({
          where: { id: schedule.id },
          data: {
            status: 'visited',
            visitedAt: new Date(),
          },
        });
      }

      // 音声テキスト生成
      voiceText = `ようこそ、${patient.nameKana}様。${schedule.department.name}、${schedule.doctor.name}先生の診察です。`;

      if (examinationNames.length > 0) {
        voiceText += `本日は${examinationNames.join('、')}を行います。`;
      }

      voiceText += `${schedule.waitingArea.name}でお待ちください。`;
    } else {
      // 予約がない場合
      voiceText = `ようこそ、${patient.nameKana}様。本日の診察予定が見つかりませんでした。受付窓口にお越しください。`;
    }

    const responseData: CheckinData = {
      patient: {
        id: patient.id,
        patientCode: patient.patientCode,
        name: patient.name,
        nameKana: patient.nameKana,
      },
      schedule: scheduleData,
      voiceText,
      visitedAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: responseData,
    });
  } catch (error) {
    console.error('POST /api/reception/checkin error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: ErrorCode.DATABASE_ERROR,
          message: '来院処理に失敗しました',
        },
      },
      { status: 500 }
    );
  }
}
