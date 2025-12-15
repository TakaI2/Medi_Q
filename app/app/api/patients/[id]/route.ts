import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ApiResponse, Patient, ErrorCode } from '@/types';

type RouteContext = {
  params: Promise<{ id: string }>;
};

// GET /api/patients/[id] - 患者詳細取得
export async function GET(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse<ApiResponse<Patient>>> {
  try {
    const { id } = await context.params;
    const patientId = parseInt(id, 10);

    if (isNaN(patientId)) {
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

    const patient = await prisma.patient.findFirst({
      where: {
        id: patientId,
        isDeleted: false,
      },
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

    return NextResponse.json({
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
    });
  } catch (error) {
    console.error('GET /api/patients/[id] error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: ErrorCode.DATABASE_ERROR,
          message: '患者情報の取得に失敗しました',
        },
      },
      { status: 500 }
    );
  }
}

// PUT /api/patients/[id] - 患者更新
export async function PUT(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse<ApiResponse<Patient>>> {
  try {
    const { id } = await context.params;
    const patientId = parseInt(id, 10);

    if (isNaN(patientId)) {
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

    // 既存患者確認
    const existing = await prisma.patient.findFirst({
      where: {
        id: patientId,
        isDeleted: false,
      },
    });

    if (!existing) {
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

    const body = await request.json();

    // 患者コードの重複チェック（変更がある場合のみ）
    if (body.patientCode && body.patientCode !== existing.patientCode) {
      const duplicate = await prisma.patient.findUnique({
        where: { patientCode: body.patientCode },
      });

      if (duplicate) {
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
    }

    // 更新データ構築
    const updateData: Parameters<typeof prisma.patient.update>[0]['data'] = {};

    if (body.patientCode !== undefined) {
      updateData.patientCode = body.patientCode;
    }
    if (body.name !== undefined) {
      updateData.name = body.name;
    }
    if (body.nameKana !== undefined) {
      updateData.nameKana = body.nameKana;
    }
    if (body.voiceTemplate !== undefined) {
      updateData.voiceTemplate = body.voiceTemplate;
    }
    if (body.printTemplate !== undefined) {
      updateData.printTemplate = body.printTemplate;
    }

    const patient = await prisma.patient.update({
      where: { id: patientId },
      data: updateData,
    });

    return NextResponse.json({
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
    });
  } catch (error) {
    console.error('PUT /api/patients/[id] error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: ErrorCode.DATABASE_ERROR,
          message: '患者情報の更新に失敗しました',
        },
      },
      { status: 500 }
    );
  }
}

// DELETE /api/patients/[id] - 患者削除（論理削除）
export async function DELETE(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse<ApiResponse<{ deleted: boolean }>>> {
  try {
    const { id } = await context.params;
    const patientId = parseInt(id, 10);

    if (isNaN(patientId)) {
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

    // 既存患者確認
    const existing = await prisma.patient.findFirst({
      where: {
        id: patientId,
        isDeleted: false,
      },
    });

    if (!existing) {
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

    // 論理削除
    await prisma.patient.update({
      where: { id: patientId },
      data: { isDeleted: true },
    });

    return NextResponse.json({ success: true, data: { deleted: true } });
  } catch (error) {
    console.error('DELETE /api/patients/[id] error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: ErrorCode.DATABASE_ERROR,
          message: '患者の削除に失敗しました',
        },
      },
      { status: 500 }
    );
  }
}
