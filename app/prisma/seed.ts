import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import * as bcrypt from 'bcrypt';

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? 'file:./prisma/medi_q.db',
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting seed...');

  // 診察科マスタ
  const departments = await Promise.all([
    prisma.department.upsert({
      where: { id: 1 },
      update: {},
      create: { id: 1, name: '内科' },
    }),
    prisma.department.upsert({
      where: { id: 2 },
      update: {},
      create: { id: 2, name: '外科' },
    }),
    prisma.department.upsert({
      where: { id: 3 },
      update: {},
      create: { id: 3, name: '整形外科' },
    }),
    prisma.department.upsert({
      where: { id: 4 },
      update: {},
      create: { id: 4, name: '皮膚科' },
    }),
    prisma.department.upsert({
      where: { id: 5 },
      update: {},
      create: { id: 5, name: '眼科' },
    }),
  ]);
  console.log(`✅ Created ${departments.length} departments`);

  // 担当医マスタ
  const doctors = await Promise.all([
    prisma.doctor.upsert({
      where: { id: 1 },
      update: {},
      create: { id: 1, name: '田中太郎', departmentId: 1 },
    }),
    prisma.doctor.upsert({
      where: { id: 2 },
      update: {},
      create: { id: 2, name: '山田花子', departmentId: 1 },
    }),
    prisma.doctor.upsert({
      where: { id: 3 },
      update: {},
      create: { id: 3, name: '佐藤一郎', departmentId: 2 },
    }),
    prisma.doctor.upsert({
      where: { id: 4 },
      update: {},
      create: { id: 4, name: '鈴木二郎', departmentId: 3 },
    }),
    prisma.doctor.upsert({
      where: { id: 5 },
      update: {},
      create: { id: 5, name: '高橋三郎', departmentId: 4 },
    }),
    prisma.doctor.upsert({
      where: { id: 6 },
      update: {},
      create: { id: 6, name: '伊藤四郎', departmentId: 5 },
    }),
  ]);
  console.log(`✅ Created ${doctors.length} doctors`);

  // 待機場所マスタ
  const waitingAreas = await Promise.all([
    prisma.waitingArea.upsert({
      where: { id: 1 },
      update: {},
      create: { id: 1, name: '1階待合室A' },
    }),
    prisma.waitingArea.upsert({
      where: { id: 2 },
      update: {},
      create: { id: 2, name: '1階待合室B' },
    }),
    prisma.waitingArea.upsert({
      where: { id: 3 },
      update: {},
      create: { id: 3, name: '2階待合室' },
    }),
    prisma.waitingArea.upsert({
      where: { id: 4 },
      update: {},
      create: { id: 4, name: '3階待合室' },
    }),
  ]);
  console.log(`✅ Created ${waitingAreas.length} waiting areas`);

  // 検査項目マスタ
  const examinations = await Promise.all([
    prisma.examination.upsert({
      where: { id: 1 },
      update: {},
      create: { id: 1, name: '血液検査' },
    }),
    prisma.examination.upsert({
      where: { id: 2 },
      update: {},
      create: { id: 2, name: '尿検査' },
    }),
    prisma.examination.upsert({
      where: { id: 3 },
      update: {},
      create: { id: 3, name: 'レントゲン' },
    }),
    prisma.examination.upsert({
      where: { id: 4 },
      update: {},
      create: { id: 4, name: 'CT検査' },
    }),
    prisma.examination.upsert({
      where: { id: 5 },
      update: {},
      create: { id: 5, name: 'MRI検査' },
    }),
    prisma.examination.upsert({
      where: { id: 6 },
      update: {},
      create: { id: 6, name: '心電図' },
    }),
    prisma.examination.upsert({
      where: { id: 7 },
      update: {},
      create: { id: 7, name: 'エコー検査' },
    }),
  ]);
  console.log(`✅ Created ${examinations.length} examinations`);

  // 管理者（初期パスワード: admin123）
  const passwordHash = await bcrypt.hash('admin123', 10);
  const admin = await prisma.admin.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      passwordHash: passwordHash,
    },
  });
  console.log(`✅ Created admin user: ${admin.username}`);

  // サンプル患者データ
  const patients = await Promise.all([
    prisma.patient.upsert({
      where: { patientCode: 'P00001' },
      update: {},
      create: {
        patientCode: 'P00001',
        name: '山田太郎',
        nameKana: 'やまだたろう',
      },
    }),
    prisma.patient.upsert({
      where: { patientCode: 'P00002' },
      update: {},
      create: {
        patientCode: 'P00002',
        name: '佐藤花子',
        nameKana: 'さとうはなこ',
      },
    }),
    prisma.patient.upsert({
      where: { patientCode: 'P00003' },
      update: {},
      create: {
        patientCode: 'P00003',
        name: '鈴木一郎',
        nameKana: 'すずきいちろう',
      },
    }),
  ]);
  console.log(`✅ Created ${patients.length} sample patients`);

  console.log('🎉 Seed completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
