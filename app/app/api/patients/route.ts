import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { ApiResponse, Patient, ErrorCode } from '@/types';

// GET /api/patients - 患者一覧取得
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<Patient[]>>> {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');

    const where: Prisma.PatientWhereInput = {
      isDeleted: false,
    };

    // 検索条件
    if (search) {
      where.OR = [
        { patientCode: { contains: search } },
        { name: { contains: search } },
        { nameKana: { contains: search } },
      ];
    }

    const patients = await prisma.patient.findMany({
      where,
      orderBy: { patientCode: 'asc' },
      take: 100, // 最大100件
    });

    const response: Patient[] = patients.map((p) => ({
      id: p.id,
      patientCode: p.patientCode,
      name: p.name,
      nameKana: p.nameKana,
      voiceTemplate: p.voiceTemplate,
      printTemplate: p.printTemplate,
      isDeleted: p.isDeleted,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    }));

    return NextResponse.json({ success: true, data: response });
  } catch (error) {
    console.error('GET /api/patients error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: ErrorCode.DATABASE_ERROR,
          message: '患者一覧の取得に失敗しました',
        },
      },
      { status: 500 }
    );
  }
}

// POST /api/patients - 患者登録
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<Patient>>> {
  try {
    const body = await request.json();

    // バリデーション
    if (!body.patientCode || !body.name || !body.nameKana) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.VALIDATION_ERROR,
            message: '患者コード、氏名、ふりがなは必須です',
          },
        },
        { status: 400 }
      );
    }

    // 重複チェック
    const existing = await prisma.patient.findUnique({
      where: { patientCode: body.patientCode },
    });

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.VALIDATION_ERROR,
            message: 'この患者コードは既に使用されています',
          },
        },
        { status: 400 }
      );
    }

    const patient = await prisma.patient.create({
      data: {
        patientCode: body.patientCode,
        name: body.name,
        nameKana: body.nameKana,
        voiceTemplate: body.voiceTemplate ?? null,
        printTemplate: body.printTemplate ?? null,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: patient.id,
          patientCode: patient.patientCode,
          name: patient.name,
          nameKana: patient.nameKana,
          voiceTemplate: patient.voiceTemplate,
          printTemplate: patient.printTemplate,
          isDeleted: patient.isDeleted,
          createdAt: patient.createdAt.toISOString(),
          updatedAt: patient.updatedAt.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/patients error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: ErrorCode.DATABASE_ERROR,
          message: '患者の登録に失敗しました',
        },
      },
      { status: 500 }
    );
  }
}
